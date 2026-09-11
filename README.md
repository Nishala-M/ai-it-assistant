# AI IT Error Troubleshooting Assistant

**🔗 Live Demo:** [https://frontend-nishala-m.vercel.app/](https://frontend-nishala-m.vercel.app/)

A simple full-stack AI assistant that diagnoses IT errors and gives step-by-step fixes.

- **Frontend:** React (Vite)
- **Backend:** Python (FastAPI)
- **LLM:** Groq API
- **AI Model:** `openai/gpt-oss-120b`
- **Deployment:** Backend on Render, Frontend on Vercel

---

## 1. Architecture

<img width="1472" height="1000" alt="Architecture diagram" src="https://github.com/user-attachments/assets/bab406b8-fc50-4e61-b73d-63e490b362b8" />

**Flow:**

1. User types an IT error into the chat UI.
2. The React frontend, deployed on Vercel, sends the message to the FastAPI backend.
3. The backend, deployed on Render, receives the message and conversation history.
4. The backend sends the conversation to the Groq API along with a system prompt that instructs the AI to act as an IT troubleshooting expert.
5. Groq's LLM generates a structured troubleshooting response.
6. The backend returns the AI response as JSON.
7. The React frontend displays the response to the user.

**Tech stack:**

| Layer    | Technology                     | Hosting |
|----------|----------------------------------|---------|
| Frontend | React (Vite)                     | Vercel  |
| Backend  | Python (FastAPI)                 | Render  |
| AI / LLM | Groq API (`openai/gpt-oss-120b`) | Groq    |

> **Possible future upgrade:** Adding a vector database and Retrieval-Augmented Generation (RAG) so the assistant can search trusted IT documentation or past errors before answering. This is not implemented in the current version — the project is intentionally kept simple.

---

## 2. How It Works

- The chat interface is a single-page React application.
- Conversation state is maintained in React state only.
- Nothing is saved to a database, so refreshing the page clears the chat.
- Every message the user sends is bundled with the previous conversation history and sent to the backend in one request.
- This allows the AI to maintain context across multiple turns.

The backend has one main endpoint:

```
POST /api/chat
```

The endpoint:

- Validates that the incoming message is not empty.
- Adds a system prompt instructing the model to act as an IT troubleshooting expert.
- Includes previous conversation history.
- Sends the conversation to the Groq API.
- Requests a concise and structured troubleshooting response.
- Returns the AI response as JSON.

The frontend uses `react-markdown` and `remark-gfm` to display AI responses with Markdown formatting such as:

- Headings
- Numbered lists
- Bullet points
- Code blocks
- Tables

CORS is enabled on the backend so the frontend hosted on Vercel can communicate with the backend hosted on Render.

---

## 3. Project Structure

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

## 4. Get a Groq API Key

1. Go to the [Groq Console](https://console.groq.com).
2. Sign up or log in.
3. Go to **API Keys**.
4. Create a new API key.
5. Copy the key and add it to your local `.env` file or Render environment variables.

> **Security:** Never commit your real Groq API key to GitHub. Keep it inside environment variables such as `.env` locally and Render Environment Variables in production.

---

## 5. Run the Backend Locally

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file inside the `backend` folder:

```
GROQ_API_KEY=gsk_your_real_key_here
GROQ_MODEL=openai/gpt-oss-120b
ALLOWED_ORIGIN=http://localhost:5173
```

Start the server:

```bash
uvicorn main:app --reload --port 8000
```

Visit `http://localhost:8000` — you should see:

```json
{
  "status": "ok",
  "message": "AI IT Troubleshooting Assistant backend is running"
}
```

---

## 6. Run the Frontend Locally

In a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

Open the URL it prints, usually `http://localhost:5173`.

For local development, create `frontend/.env` with:

```
VITE_API_URL=http://localhost:8000
```

Try typing: *"My Windows 11 laptop cannot connect to Wi-Fi."*

The assistant should return a troubleshooting response.

---

## 7. Deploy the Backend to Render

1. Push the `ai-it-assistant` project to a GitHub repository.
2. Go to [Render](https://render.com) and sign up or log in.
3. Click **New +** → **Web Service**.
4. Connect your GitHub repository.
5. Configure the service:
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Under **Environment Variables**, add:
   ```
   GROQ_API_KEY=your_real_groq_key
   GROQ_MODEL=openai/gpt-oss-120b
   ALLOWED_ORIGIN=https://your-app.vercel.app
   ```
7. Click **Create Web Service**.
8. Wait for the deployment to finish. Copy the Render service URL, for example:
   ```
   https://your-backend.onrender.com
   ```
9. Open the Render URL in a browser and confirm that the health-check JSON is displayed.

---

## 8. Deploy the Frontend to Vercel

1. Go to [Vercel](https://vercel.com) and sign up or log in with GitHub.
2. Click **Add New** → **Project**.
3. Import the GitHub repository.
4. Set **Root Directory** to `frontend`. Vercel should automatically detect Vite.
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Under **Environment Variables**, add:
   ```
   VITE_API_URL=https://your-backend.onrender.com
   ```
   Do not add a trailing `/` to the backend URL.
6. Click **Deploy**.

Vercel will provide a production URL such as `https://your-app.vercel.app`. Open the URL and test the chatbot.

---

## 9. Configure CORS

Because the frontend and backend are deployed on different domains, the backend must allow requests from the Vercel frontend.

The backend uses:

```python
ALLOWED_ORIGIN = os.getenv(
    "ALLOWED_ORIGIN",
    "http://localhost:5173"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[ALLOWED_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

For production, set the Render environment variable to the exact Vercel production URL:

```
ALLOWED_ORIGIN=https://your-app.vercel.app
```

Do not include a trailing slash.

---

## 10. Issues Encountered & Fixes

During development and deployment, several issues were encountered and resolved.

**1. Groq model became unavailable**
- **Symptom:** The backend initially returned a `404 model_not_found` error when using `llama-3.3-70b-versatile`.
- **Cause:** The previously configured Groq model was no longer available for the project.
- **Fix:** The model was changed to `openai/gpt-oss-120b`, configured through the `GROQ_MODEL` environment variable so it can be changed without modifying the application code.

**2. Pydantic build failure during Render deployment**
- **Symptom:** The first Render deployment failed while installing Python dependencies — the build attempted to compile `pydantic-core` and encountered Rust/maturin build errors.
- **Cause:** Render was using a newer Python version than the dependency versions were originally tested with, causing an incompatible dependency/build combination.
- **Fix:** A `.python-version` file was added to the project to control the Python version used by the deployment. The deployment then completed successfully.

**3. Groq and HTTPX version conflict**
- **Symptom:** The backend initially crashed with an error similar to `TypeError: Client.__init__() got an unexpected keyword argument 'proxies'`.
- **Cause:** The installed `groq` SDK version was incompatible with a newer `httpx` version.
- **Fix:** `httpx` was pinned to a compatible version in `requirements.txt`: `httpx==0.27.2`. This resolved the compatibility problem with the Groq SDK.

**4. `/api/chat` returned a 500 Internal Server Error**
- **Symptom:** The frontend displayed an error indicating that it could not reach the AI service.
- **Cause:** The issue was related to backend configuration, particularly the Groq API key and environment variables.
- **Fix:** The Groq API key was configured correctly in the environment variables and the backend was restarted after configuration changes. The API was then tested directly through the backend and successfully returned AI responses.

**5. Frontend could not connect to the deployed backend**
- **Symptom:** The deployed frontend displayed an error similar to "I couldn't reach the AI service right now."
- **Cause:** The frontend's `VITE_API_URL` was initially pointing to an incorrect placeholder URL.
- **Fix:** The Vercel environment variable was updated to the actual Render backend URL (`VITE_API_URL=https://your-backend.onrender.com`), and the frontend was redeployed.

**6. CORS error between Vercel and Render**
- **Symptom:** The backend worked correctly when tested directly, but requests from the deployed Vercel frontend were blocked.
- **Cause:** The backend CORS configuration did not exactly match the Vercel production URL — the configured origin also contained a trailing slash (e.g. `https://your-app.vercel.app/`).
- **Fix:** The Render environment variable was changed to the exact frontend origin without a trailing slash: `ALLOWED_ORIGIN=https://your-app.vercel.app`. After redeployment, the Vercel frontend was able to communicate with the Render backend.

**7. Duplicate CORS configuration**
- **Symptom:** The backend contained more than one CORS middleware configuration, including a permissive `allow_origins=["*"]` configuration.
- **Cause:** CORS configuration had been added more than once during development.
- **Fix:** The duplicate middleware was removed and replaced with one CORS configuration using `allow_origins=[ALLOWED_ORIGIN]`, providing a cleaner and more secure production configuration.

**8. AI responses contained raw Markdown tables and HTML-like formatting**
- **Symptom:** Some AI responses appeared with incorrectly formatted Markdown tables or raw HTML such as `<br>` inside the response.
- **Cause:** The frontend originally used custom JavaScript formatting to manually process Markdown-like content, which did not correctly handle all Markdown structures.
- **Fix:** The frontend was updated to use `react-markdown` and `remark-gfm` (which provides support for GitHub-Flavored Markdown, including tables). The custom message formatting was replaced with proper Markdown rendering.

**9. Empty or duplicate code blocks appeared in AI responses**
- **Symptom:** Some responses could produce empty or incorrectly nested code block elements.
- **Cause:** The custom `react-markdown` component handling for `<pre>` and `<code>` elements was creating unnecessary nested structures.
- **Fix:** The Markdown rendering logic was adjusted so that fenced code blocks render correctly, inline code stays inline, empty `<pre>` blocks are ignored, and code blocks use the application's existing CSS.

**10. AI troubleshooting responses were sometimes too long and cut off**
- **Symptom:** Some troubleshooting responses contained many steps and occasionally ended mid-sentence.
- **Cause:** The AI model was generating longer troubleshooting responses than necessary, while the configured response token limit could be reached.
- **Fix:** The system prompt was improved to make the AI response more concise — instructing the model to use a maximum of 6 troubleshooting steps, keep the answer around 500 words or less, avoid repeating information, complete the final sentence and section, use numbered lists for troubleshooting steps, and avoid unnecessary Markdown tables. This produced shorter and more complete troubleshooting responses.

**11. Troubleshooting steps were sometimes generated as Markdown tables**
- **Symptom:** The AI sometimes formatted troubleshooting instructions as a large Markdown table instead of a numbered list, making step-by-step troubleshooting harder to read.
- **Cause:** The model was allowed to use Markdown tables when it considered them useful.
- **Fix:** The system prompt was updated to explicitly instruct the model to never use Markdown tables for troubleshooting steps, and to always use a numbered list for the Step-by-Step Fix. This improved readability and consistency.

**12. Git repository configuration issues**
- **Symptom:** Git detected nested repository information inside the project during development.
- **Cause:** A separate `.git` directory had accidentally been created inside the `backend` folder.
- **Fix:** The unnecessary nested Git repository was removed so the entire project could be managed by the main repository. The project was then committed and pushed from the root directory.

**13. Environment variables and API key security**
- **Symptom/Risk:** The project required a Groq API key for local and production use. Putting the API key directly inside source code or committing `.env` to GitHub would expose the secret.
- **Fix:** The project uses environment variables. The `.env` file is excluded from Git using `.gitignore`:
  ```
  .env
  *.env
  ```
  The real Groq API key is stored locally in `.env` and in Render's Environment Variables for production. The frontend never receives or exposes the Groq API key.

**14. Render free-tier cold starts**
- **Symptom:** The first request to the deployed backend can take noticeably longer after the service has been inactive.
- **Cause:** The Render free tier can spin down an inactive service; when a new request arrives, the service needs to start again.
- **Fix:** This is expected behavior rather than an application bug. A paid hosting plan or another always-on hosting configuration can reduce or eliminate cold-start delays in a production deployment.

---

## 11. Current Features

The current application provides:

- AI-powered IT error troubleshooting
- Natural-language user input
- Conversation history during the current session
- Context-aware follow-up questions
- Step-by-step troubleshooting instructions
- Likely-cause explanations
- Alternative troubleshooting suggestions
- Markdown response formatting
- Responsive React chat interface
- FastAPI REST API
- Groq LLM integration
- CORS configuration for frontend/backend communication
- Secure API-key handling through environment variables
- Cloud deployment using Vercel and Render

---

## 12. Limitations

The current version intentionally keeps the architecture simple.

- Chat history is stored only in React state.
- Refreshing the browser clears the conversation.
- There is no database.
- The system does not automatically access the user's computer.
- The system cannot directly execute troubleshooting commands on the user's machine.
- The AI response depends on the capabilities and knowledge of the selected LLM.
- The system does not currently use a vector database or RAG.
- Render's free tier may introduce cold-start delays.

---

## 13. Future Improvements

Possible future improvements include:

- **Retrieval-Augmented Generation (RAG)** — Add a vector database containing trusted IT documentation, error codes, and troubleshooting guides.
- **Persistent Chat History** — Add a database so users can save and retrieve previous conversations.
- **User Authentication** — Add login and user accounts for personalized troubleshooting history.
- **File and Screenshot Analysis** — Allow users to upload screenshots of error messages for analysis.
- **IT Knowledge Base** — Build a searchable knowledge base containing common Windows, networking, hardware, and software issues.
- **Automatic Error Classification** — Automatically classify problems into categories such as Windows, Networking, Hardware, Software, Security, Application errors.
- **More Advanced Diagnostics** — Provide guided diagnostic workflows based on the user's answers.
- **Admin Dashboard** — Add an admin interface to monitor common errors and frequently requested solutions.

---

## 14. Notes

- The AI model can be changed using the `GROQ_MODEL` environment variable. The current model is `openai/gpt-oss-120b`.
- Chat history is kept in React state only and is not saved to a database. Refreshing the page clears the current conversation.
- The Groq API key should never be exposed in frontend code. The backend is responsible for communicating with the Groq API.
- The frontend communicates only with the FastAPI backend.
- The current version is intentionally designed as a simple full-stack AI project that can be extended with RAG, databases, authentication, and advanced diagnostics in future versions.
