import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function GET(request: Request) {
  // Verify Vercel Cron secret
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  revalidatePath("/");

  return NextResponse.json({
    revalidated: true,
    now: new Date().toISOString(),
  });
}
