# PR Tracker Development Guide

## 🚀 Quick Start

```bash
# Make sure you're in the pr-tracker directory
cd pr-tracker

# Start development server
npm run dev-clean

# Open browser to: http://localhost:5454
```

## 📋 Available Scripts

- `npm run dev` - Start development server on port 5454
- `npm run dev-clean` - Kill any existing processes and start fresh
- `npm run dev-debug` - Type check + clean start (for troubleshooting)
- `npm run build` - Build for production
- `npm run type-check` - Check TypeScript without building
- `npm run kill-port` - Kill processes on port 5454
- `npm run reset` - Clear Next.js cache and restart
- `npm run deploy` - Build, commit, and push to GitHub

## 🔧 Troubleshooting

### Server Won't Start
```bash
# 1. Make sure you're in the right directory
pwd  # Should show: .../pr-tracker

# 2. Kill any existing processes
npm run kill-port

# 3. Clear cache and restart
npm run reset
```

### "Command Not Found" Errors
```bash
# Make sure you're in pr-tracker directory, not parent
cd pr-tracker
npm run dev
```

### Git Issues
```bash
# If git corruption occurs, reset the repository
git fsck --full
git gc --aggressive --prune=now
```

### Build Errors
```bash
# Check for TypeScript errors
npm run type-check

# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run dev
```

## 🌐 URLs

- **Local**: http://localhost:5454
- **Network**: http://192.168.1.190:5454
- **Production**: https://pr-tracker-qglucjol5-todd-alchins-projects.vercel.app

## 📁 Project Structure

```
pr-tracker/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── page.tsx        # Analytics (main page)
│   │   ├── dashboard/      # Recent coverage dashboard
│   │   ├── coverage/       # Media coverage list
│   │   ├── events/         # Speaking events
│   │   └── outreach/       # PR outreach tracking
│   ├── components/         # Reusable components
│   ├── lib/               # Utilities and data
│   └── types/             # TypeScript definitions
├── public/                # Static assets
└── package.json          # Dependencies and scripts
```

## 🎯 Features Implemented

- ✅ Interactive analytics dashboard with charts
- ✅ Publication reach estimation
- ✅ Enhanced coverage tracking with links
- ✅ Fun branding with gradients and emojis
- ✅ Mobile-responsive design
- ✅ Real-time Google Sheets integration
- ✅ Multi-worksheet support (6 sheets)
- ✅ Type-safe TypeScript throughout

## 🔄 Development Workflow

1. **Make changes** to code
2. **Test locally** at http://localhost:5454
3. **Type check** with `npm run type-check`
4. **Build test** with `npm run build`
5. **Deploy** with `npm run deploy`

## 🆘 Emergency Reset

If everything breaks:
```bash
cd pr-tracker
npm run kill-port
rm -rf .next node_modules package-lock.json
npm install
npm run dev
``` 