const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const debateRoutes = require('./routes/debate');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/debate', debateRoutes);

const distPath = path.join(__dirname, '../client/dist');
const hasDist = fs.existsSync(distPath);
if (hasDist) {
  console.log(`[Static] distPath: ${distPath}`);
  fs.readdirSync(distPath, { recursive: true }).forEach(f => console.log(`  ${f}`));
  app.use(express.static(distPath));
  app.get(/^\/(?!api\/).*/, (req, res) => {
    const htmlPath = path.join(distPath, 'index.html');
    if (fs.existsSync(htmlPath)) {
      res.sendFile(htmlPath);
    } else {
      res.status(404).json({ error: 'Frontend not built. Run: cd client && npm run build' });
    }
  });
} else {
  console.log(`[Static] distPath NOT FOUND: ${distPath}`);
}

app.listen(PORT, () => {
  const keyPreview = (process.env.GROQ_API_KEY || 'missing').substring(0, 12) + '...'
  console.log(`[Argue With Me] Server running on port ${PORT}`)
  console.log(`[Argue With Me] Model: ${process.env.AI_MODEL || 'llama-3.3-70b-versatile'}, Key: ${keyPreview}`)
});