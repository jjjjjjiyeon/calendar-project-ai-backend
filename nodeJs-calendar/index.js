// index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { dbConnection } = require('./database/config');

const app = express();

// DB
dbConnection();

// CORS
app.use(cors());

// public 디렉토리
app.use(express.static('public'));

// Body
app.use(express.json());

// Rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/calendars', require('./routes/calendars'));
app.use('/api/events', require('./routes/events'));

app.listen(process.env.PORT, () => {
  console.log('Servidor corriendo en puerto', process.env.PORT);
});
