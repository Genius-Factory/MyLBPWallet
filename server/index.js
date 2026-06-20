require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cheerio = require('cheerio'); 
const axios = require('axios');    
const helmet = require('helmet');
const morgan = require('morgan');
require('express-async-errors');

const app = express();

app.use(helmet());


const clientUrls = (process.env.CLIENT_URL || '').split(',').map(s => s.trim()).filter(Boolean);
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (clientUrls.length === 0) return callback(null, true);
    if (clientUrls.includes(origin)) return callback(null, true);
    try {
      const reqHost = new URL(origin).host;
      if (clientUrls.some(u => { try { return new URL(u).host === reqHost; } catch { return false; } })) {
        return callback(null, true);
      }
    } catch {}
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());


morgan.token('user', (req) => (req.auth?.userId ? `user:${req.auth.userId}` : 'user:-'));
morgan.token('origin', (req) => (req.headers.origin || '-'));
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :origin :user'));


// Routes
const healthHandler = async (req, res, next) => {
  try {
    const db = require('./db');
    const result = await db.query('SELECT 1 as ok');
    res.json({ status: 'ok', db: result.rows[0].ok === 1 });
  } catch (err) {
    next(err);
  }
};
app.get('/healthz', healthHandler);
app.get('/healthz/healthz', healthHandler);



app.get('/api/live-prices', async (req, res) => {
  try {
    
    const { data: html } = await axios.get('https://books.toscrape.com/');
    const $ = cheerio.load(html);
    
    const labels = [];
    const values = [];

   
    $('.product_pod').each((index, element) => {
      if (index < 7) { 
        const bookTitle = $(element).find('h3 a').attr('title');
        const bookPrice = $(element).find('.price_color').text();
        
        if (bookTitle && bookPrice) {
          
          labels.push(bookTitle.substring(0, 12) + '...');
          values.push(parseFloat(bookPrice.replace(/[^0-9.]/g, '')));
        }
      }
    });

    res.json({ labels, values });

  } catch (error) {
    console.error("Scraping route error details:", error);
    res.status(500).json({ error: 'Failed to extract sandbox data.' });
  }
});


app.use('/api/users', require('./routes/users'));


const { authenticate, syncUser } = require('./middleware/auth');
app.get('/api/me', authenticate, syncUser, (req, res) => {
  const email = req.clerkUser?.emailAddresses?.[0]?.emailAddress;
  res.json({ id: req.auth.userId, email, role: req.userRole });
});


app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
