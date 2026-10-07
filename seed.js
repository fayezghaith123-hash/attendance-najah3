require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');
const { SEED_USERNAME: u, SEED_PASSWORD: p } = process.env;
if (!u || !p || p.length < 10) { console.error('عيّن SEED_USERNAME و SEED_PASSWORD (10 أحرف على الأقل) في .env'); process.exit(1); }
if (db.prepare('SELECT 1 FROM users WHERE username = ?').get(u)) { console.log('المستخدم موجود مسبقًا'); process.exit(0); }
db.transaction(() => {
  const uid = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(u, bcrypt.hashSync(p, 12)).lastInsertRowid;
  const tid = db.prepare('INSERT INTO teachers (user_id, full_name) VALUES (?, ?)').run(uid, 'د. سائد أبو حجلة').lastInsertRowid;
  db.prepare('INSERT INTO courses (teacher_id, name, semester) VALUES (?, ?, ?)').run(tid, 'دراسات فلسطينية', 'خريف 2026');
})();
console.log('تم إنشاء حساب الدكتور والمادة. احذف SEED_PASSWORD من .env الآن.');
