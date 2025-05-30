# PR Tracker - Optimized Dashboard

> **"Oh S#!T, We're Famous"** - Professional PR tracking dashboard with Google Sheets integration

[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000)](https://vercel.com)

## 🚀 Live Demo

**Production**: [https://pr-tracker-qglucjol5-todd-alchins-projects.vercel.app](https://pr-tracker-qglucjol5-todd-alchins-projects.vercel.app)

## ✨ Features

- **📊 Real-time Dashboard** - Live data from Google Sheets
- **📰 Media Coverage Tracking** - Monitor all press mentions
- **📧 Outreach Management** - Track journalist communications  
- **📅 Event Planning** - Manage PR events and interviews
- **📱 Responsive Design** - Works on all devices
- **⚡ Optimized Performance** - 17.5% code reduction, zero linting errors

## 🛠️ Tech Stack

- **Framework**: Next.js 15.2.4 (App Router)
- **Language**: TypeScript (100% type-safe)
- **Styling**: Tailwind CSS
- **Data Source**: Google Sheets API
- **Deployment**: Vercel
- **Version Control**: Git

## 📊 Optimization Results

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Lines of Code** | 1,980 | 1,634 | **-346 lines (-17.5%)** |
| **Build Errors** | Multiple | 0 | **✅ Zero errors** |
| **Type Safety** | Partial | 100% | **✅ Full TypeScript** |
| **Dead Code** | Present | Removed | **✅ Clean codebase** |
| **Bundle Size** | - | 101 kB | **✅ Optimized** |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm/yarn/pnpm
- Google Sheets API credentials

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/pr-tracker-optimized.git
cd pr-tracker-optimized

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Google Sheets credentials

# Run development server
npm run dev
```

### Environment Variables

```bash
GOOGLE_SHEET_ID=your_google_sheet_id
GOOGLE_SHEETS_CREDENTIALS={"type":"service_account",...}
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url (optional)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key (optional)
```

## 📁 Project Structure

```
pr-tracker/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── page.tsx        # Dashboard
│   │   ├── coverage/       # Media coverage page
│   │   ├── events/         # PR events page
│   │   ├── outreach/       # Outreach tracking page
│   │   └── api/            # API routes
│   ├── components/         # Reusable React components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   └── types/              # TypeScript type definitions
├── public/                 # Static assets
└── docs/                   # Documentation
```

## 🔧 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 📈 Performance Metrics

### Bundle Analysis
- **Total First Load JS**: 101 kB
- **Main Dashboard**: 2.81 kB
- **Coverage Page**: 2.15 kB
- **Events Page**: 2.02 kB
- **Outreach Page**: 2.02 kB

### Lighthouse Scores (Target)
- **Performance**: 90+
- **Accessibility**: 95+
- **Best Practices**: 90+
- **SEO**: 90+

## 🔄 API Endpoints

- `GET /api/sheets` - Fetch data from Google Sheets
- `POST /api/sync` - Sync data to Supabase (optional)
- `GET /api/static` - Static data endpoint

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect GitHub**: Link this repository to Vercel
2. **Set Environment Variables**: Add your Google Sheets credentials
3. **Deploy**: Automatic deployment on push to main

### Manual Deployment

```bash
# Build and deploy
npm run build
vercel --prod
```

## 🔒 Security

- Environment variables are properly secured
- Google Sheets API uses service account authentication
- No sensitive data exposed in client-side code
- CORS properly configured

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Deployed on [Vercel](https://vercel.com/)
- Data powered by [Google Sheets API](https://developers.google.com/sheets/api)

---

**Made with ❤️ for PR professionals who need to track their success!** 