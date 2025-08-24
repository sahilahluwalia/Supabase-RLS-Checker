# Supabase Security Checker

A security auditing tool for Supabase databases that checks read/insert/update/delete access for anonymous users.

**Live Demo:** [https://supabase-checker.sahilahluwalia.com/](https://supabase-checker.sahilahluwalia.com/)

## What it does

- 🔍 Tests all CRUD operations on your database tables
- 🛡️ Identifies security vulnerabilities in Supabase configurations
- 📊 Provides detailed security reports

## Quick Start

```bash
npm install
npm run dev
```

Then visit `http://localhost:5173`

## Usage

1. Enter your Supabase project URL (e.g., `https://your-project.supabase.co`)
2. Paste your Supabase anon key
3. Click "Check Security" to start the audit
4. Review the comprehensive security report

## Tech Stack

- **Frontend:** React 19, TypeScript, TailwindCSS
- **Build Tool:** Vite
- **Database:** Supabase
- **Package Manager:** pnpm

## Security

- ✅ All checks run client-side in your browser
- 🔒 No data is sent to external servers
- 🕵️ Non-destructive testing only
- 📝 Your credentials stay in browser session

## Available Scripts

```bash
pnpm dev      # Start development server
pnpm build    # Build for production
pnpm preview  # Preview production build
pnpm lint     # Run ESLint
```

## Disclaimer

For educational and security auditing purposes only. Only test projects you own or have permission to audit.
