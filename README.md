# AI IT Error Troubleshooting Assistant

A simple full-stack AI assistant that diagnoses IT errors and gives step-by-step fixes.

- **Frontend:** React (Vite)
- **Backend:** Python (FastAPI)
- **LLM:** Groq API (fast, free-tier available)
- **Deployment:** Render (both frontend and backend)

---

## 1. Project Structure

```
ai-it-assistant/
├── backend/
│   ├── main.py            # FastAPI app + Groq integration
│   ├── requirements.txt
│   ├── .env.example
│   └── .gitignore
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx         # Chat UI
        ├── App.css
        └── index.css
```

---

## 2. Get a Groq API Key

1. Go to https://console.groq.com
2. Sign up / log in (free)
3. Go to **API Keys** → **Create API Key**
4. Copy the key — you'll need it in Step 3 and Step 5

---

## 3. Run the Backend Locally

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Open `.env` and paste your real key:
```
GROQ_API_KEY=gsk_your_real_key_here
```

Start the server:
```bash
uvicorn main:app --reload --port 8000
```

Visit `http://localhost:8000` — you should see:
```json
{"status": "ok", "message": "AI IT Troubleshooting Assistant backend is running"}
```

---

## 4. Run the Frontend Locally

In a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

Open the URL it prints (usually `http://localhost:5173`). You should see the chat UI, connected to your local backend at `http://localhost:8000`.

Try typing: *"My laptop shows Blue Screen error 0x0000007B"* and confirm you get a reply.

---

## 5. Deploy the Backend to Render

1. Push this whole `ai-it-assistant` folder to a **GitHub repository**.
2. Go to https://render.com → sign up/log in.
3. Click **New +** → **Web Service**.
4. Connect your GitHub repo.
5. Configure:
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Under **Environment Variables**, add:
   - `GROQ_API_KEY` = your real Groq key
   - `GROQ_MODEL` = `llama-3.3-70b-versatile` (optional, this is the default)
7. Click **Create Web Service**.
8. Wait for the deploy to finish. Copy the live URL, e.g.
   `https://ai-it-assistant-backend.onrender.com`
9. Visit that URL in your browser — confirm you see the health check JSON.

---

## 6. Deploy the Frontend to Render

1. Back in Render, click **New +** → **Static Site**.
2. Connect the **same GitHub repo**.
3. Configure:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. Under **Environment Variables**, add:
   - `VITE_API_URL` = your backend URL from Step 5 (e.g. `https://ai-it-assistant-backend.onrender.com`)
5. Click **Create Static Site**.
6. Wait for the deploy — Render will give you a live frontend URL, e.g.
   `https://ai-it-assistant-frontend.onrender.com`

Open that URL — your chat assistant is now live and talking to your deployed backend.

---

## 7. (Recommended) Lock down CORS

In `backend/main.py`, change:
```python
allow_origins=["*"]
```
to:
```python
allow_origins=["https://ai-it-assistant-frontend.onrender.com"]
```
using your actual frontend URL, then redeploy the backend. This stops random websites from calling your API.

---

## 8. Notes

- Render's free tier spins down inactive services — the first request after idling can take ~30–50 seconds while it wakes up. This is normal.
- You can swap the model by changing `GROQ_MODEL` in your environment variables (see available models at https://console.groq.com/docs/models).
- Chat history is kept in React state only (not saved to a database) — refreshing the page clears it. That's intentional to keep this version simple; a database can be added later if you want persistence.
