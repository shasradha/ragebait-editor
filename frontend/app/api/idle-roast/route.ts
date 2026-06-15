import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get("lang") || "english";

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const targetUrl = `${backendUrl}/api/idle-roast?lang=${encodeURIComponent(lang)}`;

    console.log(`Proxying idle-roast request to backend: ${targetUrl}`);

    const response = await fetch(targetUrl, {
      method: "GET",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend error on idle-roast: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { detail: `Backend responded with status ${response.status}: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Proxy idle-roast error:", err);
    return NextResponse.json(
      { detail: `Internal proxy error: ${err.message || String(err)}` },
      { status: 500 }
    );
  }
}
