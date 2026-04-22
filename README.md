# BİLSEM Math Intelligence Platform
## Kurulum ve Çalıştırma Kılavuzu

---

## 📁 Proje Yapısı

```
bilsem-platform/
├── backend/                    # NestJS API
│   ├── src/
│   │   ├── auth/               # JWT kimlik doğrulama
│   │   ├── users/              # Kullanıcı profil & not defteri
│   │   ├── students/           # Öğrenci CRUD & analitik
│   │   ├── groups/             # Grup yönetimi
│   │   ├── activities/         # Etkinlik kütüphanesi & ders kaydı
│   │   ├── questions/          # Soru bankası
│   │   ├── plans/              # Konu planlayıcı
│   │   ├── feedback/           # Geri bildirim & gözlemler
│   │   ├── reports/            # Raporlar & dashboard stats
│   │   ├── ai/                 # Claude AI entegrasyonu
│   │   ├── gdrive/             # Google Drive entegrasyonu
│   │   └── common/prisma/      # Veritabanı servisi
│   ├── prisma/
│   │   └── schema.prisma       # Tam veritabanı şeması
│   └── .env.example
│
└── frontend/                   # Next.js 14 App
    ├── src/
    │   ├── app/
    │   │   ├── (auth)/login/   # Giriş sayfası
    │   │   └── (dashboard)/    # Korumalı panel sayfaları
    │   │       ├── dashboard/  # Ana panel
    │   │       ├── students/   # Öğrenci yönetimi
    │   │       ├── groups/     # Grup yönetimi
    │   │       ├── activities/ # Etkinlik kütüphanesi
    │   │       ├── questions/  # Soru bankası + AI üretici
    │   │       ├── planner/    # Konu planlayıcı
    │   │       ├── feedback/   # Geri bildirim
    │   │       ├── analytics/  # Analitik grafikler
    │   │       ├── reports/    # AI raporlar
    │   │       └── settings/   # Ayarlar & not defteri
    │   ├── components/
    │   │   ├── layout/         # Sidebar & Topbar
    │   │   └── providers.tsx
    │   └── lib/
    │       ├── api.ts          # Axios + Zustand auth store
    │       └── utils.ts        # Yardımcı fonksiyonlar
    └── tailwind.config.js
```

---

## ⚡ Yerel Geliştirme Ortamı

### Gereksinimler
- Node.js 20+
- PostgreSQL 15+
- Git

### 1. Veritabanı Kurulumu

```bash
# PostgreSQL'de veritabanı oluştur
psql -U postgres
CREATE DATABASE bilsem_db;
CREATE USER bilsem_user WITH PASSWORD 'bilsem_pass';
GRANT ALL PRIVILEGES ON DATABASE bilsem_db TO bilsem_user;
\q
```

### 2. Backend Kurulumu

```bash
cd bilsem-platform/backend

# Bağımlılıkları yükle
npm install

# .env dosyasını oluştur
cp .env.example .env
# .env dosyasını düzenleyin (DATABASE_URL, JWT_SECRET, ANTHROPIC_API_KEY)

# Prisma migration
npx prisma generate
npx prisma migrate dev --name init

# Seed data yükle (20 öğrenci, 30 etkinlik, 50 soru)
npm run seed

# Geliştirme modunda başlat
npm run start:dev
# API: http://localhost:3001
# Swagger: http://localhost:3001/api/docs
```

### 3. Frontend Kurulumu

```bash
cd bilsem-platform/frontend

# Bağımlılıkları yükle
npm install

# .env.local dosyasını oluştur
echo 'NEXT_PUBLIC_API_URL=http://localhost:3001/api' > .env.local

# Geliştirme modunda başlat
npm run dev
# Uygulama: http://localhost:3000
```

---

## 🔑 Demo Giriş Bilgileri

| Rol       | E-posta                       | Şifre       |
|-----------|-------------------------------|-------------|
| Öğretmen  | ogretmen@bilsem.edu.tr        | bilsem2024  |
| Admin     | admin@bilsem.edu.tr           | admin123    |

---

## 🌍 Production Deployment

### Option A: Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: bilsem_db
      POSTGRES_USER: bilsem_user
      POSTGRES_PASSWORD: bilsem_secure_pass
    volumes:
      - pgdata:/var/lib/postgresql/data

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://bilsem_user:bilsem_secure_pass@postgres:5432/bilsem_db
      JWT_SECRET: your-production-secret
      ANTHROPIC_API_KEY: sk-ant-your-key
    ports:
      - "3001:3001"
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    environment:
      NEXT_PUBLIC_API_URL: https://api.yourdomain.com/api
    ports:
      - "3000:3000"

volumes:
  pgdata:
```

```bash
docker-compose up -d
```

### Option B: VPS / Sunucu (Ubuntu 22.04)

```bash
# 1. Node.js 20 yükle
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. PM2 yükle
sudo npm install -g pm2

# 3. PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# 4. Backend deploy
cd /var/www/bilsem/backend
npm install --production
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 start dist/main.js --name "bilsem-api"

# 5. Frontend deploy
cd /var/www/bilsem/frontend
npm install
npm run build
pm2 start npm --name "bilsem-web" -- start

