const express = require('express')
const router = express.Router()
const { login, callback, playlistTracks } = require('../controllers/generator')

router.get('/login', login)
router.get('/callback', callback)
router.post('/playlist-tracks', playlistTracks)

module.exports  = router