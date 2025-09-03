const express = require('express');
const youtubeController = require('../apis/ytmusic');

const router = express.Router();

router.route('/playlist').get(youtubeController.ytAuth);
router.route('/oauth2callback').get(youtubeController.handleCallback);

router.use(youtubeController.createPlaylist, youtubeController.importTracks);

module.exports = router;
