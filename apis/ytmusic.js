const fs = require('fs').promises;
const fsc = require('fs');
const StreamArray = require('stream-json/streamers/StreamArray');

const { google } = require('googleapis');
const { request } = require('http');
const OAuth2 = google.auth.OAuth2;

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/youtube-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/youtube'];
var TOKEN_DIR = './credentials/';
var TOKEN_PATH = TOKEN_DIR + 'youtube-creds.json';

const getYoutubeOauthClient = async () => {
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

const getNewToken = async (oauth2Client, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
  res.redirect(authUrl);
};

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

exports.ytAuth = async (req, res, next) => {
  const oauth2Client = await getYoutubeOauthClient();
  try {
    const token = await fs.readFile(TOKEN_PATH);
    oauth2Client.credentials = JSON.parse(token);
    req.oauth2Client = oauth2Client;
    console.log('YouTube Auth Success');
    next();
  } catch (error) {
    await getNewToken(oauth2Client, res);
  }
};

exports.handleCallback = async (req, res, next) => {
  const code = req.query.code;
  const oauth2Client = await getYoutubeOauthClient();
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.credentials = tokens;
    req.oauth2Client = oauth2Client;
    await storeToken(tokens);
  } catch (error) {
    return res.status(500).send('YouTube Auth Failed');
  }
  next();
};

exports.createPlaylist = async (req, res, next) => {
  if (process.env.YT_PLAYLIST_ID) {
    req.playlistId = process.env.YT_PLAYLIST_ID;
    return next();
  }

  const service = google.youtube({ version: 'v3', auth: req.oauth2Client });
  const response = await service.playlists.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title: 'Spotube',
        description: 'came from spotify btw',
      },
      status: {
        privacyStatus: 'private',
      },
    },
  });
  req.playlistId = response.data.id;
  process.env.YT_PLAYLIST_ID = response.data.id;
  next();
};

const searchTrack = async (service, req) => {
  const response = await service.search.list({
    part: 'snippet',
    q: req.q,
    maxResults: 1,
  });
  if (response.data.items.length > 0) return response.data.items[0].id.videoId;
  return null;
};

const insertPlaylistItem = async (service, videoId, req) => {
  service.playlistItems.insert({
    part: 'snippet',
    requestBody: {
      snippet: {
        playlistId: req.playlistId,
        resourceId: {
          kind: 'youtube#video',
          videoId: videoId,
        },
      },
    },
  });
};

// hasn't been tested yet
exports.importTracks = async (req, res, nex) => {
  const service = google.youtube({ version: 'v3', auth: req.oauth2Client });
  const pipeline = fsc
    .createReadStream('tracks.json')
    .pipe(StreamArray.withParser());

  for (const { key, value } of pipeline) {
    req.q = `${value.name} ${value.artists}`;
    const videoId = await searchTrack(service, req);
    if (videoId) insertPlaylistItem(service, videoId, req);
  }
};
