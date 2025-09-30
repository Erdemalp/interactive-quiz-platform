# 🎯 İnteraktif Quiz Platformu

**Mentimeter** benzeri, öğrencilerinize ders sırasında anlık sorular sorup gerçek zamanlı cevaplar alabileceğiniz modern bir web uygulaması.

🌐 **[Deployment Rehberi için DEPLOYMENT.md dosyasına bakın](./DEPLOYMENT.md)**

## ✨ Özellikler

- 🎓 **Öğretmen Paneli**: Oturum oluşturma, soru ekleme ve yönetme
- 👥 **Öğrenci Paneli**: QR kod veya kod ile kolay katılım
- ⚡ **Gerçek Zamanlı**: Socket.io ile anlık soru-cevap sistemi
- 📊 **Görsel Raporlar**: Cevapları grafik ve istatistiklerle görüntüleme
- 📱 **QR Kod**: Hızlı katılım için QR kod desteği
- 🎨 **Modern UI**: Tailwind CSS ile güzel ve responsive tasarım

## 🚀 Hızlı Başlangıç

### Gereksinimler

- **Node.js** (v18 veya üzeri) - [İndirmek için tıklayın](https://nodejs.org/)
- npm (Node.js ile birlikte gelir)

> **Not**: Node.js yoksa, önce yukarıdaki linkten indirip kurun.

### Adım 1: Bağımlılıkları Yükleyin

```bash
# Kök dizinde (backend)
npm install

# Client dizininde (frontend)
cd client
npm install
cd ..
```

Veya tek komutla:

```bash
npm run install-all
```

### Adım 2: Environment Variables (Opsiyonel - Yerel geliştirme için)

Varsayılan değerler localhost için çalışır. Production için [DEPLOYMENT.md](./DEPLOYMENT.md) dosyasına bakın.

### Adım 3: Uygulamayı Başlatın

Tek komutla hem backend hem frontend'i başlatın:

```bash
npm run dev
```

Bu komut:
- Backend sunucusunu `http://localhost:3000` adresinde
- Frontend uygulamasını `http://localhost:5173` adresinde başlatır

## 📖 Kullanım

### Öğretmen İçin

1. Ana sayfada "Öğretmen" kartından oturum oluşturun
2. Öğretmen panelinde:
   - QR kodu veya oturum kodunu öğrencilerinizle paylaşın
   - "Yeni Soru" butonuyla sorular ekleyin
   - Eklenen soruları "Başlat" butonuyla etkinleştirin
   - Anlık sonuçları grafiklerle görün
   - "Soruyu Bitir" ile sonuçları finalize edin

### Öğrenci İçin

1. Ana sayfada "Oturuma Katıl" butonuna tıklayın
2. Adınızı ve öğretmenin verdiği kodu girin
3. Öğretmen soru başlattığında:
   - Soruyu görün
   - Cevabınızı seçin ve gönderin
   - Sonuçları bekleyin

## 🛠️ Teknolojiler

### Backend
- **Node.js & Express**: RESTful API
- **Socket.io**: Gerçek zamanlı iletişim
- **QRCode**: QR kod üretimi
- **Nanoid**: Benzersiz oturum kodları

### Frontend
- **React 18**: UI kütüphanesi
- **Vite**: Modern build tool
- **React Router**: Sayfa yönlendirme
- **Tailwind CSS**: Stil ve tasarım
- **Recharts**: Grafik ve görselleştirme
- **Socket.io Client**: Gerçek zamanlı bağlantı

## 📁 Proje Yapısı

```
Quiz_deneme/
├── server/
│   └── index.js          # Backend API ve Socket.io sunucusu
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx           # Ana sayfa
│   │   │   ├── TeacherPanel.jsx   # Öğretmen paneli
│   │   │   ├── StudentJoin.jsx    # Öğrenci katılım sayfası
│   │   │   └── StudentQuiz.jsx    # Öğrenci quiz sayfası
│   │   ├── App.jsx                # Ana uygulama bileşeni
│   │   ├── main.jsx               # React giriş noktası
│   │   └── index.css              # Global stiller
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── package.json
└── README.md
```

## 🔧 Geliştirme

### Backend Geliştirme

Backend dosyası değiştiğinde otomatik olarak yeniden başlar (nodemon sayesinde).

```bash
npm run server
```

### Frontend Geliştirme

```bash
npm run client
```

### Production Build

```bash
npm run build
```

## 🎯 Özellik Detayları

### Oturum Yönetimi
- Benzersiz 6 haneli oturum kodları
- QR kod ile hızlı erişim
- Katılımcı takibi

### Soru Tipleri
- Çoktan seçmeli sorular
- Özelleştirilebilir seçenek sayısı
- Zaman limiti ayarı

### Gerçek Zamanlı İletişim
- Anlık soru dağıtımı
- Cevap toplama
- Sonuç güncellemeleri
- Katılımcı bildirimleri

### Sonuç Görselleştirme
- Bar grafik ile cevap dağılımı
- Yüzdelik oranlar
- Toplam katılımcı sayısı
- Renk kodlu gösterim

## 🌐 Production Deployment

Bu uygulama **localhost** yerine **gerçek sunucuda** çalışması için deploy edilebilir:

### Önerilen Servisler
- **Frontend**: Vercel (ücretsiz, hızlı)
- **Backend**: Render veya Railway (ücretsiz)

### Detaylı Deployment Rehberi
**[DEPLOYMENT.md](./DEPLOYMENT.md)** dosyasında adım adım açıklanmıştır:
- Backend deploy etme (Render/Railway)
- Frontend deploy etme (Vercel/Netlify)
- Environment variables ayarlama
- CORS ve güvenlik ayarları
- Sorun giderme

## 🎨 Tasarım Güncellemeleri

✨ **Mentimeter benzeri modern görünüm**:
- Poppins font ailesi
- Gradient renkler (mor, pembe, mavi)
- Büyük, bold tipografi
- Animasyonlu butonlar ve kartlar
- Hero pattern background
- Daha minimalist ve temiz arayüz

## 🌟 Gelecek Geliştirmeler

- [ ] Veritabanı entegrasyonu (MongoDB/PostgreSQL)
- [ ] Kullanıcı hesapları ve kimlik doğrulama
- [ ] Doğru/yanlış gösterimi ve puanlama
- [ ] Word cloud, rating, açık uçlu sorular
- [ ] Oturum geçmişi ve raporlama
- [ ] Excel/PDF export
- [ ] Zaman limiti göstergesi
- [ ] Mobil uygulama
- [ ] Çoklu dil desteği

## 📝 Lisans

MIT

## 👨‍💻 Geliştirici

Bu proje eğitim amaçlı geliştirilmiştir.

---

**Not**: Uygulama şu an development modunda çalışmaktadır. Production kullanımı için ek güvenlik önlemleri, veritabanı entegrasyonu ve hosting ayarları gereklidir.

