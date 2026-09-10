import os
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY is not set. Add it to your .env file or Render environment variables.")

client = Groq(api_key=GROQ_API_KEY)

# The model Groq is currently serving for fast, free-tier friendly chat.
# You can change this to any model listed in your Groq console.
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

app = FastAPI(title="AI IT Error Troubleshooting Assistant")

# Allow your React frontend to call this API.
# In production, replace "*" with your actual Render frontend URL for security.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SYSTEM_PROMPT = """You are an expert AI IT Support and Error Troubleshooting Assistant.
A user will describe a technical error, error message, or IT issue (software, hardware,
network, OS, application, or server related).

For every issue, respond in this clear structure:
1. **Likely Cause** - short explanation of what is probably going wrong
2. **Step-by-Step Fix** - numbered, actionable steps a non-expert can follow
3. **If That Doesn't Work** - one or two alternative things to try

Keep answers concise, practical, and beginner-friendly. Avoid unnecessary jargon.
If the user gives too little detail to diagnose the issue, ask 1-2 clarifying questions
instead of guessing.
"""


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []


class ChatResponse(BaseModel):
    reply: str


@app.get("/")
def health_check():
    return {"status": "ok", "message": "AI IT Troubleshooting Assistant backend is running"}


@app.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="message cannot be empty")

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # include prior conversation turns so the assistant has context
    for turn in request.history:
        messages.append({"role": turn.role, "content": turn.content})

    messages.append({"role": "user", "content": request.message})

    try:
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            temperature=0.4,
            max_tokens=1024,
        )
        reply = completion.choices[0].message.content
        return ChatResponse(reply=reply)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq API error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
