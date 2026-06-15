import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get("text");
    const lang = searchParams.get("lang") || "english";
    const gender = searchParams.get("gender") || "male";

    if (!text) {
      return NextResponse.json({ detail: "Missing 'text' parameter" }, { status: 400 });
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const targetUrl = `${backendUrl}/api/speak?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(lang)}&gender=${encodeURIComponent(gender)}`;
    
    console.log(`Proxying speak request to backend: ${targetUrl}`);

    const response = await fetch(targetUrl, {
      method: "POST",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend error on speak: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { detail: `Backend responded with status ${response.status}: ${errorText}` },
        { status: response.status }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Proxy speak error:", err);
    return NextResponse.json(
      { detail: `Internal proxy error: ${err.message || String(err)}` },
      { status: 500 }
    );
  }
}
