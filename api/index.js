const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const debateRoutes = require('../server/routes/debate');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/debate', debateRoutes);

app.get('/api', (req, res) => {
  const keyPreview = (process.env.GROQ_API_KEY || 'NOT SET').substring(0, 8) + '...'
  res.json({
    message: 'Argue With Me API running',
    model: process.env.AI_MODEL || 'llama-3.3-70b-versatile',
    key: keyPreview
  });
});

module.exports = app;
