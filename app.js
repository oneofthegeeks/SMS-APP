require("dotenv").config(); // Load environment variables from .env
const { AuthorizationCode } = require("simple-oauth2"); // OAuth client
const crypto = require("crypto"); // For secure state
const express = require("express"); // Web server framework

const app = express();
app.use(express.json()); // Middleware for parsing JSON requests
app.use(express.urlencoded({ extended: true })); // Middleware for parsing URL-encoded form submissions

// OAuth client configuration
const oauthConfig = {
  client: {
    id: process.env.OAUTH_CLIENT_ID, // OAuth Client ID
    secret: process.env.OAUTH_CLIENT_SECRET, // OAuth Client Secret
  },
  auth: {
    tokenHost: process.env.OAUTH_SERVICE_URL, // Token service URL
    tokenPath: "/oauth/token", // Path for token exchange
    authorizePath: "/oauth/authorize", // Path for authorization
  },
};

const oauthClient = new AuthorizationCode(oauthConfig);

// Variables for OAuth flow
const expectedStateForAuthorizationCode = crypto.randomBytes(15).toString("hex"); // Random state for CSRF protection
let accessToken = null; // Stores the OAuth access token

/** Serve the SMS form */
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Send SMS</title>
    </head>
    <body>
      <h1>Send an SMS</h1>
      <form method="POST" action="/send-sms">
        <label for="ownerPhoneNumber">Owner Phone Number:</label><br>
        <input type="text" id="ownerPhoneNumber" name="ownerPhoneNumber" placeholder="+1234567890" required><br><br>

        <label for="contactPhoneNumber">Contact Phone Number (Recipient):</label><br>
        <input type="text" id="contactPhoneNumber" name="contactPhoneNumber" placeholder="+9876543210" required><br><br>

        <label for="messageBody">Message:</label><br>
        <textarea id="messageBody" name="messageBody" placeholder="Enter your SMS message here" required></textarea><br><br>

        <button type="submit">Send SMS</button>
      </form>
      <br>
      <a href="/authorize">Click here to authorize the app.</a>
    </body>
    </html>
  `);
});

/** Redirect user for OAuth authorization */
app.get("/authorize", (req, res) => {
  const authorizationUri = oauthClient.authorizeURL({
    redirect_uri: process.env.OAUTH_REDIRECT_URI,
    scope: "messaging.v1.send", // Required scope
    state: expectedStateForAuthorizationCode, // Secure state for validation
  });

  console.log("Authorization URL:", authorizationUri); // Debugging
  res.redirect(authorizationUri); // Redirect the user for authorization
});

/** Handle callback and exchange authorization code for access token */
app.get("/login/oauth2/code/goto", async (req, res) => {
  const { code, state } = req.query;

  if (state !== expectedStateForAuthorizationCode || !code) {
    res.status(403).send("<h1>Error: Invalid state or authorization code</h1>");
    return;
  }

  const tokenParams = { code, redirect_uri: process.env.OAUTH_REDIRECT_URI };
  try {
    const tokenResponse = await oauthClient.getToken(tokenParams);
    accessToken = tokenResponse.token.access_token;
    res.status(200).send(
      `<h1>Authorization Successful</h1><p>Your access token has been received. You may now send SMS messages.</p><br><a href="/">Go to SMS Form</a>`
    );
  } catch (error) {
    console.error("Error exchanging authorization code:", error.message);
    res.status(500).send("<h1>Error: Unable to obtain access token</h1>");
  }
});

/** Handle SMS submission */
app.post("/send-sms", async (req, res) => {
  const { ownerPhoneNumber, contactPhoneNumber, messageBody } = req.body;

  if (!ownerPhoneNumber || !contactPhoneNumber || !messageBody || messageBody.trim().length === 0) {
    res.status(400).send("<h1>Error: Please fill in all fields. The message must contain valid text.</h1>");
    return;
  }

  const smsEndpoint = "https://api.goto.com/messaging/v1/messages";
  const payload = {
    ownerPhoneNumber: ownerPhoneNumber, // Sender phone number
    contactPhoneNumbers: [contactPhoneNumber], // Array containing the recipient phone number
    body: messageBody.trim(), // Message content (trim whitespace)
  };

  try {
    const response = await fetch(smsEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload), // Send payload to API
    });

    const responseData = await response.json();

    if (response.ok) {
      res.status(201).send(
        `<h1>SMS Sent Successfully!</h1><p>To: ${contactPhoneNumber}</p><p>Message: ${messageBody}</p><br><a href="/">Go back to SMS Form</a>`
      );
    } else {
      console.error("Error Response from SMS API:", responseData);
      res.status(400).send(`<h1>Error Sending SMS</h1><p>${responseData.message}</p>`);
    }
  } catch (error) {
    console.error("Error sending SMS:", error.message);
    res.status(500).send(`<h1>Error Sending SMS</h1><p>${error.message}</p>`);
  }
});

/** Start the server */
app.listen(5000, () => console.log("Server is running on http://127.0.0.1:5000"));