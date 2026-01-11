# ITERO_

> **Master the Technical Interview.**

A real-time voice-based AI interview practice platform. Experience autonomous evaluation with live code execution and natural conversation.

---

## ⚡ Overview

Itero is a single-session interview simulator where candidates practice coding interviews with an AI interviewer. The system provides:

- **Voice-based AI Interviewer** — Natural conversation using Deepgram STT and ElevenLabs TTS
- **Live Code Editor** — Monaco Editor with JavaScript syntax highlighting
- **Real-time Transcription** — See the conversation as it happens
- **Code-Aware AI** — The interviewer can see your code and provide contextual hints
- **Intelligent Evaluation** — LLM-powered feedback on your performance

---

## 🏗️ Architecture

```mermaid
flowchart TB
    subgraph Frontend["🖥️ Frontend"]
        A["Next.js 15 • TypeScript"]
        B["Tailwind CSS • ShadCN UI"]
        C["Monaco Editor • Framer Motion"]
        D["LiveKit Client SDK"]
    end
    
    subgraph Backend["⚙️ Backend"]
        E["Express • TypeScript"]
        F["MongoDB • Redis"]
        G["LiveKit Server SDK • Groq LLM"]
    end
    
    subgraph Agent["🤖 Python Agent"]
        H["LiveKit Agents Framework"]
        I["Deepgram STT"]
        J["ElevenLabs TTS"]
        K["Groq Llama 3.3 70B"]
    end
    
    Frontend -->|REST API| Backend
    Frontend <-->|WebRTC Voice| Agent
    Backend -->|Room Tokens| Frontend
    Agent -->|Real-time Audio| Frontend
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
├── livekit-agent/            # Python Voice AI Agent
│   ├── agent.py              # Main agent logic
│   ├── requirements.txt      # Python dependencies
│   ├── .env.example          # Environment template
│   └── venv/                 # Virtual environment
│
└── README.md                 # This file
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.9+
- MongoDB Atlas account (or local MongoDB)
- Redis instance (Redis Cloud or local)
- API keys for: LiveKit, Groq, Deepgram, ElevenLabs

### 1. Clone & Install

```bash
git clone https://github.com/your-username/itero.git
cd itero

# Install Node.js dependencies
npm run install:all

# Set up Python agent
cd livekit-agent
python -m venv venv
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Backend
cp backend/env.example backend/.env

# Frontend
cp frontend/env.example frontend/.env.local

# Python Agent
cp livekit-agent/.env.example livekit-agent/.env
```

Edit all files with your API keys (see Environment Variables section below).

### 3. Run Development Servers

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev

# Terminal 3 - Python Agent
cd livekit-agent
.\venv\Scripts\activate
python agent.py dev
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

# LiveKit
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret

# Groq (for evaluation)
GROQ_API_KEY=gsk_your_groq_api_key_here
```

### Python Agent (`livekit-agent/.env`)

```env
# LiveKit (same as backend)
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret

# Groq (for conversation)
GROQ_API_KEY=gsk_your_groq_api_key_here

# Deepgram (Speech-to-Text)
DEEPGRAM_API_KEY=your_deepgram_api_key

# ElevenLabs (Text-to-Speech)
ELEVENLABS_API_KEY=sk_your_elevenlabs_api_key
```

---

## 🔑 Getting API Keys

| Service | Purpose | Free Tier | Link |
|---------|---------|-----------|------|
| **LiveKit** | Real-time voice/video | Generous free tier | [livekit.io](https://livekit.io) |
| **Groq** | LLM (Llama 3.3 70B) | Free tier available | [console.groq.com](https://console.groq.com) |
| **Deepgram** | Speech-to-text | $200 credits | [deepgram.com](https://deepgram.com) |
| **ElevenLabs** | Text-to-speech | 10k chars/month | [elevenlabs.io](https://elevenlabs.io) |
| **MongoDB Atlas** | Database | 512MB free | [mongodb.com/atlas](https://mongodb.com/atlas) |
| **Redis Cloud** | Caching | 30MB free | [redis.com/try-free](https://redis.com/try-free) |

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
        F["Get Hints"]
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

## 🎤 Interview Features

### Code-Aware AI Interviewer
- **Sarah** sees your code in real-time
- Provides contextual hints without revealing solutions
- Asks clarifying questions about your approach
- Nudges you if you're silent for too long

### Problems Pool

| Problem | Difficulty |
|---------|------------|
| Two Sum | Easy |
| Valid Parentheses | Easy |
| Reverse Linked List | Easy |
| Maximum Subarray (Kadane's) | Medium |
| Binary Search | Easy |

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
3. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = your Render backend URL

### Python Agent → LiveKit Cloud

1. Deploy agent to [LiveKit Cloud](https://cloud.livekit.io)
2. Or run on your own server using Docker

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Components**: ShadCN UI
- **Code Editor**: Monaco Editor
- **Animations**: Framer Motion
- **Voice**: LiveKit Client SDK
- **Theming**: next-themes (light/dark mode)

### Backend
- **Runtime**: Node.js
- **Framework**: Express
- **Language**: TypeScript
- **Database**: MongoDB (Mongoose)
- **Cache**: Redis (ioredis)
- **Voice**: LiveKit Server SDK
- **LLM**: Groq SDK

### Python Agent
- **Framework**: LiveKit Agents
- **STT**: Deepgram
- **TTS**: ElevenLabs
- **LLM**: Groq (Llama 3.3 70B)
- **VAD**: Silero

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

## 📄 License

MIT

---

<p align="center">
  <strong>Built for mastering technical interviews.</strong>
</p>