# 6. Nginx reverse proxy
sudo nano /etc/nginx/sites-available/bilsem
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/bilsem /etc/nginx/sites-enabled/
sudo certbot --nginx -d yourdomain.com  # SSL
sudo systemctl restart nginx
```

### Option C: Vercel + Railway (En Kolay)

**Frontend → Vercel:**
```bash
cd frontend
vercel --prod
# NEXT_PUBLIC_API_URL ortam değişkenini Vercel dashboard'dan ayarlayın
```

**Backend → Railway:**
1. railway.app'te proje oluştur
2. GitHub repo bağla → /backend klasörünü seç
3. PostgreSQL service ekle
4. Ortam değişkenlerini ayarla:
   - DATABASE_URL (Railway otomatik sağlar)
   - JWT_SECRET
   - ANTHROPIC_API_KEY
   - GDRIVE_CLIENT_ID / SECRET

---

## 🔧 Ortam Değişkenleri

### Backend (.env)
```env
DATABASE_URL="postgresql://user:pass@host:5432/bilsem_db"
JWT_SECRET="güçlü-rastgele-anahtar-buraya"
PORT=3001
FRONTEND_URL="https://yourdomain.com"

# Claude AI (Soru üretici, geri bildirim, rapor için ZORUNLU)
ANTHROPIC_API_KEY="sk-ant-..."

# Google Drive (Etkinlik kitapları için)
GDRIVE_CLIENT_ID="..."
GDRIVE_CLIENT_SECRET="..."
GDRIVE_REDIRECT_URI="https://api.yourdomain.com/api/gdrive/callback"
GDRIVE_ACTIVITIES_FOLDER_ID="Drive klasör ID'si"

# Dosya Depolama
STORAGE_TYPE="local"  # veya "supabase"
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_KEY="..."
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL="https://api.yourdomain.com/api"
```

---

## 📡 API Endpoint Referansı

```
POST   /api/auth/login              Giriş
GET    /api/auth/me                 Profil
PUT    /api/auth/change-password    Şifre değiştir

GET    /api/students                Öğrenci listesi
POST   /api/students                Öğrenci ekle
GET    /api/students/:id            Öğrenci detay
GET    /api/students/:id/analytics  Analitik

GET    /api/groups                  Grup listesi
POST   /api/groups                  Grup oluştur
POST   /api/groups/:id/students     Öğrenci ata

GET    /api/activities              Etkinlik listesi (filtreli)
GET    /api/activities/modules      Modüller
POST   /api/activities/log          Ders kaydı

GET    /api/questions               Soru bankası (filtreli)
POST   /api/questions               Soru ekle
POST   /api/questions/bulk          Toplu ekle (AI)
POST   /api/questions/:id/favorite  Favori

POST   /api/ai/generate-questions   AI soru üret
POST   /api/ai/generate-plan        AI plan üret
POST   /api/ai/analyze-text         Metin analiz (OCR sonrası)

POST   /api/feedback                Geri bildirim
POST   /api/feedback/generate-ai    AI geri bildirim
POST   /api/feedback/observation    Gözlem notu

POST   /api/plans                   Plan oluştur
POST   /api/plans/generate-ai       AI plan oluştur

GET    /api/reports/dashboard       Dashboard stats
GET    /api/reports/student/:id     Öğrenci raporu
GET    /api/reports/group/:id       Grup raporu

GET    /api/gdrive/files            Drive dosyaları
GET    /api/gdrive/folder/:id       Klasör içeriği
```

---

## 🛠 Özelleştirme

### Yeni Etkinlik Ekleme
```bash
# Prisma Studio ile manual
npx prisma studio
# activities tablosuna yeni kayıt ekleyin

# veya API ile (Admin rolü gerekli)
POST /api/activities
{
  "moduleId": "seed-module-ilkogretim",
  "title": "Yeni Etkinlik",
  "topic": "Kesirler",
  "difficulty": "ORTA",
  ...
}
```

### Google Drive Entegrasyonu Aktivasyonu
1. Google Cloud Console'da proje oluştur
2. Drive API'yi etkinleştir
3. OAuth 2.0 credentials oluştur
4. Credentials'ı .env'e ekle
5. Drive'da etkinlik kitapları için klasör oluştur
6. Klasör ID'sini GDRIVE_ACTIVITIES_FOLDER_ID'ye ekle

---

## 📊 Veritabanı Tabloları

| Tablo               | Açıklama                          |
|---------------------|-----------------------------------|
| users               | Tüm kullanıcılar                  |
| teachers            | Öğretmen profilleri               |
| students            | Öğrenci kayıtları                 |
| parents             | Veli bilgileri                    |
| groups              | Öğrenci grupları                  |
| group_students      | Grup-öğrenci bağlantısı           |
| modules             | Etkinlik kitabı modülleri         |
| activities          | Resmi etkinlikler                 |
| activity_logs       | Ders sonrası kayıtlar             |
| student_activity_logs | Öğrenci bazlı performans        |
| feedbacks           | Geri bildirimler                  |
| observations        | Gözlem notları                    |
| custom_questions    | Öğretmen soru bankası             |
| tags                | Soru etiketleri                   |
| question_tags       | Soru-etiket bağlantısı            |
| exams               | Testler/Sınavlar                  |
| exam_questions      | Test soruları                     |
| exam_results        | Sınav sonuçları                   |
| plans               | Dönem planları                    |
| plan_items          | Haftalık plan maddeleri           |
| progress_records    | Gelişim kayıtları                 |
| teacher_notes       | Not defteri                       |
| teacher_uploads     | Yüklenen dosyalar                 |

---

## 🎨 Teknik Mimari

- **Frontend**: Next.js 14 App Router + TypeScript + Tailwind CSS
- **State**: Zustand (auth) + TanStack Query (server state)
- **Backend**: NestJS + Prisma ORM
- **Veritabanı**: PostgreSQL
- **AI**: Anthropic Claude API (claude-opus-4-5)
- **Animasyon**: Framer Motion
- **Grafikler**: Recharts
- **Form**: React Hook Form + Zod
- **Auth**: JWT + HTTP-only cookies
