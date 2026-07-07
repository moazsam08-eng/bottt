# نشر البوت على Railway

## خطوات النشر

### 1) جهز قاعدة بيانات MongoDB
- روح على [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) واعمل cluster مجاني.
- اعمل user/password وحط IP `0.0.0.0/0` في Network Access.
- خد الـ Connection String (هيكون شكله `mongodb+srv://...`).

### 2) ارفع الكود على GitHub
```
git init
git add .
git commit -m "ready for railway"
git remote add origin <your-repo-url>
git push -u origin main
```

### 3) اعمل مشروع جديد على Railway
- افتح [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
- اختار الريبو بتاعك.

### 4) ضيف الـ Environment Variables
من تاب **Variables** في مشروعك على Railway، ضيف:

| اسم المتغير | القيمة |
|---|---|
| `DISCORD_TOKEN` | توكن البوت من Discord Developer Portal |
| `CLIENT_ID` | Application ID من Discord |
| `MAIN_GUILD_ID` | ID السيرفر الأساسي |
| `MONGO_URI` | الـ connection string بتاع MongoDB |
| `SESSION_SECRET` | أي نص عشوائي طويل (32+ حرف) |
| `DEFAULT_PREFIX` | `!` (أو أي بريفكس تحبه) |
| `DEFAULT_LANGUAGE` | `en` أو `ar` |

> ملحوظة: `PORT` بيتحط أوتوماتيك من Railway، متضيفهوش بنفسك.

### 5) فعّل دومين عام (للـ Dashboard و OAuth)
- من **Settings → Networking** اضغط **Generate Domain**.
- هيديك دومين شكله `your-app.up.railway.app`.

### 6) ظبط Discord OAuth
- روح [Discord Developer Portal](https://discord.com/developers/applications) → تطبيقك → **OAuth2 → Redirects**.
- ضيف: `https://your-app.up.railway.app/auth/callback`

### 7) أول Deploy
- Railway هيعمل build و run لوحده.
- لو لقيت مشكلة في الـ build، شوف الـ Logs.

---

## ملاحظات مهمة

- البوت بيشغل **حاجتين في نفس الوقت**: الـ Discord client + الـ dashboard على نفس البورت اللي Railway بيديهولك.
- لو الـ build فشل بسبب `ts-node` في `postbuild`، تأكد إن Railway مش بيعمل prune للـ devDependencies قبل الـ build (Nixpacks بيعمل install كامل قبل الـ build فالعادة تمام).
- ملف `settings.json` موجود مع الكود وهيتقرأ تلقائي.
- بدّل `SESSION_SECRET` لأي حاجة عشوائية، مهم جداً للأمان.
