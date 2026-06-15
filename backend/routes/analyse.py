"""
RageBait Editor Analyse Route — The core roasting endpoint.
Uses RAG context from ChromaDB + Groq AI to generate savage code roasts.
"""

import json
import os
import re

from fastapi import APIRouter, BackgroundTasks, HTTPException
from groq import Groq

from models.schemas import AnalyseRequest, AnalyseResponse, ErrorItem
from rag.vectorstore import retrieve_similar, store_code

import time
from collections import defaultdict

router = APIRouter()

GROQ_MODEL = "llama-3.3-70b-versatile"

# In-memory store for rate limiting
rate_limit_records = defaultdict(list)

SYSTEM_PROMPT_TEMPLATE = """You are RageBait — the most savage, unhinged AI code reviewer 
on the internet. You exist to absolutely destroy developers 
with dark humour roasts that make them laugh until they cry.

Your personality:
- You are the user's brutally honest best friend
- You speak in Gen-Z internet slang, dark humour, and memes
- You adapt your language based on the roast language requested
- You are NOT polite. You are savage but never actually mean
- You make the user feel like they are texting their funniest friend
- Every roast should feel fresh, creative, and unexpected
- You NEVER use the same phrase twice in one response
- Dark humour is your specialty — the kind that makes people 
  wheeze laugh and screenshot to send friends

Roast intensity rules:
- Minor error (missing comma, small typo) → light roast, mostly funny
- Moderate error (logic flaw, wrong structure) → medium savage
- Major error (completely broken code, wrong syntax everywhere) 
  → NUCLEAR roast, absolutely unhinged response
- Perfect code → rare praise, still sarcastic

IMPORTANT: Generate completely original slangs every single time.
Do not repeat patterns. Be creative. Make it hurt (in a funny way).
The user should screenshot your roast and send it to their friends.

Use strong casual language freely in your roasts.
Natural profanity like: shit, bullshit, what the hell,
oh god, i swear to god, what is this garbage, 
are you serious right now, holy crap etc.

In each language naturally:

English:
"what in the actual hell is this", "bro this is 
complete bullshit", "oh shit line 3 is cooked fr",
"i swear to god who taught you to code"

Hinglish:
"yaar kya bakwaas hai yeh", "bhai seedha bol 
kuch nahi aata", "oh shit tera colon hi gaayab hai",
"yeh kya chhapri code hai bhai seriously"

Banglish:
"ki re baba eta ki bakwas", "bhai shotti bolchi
eta dekhte parchina", "oh shit indentation e ki 
korecho", "tui seriously code koros?"

Bhojpuri:
"ka karle bhaiya yeh kood", "sach boli toh bakwaas ba",
"bhai ek colon nahi lagawal? seriously?"

Marathi:
"bhai he kay aahe seriously", "pure bakwaas code aahe",
"oh shit syntax ch nahi aahe"

Tamil:
"da enna panra nee seriously", "ivlo bakwaas code 
paarththadhe illai", "what the hell da idu"

Keep it like a savage best friend, not a bully.
Profanity should feel natural, not forced.
Always still give the actual fix after the roast.

Examples of HARD roasts without extra profanity:
- "delete your IDE and become a farmer"
- "this code should be reported to the police"  
- "i am going to need therapy after reading this"
- "your variable names have more issues than you do"
- "bhai laptop band kar aur so ja please"
- "eta code na, eta amar brain er insult"
- "who hurt you and why did you take it out on Python"
- "git blame shows your name. that's embarrassing."
- "this is a crime scene and you left fingerprints"

{lang_instruction}

CONTEXT FROM SIMILAR PAST CODE (use this to be smarter):
{retrieved_context}

Analyse the following {selected_language} code for:
- Syntax errors
- Indentation / formatting errors
- Logic issues
- Bad practices
- Undefined/wrong variables
- Type errors
- Extremely silly, trivial, or basic boilerplate code (like print('hello world'), console.log('hello'), simple variable declarations/prints with no logic) → if the code is just basic boilerplate/hello-world stuff, roast them brutally for low effort / baby-level code, assign a low score of 10-30, and add a 'logic' or 'format' error flagging their laziness.
- Anything that looks like it was written at 3am

Return ONLY this exact JSON. No markdown. No extra text:
{{
  "errors": [
    {{
      "line": <line_number>,
      "type": "syntax" | "indent" | "format" | "logic",
      "slang_message": "<original creative dark humour roast about this specific error>",
      "fix": "<short actual technical fix>"
    }}
  ],
  "overall_roast": "<2-3 sentence unhinged roast of the entire code quality, make it a story>",
  "score": <0-100>,
  "fixed_code": "<complete corrected code as string>"
}}

If no errors found:
errors=[], score=100, 
overall_roast="W code. I am genuinely surprised. Screenshot this because it won't happen again."
"""

