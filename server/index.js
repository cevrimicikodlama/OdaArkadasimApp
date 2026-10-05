require('dotenv').config();

const bcrypt = require('bcryptjs');
const cors = require('cors');
const express = require('express');
const { rateLimit } = require('express-rate-limit');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const { z } = require('zod');

const app = express();
const port = Number(process.env.API_PORT || 4000);
const jwtSecret = process.env.JWT_SECRET;
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'oda_arkadasim',
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true,
  charset: 'utf8mb4',
});

const userColumns = 'id, first_name, last_name, email, birth_date, bio, created_at';
const passwordSchema = z.string().min(8).max(72).refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Şifre en fazla 72 bayt olabilir.');
const registerSchema = z.object({
  first_name: z.string().trim().min(1).max(50),
  last_name: z.string().trim().min(1).max(50),
  email: z.string().trim().email().max(100).transform((value) => value.toLowerCase()),
  password: passwordSchema,
  birth_date: z.string().date().nullable().optional(),
  bio: z.string().max(5000).nullable().optional(),
});
const loginSchema = z.object({
  email: z.string().trim().email().max(100).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(72),
});
const listingSchema = z.object({
  type: z.enum(['HAVE_ROOM', 'NEED_ROOM']),
  title: z.string().trim().min(1).max(150),
  description: z.string().trim().min(1).max(10000),
  city: z.string().trim().min(1).max(50),
  district: z.string().trim().min(1).max(50),
  price: z.number().positive().max(99999999.99),
});
const offerSchema = z.object({ listing_id: z.number().int().positive(), message: z.string().trim().max(5000).nullable().optional() });
const offerStatusSchema = z.object({ status: z.enum(['ACCEPTED', 'REJECTED']) });

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:8081,http://127.0.0.1:8081')
      .split(',').map((value) => value.trim()).filter(Boolean);
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Bu origin için CORS izni yok.'), false);
  },
}));
app.use(express.json({ limit: '32kb' }));

const authRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false });

function sendValidationError(response, error) {
  return response.status(400).json({ error: error.issues?.[0]?.message || 'Geçersiz istek.' });
}

function parseBody(schema, request, response) {
  const result = schema.safeParse(request.body);
  if (!result.success) {
    sendValidationError(response, result.error);
    return null;
  }
  return result.data;
}

function createAccessToken(user) {
  return jwt.sign({ email: user.email }, jwtSecret, {
    subject: String(user.id),
    issuer: 'oda-arkadasim-api',
    expiresIn: '7d',
  });
}

function requireAuth(request, response, next) {
  const authorization = request.get('authorization') || '';
  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token) return response.status(401).json({ error: 'Giriş yapman gerekiyor.' });
  try {
    const payload = jwt.verify(token, jwtSecret, { issuer: 'oda-arkadasim-api' });
    request.user = { id: Number(payload.sub), email: payload.email };
    return next();
  } catch {
    return response.status(401).json({ error: 'Oturumun geçersiz veya süresi dolmuş.' });
  }
}

function mapUser(row) {
  return {
    id: Number(row.id),
    first_name: row.first_name,
    last_name: row.last_name,
    email: row.email,
    birth_date: row.birth_date ? new Date(row.birth_date).toISOString().slice(0, 10) : null,
    bio: row.bio,
    created_at: row.created_at,
  };
}

function mapListing(row) {
  const age = row.birth_date ? Math.max(0, Math.floor((Date.now() - new Date(row.birth_date).getTime()) / 31557600000)) : null;
  return {
    id: Number(row.id),
    userId: Number(row.user_id),
    type: row.type,
    title: row.title,
    description: row.description,
    city: row.city,
    district: row.district,
    price: Number(row.price),
    status: row.status,
    created_at: row.created_at,
    ownerName: `${row.first_name} ${row.last_name}`,
    age,
    occupation: 'Ev arkadaşı',
    tags: [],
    image: null,
  };
}

const listingSelect = `SELECT l.id, l.user_id, l.type, l.title, l.description, l.city, l.district,
  l.price, l.status, l.created_at, u.first_name, u.last_name, u.birth_date
  FROM listings l INNER JOIN users u ON u.id = l.user_id`;

app.get('/api/health', async (request, response) => {
  await pool.query('SELECT 1');
  return response.json({ status: 'ok', database: 'connected' });
});

app.post('/api/auth/register', authRateLimit, async (request, response) => {
  const body = parseBody(registerSchema, request, response);
  if (!body) return;
  const passwordHash = await bcrypt.hash(body.password, 12);
  try {
    const [result] = await pool.execute(
      'INSERT INTO users (first_name, last_name, email, password_hash, birth_date, bio) VALUES (?, ?, ?, ?, ?, ?)',
      [body.first_name, body.last_name, body.email, passwordHash, body.birth_date || null, body.bio || null],
    );
    const [rows] = await pool.execute(`SELECT ${userColumns} FROM users WHERE id = ?`, [result.insertId]);
    const user = mapUser(rows[0]);
    return response.status(201).json({ user, token: createAccessToken(user) });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return response.status(409).json({ error: 'Bu e-posta ile kayıtlı bir hesap var.' });
    throw error;
  }
});

app.post('/api/auth/login', authRateLimit, async (request, response) => {
  const body = parseBody(loginSchema, request, response);
  if (!body) return;
  const [rows] = await pool.execute(`SELECT ${userColumns}, password_hash FROM users WHERE email = ?`, [body.email]);
  const row = rows[0];
  if (!row || !(await bcrypt.compare(body.password, row.password_hash))) {
    return response.status(401).json({ error: 'E-posta veya şifre hatalı.' });
  }
  const user = mapUser(row);
  return response.json({ user, token: createAccessToken(user) });
});

