# ITERO_

> **Master the Technical Interview.**

A real-time voice-based AI interview practice platform. Experience autonomous evaluation with live code execution and natural conversation.

---

## ⚡ Overview

Itero is a single-session interview simulator where candidates practice coding interviews with an AI interviewer. The system provides:

- **Voice-based AI Interviewer** — Natural conversation using speech-to-text and text-to-speech
- **Live Code Editor** — Monaco Editor with JavaScript syntax highlighting
- **Real-time Transcription** — See the conversation as it happens
- **Intelligent Evaluation** — LLM-powered feedback on your performance

---

## 🖥️ Screenshots

### Landing Page
The minimalist landing page with a single call-to-action to start your interview simulation.

### Interview Session
Split-panel interface with:
- **Left**: Full-featured Monaco code editor
- **Right**: Voice controls and live transcription feed

### Results Dashboard
Comprehensive feedback including:
- Overall score (1-10)
- Strengths analysis
- Areas for improvement
- Missing edge cases
- Next steps for preparation
- Detailed code review

---

## 🏗️ Architecture

```mermaid
flowchart TB
    subgraph Frontend["🖥️ Frontend"]
        A["Next.js 15 • TypeScript"]
        B["Tailwind CSS • ShadCN UI"]
        C["Monaco Editor • Framer Motion"]
        D["Vapi Web SDK"]
    end
    
    subgraph Backend["⚙️ Backend"]
        E["Express • TypeScript"]
        F["MongoDB • Redis"]
        G["Vapi Server SDK • Groq LLM"]
    end
    
    subgraph AI["🤖 AI Services"]
        H["Vapi - Voice Orchestration"]
        I["Deepgram - Speech-to-Text"]
        J["ElevenLabs - Text-to-Speech"]
        K["Groq - Llama 3.3 70B"]
    end
    
    Frontend -->|REST API| Backend
    Backend --> AI
    AI -->|Real-time Voice| Frontend
```

---

## 📦 Project Structure

```
itero/
├── frontend/                 # Next.js 15 application
│   ├── src/
│   │   ├── app/              # App router pages
│   │   │   ├── page.tsx      # Landing page
│   │   │   ├── interview/    # Interview session
│   │   │   └── results/      # Evaluation results
│   │   ├── components/       # UI components
│   │   │   ├── ui/           # ShadCN primitives
│   │   │   ├── layout/       # Navbar, etc.
│   │   │   └── interview/    # Interview-specific
│   │   └── lib/              # Hooks, utilities, API
│   ├── .env.example          # Environment template
│   └── package.json
│
├── backend/                  # Express API server
│   ├── src/
│   │   ├── index.ts          # Server entry point
│   │   ├── routes/           # API endpoints
│   │   ├── services/         # Business logic
│   │   ├── models/           # MongoDB schemas
│   │   └── config/           # DB & Redis config
│   ├── .env.example          # Environment template
│   └── package.json
│
└── README.md                 # This file
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Redis instance (Redis Cloud or local)
- API keys for: Vapi, Groq, Deepgram, ElevenLabs

### 1. Clone & Install

```bash
git clone https://github.com/your-username/itero.git
cd itero

# Install all dependencies
npm run install:all
```

### 2. Configure Environment

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env.local
```

Edit both files with your API keys (see Environment Variables section below).

### 3. Run Development Servers

```bash
# From root directory - starts both frontend and backend
npm run dev
```

Or run separately:

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### 4. Open Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

---

## ⚙️ Environment Variables

### Frontend (`frontend/.env.local`)

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5000

# Vapi public key (for client-side voice)
NEXT_PUBLIC_VAPI_PUBLIC_KEY=your_vapi_public_key_here
```

### Backend (`backend/.env`)

```env
# Server
PORT=5000
FRONTEND_URL=http://localhost:3000

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/itero

