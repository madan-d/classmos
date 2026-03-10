from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import os
from google import genai
from dotenv import load_dotenv

router = APIRouter()

# Load env variables
load_dotenv(os.path.join(os.getcwd(), ".env.local"))
api_key = os.environ.get("GEMINI_API_KEY")
client = None
if api_key:
    client = genai.Client(api_key=api_key)

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    context: str
    history: List[ChatMessage]

class ChatResponse(BaseModel):
    reply: str

@router.post("/chat", response_model=ChatResponse)
async def chat_with_tutor(request: ChatRequest):
    if not api_key:
        raise HTTPException(status_code=500, detail="Gemini API key is missing. Please check .env.local")
        
    try:
        if not client:
            raise HTTPException(status_code=500, detail="Gemini client not initialized")
        
        system_instruction = (
            "You are a helpful, encouraging, and clear AI Tutor for a student. "
            f"Here is the context of the course they are currently studying: {request.context}. "
            "Your goal is to explain concepts simply, give hints when they struggle, and be highly supportive. "
            "Keep your answers concise and formatted with markdown."
        )
        
        formatted_history = []
        for msg in request.history:
            role = "user" if msg.role == "user" else "model"
            formatted_history.append({"role": role, "parts": [{"text": msg.content}]})
            
        chat = client.chats.create(model='gemma-3-27b-it', history=formatted_history)
        
        # Inject the system instruction as context for the latest message behind the scenes
        prompt = f"[System Instructions: {system_instruction}]\n\nStudent: {request.message}"
        response = chat.send_message(prompt)
        
        return {"reply": response.text}
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))
