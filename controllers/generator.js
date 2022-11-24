const querystring = require('query-string');
const request = require('request')
const axios = require('axios')
const Buffer = require('buffer/').Buffer
const formidable = require('formidable')
const { parseOnly } = require('../helpers/forms');
const { response } = require('express');

exports.login = async (req, res) => {
  try {

    res.redirect('https://accounts.spotify.com/authorize?'+
    querystring.stringify({
      response_type: 'code',
      client_id: process.env.SPOTIFY_CLIENT_ID,
      scope: process.env.SPOTIFY_SCOPES,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    }));
    
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
    // console.log(body)
    let access_token = body.access_token

    return res.redirect(`${process.env.SPOTIFY_FRONTEND_URI}?token=${access_token}`)
  })
}

exports.playlistTracks = async (req, res) => {

  const form = formidable({ multiples: true })

  form.parse(req, async (err, fields, files) => {
    
    parseOnly(fields)

    const headerOptions = {
      Accept: 'application/json',
      ContentType: 'application/json',
      Authorization: `Bearer ${fields.token}`,
    }

    const id = fields.id
    const total = fields.totalTracks
    let offset = 0
    let tracks = []
  
    while(offset <= total){

      try {
        
        const response = await axios.get(`https://api.spotify.com/v1/playlists/${id}/tracks?limit=100&offset=${offset}`, {headers: headerOptions})

        offset = 100 + offset

        tracks = [...tracks, ...response.data.items]
        
      } catch (error) {
        console.log(error.response)

        if(error.response.data){
          if(error.response.data.error){
            if(error.response.data.error.status === 401){
              return res.status(401).json(error.response.data.error.message)
            }
          }
        }

        return res.status(400).json(error.response.data ? error.response.data : 'Error with spotify service')
        
      }

    }

    console.log('TRACKS', tracks.length)

    return res.json(tracks)

  })
  
}

exports.createPlaylist = (req, res) => {

  const form = formidable({ multiples: true })

  form.parse(req, async (err, fields, files) => {
    
    parseOnly(fields)

    const headerOptions = {
      Accept: 'application/json',
      ContentType: 'application/json',
      Authorization: `Bearer ${fields.token}`,
    }

    let uris = []

    fields.tracks.forEach((item, idx) => {
      if(item.track.uri) uris.push(item.track.uri)
    })

    // console.log(uris.length)

    try {
        
      const response = await axios.post(`https://api.spotify.com/v1/users/${fields.userID}/playlists`, 
        {
          name: fields.playlistName,
          description: ''
        },
        { headers: headerOptions }
      )

      if(response.data.id){
        
        const responseAddItems = await axios.post(`https://api.spotify.com/v1/playlists/${response.data.id}/tracks`, 
          { "uris": uris }, 
          { headers: headerOptions }
        )
        
      }

      return res.json('Playlist was generated')

      
    } catch (error) {
      console.log(error.response)

      if(error.response.data){
        if(error.response.data.error){
          if(error.response.data.error.status === 401){
            return res.status(401).json(error.response.data.error.message)
          }
        }
      }

      return res.status(400).json(error.response.data ? error.response.data : 'Error with spotify service')
      
    }

  })
  
}