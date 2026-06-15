import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    
    console.log(`Proxying request to backend: ${backendUrl}/api/analyse`);

    const response = await fetch(`${backendUrl}/api/analyse`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend error: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { detail: `Backend responded with status ${response.status}: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Proxy error:", err);
    return NextResponse.json(
      { detail: `Internal proxy error: ${err.message || String(err)}` },
      { status: 500 }
    );
  }
}
