const authorization = require('../middleware/authorization');
const jwt = require('jsonwebtoken');
const config = require('config');
const _ = require('lodash');
const bcrypt = require('bcrypt');
const { validateUser, validatePassword } = require('../models/user');
const express = require('express');
const router = express.Router();

module.exports = (db) => {
  router.get('/me', authorization, async (req, res) => {
    try{
      const user = await db.oneOrNone('SELECT user_id, user_phone, user_first_name, user_last_name, role FROM users WHERE user_id = $1', req.user.user_id)
      res.send(user)
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }) 

  router.post('/', async (req, res) => {
    try{
      var { error } = validateUser(req.body)
      if (error) return res.status(400).send(error.details[0].message)

      var { error } = validatePassword(req.body.user_password)
      if (error) return res.status(400).send(error.details[0].message)

      const old_user = await db.oneOrNone('SELECT user_id FROM users WHERE user_phone = $1', req.body.user_phone)
      if (old_user) return res.status(400).send('User already exists')

      const salt = await bcrypt.genSalt(10);
      const hashed_password = await bcrypt.hash(req.body.user_password, salt);

      const user = await db.one('INSERT INTO users(user_first_name, user_last_name, user_phone, user_password) VALUES($1, $2, $3, $4) RETURNING *', [req.body.user_first_name, req.body.user_last_name, req.body.user_phone, hashed_password])

      const token = jwt.sign({user_id: user.user_id, role: user.role}, config.get('jwtPrivateKey'));
      
      user.data = token;

      res.header('x-auth-token', token).status(201).send(_.pick(user, ['user_id', 'user_first_name', 'user_last_name', 'user_phone', 'role', 'data']));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  })

  router.put('/:id', authorization, async (req, res) => {
    try{
      const { error } = validateUser(req.body)
      if (error) return res.status(400).send(error.details[0].message)

      const user = await db.oneOrNone('UPDATE users SET user_first_name=$1, user_last_name=$2, user_phone=$3, role=$4 WHERE user_id = $5 RETURNING *', [req.body.user_first_name, req.body.user_last_name, req.body.user_phone, req.user.role, req.user.user_id])
      if (!user) return res.status(404).send('The user with the given ID is not found')
      
      res.send(user)
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  })

  return router
}