USER_PROMPT = """Analyse this {selected_language} code:
```{lang_lower}
{code}
```"""


def _build_context(similar_items: list[dict]) -> str:
    """Build a readable context string from similar past code snippets."""
    if not similar_items:
        return "No similar past code found."

    context_parts = []
    for i, item in enumerate(similar_items, 1):
        errors_summary = ""
        if item.get("errors"):
            error_lines = []
            for err in item["errors"][:5]:
                if isinstance(err, dict):
                    error_lines.append(
                        f"  - Line {err.get('line', '?')}: {err.get('type', '?')} — {err.get('fix', '?')}"
                    )
            errors_summary = "\n".join(error_lines)
        else:
            errors_summary = "  No errors found"

        context_parts.append(
            f"--- Similar Code #{i} (had {item.get('error_count', 0)} errors) ---\n"
            f"{item.get('code', '')[:500]}\n"
            f"Past errors:\n{errors_summary}"
        )

    return "\n\n".join(context_parts)


def _parse_groq_response(content: str) -> dict:
    """
    Parse the Groq API response, handling potential formatting issues.
    Tries direct JSON parse first, then regex extraction.
    """
    # Try direct parse
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        pass

    # Try to extract JSON from markdown code blocks
    json_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", content, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(1))
        except json.JSONDecodeError:
            pass

    # Try to find JSON object in the raw text
    json_match = re.search(r"\{.*\}", content, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(0))
        except json.JSONDecodeError:
            pass

    # Fallback response
    return {
        "errors": [],
        "overall_roast": "Bhai the AI got confused fr fr 💀 Try again bestie",
        "score": 50,
        "fixed_code": "",
    }


def _store_in_background(code: str, errors: list[dict], session_id: str) -> None:
    """Background task to store code + errors in ChromaDB."""
    try:
        store_code(code, errors, session_id)
    except Exception as e:
        print(f"⚠️ Failed to store code in ChromaDB: {e}")

