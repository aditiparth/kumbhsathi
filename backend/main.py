from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx, os, json, re
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(dotenv_path=Path(__file__).parent / ".env")

app = FastAPI(title="KumbhSathi API")

API_KEY = os.getenv("OPENROUTER_API_KEY")
API_URL = "https://openrouter.ai/api/v1/chat/completions"
MODELS = [
    "openrouter/owl-alpha",
    "nvidia/nemotron-3-super-120b-a12b:free",
    "openai/gpt-oss-120b:free",
    "nvidia/nemotron-3-ultra-550b-a55b:free",
    "meta-llama/llama-3.3-70b-instruct:free",
]
print("API KEY LOADED:", API_KEY)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174","https://kumbhsathi.vercel.app",],
    allow_methods=["*"],
    allow_headers=["*"],
)

SYSTEM_PROMPTS = {
    "en": "You are KumbhSathi, a helpful AI assistant for Mahakumbh 2028 pilgrimage in Ujjain, Madhya Pradesh. Answer warmly and concisely in English. Focus on Mahakumbh 2028 info: Shipra river ghats, Mahakaleshwar temple, Kumbh rituals, logistics from major cities to Ujjain, safety, accommodation, bathing dates, and pilgrimage guidance. Keep responses under 150 words.",
    "hi": "आप कुम्भसाथी हैं, उज्जैन, मध्य प्रदेश में महाकुम्भ 2028 तीर्थयात्रा के लिए AI असिस्टेंट। हिंदी में संक्षिप्त उत्तर दें। शिप्रा नदी घाट, महाकालेश्वर मंदिर, और उज्जैन की जानकारी पर ध्यान दें। 150 शब्दों से कम रखें।",
    "ta": "நீங்கள் கும்பசாதி, உஜ்ஜைன், மத்திய பிரதேசத்தில் மகாகும்பம் 2028 யாத்திரை AI உதவியாளர். தமிழில் சுருக்கமாக பதிலளிக்கவும். சிப்ரா நதி கடவுகள், மகாகாலேஸ்வர் கோயில் குறித்து கவனம் செலுத்தவும்।",
}

class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []
    lang: str = "en"

class ItineraryRequest(BaseModel):
    days: int = 2
    group: str = "family"
    lang: str = "en"

async def call_ai(messages: list) -> str:
    for model in MODELS:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                API_URL,
                headers={"Authorization": f"Bearer {API_KEY}"},
                json={"model": model, "messages": messages, "max_tokens": 300},
            )
        data = resp.json()
        print(f"Trying {model}:", data.get("error", "OK"))
        if "choices" in data:
            print(f"Success with {model}")
            return data["choices"][0]["message"]["content"]
    raise Exception("All models failed")
@app.get("/")
def root():
    return {"status": "KumbhSathi API running"}

@app.post("/chat")
async def chat(req: ChatRequest):
    try:
        messages = [{"role": "system", "content": SYSTEM_PROMPTS.get(req.lang, SYSTEM_PROMPTS["en"])}]
        for m in req.history[-6:]:
            messages.append({"role": m["role"], "content": m["content"]})
        messages.append({"role": "user", "content": req.message})
        reply = await call_ai(messages)
    except Exception as e:
        print("ERROR:", e)
        reply = "Sorry, the AI is temporarily busy. Please try again in a few seconds. 🙏"
    return {"reply": reply}

@app.post("/itinerary")
async def itinerary(req: ItineraryRequest):
    messages = [
        {"role": "system", "content": "You are a Mahakumbh pilgrimage expert. Return only valid JSON, no markdown, no extra text."},
        {"role": "user", "content": f"Create a {req.days}-day Mahakumbh itinerary for {req.group}. Return ONLY this JSON: {{\"days\":[{{\"day\":1,\"title\":\"Day title\",\"slots\":[{{\"time\":\"6:00 AM\",\"place\":\"Place name\",\"activity\":\"Description\"}}]}}]}}. Exactly 4 slots per day."}
    ]
    text = await call_ai(messages)
    text = re.sub(r"```json|```", "", text).strip()
    return json.loads(text)

@app.get("/crowd")
def crowd():
    return {"locations": [
        {"name": "Ram Ghat", "level": "High", "best_time": "4:00–6:00 AM"},
        {"name": "Mahakaleshwar Temple", "level": "High", "best_time": "Early dawn"},
        {"name": "Harsiddhi Temple", "level": "Medium", "best_time": "8:00–10:00 AM"},
        {"name": "Tent City Sector A", "level": "Low", "best_time": "Anytime"},
        {"name": "Ujjain Bus Stand", "level": "Medium", "best_time": "Avoid 5–8 PM"},
        {"name": "Triveni Ghat", "level": "Low", "best_time": "Anytime"},
    ]}

@app.get("/emergency")
def emergency():
    return {"contacts": [
        {"type": "Medical", "icon": "🏥", "number": "108", "location": "Sector 4, Nanakheda"},
        {"type": "Police", "icon": "👮", "number": "100", "location": "Mahakal Police Chowki"},
        {"type": "Lost Person", "icon": "🔍", "number": "1920", "location": "Dewas Gate Center"},
        {"type": "Fire Brigade", "icon": "🚒", "number": "101", "location": "Freeganj, Ujjain"},
        {"type": "Lost Child", "icon": "👶", "number": "1098", "location": "All main entry points"},
        {"type": "Women Helpline", "icon": "🤝", "number": "1090", "location": "Pink booths at all ghats"},
    ]}