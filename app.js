const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const spotifyController = require('./apis/spotify');
const app = express();

app.use(express.json());
app.use(cors()).use(cookieParser());

app.get('/', spotifyController.startScript);
app.get('/callback', spotifyController.handleCallback);

module.exports = app;
