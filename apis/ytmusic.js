const fs = require('fs').promises;
const fsc = require('fs');
const { google } = require('googleapis');
const { getYoutubeOauthClient } = require('../utils/utils');

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/youtube-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/youtube.readonly'];
var TOKEN_DIR = './credentials/';
var TOKEN_PATH = TOKEN_DIR + 'youtube-creds.json';

exports.ytAuth = async (req, res) => {
  const oauth2Client = await getYoutubeOauthClient();
  try {
    const token = await fs.readFile(TOKEN_PATH);
    oauth2Client.credentials = JSON.parse(token);
    // getChannel(oauth2Client);
    console.log('YouTube Auth Success');
  } catch (error) {
    await getNewToken(oauth2Client, res);
  }
};

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
const getNewToken = async (oauth2Client, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  res.redirect(authUrl);
};

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
const storeToken = async (token) => {
  try {
    fsc.mkdirSync(TOKEN_DIR);
    console.log('Directory created successfully');
  } catch (err) {
    if (err.code != 'EEXIST') {
      console.log("couldn't make dir:", err);
      throw err;
    }
  }
  await fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
    if (err) throw err;
    console.log('Token stored to ' + TOKEN_PATH);
  });
};

/**
 * Lists the names and IDs of up to 10 files.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function getChannel(auth) {
  var service = google.youtube('v3');
  service.channels.list(
    {
      auth: auth,
      part: 'snippet,contentDetails,statistics',
      forUsername: 'GoogleDevelopers',
    },
    function (err, response) {
      if (err) {
        console.log('The API returned an error: ' + err);
        return;
      }
      var channels = response.data.items;
      if (channels.length == 0) {
        console.log('No channel found.');
      } else {
        console.log(
          "This channel's ID is %s. Its title is '%s', and " +
            'it has %s views.',
          channels[0].id,
          channels[0].snippet.title,
          channels[0].statistics.viewCount
        );
      }
    }
  );
}

exports.handleCallback = async (req, res) => {
  const code = req.query.code;
  const oauth2Client = await getYoutubeOauthClient();
  try {
    oauth2Client.getToken(code, async function (err, token) {
      if (err) {
        return new Error('Error while trying to retrieve access token');
      }
      oauth2Client.credentials = token;
      await storeToken(token);
    });
    // getChannel(oauth2Client);
    res.status(200).send('YouTube Auth Success');
  } catch (error) {
    res.status(500).send('YouTube Auth Failed');
  }
};
