# نظام الحضور الذكي — المرحلة 1
1. `npm install`
2. `cp .env.example .env` ثم املأ `JWT_SECRET` (32+ حرفًا عشوائيًا) و`SEED_USERNAME` و`SEED_PASSWORD`
3. `npm run seed` ينشئ حساب الدكتور والمادة، ثم احذف `SEED_PASSWORD` من `.env`
4. `npm start` ثم افتح http://localhost:3000/login
`/dashboard` يحوّلك إلى تسجيل الدخول إن لم تكن مسجّلًا.
