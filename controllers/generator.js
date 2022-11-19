const querystring = require('query-string');
const request = require('request')
const axios = require('axios')
const Buffer = require('buffer/').Buffer

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
  
  let code = req.query.code
  
  let authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (Buffer(
            process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_SECRET_ID
        ).toString('base64'))
      },
      withCredentials: true,
      json: true
  }

  request.post(authOptions, function(error, response, body) {
    console.log(body)
    let access_token = body.access_token

    return res.redirect(`${process.env.SPOTIFY_FRONTEND_URI}?token=${access_token}`)
  })
}