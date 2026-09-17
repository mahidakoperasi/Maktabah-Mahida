# Mahida Digital

**Belajar • Berkarya • Berkhidmah**

Mahida Digital adalah wajah digital utama Pondok Pesantren Mahida. Website ini menggabungkan fungsi resmi pondok, ruang literasi, pusat media, maktabah digital, arsip hidup, dan pintu menuju ekosistem Mahida.

## 🎯 Visi & Misi

**Website ini bukan sekadar:**
- Website profil pondok
- Portal berita
- Blog literasi
- Website koperasi
- Perpustakaan digital
- Atau galeri media

**Website ini adalah:** Satu ekosistem yang terstruktur yang menggabungkan seluruh fungsi tersebut.

## ✨ Fitur Utama (V1)

### Publik Website
- ✅ Homepage dengan editorial layout
- ✅ Halaman Tentang (Profil, Sejarah, Visi & Misi, Pendidikan)
- ✅ Literasi (Artikel, Esai, Opini, Pendidikan)
- ✅ Karya (Esai, Terjemahan, Sastra, Media Kreatif, Riset)
- ✅ Maktabah (Kitab, Terjemahan, Kajian)
- ✅ Kegiatan (Berita, Agenda, Pengumuman, Prestasi)
- ✅ Media (Mahida TV, Video, Galeri, Facebook)
- ✅ Koperasi (Katalog produk)
- ✅ Arsip (Timeline dokumentasi)
- ✅ Global Search
- ✅ Halaman Kirim Karya

### User Features
- ✅ Registrasi dengan OTP verification
- ✅ Login dengan JWT auth
- ✅ User Profile
- ✅ Bookmark artikel
- ✅ Collection/Koleksi
- ✅ Reading History
- ✅ Dark Mode support

### Admin CMS
- ✅ Dashboard
- ✅ Content Management (Artikel, Karya, Berita)
- ✅ Media Library
- ✅ Category & Tag Management
- ✅ User Management
- ✅ Analytics dasar

### Database
- ✅ PostgreSQL dengan Drizzle ORM
- ✅ 30+ tables terstruktur
- ✅ Relasi konten yang fleksibel
- ✅ Support Arabic text dengan Unicode

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework dengan App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React** - UI library

### Backend
- **Next.js API Routes** - RESTful API
- **PostgreSQL** - Database
- **Drizzle ORM** - Database ORM
- **bcrypt** - Password hashing
- **JWT** - Authentication

### Tools
- **Drizzle Kit** - Database migrations
- **Sharp** - Image optimization
- **slugify** - URL slug generation

## 📁 Project Structure

```
src/
├── app/
│   ├── (main)/                    # Public pages
│   │   ├── page.tsx              # Homepage
│   │   ├── tentang/              # About section
│   │   ├── literasi/             # Literacy section
│   │   ├── karya/                # Works section
│   │   ├── maktabah/             # Library section
│   │   ├── kegiatan/             # Activities
│   │   ├── media/                # Media section
│   │   ├── koperasi/             # Cooperative
│   │   ├── arsip/                # Archive
│   │   ├── auth/                 # Auth pages
│   │   ├── profile/              # User profile
│   │   └── kirim-karya/          # Submit work
│   ├── admin/                     # Admin CMS
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Dashboard
│   │   └── konten/               # Content management
│   ├── api/                       # API Routes
│   │   ├── auth/                 # Auth endpoints
│   │   ├── posts/                # Post endpoints
│   │   ├── categories/           # Category endpoints
│   │   └── health/               # Health check
│   ├── globals.css               # Global styles
│   └── layout.tsx                # Root layout
├── components/
│   ├── layout/
│   │   ├── Header.tsx            # Navbar
│   │   └── Footer.tsx            # Footer
│   └── ui/                        # Reusable UI components
├── db/
│   ├── schema.ts                 # Database schema
│   └── index.ts                  # Database connection
└── lib/
    ├── auth.ts                   # Auth utilities
    ├── otp.ts                    # OTP service
    └── utils.ts                  # General utilities
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. Clone repository
```bash
git clone <repository-url>
cd mahida-digital
```

2. Install dependencies
```bash
npm install
```

3. Setup environment variables
```bash
cp .env.example .env
# Edit .env dengan konfigurasi database Anda
```

4. Initialize database
```bash
npx drizzle-kit push
```

5. Run development server
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## 🔐 Authentication

### Registration Flow
1. User mendaftar dengan nama, email, password
2. System mengirim OTP ke email (via console untuk sekarang)
3. User verifikasi OTP
4. Akun aktif dan bisa login

### JWT Token
- Token valid selama 7 hari
- Stored di HTTP-only cookie
- Include role (USER/ADMIN)

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/login` - Login user

