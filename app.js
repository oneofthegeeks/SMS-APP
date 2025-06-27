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

// Variables for OAuth flow
const expectedStateForAuthorizationCode = crypto.randomBytes(15).toString("hex");

// Function to get and save account keys
async function getSavedAccountKeys() {
  try {
    const accountKeys = await redisClient.get('account_keys');
    return accountKeys ? JSON.parse(accountKeys) : [];
  } catch (error) {
    console.error("Error retrieving account keys:", error.message);
    return [];
  }
}

async function saveAccountKey(accountKey, accountName) {
  try {
    if (!accountKey) return;
    
    // Get existing account keys
    let accounts = await getSavedAccountKeys();
    
    // Check if account key already exists
    const existingIndex = accounts.findIndex(acc => acc.key === accountKey);
    
    if (existingIndex >= 0) {
      // Update the account name if it exists
      accounts[existingIndex].name = accountName || accounts[existingIndex].name;
    } else {
      // Add the new account key
      accounts.push({
        key: accountKey,
        name: accountName || `Account ${accounts.length + 1}`,
        dateAdded: new Date().toISOString()
      });
    }
    
    // Save updated accounts
    await redisClient.set('account_keys', JSON.stringify(accounts));
    
    // Set this as the current account key for API calls
    await redisClient.set('current_account_key', accountKey);
    
    return accounts;
  } catch (error) {
    console.error("Error saving account key:", error.message);
    return await getSavedAccountKeys();
  }
}

// Function to get current account key
async function getCurrentAccountKey() {
  // Try to get the current account key
  const currentKey = await redisClient.get('current_account_key');
  
  if (currentKey) {
    return currentKey;
  }
  
  // If no current key is set, use the first one from the saved accounts
  const accounts = await getSavedAccountKeys();
  
  if (accounts && accounts.length > 0) {
    await redisClient.set('current_account_key', accounts[0].key);
    return accounts[0].key;
  }
  
  // If no saved accounts, use the environment variable
  return process.env.GOTO_ACCOUNT_KEY;
}

// Helper function to format phone number with country code
function formatPhoneNumber(countryCode, phoneNumber) {
  // Remove any non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  return `+${countryCode}${digitsOnly}`;
}

// Function to fetch authorized phone numbers from GoTo Connect API
async function fetchAuthorizedPhoneNumbers() {
  try {
    const accessToken = await redisClient.get('access_token');
    const accountKey = await getCurrentAccountKey();
    
    if (!accessToken) {
      console.log("No access token available");
      return [];
    }
    
    if (!accountKey) {
      console.log("No account key available");
      return [];
    }
    
    // API endpoint with accountKey as query parameter
    const phoneNumbersEndpoint = `https://api.goto.com/voice-admin/v1/phone-numbers?accountKey=${accountKey}`;
    
    console.log("Fetching phone numbers from API...");
    console.log("Using account key:", accountKey);
    
    const response = await fetch(phoneNumbersEndpoint, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      console.error(`Error fetching phone numbers: ${response.status}`);
      const errorText = await response.text();
      console.error("Response:", errorText);
      return [];
    }
    
    const data = await response.json();
    console.log("API Response:", JSON.stringify(data, null, 2));
    
    // Extract phone numbers and caller ID names from the response
    let phoneNumbersWithDetails = [];
    
    if (data && Array.isArray(data.items)) {
      phoneNumbersWithDetails = data.items
        .filter(item => item.number) // Make sure there's a number field
        .map(item => ({
          number: item.number,
          callerIdName: item.callerIdName || item.name || '',
          name: item.name || '',
          smsEnabled: item.smsEnabled === true || item.smsEnabled === "true", // Track SMS capability, but don't filter by it
          status: item.status || ''
        }));
    }
    
    console.log("Extracted phone numbers with details:", phoneNumbersWithDetails);
    
    // Store in Redis with 24-hour expiration
    if (phoneNumbersWithDetails.length > 0) {
      await redisClient.set('authorized_phone_numbers', JSON.stringify(phoneNumbersWithDetails), {
        EX: 86400 // 24 hours
      });
    }
    
    return phoneNumbersWithDetails;
  } catch (error) {
    console.error("Error fetching authorized phone numbers:", error.message);
    return [];
  }
}

