const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const spotifyController = require('./apis/spotify');
const ytmusicRouter = require('./routes/ytmusicRoutes');
const spotifyRouter = require('./routes/spotifyRoutes');

const app = express();

app.use(express.json());
app.use(cors()).use(cookieParser());

app.get('/', spotifyController.startScript);
app.use('/ytmusic', ytmusicRouter);
app.use('/spotify', spotifyRouter);

module.exports = app;
