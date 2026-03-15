import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { put, list } from "@vercel/blob";
import { applyMutation } from "@/lib/kanban/mutations";
import { normalizeTask } from "@/lib/kanban/normalize";
import { KanbanData, KanbanMutation } from "@/lib/kanban/types";

export const dynamic = "force-dynamic";

const BLOB_KEY = "kanban/kanban.json";
const PUBLIC_KANBAN_PATH = path.resolve(process.cwd(), "public/kanban.json");
const isVercel = !!process.env.VERCEL;

async function readFromBlob(): Promise<KanbanData | null> {
  try {
    const blobs = await list({ prefix: BLOB_KEY });
    if (blobs.blobs.length > 0) {
      const res = await fetch(blobs.blobs[0].url, { cache: "no-store" });
      return (await res.json()) as KanbanData;
    }
  } catch {
    // Blob not available
  }
  return null;
}

async function readLocal(): Promise<KanbanData> {
  const raw = await fs.readFile(PUBLIC_KANBAN_PATH, "utf-8");
  return JSON.parse(raw) as KanbanData;
}

async function writeToBlob(data: KanbanData): Promise<void> {
  await put(BLOB_KEY, JSON.stringify(data, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
  });
}

async function writeLocal(data: KanbanData): Promise<void> {
  const KANBAN_PATH = path.resolve(process.cwd(), "../kanban.json");
  const json = JSON.stringify(data, null, 2);
  await fs.writeFile(KANBAN_PATH, json, "utf-8");
  await fs.writeFile(PUBLIC_KANBAN_PATH, json, "utf-8");
}

export async function GET() {
  try {
    // 1. Try Blob first
    const blobData = await readFromBlob();
    if (blobData) {
      blobData.tasks = blobData.tasks.map((t) => normalizeTask(t));
      return NextResponse.json(blobData);
    }

    // 2. Fallback: public/kanban.json (first deploy or local dev)
    const localData = await readLocal();
    localData.tasks = localData.tasks.map((t) => normalizeTask(t));

    // 3. Seed Blob if token is available
    try {
      await writeToBlob(localData);
    } catch {
      // No blob token (local dev) — that's fine
    }

    return NextResponse.json(localData);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: "Failed to read kanban data", detail: msg },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const mutation = (await req.json()) as KanbanMutation;

    // Read current data (Blob → local fallback)
    let currentData = await readFromBlob();
    if (!currentData) {
      currentData = await readLocal();
    }
    currentData.tasks = currentData.tasks.map((t) => normalizeTask(t));

    // Apply mutation
    const updated = applyMutation(currentData, mutation);

    // Write: Blob on Vercel, local files in dev
    if (isVercel) {
      await writeToBlob(updated);
    } else {
      try {
        await writeToBlob(updated);
      } catch {
        await writeLocal(updated);
      }
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: "Failed to apply mutation", detail: msg },
      { status: 500 },
    );
  }
}
