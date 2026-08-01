<div align="center">

# 🐛 CodeFix AI

### AI & ML Software Defect Prediction Suite

Live code auto-fixing • ML-powered bug prediction • Dataset analytics • Secure auth

[![Node](https://img.shields.io/badge/Node.js-22+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Auth-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Groq](https://img.shields.io/badge/AI-Groq%20LLM-F55036)](https://groq.com)
[![Deployed on Render](https://img.shields.io/badge/Deployed-Render-46E3B7?logo=render&logoColor=white)](https://render.com)

**Built By Saranaeswar &nbsp;|&nbsp; Team : 9**

</div>

---

## 📖 Overview

**CodeFix AI** is a full-stack web application that combines large language model reasoning with classic ML-based defect prediction to help developers catch and fix bugs faster. Paste in code and get an instant AI-driven fix, or upload a dataset to run bug-density predictions across an entire codebase.

---

## ✨ Features

| Module | Description |
|---|---|
| 🛠️ **Live Code Fixer** | Paste any code snippet and get automatic bug detection, root-cause explanation, and a corrected version — powered by LLM inference with multi-model fallback |
| 📤 **Data Upload & Validation** | Upload CSV/dataset files for pre-flight quality checks before running predictions |
| 🧠 **Bug Prediction Engine** | ML-based software defect prediction with explainability breakdowns |
| 📊 **Analytics & Reports** | Bug density heatmaps, multi-model comparison matrix, and exportable PDF reports |
| 🔐 **User Auth & Profile** | Secure sign-up, login, and password reset via Supabase Auth |
| ⌨️ **Keyboard Shortcuts** | Power-user shortcuts for fast navigation between modules |

---

## 🏗️ Tech Stack

**Frontend**
- React 19 + TypeScript
- Vite 6 (build tool & dev server)
- Tailwind CSS 4
- Recharts + D3 (data visualization)
- Framer Motion (animations)
- Lucide Icons

**Backend**
- Express.js (Node.js server)
- TypeScript, compiled via esbuild for production

**AI / ML**
- Groq API — LLM inference (`llama-3.3-70b-versatile` with automatic fallback models) for the live code-fixing engine
- Custom ML engine for bug density prediction and explainability

**Auth & Data**
- Supabase Auth (email/password, session management)

**Deployment**
- Render (Node web service)

---

## 📁 Project Structure

codefix-ai/
├── server.ts              # Express server + Groq AI proxy
├── src/
│   ├── App.tsx             # Root component, tab routing
│   ├── components/          # UI modules (editor, prediction, reports, auth)
│   ├── lib/supabase.ts       # Supabase client & session helpers
│   ├── utils/                # ML engine, explainability, preflight checks
│   ├── data/                 # Sample datasets & bug presets
│   └── types.ts              # Shared TypeScript types
├── .env.example             # Environment variable template
└── package.json
---

## 🚀 Getting Started

### Prerequisites
- Node.js **v22+**
- A free [Supabase](https://supabase.com) project
- A free [Groq](https://console.groq.com/keys) API key

### Installation

```bash
git clone https://github.com/saranaeswar/CodeFix.AI.git
cd CodeFix.AI
npm install
```

### Environment Setup

Create a `.env.local` file in the project root:

```env
GROQ_API_KEY=your_groq_api_key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> ⚠️ Never commit `.env.local` — it's already excluded via `.gitignore`.

### Run Locally

```bash
npm run dev
```

App runs at **http://localhost:3000**

### Production Build

```bash
npm run build
npm start
```

---

## ☁️ Deployment

Deployed on **Render** as a persistent Node web service.

| Setting | Value |
|---|---|
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Node Version | `22` |

**Required environment variables on Render:**

---

## 🔒 Security Notes

- The Groq API key is used **server-side only** (never exposed to the browser)
- Supabase's `anon` key is safe for client-side use and respects Row Level Security
- Authentication redirect URLs must be whitelisted in Supabase's dashboard for production domains

---

## 🧑‍💻 Team

| Role | Team |
|---|---|
| Development | Team 9 |
| Lead | Saranaeswar |

---

## 📄 License

This project was built for educational purposes.

<div align="center">

**⭐ If you found this useful, consider giving it a star!**

</div>

