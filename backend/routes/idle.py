"""
RageBait Editor Idle Roast Route — Generates fresh AI-powered idle messages.
Called when the user goes AFK for 5 minutes. Uses Groq to produce unique,
never-repeated taunts in the user's selected roast language.
"""

import os

from fastapi import APIRouter, HTTPException, Query
from groq import Groq

router = APIRouter()

GROQ_MODEL = "llama-3.3-70b-versatile"

IDLE_SYSTEM_PROMPT = """You are RageBait — the most savage AI code reviewer.
The user has been idle for 5 minutes on a code editor. 
Generate ONE short, savage, funny idle taunt (1-2 sentences max).

Rules:
- Be creative and NEVER repeat the same line twice
- Use strong casual language freely (shit, bullshit, what the hell, oh god, etc.)
- Make it feel like a savage best friend checking on them
- Reference coding, their terrible habits, their code sitting there broken, etc.
- Keep it SHORT — this will be spoken aloud by TTS

{lang_instruction}

Return ONLY the taunt text. No quotes, no JSON, no markdown. Just the raw sentence."""

LANG_INSTRUCTIONS: dict[str, str] = {
    "english": "Write in savage English internet slang.",
    "hinglish": "Write in Hinglish (Hindi + English mix). Example tone: 'bhai kahan mar gaya? code toh apne aap nahi likhega'",
    "banglish": "Write in Banglish (Bengali + English mix). Example tone: 'ki re bhai, kothay geli? code niye boshi na keno?'",
    "bhojpuri": "Write in Bhojpuri style. Example tone: 'arre babua, kahan gailu? code ta apne se na likhayi'",
    "marathi": "Write in Marathi + English mix. Example tone: 'भाऊ कुठे गेलास? कोड स्वतःहून नाही लिहिणार'",
    "tamil": "Write in Tamil + English mix. Example tone: 'என்ன தம்பி எங்க போன? code-ஐ யாரு எழுதுவா?'",
    "british": "Write in British English slang with dry humour. Example tone: 'Right then, have you popped off for tea? This code is absolutely dire, mate.'",
}


@router.get("/api/idle-roast")
async def get_idle_roast(
    lang: str = Query("english", description="Roast language"),
) -> dict:
    """Generate a fresh AI-powered idle taunt for AFK users."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")

    lang_instruction = LANG_INSTRUCTIONS.get(lang, LANG_INSTRUCTIONS["english"])
    system_message = IDLE_SYSTEM_PROMPT.format(lang_instruction=lang_instruction)

    try:
        client = Groq(api_key=api_key)
        completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": "The user has been idle for 5 minutes. Generate a fresh taunt."},
            ],
            model=GROQ_MODEL,
            temperature=1.0,  # High temperature for maximum variety
            max_tokens=150,
        )
        taunt = completion.choices[0].message.content.strip()
        # Remove surrounding quotes if Groq wrapped it
        if (taunt.startswith('"') and taunt.endswith('"')) or (taunt.startswith("'") and taunt.endswith("'")):
            taunt = taunt[1:-1]
        return {"text": taunt}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Groq API error: {str(e)}")
