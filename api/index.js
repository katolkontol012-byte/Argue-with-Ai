const express = require('express');
const cors = require('cors');
const debateRoutes = require('../server/routes/debate');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/debate', debateRoutes);

app.get('/api', (req, res) => {
  res.json({ message: 'Argue With Me API running' });
});

module.exports = app;
