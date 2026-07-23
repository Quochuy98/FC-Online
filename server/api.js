const express = require('express');
const path = require('path');
const logger = require('../src/utils/logger');
const { getPlayerFromUrl } = require('../src/services/fifaAddictPlayerService');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use(express.json({ limit: '16kb' }));
app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
  res.render('pages/home', {
    title: 'Đào tạo cầu thủ FC Online',
    currentPage: 'home',
  });
});

// The application's only API: import one player directly from FIFA Addict.
app.post('/api/player/import', async (req, res) => {
  try {
    const player = await getPlayerFromUrl(req.body && req.body.url);
    res.json({ success: true, data: player });
  } catch (error) {
    logger.warn('FIFA Addict import failed', { error: error.message });
    const inputError = /link|hỗ trợ|dạng/i.test(error.message);
    res.status(inputError ? 400 : 502).json({ success: false, error: error.message });
  }
});

function startServer() {
  return app.listen(PORT, () => {
    logger.info(`FC Online Training Lab running on http://localhost:${PORT}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
