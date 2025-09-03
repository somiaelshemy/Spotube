const express = require('express');
const spotifyController = require('../apis/spotify');

const router = express.Router();

router.get('/oauth2callback', spotifyController.handleCallback);

module.exports = router;
