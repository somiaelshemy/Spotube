const fs = require('fs');
const request = require('request');
const querystring = require('querystring');

const utils = require('../utils/utils');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const stream = fs.existsSync('./tracks.json')
  ? null
  : fs.createWriteStream('./tracks.json', { flags: 'w' });
if (stream) stream.write('[\n');

const fetchTracks = async (
  access_token,
  next,
  url = `https://api.spotify.com/v1/playlists/${process.env.SPOTIFY_PLAYLIST_ID}/tracks`
) => {
  const options = {
    url,
    headers: { Authorization: 'Bearer ' + access_token },
    json: true,
  };

  request.get(options, function (error, response, body) {
    if (error) throw new AppError(error.message, error.statusCode);
    for (let i = 0; i < body.items.length; i++) {
      const track = {
        name: body.items[i].track.name,
        artists: body.items[i].track.artists
          .map((artist) => artist.name)
          .join(' '),
      };
      stream.write(JSON.stringify(track, null, 2));
      if (!body.next && i === body.items.length - 1) return stream.end('\n]');
      stream.write(',\n');
    }
    fetchTracks(access_token, next, body.next);
  });
};

exports.startScript = catchAsync(async (req, res) => {
  const state = utils.generateRandomString(16);
  res.cookie('spotify_auth_state', state);
  res.redirect(
    'https://accounts.spotify.com/authorize?' +
      querystring.stringify({
        response_type: 'code',
        client_id: process.env.SPOTIFY_CLIENT_ID,
        scope: 'user-read-private user-read-email',
        redirect_uri: process.env.SPOTIFY_REDIRECT_URL,
        state: state,
      })
  );
});

exports.handleCallback = catchAsync(async (req, res, next) => {
  const storedState = req.cookies ? req.cookies['spotify_auth_state'] : null;

  if (!storedState || storedState !== req.query.state) {
    return res.redirect(
      '/#' +
        querystring.stringify({
          error: 'state_mismatch',
        })
    );
  } else {
    res.clearCookie('spotify_auth_state');
    const authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: req.query.code,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URL,
        grant_type: 'authorization_code',
      },
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        Authorization:
          'Basic ' +
          new Buffer.from(
            process.env.SPOTIFY_CLIENT_ID +
              ':' +
              process.env.SPOTIFY_CLIENT_SECRET
          ).toString('base64'),
      },
      json: true,
    };

    request.post(authOptions, function (error, response, body) {
      if (error) return next(new AppError(error.message, error.statusCode));
      if (response.statusCode === 200) {
        var access_token = body.access_token;
        var options = {
          url: `https://api.spotify.com/v1/me`,
          headers: { Authorization: 'Bearer ' + access_token },
          json: true,
        };
        request.get(options, function () {
          if (stream) fetchTracks(access_token, next);
        });
      }
    });
  }
  res.redirect('http://localhost:3000/ytmusic/playlist');
});
