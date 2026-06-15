from pydantic import BaseModel


class AnalyseRequest(BaseModel):
    code: str
    session_id: str
    roast_lang: str = "english"
    selected_language: str = "python"
    is_3am: bool = False


class ErrorItem(BaseModel):
    line: int
    type: str  # "syntax" | "indent" | "format" | "logic"
    slang_message: str
    fix: str


class AnalyseResponse(BaseModel):
    errors: list[ErrorItem]
    overall_roast: str
    score: int
    fixed_code: str


class EmbedRequest(BaseModel):
    code: str
    session_id: str


class EmbedResponse(BaseModel):
    stored: bool
