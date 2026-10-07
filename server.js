require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const SECRET = process.env.JWT_SECRET;
if (!SECRET || SECRET.length < 32) { console.error('JWT_SECRET مفقود أو أقصر من 32 حرفًا'); process.exit(1); }
const PROD = process.env.NODE_ENV === 'production';
const DUMMY_HASH = bcrypt.hashSync('dummy-password', 12); // لتوحيد زمن الاستجابة

const app = express();
app.disable('x-powered-by');
if (PROD) app.set('trust proxy', 1); // خلف وكيل الاستضافة (HTTPS)
app.use(helmet({ contentSecurityPolicy: { directives: {
  defaultSrc: ["'self'"],
  styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  fontSrc: ['https://fonts.gstatic.com'],
  imgSrc: ["'self'", 'data:'],
} } }));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

function auth(kind) {
  return (req, res, next) => {
    try {
      const p = jwt.verify(req.cookies.token, SECRET);
      const user = db.prepare('SELECT u.id, u.username, t.id AS teacher_id, t.full_name FROM users u JOIN teachers t ON t.user_id = u.id WHERE u.id = ?').get(p.uid);
      if (!user) throw new Error('no user');
      req.user = user; next();
    } catch {
      kind === 'page' ? res.redirect('/login') : res.status(401).json({ error: 'غير مصرح' });
    }
  };
}

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false,
  message: { error: 'محاولات كثيرة، حاول لاحقًا' } });

app.post('/api/login', loginLimiter, (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || typeof password !== 'string') return res.status(400).json({ error: 'بيانات غير صالحة' });
  const row = db.prepare('SELECT id, password_hash FROM users WHERE username = ? OR email = ?').get(username.trim(), username.trim());
  const ok = bcrypt.compareSync(password, row ? row.password_hash : DUMMY_HASH);
  if (!row || !ok) return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
  const token = jwt.sign({ uid: row.id }, SECRET, { expiresIn: '8h' });
  res.cookie('token', token, { httpOnly: true, sameSite: 'strict', secure: PROD, maxAge: 8 * 3600 * 1000 });
  res.json({ ok: true });
});
app.post('/api/logout', (req, res) => { res.clearCookie('token'); res.json({ ok: true }); });
app.get('/api/me', auth('api'), (req, res) => res.json({ name: req.user.full_name }));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public/login.html')));
app.get('/dashboard', auth('page'), (req, res) => res.sendFile(path.join(__dirname, 'views/dashboard.html')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));

app.get('/a/:token', (req, res) => res.sendFile(path.join(__dirname, 'public/student.html')));
require('./routes/attendance')(app, auth);
require('./routes/records')(app, auth);
require('./routes/reports')(app, auth);
require('./routes/roster')(app, auth);
app.get('/display', auth('page'), (req, res) => res.sendFile(path.join(__dirname, 'views/display.html')));
app.get('/roster', auth('page'), (req, res) => res.sendFile(path.join(__dirname, 'views/roster.html')));
app.get('/stats', auth('page'), (req, res) => res.sendFile(path.join(__dirname, 'views/stats.html')));
app.get('/lectures', auth('page'), (req, res) => res.sendFile(path.join(__dirname, 'views/lectures.html')));
app.get('/lectures/:id', auth('page'), (req, res) => res.sendFile(path.join(__dirname, 'views/lecture.html')));

app.listen(process.env.PORT || 3000, () => console.log('running'));
