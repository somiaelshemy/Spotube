const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const spotifyController = require('./apis/spotify');
const youtubeController = require('./apis/ytmusic');
const app = express();

app.use(express.json());
app.use(cors()).use(cookieParser());

app.get('/', spotifyController.startScript);
app.get('/ytauth', youtubeController.ytAuth);
app.get('/callback', spotifyController.handleCallback);
app.get('/oauth2callback', youtubeController.handleCallback);
module.exports = app;
