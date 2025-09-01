const fs = require('fs').promises;
const crypto = require('crypto');
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;

exports.generateRandomString = (length) =>
  crypto.randomBytes(60).toString('hex').slice(0, length);

exports.getYoutubeOauthClient = async () => {
  try {
    const content = await fs.readFile('client_secret.json', 'utf8');
    const credentials = JSON.parse(content);
    var clientSecret = credentials.web.client_secret;
    var clientId = credentials.web.client_id;
    var redirectUrl = credentials.web.redirect_uris[0];
    return new OAuth2(clientId, clientSecret, redirectUrl);
  } catch (error) {
    console.log('Error loading client secret file: ' + error);
    return null;
  }
};
