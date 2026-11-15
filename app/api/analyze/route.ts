import { NextResponse } from "next/server";
import { analyze } from "@/lib/analyze";
import { canRunLive } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { text?: string; sample?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const text = (body.text || "").toString();
  if (!body.sample && text.trim().length < 12) {
    return NextResponse.json(
      { error: "Paste at least a sentence of an AI answer to check." },
      { status: 400 },
    );
  }
  try {
    const result = await analyze(text, { forceSample: Boolean(body.sample) });
    return NextResponse.json(result);
  } catch (e) {
    // Never 500 into a blank screen: fall back to sample so the UI still renders.
    return NextResponse.json(
      {
        error: (e as Error).message || "Analysis failed.",
        fallbackSample: true,
      },
      { status: 502 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ live: canRunLive() });
}
