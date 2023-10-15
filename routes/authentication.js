const config = require('config');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const {validatePassword, validatePhone} = require('../models/user');
const {validateAdmin} = require('../models/admin')
const bcrypt = require('bcrypt');
const express = require('express')
const router = express.Router()

module.exports = (db) => {
  router.post('/user', async (req, res) => {
    try{
      if (!req.body.user_phone){
        return res.status(400).send('Phone number required')
      }
      if (!req.body.user_password){
        return res.status(400).send('Password required')
      }
      var { error } = validatePhone(req.body.user_phone)
      if (error) return res.status(400).send(error.details[0].message)

      var { error } = validatePassword(req.body.user_password)
      if (error) return res.status(400).send(error.details[0].message)

      const user = await db.oneOrNone('SELECT * FROM users WHERE user_phone = $1', req.body.user_phone)
      if (!user) return res.status(400).send('Invalid phone number or password')

      const validPassword = await bcrypt.compare(req.body.user_password, user.user_password)
      if (!validPassword) return res.status(400).send('Invalid phone number or password')

      const token = jwt.sign({user_id: user.user_id, role: user.role}, config.get('jwtPrivateKey'));

      user.data = token
      res.header('x-auth-token', token).status(200).send(_.pick(user, ['user_id', 'user_first_name', 'user_last_name', 'user_phone', 'data']));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  })

  router.post('/artist', async (req, res) => {
    try{
      if (!req.body.artist_phone){
        return res.status(400).send('Phone number required')
      }
      
      if (!req.body.artist_password){
        return res.status(400).send('Password required')
      }
      
      var { error } = validatePhone(req.body.artist_phone)
      if (error) return res.status(400).send(error.details[0].message)
      
      var { error } = validatePassword(req.body.artist_password)
      if (error) return res.status(400).send(error.details[0].message)
      
      const artist = await db.oneOrNone('SELECT * FROM artists WHERE artist_phone = $1', req.body.artist_phone)
      if (!artist) return res.status(400).send('Invalid phone number or password')
      
      const validPassword = await bcrypt.compare(req.body.artist_password, artist.artist_password)
      if (!validPassword) return res.status(400).send('Invalid phone number or password')

      const token = jwt.sign({artist_id: artist.artist_id, role: "artist"}, config.get('jwtPrivateKey'));
      artist.token = token;
      
      res.header('x-auth-token', token).status(200).send(_.pick(artist, ['artist_id', 'artist_phone', 'artist_first_name', 'artist_last_name', 'artist_stage_name', 'artist_bio', 'artist_catagory', 'artist_id_card', 'artist_image_url', 'token']));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  })

  router.post('/admin', async (req, res) => {
    try{
      var { error } = validateAdmin(req.body)
      if (error) return res.status(400).send(error.details[0].message)
      
      var { error } = validatePhone(req.body.admin_phone)
      if (error) return res.status(400).send(error.details[0].message)

      var { error } = validatePassword(req.body.admin_password)
      if (error) return res.status(400).send(error.details[0].message)

      const admin = await db.oneOrNone('SELECT * FROM admins WHERE admin_phone = $1', req.body.admin_phone)
      if (!admin) return res.status(400).send('Invalid email or password')

      const validPassword = await bcrypt.compare(req.body.admin_password, admin.admin_password)
      if (!validPassword) return res.status(400).send('Invalid email or password')

      const token = jwt.sign({admin_id: admin.admin_id, role: "admin"}, config.get('jwtPrivateKey'));
      return res.header('x-auth-token', token).status(200).send(_.pick(artist, ['admin_id', 'artist_phone']));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  })

  return router
}