### Content
- `GET /api/posts` - Get articles
- `POST /api/posts` - Create post (Admin)
- `GET /api/categories` - Get categories
- `POST /api/categories` - Create category (Admin)

### Health
- `GET /api/health` - Health check

## 🎨 Design System

### Colors
- Primary: Forest Green (`#1b5e3f`)
- Secondary: Deep Gray-Green (`#2d4a28`)
- Accent: Muted Gold (`#8b7355`)
- Background: Off-White (`#fafaf8`)

### Typography
- Display/Headers: Lora (Serif)
- Body: Inter (Sans-serif)
- Arabic: Scheherazade New (Serif)

### Layout
- Max container width: 1200px
- Responsive breakpoints: sm, md, lg
- Editorial grid system
- Asymmetric layouts preferred

## 🔄 Data Flow

### Content Creation
1. User kirim karya via email (DOCX)
2. Admin review dan parse DOCX
3. Admin preview dan edit
4. Admin publish artikel
5. Konten muncul di website

### Reading Experience
1. User membuka artikel
2. System track reading progress
3. Support dark mode, font sizing
4. User bisa bookmark atau add to collection
5. Reading history tersimpan

## 🧪 Testing

```bash
# Type checking
npm run typecheck

# Build
npm run build

# Start production server
npm run start
```

## 📚 Database Schema

### Main Tables
- `users` - Registered users
- `posts` - Articles, news, works
- `categories` - Content categories
- `tags` - Content tags
- `authors` - Content authors
- `media` - Images and files
- `videos` - YouTube videos
- `bookmarks` - User bookmarks
- `collections` - User collections
- `reading_history` - User reading progress
- `comments` - Comments (if enabled)
- `otpCodes` - OTP for verification
- `analytics` - Basic analytics

[Lihat full schema di src/db/schema.ts]

## 🔍 Search & Filtering

Global search mencakup:
- Artikel
- Karya
- Berita
- Kitab
- Video
- Event
- Profil Author
- Support Arabic search

## ♿ Accessibility

- Semantic HTML
- Keyboard navigation
- Focus management
- ARIA labels
- Alt text untuk images
- Contrast ratio WCAG AA
- Reduced motion support

## 📱 Mobile First

Website didesain mobile-first dengan:
- Responsive grid
- Touch-friendly buttons (min 44px)
- Optimized images
- Fast load time
- PWA ready

## 🌙 Dark Mode

Automatic dark mode berdasarkan:
- System preference
- Manual toggle
- Consistent color scheme
- Optimal contrast

## 📈 Analytics

Admin dapat melihat:
- Total visitors
- Page views
- Top content
- Popular searches
- Traffic sources
- Reading behavior

## 🚀 Deployment

### Production Build
```bash
npm run build
npm run start
```

### Environment Variables (Production)
```
DATABASE_URL=postgresql://user:password@host:5432/mahida
JWT_SECRET=your-secure-secret-key
NODE_ENV=production
```

## 🗺️ Roadmap V2

- Mahida Stories (long-form content)
- Photo Stories (editorial photo essays)
- Advanced archive with timeline
- PWA support
- Newsletter
- Interactive timeline
- Reading sync across devices
- QR code integration

## 🗺️ Roadmap V3 (Optional)

- Mahida Live (streaming)
- Podcast/Audio content
- Multilingual support
- Semantic search
- AI-assisted internal search (tools only)

## 📖 Documentation

- [Database Schema](src/db/schema.ts)
- [Authentication](src/lib/auth.ts)
- [API Routes](src/app/api)
- [Components](src/components)

## 🤝 Contributing

Contributions welcome! Please:
1. Follow TypeScript strict mode
2. Use Tailwind for styling
3. Write semantic HTML
4. Test pada mobile
5. Support dark mode

## 📞 Support

Untuk support atau pertanyaan:
- Email: dev@mahida.ac.id
- Issues: GitHub issues

## 📄 License

Mahida Digital © 2024. All rights reserved.

---

Built with ❤️ for Mahida Digital
