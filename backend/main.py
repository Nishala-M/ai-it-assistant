import os
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# -----------------------------
# Environment variables
# -----------------------------

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise RuntimeError(
        "GROQ_API_KEY is not set. "
        "Add it to your .env file or Render environment variables."
    )

GROQ_MODEL = os.getenv(
    "GROQ_MODEL",
    "openai/gpt-oss-120b"
)

ALLOWED_ORIGIN = os.getenv(
    "ALLOWED_ORIGIN",
    "http://localhost:5173"
)

# -----------------------------
# Groq client
# -----------------------------

client = Groq(api_key=GROQ_API_KEY)

# -----------------------------
# FastAPI app
# -----------------------------

app = FastAPI(
    title="AI IT Error Troubleshooting Assistant"
)

# -----------------------------
# CORS
# -----------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[ALLOWED_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# System prompt
# -----------------------------

SYSTEM_PROMPT = """
You are an expert AI IT Support and Error Troubleshooting Assistant.

A user will describe a technical error, error message, or IT issue
(software, hardware, network, OS, application, or server related).

For every issue, respond in this clear structure:

1. **Likely Cause** - briefly explain what is probably going wrong
2. **Step-by-Step Fix** - give clear, actionable steps a non-expert can follow
3. **If That Doesn't Work** - give one or two alternative things to try

Response rules:
- Keep the answer concise and practical.
- Use a maximum of 6 troubleshooting steps.
- Keep the answer under approximately 500 words.
- Do not repeat information.
- Always complete your final sentence and section.
- Avoid unnecessary jargon.
- Use clean Markdown.
- Do not use raw HTML such as <br>, <div>, or <p>.
- Never use Markdown tables for troubleshooting steps.
- Always use a numbered list for Step-by-Step Fix.

If the user gives too little detail to diagnose the issue,
ask 1-2 clarifying questions instead of guessing.
"""

# -----------------------------
# Request / Response models
# -----------------------------

class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []


class ChatResponse(BaseModel):
    reply: str


# -----------------------------
# Health check
# -----------------------------

@app.get("/")
def health_check():
    return {
        "status": "ok",
        "message": "AI IT Troubleshooting Assistant backend is running"
    }


# -----------------------------
# Chat endpoint
# -----------------------------

@app.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest):

    if not request.message or not request.message.strip():
        raise HTTPException(
            status_code=400,
            detail="message cannot be empty"
        )

    messages = [
        {
            "role": "system",
            "content": SYSTEM_PROMPT
        }
    ]

    # Include previous conversation turns
    for turn in request.history:
        messages.append(
            {
                "role": turn.role,
                "content": turn.content
            }
        )

    # Add current user message
    messages.append(
        {
            "role": "user",
            "content": request.message
        }
    )

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
        raise HTTPException(
            status_code=500,
            detail=f"Groq API error: {str(e)}"
        )


# -----------------------------
# Local development
# -----------------------------

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port
    )