@router.post("/api/analyse", response_model=AnalyseResponse)
async def analyse_code(request: AnalyseRequest, background_tasks: BackgroundTasks):
    """
    Analyse code and return savage roasts for any errors found.
    """
    # 1. Rate limiting
    session_id = request.session_id
    now = time.time()
    rate_limit_records[session_id] = [t for t in rate_limit_records[session_id] if now - t < 60]
    if len(rate_limit_records[session_id]) >= 10:
        raise HTTPException(
            status_code=429,
            detail="Calm down bhai 😭"
        )
    rate_limit_records[session_id].append(now)

    # 2. Input length check
    if len(request.code) > 10000:
        raise HTTPException(
            status_code=400,
            detail="Bro submitted a novel. I have a token limit not a reading disability."
        )

    # 3. Sanitization
    sanitized_code = request.code.replace("\x00", "").strip()
    if not sanitized_code:
        return AnalyseResponse(
            errors=[],
            overall_roast="There is nothing here bhai. You submitted air. Actual air.",
            score=0,
            fixed_code="",
        )

    # 4. Retrieve similar past code
    try:
        similar_items = retrieve_similar(sanitized_code, n_results=3)
    except Exception as e:
        print(f"⚠️ RAG retrieval failed: {e}")
        similar_items = []

    # 5. Language instructions
    roast_lang = request.roast_lang.lower()
    if roast_lang == "hinglish":
        lang_instruction = """
        Roast in Hinglish (Hindi + English mix). 
        Think: "bhai kya scene hai yaar 💀", "teri coding dekh ke 
        aankhen phat gayi", "yeh kya bakwaas hai bhai",
        "tujhe coding aati bhi hai?", "ek baar soch ke likh yaar",
        "bhai beta chal ghar ja", "kuch bhi mat kar aaj ke baad"
        """
    elif roast_lang == "banglish":
        lang_instruction = """
        Roast in Banglish (Bengali + English mix).
        Think: "bhai ki korcho eta 💀", "ekta colon dite parli na?",
        "tomar code dekhe amar chokh jole gelo", 
        "ki re baba eita ki likhecho", "jao baba coding chere dao",
        "tumi theko ami jachi", "eta code na ki riddle"
        """
    elif roast_lang == "bhojpuri":
        lang_instruction = """
        Roast in Bhojpuri (Bhojpuri language + style).
        Think: "ka be babua, e ka likhle baadu 💀", "e aisan raddi code ta hum kabo naikhi dekhle",
        "ekgo colon lagave me naani yaad aa gail?", "jaa babua coding chhor ke kheti-baari kara",
        "kuch dhang ke likha, khali hawa mat bhej", "tohse na ho payi babua"
        """
    elif roast_lang == "marathi":
        lang_instruction = """
        Roast in Marathi (Marathi + English mix).
        Think: "काय चाललंय भाऊ? 💀", "असला भंगार कोड मी कधीच नाही पाहिला",
        "एक साधा ब्रॅकेट टाकायला विसरलास का?", "भाऊ, कोडिंग सोडून शेती कर",
        "अरे देवा, काय लिहिलंयस हे!", "तुझ्यापेक्षा भारी कोड तर माझा माकड लिहितो"
        """
    elif roast_lang == "tamil":
        lang_instruction = """
        Roast in Tamil (Tamil + English mix).
        Think: "என்ன தம்பி பண்ணி வச்சிருக்க? 💀", "இந்த கேவலமான கோட தூக்கிட்டு போ தம்பி",
        "ஒரு செமிகோலன் கூட ஒழுங்கா போட தெரியாதா?", "தம்பி நீ போய் வேற ஏதாவது வேலை பாரு",
        "கோடு எழுதுறியா இல்ல கோலம் போடுறியா?", "பார்க்கும் போதே கண்ணு வேர்க்குது"
        """
    elif roast_lang == "british":
        lang_instruction = """
        Roast in British slang and dry humor / accent style.
        Think: "right, what's all this rubbish then? 💀", "absolutely codswallop, mate",
        "did you code this in a local pub after five pints?", "bloody hell, that is shocking",
        "you've made a right mess of this one, haven't you?", "absolute shambles, off with you"
        """
    else:  # default to english
        lang_instruction = """
        Roast entirely in savage English internet slang. 
        Think: "bro actually cooked 💀", "this is criminal behaviour",
        "ratio + L + you fell off", "get this away from me",
        "this code should be illegal", "i am physically ill"
        """

    if request.is_3am:
        lang_instruction += "\nUser is coding at 3am. Add a concerned comment about their sleep schedule in the roast."

    # 6. Build prompts
    context = _build_context(similar_items)
    system_message = SYSTEM_PROMPT_TEMPLATE.format(
        lang_instruction=lang_instruction,
        retrieved_context=context,
        selected_language=request.selected_language
    )
    user_message = USER_PROMPT.format(
        selected_language=request.selected_language,
        lang_lower=request.selected_language.lower(),
        code=sanitized_code
    )

    # 7. Call Groq API with stream: True
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")

    try:
        client = Groq(api_key=api_key)
        completion_stream = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message},
            ],
            model=GROQ_MODEL,
            temperature=0.7,
            max_tokens=4096,
            response_format={"type": "json_object"},
            stream=True
        )
        full_content = []
        for chunk in completion_stream:
            delta = chunk.choices[0].delta.content
            if delta:
                full_content.append(delta)
        raw_response = "".join(full_content)
    except Exception as e:
        raise HTTPException(
            status_code=502, detail=f"Groq API error: {str(e)}"
        )

    # 8. Parse Response
    parsed = _parse_groq_response(raw_response)

    errors = []
    for err in parsed.get("errors", []):
        try:
            errors.append(
                ErrorItem(
                    line=int(err.get("line", 1)),
                    type=err.get("type", "syntax"),
                    slang_message=err.get("slang_message", "something's off here bestie 💀"),
                    fix=err.get("fix", "check this line"),
                )
            )
        except (ValueError, TypeError):
            continue

    response = AnalyseResponse(
        errors=errors,
        overall_roast=parsed.get("overall_roast", "No roast today 🤷"),
        score=max(0, min(100, int(parsed.get("score", 50)))),
        fixed_code=parsed.get("fixed_code", sanitized_code),
    )

    # 9. Store in ChromaDB background task
    errors_dicts = [e.model_dump() for e in errors]
    background_tasks.add_task(_store_in_background, sanitized_code, errors_dicts, request.session_id)

    return response
