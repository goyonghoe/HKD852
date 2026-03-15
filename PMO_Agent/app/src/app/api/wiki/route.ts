import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { put, list } from "@vercel/blob";

export const dynamic = "force-dynamic";

const WIKI_BLOB_PREFIX = "wiki/";
const PUBLIC_WIKI_PATH = path.resolve(process.cwd(), "public/wiki");

function blobKey(slug: string) {
  return `${WIKI_BLOB_PREFIX}${slug}.md`;
}

async function readPageFromBlob(slug: string): Promise<string | null> {
  try {
    const blobs = await list({ prefix: blobKey(slug) });
    if (blobs.blobs.length > 0) {
      const res = await fetch(blobs.blobs[0].url, { cache: "no-store" });
      return await res.text();
    }
  } catch {
    // Blob not available
  }
  return null;
}

async function readPageLocal(slug: string): Promise<string | null> {
  try {
    const filePath = path.join(PUBLIC_WIKI_PATH, `${slug}.md`);
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}

async function writePageToBlob(slug: string, content: string): Promise<void> {
  await put(blobKey(slug), content, {
    access: "public",
    contentType: "text/markdown",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
  });
}

async function readIndexFromBlob(): Promise<unknown | null> {
  try {
    const blobs = await list({ prefix: `${WIKI_BLOB_PREFIX}index.json` });
    if (blobs.blobs.length > 0) {
      const res = await fetch(blobs.blobs[0].url, { cache: "no-store" });
      return await res.json();
    }
  } catch {
    // Blob not available
  }
  return null;
}

async function readIndexLocal(): Promise<unknown | null> {
  try {
    const filePath = path.join(PUBLIC_WIKI_PATH, "index.json");
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const indexParam = searchParams.get("index");
  const slug = searchParams.get("page");

  // Return index — local first (deployed with build), blob as fallback
  if (indexParam === "true") {
    const localIndex = await readIndexLocal();
    if (localIndex) return NextResponse.json(localIndex);
    const blobIndex = await readIndexFromBlob();
    if (blobIndex) return NextResponse.json(blobIndex);
    return NextResponse.json({ error: "Index not found" }, { status: 404 });
  }

  // Return page content
  if (!slug) {
    return NextResponse.json({ error: "Missing page param" }, { status: 400 });
  }

  const blobContent = await readPageFromBlob(slug);
  if (blobContent !== null) {
    return new NextResponse(blobContent, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const localContent = await readPageLocal(slug);
  if (localContent !== null) {
    // Seed to blob if token available
    try {
      await writePageToBlob(slug, localContent);
    } catch {
      // No blob token in dev — ok
    }
    return new NextResponse(localContent, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return NextResponse.json({ error: "Page not found" }, { status: 404 });
}

export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as { page: string; content: string };
    const { page, content } = body;

    if (!page || content === undefined) {
      return NextResponse.json(
        { error: "Missing page or content" },
        { status: 400 },
      );
    }

    // Sanitize slug — only allow alphanumeric, hyphens, underscores
    if (!/^[a-z0-9_-]+$/.test(page)) {
      return NextResponse.json({ error: "Invalid page slug" }, { status: 400 });
    }

    await writePageToBlob(page, content);

    return NextResponse.json({ success: true });
  } catch (e) {
    // Fallback: try writing locally in dev
    try {
      const body = (await req.clone().json()) as {
        page: string;
        content: string;
      };
      const filePath = path.join(PUBLIC_WIKI_PATH, `${body.page}.md`);
      await fs.writeFile(filePath, body.content, "utf-8");
      return NextResponse.json({ success: true, local: true });
    } catch {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json(
        { error: "Failed to save wiki page", detail: msg },
        { status: 500 },
      );
    }
  }
}
