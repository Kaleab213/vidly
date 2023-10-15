const authorization = require('../middleware/authorization');
const artist = require('../middleware/artist');
const jwt = require('jsonwebtoken');
const config = require('config');
const _ = require('lodash');
const bcrypt = require('bcrypt');
const {validatePassword } = require('../models/user');
const {validateArtist} = require('../models/artist');
const express = require('express');
const router = express.Router();

module.exports = (db) => {

  router.post('/', async (req, res) => {
    try{
      var { error } = validateArtist(req.body)
      if (error) return res.status(400).send(error.details[0].message)
      
      var { error } = validatePassword(req.body.artist_password)
      if (error) return res.status(400).send(error.details[0].message)
      
      const old_artist = await db.oneOrNone('SELECT artist_id FROM artists WHERE artist_phone = $1', req.body.artist_phone)
      if (old_artist) return res.status(400).send('Artist already exists')
      
      const salt = await bcrypt.genSalt(10);
      const hashed_password = await bcrypt.hash(req.body.artist_password, salt);
      
      const artist = await db.one('INSERT INTO artists(artist_phone, artist_first_name, artist_last_name, artist_stage_name, artist_bio, artist_category, artist_password, artist_id_card) VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *', [req.body.artist_phone, req.body.artist_first_name, req.body.artist_last_name, req.body.artist_stage_name, req.body.artist_bio, req.body.artist_category, hashed_password, req.body.artist_id_card])
      
      const token = jwt.sign({artist_id: artist.artist_id, role: artist.role}, config.get('jwtPrivateKey'));
      artist.token = token;
      
      res.header('x-auth-token', token).status(201).send(_.pick(artist, ['artist_id', 'artist_phone', 'artist_first_name', 'artist_last_name', 'artist_stage_name', 'artist_bio', 'artist_category', 'artist_id_card', 'artist_image_url', 'token']));

    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  })

  router.get('/me', authorization, artist, async (req, res) => {
    try{
      const artist = await db.oneOrNone('SELECT artist_id, artist_phone, artist_first_name, artist_last_name, artist_stage_name, artist_bio, artist_category FROM artists WHERE artist_id = $1', req.user.artist_id)
      res.send(artist)
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }) 

  router.put('/:id', authorization, artist, async (req, res) => {
    try{
      const { error } = validateArtist(req.body)
      if (error) return res.status(400).send(error.details[0].message)

      const artist = await db.oneOrNone('UPDATE artists SET artist_first_name=$1, artist_last_name=$2, artist_stage_name=$3, artist_bio=$4 WHERE artist_id=$5 RETURNING *', [req.body.artist_first_name, req.body.artist_last_name, req.body.artist_stage_name, req.body.artist_bio, req.user.artist_id])

      if (!artist) return res.status(404).send('The artist with the given ID is not found')
      
      res.send(artist)
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  })

  return router
}
