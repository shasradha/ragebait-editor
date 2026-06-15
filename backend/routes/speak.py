"""
RageBait Editor Speak Route — Text-to-speech endpoint using edge-tts.
Returns streamed MP3 audio for the given text, language, and voice gender.
"""

import io

import edge_tts
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse

router = APIRouter()

VOICE_MAP: dict[str, dict[str, str]] = {
    "english": {
        "male":   "en-US-BrianNeural",
        "female": "en-US-JennyNeural",
    },
    "hinglish": {
        "male":   "hi-IN-MadhurNeural",
        "female": "hi-IN-SwaraNeural",
    },
    "banglish": {
        "male":   "bn-IN-BashkarNeural",
        "female": "bn-IN-TanishaaNeural",
    },
    "bhojpuri": {
        "male":   "hi-IN-MadhurNeural",
        "female": "hi-IN-SwaraNeural",
    },
    "marathi": {
        "male":   "mr-IN-ManoharNeural",
        "female": "mr-IN-AarohiNeural",
    },
    "tamil": {
        "male":   "ta-IN-ValluvarNeural",
        "female": "ta-IN-PallaviNeural",
    },
    "british": {
        "male":   "en-GB-RyanNeural",
        "female": "en-GB-SoniaNeural",
    },
}


@router.post("/api/speak")
async def speak(
    text: str = Query(..., description="Text to convert to speech"),
    lang: str = Query("english", description="Roast language"),
    gender: str = Query("male", description="Voice gender (male/female)"),
) -> StreamingResponse:
    """Convert text to speech using edge-tts and return an audio/mpeg stream."""
    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    voice_group = VOICE_MAP.get(lang, VOICE_MAP["english"])
    selected_voice = voice_group.get(gender, voice_group["male"])

    try:
        communicate = edge_tts.Communicate(text, selected_voice)
        audio_buffer = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_buffer.write(chunk["data"])
        audio_buffer.seek(0)

        return StreamingResponse(
            audio_buffer,
            media_type="audio/mpeg",
            headers={"Cache-Control": "no-cache"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS generation failed: {str(e)}")
