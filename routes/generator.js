const express = require('express')
const router = express.Router()
const { login, callback, playlistTracks, createPlaylist } = require('../controllers/generator')

router.get('/login', login)
router.get('/callback', callback)
router.post('/playlist-tracks', playlistTracks)
router.post('/create-playlist', createPlaylist)

module.exports  = router