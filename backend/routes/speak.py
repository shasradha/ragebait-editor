import edge_tts
import io
from fastapi import APIRouter
from fastapi.responses import StreamingResponse

router = APIRouter()

VOICE_MAP = {
    "english": {
        "male":   "en-US-BrianNeural",
        "female": "en-US-JennyNeural"
    },
    "hinglish": {
        "male":   "hi-IN-MadhurNeural",
        "female": "hi-IN-SwaraNeural"
    },
    "banglish": {
        "male":   "bn-IN-BashkarNeural",
        "female": "bn-IN-TanishaaNeural"
    },
    "bhojpuri": {
        "male":   "hi-IN-MadhurNeural",
        "female": "hi-IN-SwaraNeural"
    },
    "marathi": {
        "male":   "mr-IN-ManoharNeural",
        "female": "mr-IN-AarohiNeural"
    },
    "tamil": {
        "male":   "ta-IN-ValluvarNeural",
        "female": "ta-IN-PallaviNeural"
    },
    "british": {
        "male":   "en-GB-RyanNeural",
        "female": "en-GB-SoniaNeural"
    }
}

@router.post("/api/speak")
async def speak(
    text: str, 
    lang: str = "english",
    gender: str = "male"
):
    voice = VOICE_MAP.get(lang, VOICE_MAP["english"])
    selected_voice = voice.get(gender, voice["male"])
    communicate = edge_tts.Communicate(text, selected_voice)
    audio_buffer = io.BytesIO()
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_buffer.write(chunk["data"])
    audio_buffer.seek(0)
    return StreamingResponse(
        audio_buffer,
        media_type="audio/mpeg",
        headers={"Cache-Control": "no-cache"}
    )
