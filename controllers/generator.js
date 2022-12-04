const querystring = require('query-string');
const request = require('request')
const axios = require('axios')
const Buffer = require('buffer/').Buffer
const formidable = require('formidable')
const { parseOnly } = require('../helpers/forms');
const { sortByKey } = require('../helpers/sort')

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

    if(fields.tracks){

      let tracks = fields.tracks

      await Promise.all(fields.tracks.map( async (item, index) => {
          try {
      
            const responseAudioFeatures = await axios.get(`https://api.spotify.com/v1/audio-features/${item.track.id}`, 
              { headers: headerOptions }
            )
            
            tracks[index].track.key = responseAudioFeatures.data.key
            
          } catch (error) {
            console.log(error.response ? error.response.data : error)

            if(error.response.data){
              if(error.response.data.error){
                if(error.response.data.error.status === 401){
                  return res.status(401).json(error.response.data.error.message)
                }
              }
            }
            
            return res.status(400).json(error.response ? error.response.data : 'Error getting track audio features')

          }
      }))

      fields.tracks = tracks
      
    }


    

    fields.tracks.forEach((item, idx) => {
      if(item.track.uri) uris.push(item.track.uri)
    })
    

    const parts = Math.ceil((uris.length / 100))

    let allTracks = new Object()

    for(let i = 0; i < parts; i++ ){

      let end = (i + 1) * 100
      let start = i * 100

      allTracks[i] = [...uris.slice(start, end)]
      
    }

    let playlistCreatedID 

    // parseOnly(fields)
    // JSON.parse(fields.userID)

    // console.log(fields.userID)
    
    try {

      const responseCreatedPlaylist = await axios.post(`https://api.spotify.com/v1/users/${JSON.parse(fields.userID)}/playlists`, 
        {
          name: JSON.parse(fields.playlistName),
          description: ''
        },
        { headers: headerOptions }
      )

      playlistCreatedID = responseCreatedPlaylist.data.id
      
    } catch (error) {
      
      console.log(error.response ? error.response.data : error)

      if(error.response.data){
        if(error.response.data.error){
          if(error.response.data.error.status === 401){
            return res.status(401).json(error.response.data.error.message)
          }
        }
      }
      
      return res.status(400).json(error.response ? error.response.data : 'Error creating playlist')
      
    }

    await Promise.all(Object.keys(allTracks).map( async (item, index) => {
      
      try {

        if( playlistCreatedID ){
          
          const responseAddItems = await axios.post(`https://api.spotify.com/v1/playlists/${playlistCreatedID}/tracks`, 
            { "uris": allTracks[item] }, 
            { headers: headerOptions }
          )
          
        }
        
      } catch (error) {
        console.log(error.response ? error.response.data : error)

        if(error.response.data){
          if(error.response.data.error){
            if(error.response.data.error.status === 401){
              return res.status(401).json(error.response.data.error.message)
            }
          }
        }

        return res.status(400).json(error.response.data ? error.response.data : 'Error with updating generated playlist')
        
      }
      
    }))
    
    return res.json('Playlist was generated')
    
  })
  
}