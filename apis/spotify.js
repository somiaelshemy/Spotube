const fs = require('fs');
const request = require('request');
const querystring = require('querystring');

const utils = require('../utils/utils');
const ytmusic = require('./ytmusic');

const stream = fs.createWriteStream('./tracks.json', { flags: 'w' });

function fetchTracks(
  access_token,
  url = `https://api.spotify.com/v1/playlists/${process.env.PLAYLIST_ID}/tracks`
) {
  if (!url) return;
  const options = {
    url,
    headers: { Authorization: 'Bearer ' + access_token },
    json: true,
  };

  request.get(options, function (error, response, body) {
    for (const item of body.items) {
      const track = {
        name: item.track.name,
        artists: item.track.artists.map((artist) => artist.name),
      };
      stream.write(JSON.stringify(track, null, 2));
      stream.write(',\n');
    }
    fetchTracks(access_token, body.next);
  });
}

exports.startScript = async (req, res) => {
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
};

exports.handleCallback = async (req, res) => {
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
      if (!error && response.statusCode === 200) {
        var access_token = body.access_token;
        var options = {
          url: `https://api.spotify.com/v1/me`,
          headers: { Authorization: 'Bearer ' + access_token },
          json: true,
        };
        request.get(options, function () {
          fetchTracks(access_token);
        });
      }
    });
  }
  res.redirect('http://localhost:3000/playlist');
};