// Function to get authorized phone numbers (from Redis or API)
async function getAuthorizedPhoneNumbers() {
  // Try to get from Redis first
  const cachedNumbers = await redisClient.get('authorized_phone_numbers');
  
  if (cachedNumbers) {
    try {
      const numbers = JSON.parse(cachedNumbers);
      console.log("Using cached phone numbers:", numbers);
      return numbers;
    } catch (e) {
      console.error("Error parsing cached phone numbers:", e.message);
      // Continue to fetch from API if parsing fails
    }
  }
  
  // If not in Redis or parsing failed, fetch from API
  return await fetchAuthorizedPhoneNumbers();
}

/** Serve the SMS form with country code dropdown */
app.get("/", async (req, res) => {
  // Check if we have a valid access token first
  const accessToken = await redisClient.get('access_token');
  
  // If no access token is available, redirect to the authorization page
  if (!accessToken) {
    console.log("No valid access token found. Redirecting to authorization page.");
    return res.redirect('/authorize');
  }
  
  // Try to get authorized phone numbers
  const authorizedNumbers = await getAuthorizedPhoneNumbers();
  console.log("Authorized numbers for dropdown:", authorizedNumbers);
  console.log("Number of authorized numbers:", authorizedNumbers ? authorizedNumbers.length : 0);
  
  // Count SMS-enabled numbers
  const smsEnabledNumbers = authorizedNumbers.filter(item => item.smsEnabled);
  console.log("Number of SMS-enabled numbers:", smsEnabledNumbers.length);
  
  // Get account information
  const accounts = await getSavedAccountKeys();
  const currentAccountKey = await getCurrentAccountKey();
  
  let accountOptions = '';
  if (accounts && accounts.length > 0) {
    accountOptions = accounts
      .map(account => `<option value="${account.key}" ${currentAccountKey === account.key ? 'selected' : ''}>${account.name}</option>`)
      .join('');
  }
  
  let ownerNumbersOptions = '';
  
  // Use ALL phone numbers in the dropdown, not just SMS-enabled ones
  if (authorizedNumbers && authorizedNumbers.length > 0) {
    // Create dropdown options from all authorized numbers with caller ID names
    ownerNumbersOptions = authorizedNumbers
      .map(item => {
        const displayName = item.callerIdName ? `${item.number} (${item.callerIdName})` : item.number;
        return `<option value="${item.number}">${displayName}</option>`;
      })
      .join('');
    
    console.log("Generated dropdown options for all numbers:", ownerNumbersOptions);
  } else {
    // If no authorized numbers available, show default text
    ownerNumbersOptions = '<option value="">-- No phone numbers found --</option>';
    console.log("No phone numbers found for dropdown");
  }

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Send SMS</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        input, textarea, select, button { width: 100%; padding: 8px; margin-bottom: 10px; box-sizing: border-box; }
        label { display: block; margin-bottom: 5px; }
        .phone-group { display: flex; }
        .country-code { width: 80px; margin-right: 10px; }
        .phone-number { flex-grow: 1; }
        button { background-color: #4CAF50; color: white; border: none; cursor: pointer; }
        button:hover { background-color: #45a049; }
        .refresh-button { padding: 5px 10px; margin-left: 10px; background-color: #f0f0f0; color: #333; border: 1px solid #ccc; cursor: pointer; width: auto; }
        .manual-entry { background-color: #f9f9f9; padding: 15px; margin-top: 15px; border-radius: 5px; border: 1px solid #ddd; }
        .settings-section { background-color: #f9f9f9; padding: 15px; margin-bottom: 20px; border-radius: 5px; border: 1px solid #ddd; }
        .settings-toggle { color: #2196F3; cursor: pointer; text-decoration: underline; }
        .caller-id { color: #666; font-style: italic; }
        .sms-enabled { color: #4CAF50; }
        .sms-disabled { color: #f44336; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
        .note { font-size: 0.85em; color: #666; margin-top: 5px; }
      </style>
      <script>
        function toggleSettings() {
          const settings = document.getElementById('accountSettings');
          if (settings.style.display === 'none') {
            settings.style.display = 'block';
          } else {
            settings.style.display = 'none';
          }
        }
      </script>
    </head>
    <body>
      <h1>Send an SMS</h1>
      
      <!-- Account Settings -->
      <p class="settings-toggle" onclick="toggleSettings()">Account Settings ▼</p>
      <div id="accountSettings" class="settings-section" style="display: none;">
        <h2>GoTo Connect Account</h2>
        
        <!-- Account Selector -->
        ${accounts && accounts.length > 0 ? `
        <form method="POST" action="/select-account">
          <label for="accountKey">Select Account:</label>
          <select name="accountKey" id="accountKey">
            ${accountOptions}
          </select>
          <button type="submit">Switch Account</button>
        </form>
        <hr>
        ` : ''}
        
        <!-- Add Account Form -->
        <form method="POST" action="/add-account">
          <h3>Add New Account</h3>
          <label for="newAccountKey">Account Key:</label>
          <input type="text" name="accountKey" id="newAccountKey" required placeholder="Enter your GoTo Connect Account Key">
          
          <label for="accountName">Account Name (Optional):</label>
          <input type="text" name="accountName" id="accountName" placeholder="e.g., My Company Account">
          
          <button type="submit">Add Account</button>
        </form>
      </div>
      
      <!-- SMS Form -->
      <form method="POST" action="/send-sms">
        <label>Owner Phone Number:</label>
        <div style="display: flex; align-items: center;">
          ${authorizedNumbers && authorizedNumbers.length > 0 ? 
            `<select name="ownerPhoneNumber" required style="flex-grow: 1;">
              ${ownerNumbersOptions}
             </select>` : 
            `<div class="phone-group" style="flex-grow: 1;">
              <select name="ownerCountryCode" class="country-code">
                <option value="1" selected>+1</option>
                <option value="44">+44</option>
                <option value="61">+61</option>
                <option value="33">+33</option>
                <option value="49">+49</option>
                <option value="81">+81</option>
                <option value="86">+86</option>
              </select>
              <input type="text" name="ownerPhoneNumber" class="phone-number" placeholder="10-digit phone number" required pattern="[0-9]{10}">
            </div>`
          }
          <button type="button" class="refresh-button" onclick="window.location.href='/refresh-numbers'">Refresh</button>
        </div>
        <p class="note">Note: SMS capability status might not be accurately reported by the API.</p>
        <br>
        
        <label>Contact Phone Number (Recipient):</label>
        <div class="phone-group">
          <select name="contactCountryCode" class="country-code">
            <option value="1" selected>+1</option>
            <option value="44">+44</option>
            <option value="61">+61</option>
            <option value="33">+33</option>
            <option value="49">+49</option>
            <option value="81">+81</option>
            <option value="86">+86</option>
          </select>
          <input type="text" name="contactPhoneNumber" class="phone-number" placeholder="10-digit phone number" required pattern="[0-9]{10}">
        </div>
        <label for="messageBody">Message:</label>
        <textarea id="messageBody" name="messageBody" placeholder="Enter your SMS message here" required rows="4"></textarea>
        <button type="submit">Send SMS</button>
      </form>
      
      <!-- Phone Numbers Status Table -->
      <div class="manual-entry">
        <h3>Phone Numbers Status</h3>
        <p>Found ${authorizedNumbers ? authorizedNumbers.length : 0} phone numbers (${smsEnabledNumbers ? smsEnabledNumbers.length : 0} reported as SMS-enabled).</p>
        
        ${authorizedNumbers && authorizedNumbers.length > 0 ? 
          `<table>
            <tr>
              <th>Number</th>
              <th>Caller ID</th>
              <th>SMS Status</th>
              <th>Status</th>
            </tr>
            ${authorizedNumbers.map(item => 
              `<tr>
                <td>${item.number}</td>
                <td>${item.callerIdName || ''}</td>
                <td class="${item.smsEnabled ? 'sms-enabled' : 'sms-disabled'}">${item.smsEnabled ? 'Enabled' : 'Disabled'}</td>
                <td>${item.status || ''}</td>
              </tr>`
            ).join('')}
          </table>
          <p class="note">Note: SMS capability status shown above might not be accurately reported by the API.</p>` : 
          `<p>No phone numbers were found. Possible reasons:</p>
          <ol>
            <li>Make sure you have <a href="/authorize">authorized</a> the app with the required permissions.</li>
            <li>Make sure you've configured the correct <a href="#" onclick="toggleSettings(); return false;">account key</a>.</li>
            <li>Try clicking the "Refresh" button above.</li>
          </ol>`
        }
      </div>
      
      <br>
      <a href="/authorize">Re-authorize App</a>
    </body>
    </html>
  `);
});

/** Endpoint to explicitly refresh phone numbers list */
app.get("/refresh-numbers", async (req, res) => {
  await redisClient.del('authorized_phone_numbers');
  const numbers = await fetchAuthorizedPhoneNumbers();
  console.log("Refreshed phone numbers:", numbers);
  res.redirect('/');
});

/** Redirect user for OAuth authorization */
app.get("/authorize", (req, res) => {
  const authorizationUri = oauthClient.authorizeURL({
    redirect_uri: process.env.OAUTH_REDIRECT_URI,
    scope: "messaging.v1.send voice-admin.v1.read", // Updated with the correct scope
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
      EX: expiresIn
    });
    
    console.log("Access token stored in Redis");
    
    // Fetch authorized phone numbers after successful authorization
    const phoneNumbers = await fetchAuthorizedPhoneNumbers();
    console.log("Fetched phone numbers after authorization:", phoneNumbers);
    
    res.status(200).send(
      `<h1>Authorization Successful</h1>
       <p>Your access token has been received and securely stored. You may now send SMS messages.</p><br>
       <a href="/">Go to SMS Form</a>`
    );
  } catch (error) {
    console.error("Error exchanging authorization code:", error.message);
    res.status(500).send("<h1>Error: Unable to obtain access token</h1>");
  }
});

/** Handle account management routes */
app.post("/add-account", async (req, res) => {
  const { accountKey, accountName } = req.body;
  
  if (!accountKey) {
    res.status(400).send("<h1>Error: Account key is required</h1>");
    return;
  }
  
  await saveAccountKey(accountKey, accountName);
  await redisClient.del('authorized_phone_numbers'); // Clear cached phone numbers
  
  res.redirect('/');
});

app.post("/select-account", async (req, res) => {
  const { accountKey } = req.body;
  
  if (accountKey) {
    await redisClient.set('current_account_key', accountKey);
    await redisClient.del('authorized_phone_numbers'); // Clear cached phone numbers
  }
  
  res.redirect('/');
});

/** Handle SMS submission with selected owner phone and formatted contact phone */
app.post("/send-sms", async (req, res) => {
  const { 
    ownerPhoneNumber, ownerCountryCode,
    contactCountryCode, contactPhoneNumber, 
    messageBody 
  } = req.body;

  if (!messageBody || messageBody.trim().length === 0) {
    res.status(400).send("<h1>Error: Please provide a message.</h1>");
    return;
  }
  
  // Determine the owner phone number (either directly selected or formatted)
  let formattedOwnerPhone = ownerPhoneNumber;
  if (ownerCountryCode) {
    formattedOwnerPhone = formatPhoneNumber(ownerCountryCode, ownerPhoneNumber);
  }
  
  // Format the contact phone number
  const formattedContactPhone = formatPhoneNumber(contactCountryCode, contactPhoneNumber);
  
  console.log(`Owner phone: ${formattedOwnerPhone}`);
  console.log(`Contact phone: ${formattedContactPhone}`);
  
  try {
    // Get token from Redis
    const accessToken = await redisClient.get('access_token');
    
    if (!accessToken) {
      res.status(401).send("<h1>Error: No valid token found. Please authorize the app first.</h1><br><a href='/authorize'>Authorize App</a>");
      return;
    }

    const smsEndpoint = "https://api.goto.com/messaging/v1/messages";
    const payload = {
      ownerPhoneNumber: formattedOwnerPhone,
      contactPhoneNumbers: [formattedContactPhone],
      body: messageBody.trim(),
    };

    console.log("Sending SMS with payload:", JSON.stringify(payload));

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
      res.status(201).send(`
        <html>
        <head>
          <title>SMS Sent</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
            .success { color: green; }
            a { display: inline-block; margin-top: 15px; text-decoration: none; color: #4CAF50; }
          </style>
        </head>
        <body>
          <h1 class="success">SMS Sent Successfully!</h1>
          <p><strong>From:</strong> ${formattedOwnerPhone}</p>
          <p><strong>To:</strong> ${formattedContactPhone}</p>
          <p><strong>Message:</strong> ${messageBody}</p>
          <a href="/">Go back to SMS Form</a>
        </body>
        </html>
      `);
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