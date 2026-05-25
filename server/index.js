const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const debateRoutes = require('./routes/debate');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/debate', debateRoutes);

const distPath = path.join(__dirname, '../client/dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return;
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  const keyPreview = (process.env.GROQ_API_KEY || 'missing').substring(0, 12) + '...'
  console.log(`[Argue With Me] Server running on port ${PORT}`)
  console.log(`[Argue With Me] Model: ${process.env.AI_MODEL || 'llama-3.3-70b-versatile'}, Key: ${keyPreview}`)
});