# Redis
REDIS_HOST=your-redis-host.redis-cloud.com
REDIS_PORT=11216
REDIS_PASSWORD=your-redis-password

# Vapi (Voice AI orchestration)
VAPI_API_KEY=your_vapi_api_key_here

# Groq (LLM for evaluation)
GROQ_API_KEY=gsk_your_groq_api_key_here
```

---

## 🔑 Getting API Keys

| Service | Purpose | Free Tier | Link |
|---------|---------|-----------|------|
| **Vapi** | Voice AI orchestration | $10 credits | [vapi.ai](https://vapi.ai) |
| **Groq** | LLM evaluation | Generous free tier | [console.groq.com](https://console.groq.com) |
| **Deepgram** | Speech-to-text | $200 credits | [deepgram.com](https://deepgram.com) |
| **ElevenLabs** | Text-to-speech | 10k chars/month | [elevenlabs.io](https://elevenlabs.io) |
| **MongoDB Atlas** | Database | 512MB free | [mongodb.com/atlas](https://mongodb.com/atlas) |
| **Redis Cloud** | Caching | 30MB free | [redis.com/try-free](https://redis.com/try-free) |

> **Note**: Vapi handles Deepgram and ElevenLabs internally — you only need the Vapi keys.

---

## 📖 Usage Flow

```mermaid
flowchart LR
    A["🏠 Landing Page"] -->|Click Start| B["🎤 Interview Session"]
    B -->|Click End Call| C["📊 Results Page"]
    
    subgraph Interview[" "]
        B
        D["Write Code"]
        E["Talk to AI"]
        F["Get Feedback"]
    end
    
    subgraph Results[" "]
        C
        G["Score 1-10"]
        H["Strengths"]
        I["Improvements"]
        J["Edge Cases"]
    end
    
    B --> D & E & F
    C --> G & H & I & J
```

---

## 🎤 Interview Problems

The AI interviewer randomly selects from these problems:

| Problem | Difficulty |
|---------|------------|
| Two Sum | Easy |
| Reverse String | Easy |
| Valid Parentheses | Easy |
| Palindrome Check | Easy |
| FizzBuzz | Easy |
| Merge Two Sorted Arrays | Easy |
| Binary Search | Easy |
| Remove Duplicates from Sorted Array | Easy |
| Find Maximum Subarray (Kadane's) | Medium |
| Linked List Cycle Detection (Floyd's) | Medium |

---

## 🌐 Deployment

### Backend → Render

1. Create Web Service on [render.com](https://render.com)
2. Connect your GitHub repository
3. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Add all environment variables

### Frontend → Vercel

1. Import project on [vercel.com](https://vercel.com)
2. Configure:
   - **Root Directory**: `frontend`
   - **Framework**: Next.js (auto-detected)
3. Add environment variables:
   - `NEXT_PUBLIC_API_URL` = your Render backend URL
   - `NEXT_PUBLIC_VAPI_PUBLIC_KEY` = your Vapi public key

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Components**: ShadCN UI
- **Code Editor**: Monaco Editor
- **Animations**: Framer Motion
- **Voice**: Vapi Web SDK
- **Theming**: next-themes (light/dark mode)

### Backend
- **Runtime**: Node.js
- **Framework**: Express
- **Language**: TypeScript
- **Database**: MongoDB (Mongoose)
- **Cache**: Redis (ioredis)
- **Voice**: Vapi Server SDK
- **LLM**: Groq SDK

---

## 📄 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/interview/start` | Create new interview session |
| `POST` | `/api/interview/:id/code` | Update code during interview |
| `POST` | `/api/interview/:id/end` | End interview and trigger evaluation |
| `GET` | `/api/interview/:id` | Get interview by session ID |
| `GET` | `/api/results/:id` | Get evaluation results |
| `GET` | `/api/health` | Health check |

---

## � License

MIT

---

<p align="center">
  <strong>Built for mastering technical interviews.</strong>
</p>
