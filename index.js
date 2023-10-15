const config = require('config')
const cors = require('cors');
const users = require('./routes/users')
const artists = require('./routes/artists')
const authentication = require('./routes/authentication')
const gdrive = require('./routes/gdrive')
const express = require('express')
const pgp = require('pg-promise')()

const app = express()

// setx VARIABLE_NAME "new_value" to set a variable as an env var
const privateKey = config.get('jwtPrivateKey')
if (!privateKey){
  console.error('Fatal Error: jwtPrivateKey is not defined.');
  process.exit(1);
}

// Configure PostgreSQL connection
const connection = {
  host: 'localhost',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres'
}

// Connect to PostgreSQL
const db = pgp(connection)

app.use(cors());
app.use(express.json())
app.use('/api/users', users(db))
app.use('/api/artists', artists(db))
app.use('/api/authentication', authentication(db))
app.use('/api/gdrive', gdrive(db))

const port = process.env.PORT || 5000
app.listen(port, () => console.log(`Listening on port ${port}...`))
