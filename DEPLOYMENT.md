# 🚀 Deployment Rehberi

Bu proje **Backend (Node.js/Socket.io)** ve **Frontend (React)** olmak üzere iki ayrı servisten oluşur.

## 📋 Gerekli Servisler

- **Frontend**: Vercel (önerilen) veya Netlify
- **Backend**: Render (önerilen), Railway, Heroku veya DigitalOcean

---

## 1️⃣ Backend Deployment (Render)

### Adım 1: Render Hesabı Oluşturun
1. [render.com](https://render.com) adresine gidin
2. GitHub ile giriş yapın

### Adım 2: Yeni Web Service Oluşturun
1. Dashboard'da **"New +"** → **"Web Service"** seçin
2. GitHub reponuzu bağlayın
3. Ayarları yapın:
   - **Name**: `quiz-backend` (veya istediğiniz isim)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server/index.js`
   - **Plan**: Free

### Adım 3: Environment Variables Ekleyin
Settings → Environment kısmından:
```
CLIENT_URL=https://your-frontend.vercel.app
PORT=3000
```

### Adım 4: Deploy Edin
- "Create Web Service" butonuna tıklayın
- Deploy tamamlandığında URL'i kopyalayın (örn: `https://quiz-backend.onrender.com`)

⚠️ **ÖNEMLİ**: Render'ın free planı 15 dakika inaktif kalınca uyur. İlk istekte 30-60 saniye gecikme olabilir.

---

## 2️⃣ Frontend Deployment (Vercel)

### Adım 1: Vercel Hesabı Oluşturun
1. [vercel.com](https://vercel.com) adresine gidin
2. GitHub ile giriş yapın

### Adım 2: Proje Import Edin
1. **"Add New..."** → **"Project"** seçin
2. GitHub reponuzu seçin
3. **Root Directory**: `client` olarak ayarlayın

### Adım 3: Build Settings
Vercel otomatik algılar ama kontrol edin:
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Adım 4: Environment Variables Ekleyin
```
VITE_API_URL=https://quiz-backend.onrender.com
VITE_SOCKET_URL=https://quiz-backend.onrender.com
VITE_CLIENT_URL=https://your-project.vercel.app
```

### Adım 5: Deploy Edin
- "Deploy" butonuna tıklayın
- Deploy tamamlandığında URL'i alın

### Adım 6: Backend'i Güncelleyin
Render'daki backend environment variables'a frontend URL'ini ekleyin:
```
CLIENT_URL=https://your-project.vercel.app
```

---

## 3️⃣ Alternatif: Railway (Backend)

Railway daha hızlı ve free plan daha cömert:

1. [railway.app](https://railway.app) → GitHub ile giriş
2. **"New Project"** → **"Deploy from GitHub repo"**
3. Root directory ayarı gerekmez
4. Environment variables:
   ```
   CLIENT_URL=https://your-frontend.vercel.app
   PORT=3000
   ```
5. Settings → Networking → Generate Domain

---

## 4️⃣ Alternatif: Netlify (Frontend)

1. [netlify.com](https://netlify.com) → GitHub ile giriş
2. **"Add new site"** → **"Import an existing project"**
3. Base directory: `client`
4. Build command: `npm run build`
5. Publish directory: `client/dist`
6. Environment variables ekleyin (Vercel'deki gibi)

---

## 🔧 Yerel .env Ayarları

### Backend (.env)
```bash
PORT=3000
CLIENT_URL=http://localhost:5173
```

### Frontend (client/.env)
```bash
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
VITE_CLIENT_URL=http://localhost:5173
```

---

## ✅ Deployment Sonrası Kontroller

### Backend Çalışıyor mu?
```bash
curl https://your-backend.onrender.com/api/session/ABC123
```

### Frontend Çalışıyor mu?
Tarayıcıda frontend URL'inize gidin ve:
1. Oturum oluşturun
2. QR kodu taratın
3. Öğrenci olarak katılın
4. Soru sorup cevap verin

### CORS Hatası Alıyorsanız
Backend environment variables'daki `CLIENT_URL` ile frontend URL'inin aynı olduğundan emin olun (trailing slash olmadan).

---

## 🐛 Yaygın Sorunlar

### 1. "Failed to fetch" Hatası
- Frontend .env dosyasındaki API_URL'i kontrol edin
- Backend'in ayakta olduğunu doğrulayın
- CORS ayarlarını kontrol edin

### 2. Socket.io Bağlanamıyor
- SOCKET_URL'in doğru olduğundan emin olun
- Backend'in WebSocket desteklediğinden emin olun
- Render: WebSocket support otomatik aktif

### 3. QR Kod Yanlış URL Gösteriyor
- Backend CLIENT_URL environment variable'ını güncelleyin
- Frontend CLIENT_URL environment variable'ını güncelleyin

---

## 💰 Ücretsiz Seçenekler

| Servis | Backend | Frontend | Limitler |
|--------|---------|----------|----------|
| **Render** | ✅ Free | ❌ | 750 saat/ay, 15dk inaktif = uyur |
| **Railway** | ✅ Free | ❌ | $5 credit/ay (500 saat), uyumaz |
| **Vercel** | ❌ | ✅ Free | Sınırsız, hızlı |
| **Netlify** | ❌ | ✅ Free | 100GB bandwidth/ay |

**Önerilen Kombinasyon**: Railway (Backend) + Vercel (Frontend)

---

## 📱 Mobil QR Okuyucu

Öğrenciler herhangi bir QR okuyucu app kullanabilir:
- iOS: Kamera uygulaması (native)
- Android: Google Lens veya Kamera
- Üçüncü parti: QR Code Reader apps

---

## 🔒 Production Güvenlik (Gelecek)

Bu versiyon MVP içindir. Production için:
- [ ] Rate limiting ekle
- [ ] HTTPS zorla
- [ ] Session expiration
- [ ] Input validation/sanitization
- [ ] PostgreSQL/MongoDB ekle
- [ ] Authentication ekle
- [ ] Logging/monitoring (Sentry)

---

## 📞 Destek

Sorun yaşarsanız:
1. Browser console'u kontrol edin
2. Backend logs'u Render/Railway'den kontrol edin
3. Environment variables'ları doğrulayın
4. CORS ayarlarını kontrol edin

