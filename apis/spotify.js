const querystring = require('querystring');
var request = require('request');

const utils = require('../utils');

var trackArr = new Array();

function getTracks(access_token) {
  var options = {
    url: `https://api.spotify.com/v1/playlists/${process.env.PLAYLIST_ID}/tracks`,
    headers: { Authorization: 'Bearer ' + access_token },
    json: true,
  };

  request.get(options, function (error, response, body) {
    body.items.map((el) =>
      console.log(
        el.track.name,
        el.track.artists.map((artist) => artist.name)
      )
    );
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
    res.redirect(
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
          getTracks(access_token);
        });
      }
    });
  }
};
