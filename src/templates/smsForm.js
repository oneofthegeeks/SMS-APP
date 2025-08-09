const { COUNTRY_CODES } = require('../config/constants');

const generateCountryCodeOptions = (selectedCode = '1') => {
  return COUNTRY_CODES.map(country => 
    `<option value="${country.code}" ${selectedCode === country.code ? 'selected' : ''}>${country.name}</option>`
  ).join('');
};

const generateSMSForm = ({
  accounts = [],
  currentAccountKey,
  authorizedNumbers = [],
  smsEnabledNumbers = []
}) => {
  const accountOptions = accounts.length > 0 
    ? accounts.map(account => 
        `<option value="${account.key}" ${currentAccountKey === account.key ? 'selected' : ''}>${account.name}</option>`
      ).join('')
    : '';

  const ownerNumbersOptions = authorizedNumbers.length > 0
    ? authorizedNumbers.map(item => {
        const displayName = item.callerIdName ? `${item.number} (${item.callerIdName})` : item.number;
        return `<option value="${item.number}">${displayName}</option>`;
      }).join('')
    : '<option value="">-- No phone numbers found --</option>';

  return `
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
        ${accounts.length > 0 ? `
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
          ${authorizedNumbers.length > 0 ? 
            `<select name="ownerPhoneNumber" required style="flex-grow: 1;">
              ${ownerNumbersOptions}
             </select>` : 
            `<div class="phone-group" style="flex-grow: 1;">
              <select name="ownerCountryCode" class="country-code">
                ${generateCountryCodeOptions()}
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
            ${generateCountryCodeOptions()}
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
        <p>Found ${authorizedNumbers.length} phone numbers (${smsEnabledNumbers.length} reported as SMS-enabled).</p>
        
        ${authorizedNumbers.length > 0 ? 
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
  `;
};

const generateSuccessPage = ({ from, to, message }) => {
  return `
    <!DOCTYPE html>
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
      <p><strong>From:</strong> ${from}</p>
      <p><strong>To:</strong> ${to}</p>
      <p><strong>Message:</strong> ${message}</p>
      <a href="/">Go back to SMS Form</a>
    </body>
    </html>
  `;
};

const generateAuthSuccessPage = () => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Authorization Successful</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center; }
        .success { color: green; }
        a { display: inline-block; margin-top: 15px; text-decoration: none; color: #4CAF50; }
      </style>
    </head>
    <body>
      <h1 class="success">Authorization Successful</h1>
      <p>Your access token has been received and securely stored. You may now send SMS messages.</p>
      <a href="/">Go to SMS Form</a>
    </body>
    </html>
  `;
};

module.exports = {
  generateSMSForm,
  generateSuccessPage,
  generateAuthSuccessPage
};