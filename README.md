🔒 Supabase Security Checker

Test your Supabase project for common security misconfigurations in seconds.

Supabase is powerful, but misconfigured policies can leave your database wide open. This tool helps developers and teams audit their Supabase setup by checking for:

✅ Public table access without Row Level Security (RLS)

✅ Unrestricted read/write operations via anon key

✅ Exposed RPC functions

✅ Missing or weak security policies

✅ Accidental use of service_role key on the frontend

## ✨ Features

Quick Scan – Input your Supabase URL & anon key to get a full security report.

RLS & Policy Check – Detect if Row Level Security is enabled and policies are enforced.

Read/Write Access Test – Finds tables vulnerable to unauthorized queries.

Function Exposure Detection – Lists RPC endpoints accessible without proper auth.


## 🛠 How It Works

Enter your Supabase Project URL and anon key.

The tool performs non-destructive API checks using Supabase's REST endpoints.

Get a detailed report with vulnerabilities and recommendations.

## 🔐 Security & Privacy

All scans run entirely in your browser - no data is sent to any server.

Your Supabase credentials are used only for direct API calls from your browser to Supabase.

We don't store, log, or transmit your keys anywhere - they remain in your browser session only.

Explicit consent disclaimer before scanning to ensure legal use.

## 📦 Tech Stack

Frontend: React 19, TypeScript, TailwindCSS

Build Tool: Vite

Package Manager: pnpm

## ⚠ Disclaimer

This tool is for educational and security auditing purposes only. Only scan projects you own or have permission to test.