app.get('/api/auth/me', requireAuth, async (request, response) => {
  const [rows] = await pool.execute(`SELECT ${userColumns} FROM users WHERE id = ?`, [request.user.id]);
  if (!rows[0]) return response.status(404).json({ error: 'Hesap bulunamadı.' });
  return response.json({ user: mapUser(rows[0]) });
});

app.get('/api/listings', async (request, response) => {
  const querySchema = z.object({ type: z.enum(['HAVE_ROOM', 'NEED_ROOM']).optional(), city: z.string().max(50).optional() });
  const query = querySchema.safeParse(request.query);
  if (!query.success) return sendValidationError(response, query.error);
  const conditions = ['l.status = \'ACTIVE\''];
  const parameters = [];
  if (query.data.type) {
    conditions.push('l.type = ?');
    parameters.push(query.data.type);
  }
  if (query.data.city) {
    conditions.push('l.city LIKE ?');
    parameters.push(`%${query.data.city}%`);
  }
  const [rows] = await pool.execute(`${listingSelect} WHERE ${conditions.join(' AND ')} ORDER BY l.created_at DESC LIMIT 100`, parameters);
  return response.json({ listings: rows.map(mapListing) });
});

app.post('/api/listings', requireAuth, async (request, response) => {
  const body = parseBody(listingSchema, request, response);
  if (!body) return;
  const [result] = await pool.execute(
    'INSERT INTO listings (user_id, type, title, description, city, district, price) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [request.user.id, body.type, body.title, body.description, body.city, body.district, body.price],
  );
  const [rows] = await pool.execute(`${listingSelect} WHERE l.id = ?`, [result.insertId]);
  return response.status(201).json({ listing: mapListing(rows[0]) });
});

app.get('/api/offers', requireAuth, async (request, response) => {
  const [rows] = await pool.execute(
    `SELECT o.id, o.listing_id, o.applicant_id, o.message, o.status, o.created_at,
      l.title AS listing_title, l.user_id AS listing_owner_id,
      applicant.first_name AS applicant_first_name, applicant.last_name AS applicant_last_name
     FROM offers o
     INNER JOIN listings l ON l.id = o.listing_id
     INNER JOIN users applicant ON applicant.id = o.applicant_id
     WHERE l.user_id = ? OR o.applicant_id = ?
     ORDER BY o.created_at DESC LIMIT 100`,
    [request.user.id, request.user.id],
  );
  const offers = rows.map((row) => {
    const direction = Number(row.listing_owner_id) === request.user.id ? 'incoming' : 'outgoing';
    return {
      id: Number(row.id),
      listingId: Number(row.listing_id),
      listingTitle: row.listing_title,
      applicantName: direction === 'incoming' ? `${row.applicant_first_name} ${row.applicant_last_name}` : 'Sen',
      message: row.message || '',
      status: row.status,
      direction,
      created_at: row.created_at,
    };
  });
  return response.json({ offers });
});

app.post('/api/offers', requireAuth, async (request, response) => {
  const body = parseBody(offerSchema, request, response);
  if (!body) return;
  const [listings] = await pool.execute('SELECT id, user_id, status FROM listings WHERE id = ?', [body.listing_id]);
  const listing = listings[0];
  if (!listing || listing.status !== 'ACTIVE') return response.status(404).json({ error: 'Aktif ilan bulunamadı.' });
  if (Number(listing.user_id) === request.user.id) return response.status(400).json({ error: 'Kendi ilanına teklif gönderemezsin.' });
  try {
    const [result] = await pool.execute(
      'INSERT INTO offers (listing_id, applicant_id, message) VALUES (?, ?, ?)',
      [body.listing_id, request.user.id, body.message || null],
    );
    return response.status(201).json({ id: Number(result.insertId), status: 'PENDING' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return response.status(409).json({ error: 'Bu ilana daha önce teklif gönderdin.' });
    throw error;
  }
});

app.patch('/api/offers/:id/status', requireAuth, async (request, response) => {
  const body = parseBody(offerStatusSchema, request, response);
  const offerId = Number(request.params.id);
  if (!body || !Number.isSafeInteger(offerId) || offerId < 1) return response.status(400).json({ error: 'Geçersiz teklif.' });
  const [result] = await pool.execute(
    `UPDATE offers o INNER JOIN listings l ON l.id = o.listing_id
     SET o.status = ? WHERE o.id = ? AND l.user_id = ? AND o.status = 'PENDING'`,
    [body.status, offerId, request.user.id],
  );
  if (!result.affectedRows) return response.status(404).json({ error: 'Bekleyen teklif bulunamadı.' });
  return response.json({ id: offerId, status: body.status });
});

app.use((request, response) => response.status(404).json({ error: 'Endpoint bulunamadı.' }));
app.use((error, request, response, next) => {
  console.error(error);
  if (response.headersSent) return next(error);
  return response.status(500).json({ error: 'Sunucu hatası oluştu.' });
});

async function start() {
  if (!process.env.DB_USER || process.env.DB_PASSWORD === undefined) {
    throw new Error('DB_USER ve DB_PASSWORD ayarlarını .env dosyasında tanımlayın.');
  }
  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error('JWT_SECRET en az 32 karakter olmalı; güçlü ve rastgele bir değer kullanın.');
  }
  await pool.query('SELECT 1');
  app.listen(port, '0.0.0.0', () => console.info(`Oda Arkadaşım API http://0.0.0.0:${port} üzerinde hazır.`));
}

start().catch((error) => {
  console.error('API başlatılamadı:', error.message);
  process.exitCode = 1;
});