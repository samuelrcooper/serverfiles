const querystring = require('query-string');
const request = require('request')
const axios = require('axios')
// const Buffer = require('buffer/').Buffer

exports.login = async (req, res) => {
  try {

    res.redirect('https://accounts.spotify.com/authorize?'+
    querystring.stringify({
      response_type: 'code',
      client_id: process.env.SPOTIFY_CLIENT_ID,
      scope: process.env.SPOTIFY_SCOPES,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    }));

    console.log('HELLO')
    
  } catch (error) {
    console.log(error)
  }
}

exports.callback = async (req, res) => {
  console.log('TEST')
}