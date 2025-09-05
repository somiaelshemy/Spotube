const fs = require('fs').promises;
const fsc = require('fs');
const StreamArray = require('stream-json/streamers/StreamArray');

const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

var SCOPES = ['https://www.googleapis.com/auth/youtube'];
var TOKEN_DIR = './credentials/';
var TOKEN_PATH = TOKEN_DIR + 'youtube-creds.json';

const getYoutubeOauthClient = async (next) => {
  try {
    const content = await fs.readFile('client_secret.json', 'utf8');
    const credentials = JSON.parse(content);
    var clientSecret = credentials.web.client_secret;
    var clientId = credentials.web.client_id;
    var redirectUrl = credentials.web.redirect_uris[0];
    return new OAuth2(clientId, clientSecret, redirectUrl);
  } catch (error) {
    return next(new Error('Error loading client secret file', error.status));
  }
};

const getNewToken = async (oauth2Client, res, next) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
  try {
    res.redirect(authUrl);
  } catch (err) {
    return next(new Error('Error redirecting to auth url', err.status));
  }
};

const storeToken = async (token, next) => {
  try {
    fsc.mkdirSync(TOKEN_DIR);
    console.log('Directory created successfully');
  } catch (err) {
    if (err.code != 'EEXIST') {
      return next(new AppError("Couldn't make directory", 500));
    }
  }
  await fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
    if (err) throw next(new AppError("Couldn't store token", 500));
    console.log('Token stored to ' + TOKEN_PATH);
  });
};

exports.ytAuth = catchAsync(async (req, res, next) => {
  const oauth2Client = await getYoutubeOauthClient(next);
  try {
    const token = await fs.readFile(TOKEN_PATH);
    oauth2Client.credentials = JSON.parse(token);
    req.oauth2Client = oauth2Client;
    console.log('YouTube Auth Success');
    next();
  } catch (error) {
    await getNewToken(oauth2Client, res, next);
  }
});

exports.handleCallback = catchAsync(async (req, res, next) => {
  const code = req.query.code;
  const oauth2Client = await getYoutubeOauthClient(next);
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.credentials = tokens;
    req.oauth2Client = oauth2Client;
    await storeToken(tokens, next);
  } catch (error) {
    return next(
      new AppError('Error while trying to retrieve access token', 500)
    );
  }
  next();
});

const checkPlaylistExists = catchAsync(
  async (service, playlistTitle = 'Spotube') => {
    try {
      const res = await service.playlists.list({
        part: 'snippet',
        mine: true,
        maxResults: 50,
      });

      const playlists = res.data.items || [];
      if (playlists.length === 0) return null;

      const match = playlists.find((p) => p.snippet.title === playlistTitle);
      if (match) return match.id;
      return null;
    } catch (error) {
      return next(new AppError('Error fetching playlists', 500));
    }
  }
);

exports.createPlaylist = catchAsync(async (req, res, next) => {
  try {
    const service = google.youtube({ version: 'v3', auth: req.oauth2Client });
    const existingPlaylistId = await checkPlaylistExists(service, next);
    if (existingPlaylistId) {
      req.playlistId = existingPlaylistId;
      return next();
    }

    const response = await service.playlists.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: 'Spotube', //req.body.title || 'Spotube',
          description: 'came from spotify btw', //req.body.description || 'came from spotify btw',
        },
        status: {
          privacyStatus: 'private', //req.body.privacyStatus || 'private',
        },
      },
    });

    req.playlistId = response.data.id;
    next();
  } catch (error) {
    return next(new AppError('Error creating playlist', 500));
  }
});

const searchTrack = async (service, req, next) => {
  try {
    const response = await service.search.list({
      part: 'snippet',
      q: req.q,
      maxResults: 1,
    });
    if (response.data.items.length > 0)
      return response.data.items[0].id.videoId;
    return null;
  } catch (error) {
    return next(new AppError('Error searching track', 500));
  }
};

const insertPlaylistItem = async (service, videoId, req, next) => {
  try {
    await service.playlistItems.insert({
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
  } catch (error) {
    return next(new AppError('Error inserting track to playlist', 500));
  }
};

exports.importTracks = catchAsync(async (req, res, next) => {
  try {
    const service = google.youtube({ version: 'v3', auth: req.oauth2Client });
    const pipeline = fsc
      .createReadStream('tracks.json')
      .pipe(StreamArray.withParser());

    for await (const { key, value } of pipeline) {
      req.q = `${value.name} ${value.artists}`;
      const videoId = await searchTrack(service, req, next);
      if (videoId) insertPlaylistItem(service, videoId, req, next);
    }
  } catch (error) {
    return next(
      new AppError(
        'Error importing tracks: maximum requests exceeded',
        error.code
      )
    );
  }
});
