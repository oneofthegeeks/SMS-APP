require("dotenv").config();
const { AuthorizationCode } = require("simple-oauth2");
const crypto = require("crypto");
const express = require("express");
const { createClient } = require('redis');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Redis client setup
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Connect to Redis
(async () => {
  redisClient.on('error', (err) => console.log('Redis Client Error', err));
  await redisClient.connect();
  console.log('Connected to Redis');
})();

// OAuth client configuration
const oauthConfig = {
  client: {
    id: process.env.OAUTH_CLIENT_ID,
    secret: process.env.OAUTH_CLIENT_SECRET,
  },
  auth: {
    tokenHost: process.env.OAUTH_SERVICE_URL,
    tokenPath: "/oauth/token",
    authorizePath: "/oauth/authorize",
  },
};

const oauthClient = new AuthorizationCode(oauthConfig);

// Variables for OAuth flow - still need state for CSRF protection
const expectedStateForAuthorizationCode = crypto.randomBytes(15).toString("hex");

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
    scope: "messaging.v1.send",
    state: expectedStateForAuthorizationCode,
  });

  console.log("Authorization URL:", authorizationUri);
  res.redirect(authorizationUri);
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
    
    // Store token in Redis with expiration based on token expiry
    const accessToken = tokenResponse.token.access_token;
    const expiresIn = tokenResponse.token.expires_in || 3600; // Default to 1 hour if not provided
    
    await redisClient.set('access_token', accessToken, {
      EX: expiresIn // Set expiration time in seconds
    });
    
    console.log("Access token stored in Redis");
    
    res.status(200).send(
      `<h1>Authorization Successful</h1><p>Your access token has been received and securely stored. You may now send SMS messages.</p><br><a href="/">Go to SMS Form</a>`
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

  // Validate phone numbers are in E.164 format (basic check)
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  if (!phoneRegex.test(ownerPhoneNumber) || !phoneRegex.test(contactPhoneNumber)) {
    res.status(400).send("<h1>Error: Phone numbers must be in E.164 format (e.g., +1234567890)</h1>");
    return;
  }

  try {
    // Get token from Redis
    const accessToken = await redisClient.get('access_token');
    
    if (!accessToken) {
      res.status(401).send("<h1>Error: No valid token found. Please authorize the app first.</h1><br><a href='/authorize'>Authorize App</a>");
      return;
    }

    const smsEndpoint = "https://api.goto.com/messaging/v1/messages";
    const payload = {
      ownerPhoneNumber: ownerPhoneNumber,
      contactPhoneNumbers: [contactPhoneNumber],
      body: messageBody.trim(),
    };

    const response = await fetch(smsEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 401) {
      // Token expired or invalid - redirect to authorize
      res.status(401).send("<h1>Error: Authentication failed. Please reauthorize the app.</h1><br><a href='/authorize'>Reauthorize App</a>");
      return;
    }

    const responseData = await response.json();

    if (response.ok) {
      res.status(201).send(
        `<h1>SMS Sent Successfully!</h1><p>To: ${contactPhoneNumber}</p><p>Message: ${messageBody}</p><br><a href="/">Go back to SMS Form</a>`
      );
    } else {
      console.error("Error Response from SMS API:", responseData);
      res.status(400).send(`<h1>Error Sending SMS</h1><p>${responseData.message || 'Unknown error'}</p><br><a href="/">Go back to SMS Form</a>`);
    }
  } catch (error) {
    console.error("Error sending SMS:", error.message);
    res.status(500).send(`<h1>Error Sending SMS</h1><p>${error.message}</p><br><a href="/">Go back to SMS Form</a>`);
  }
});

/** Graceful shutdown */
process.on('SIGINT', async () => {
  console.log('Application shutting down...');
  await redisClient.quit();
  process.exit(0);
});

/** Start the server */
app.listen(5000, () => console.log("Server is running on http://127.0.0.1:5000"));