import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { textStats } from "./public/js/layout.js";

const root = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(root, "public");
const dataDir = path.join(root, "data", "projects");
const port = Number(process.env.PORT) || 4173;
const maxBody = 20 * 1024 * 1024;
const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

function send(res, status, body, headers = {}) {
  const payload = Buffer.isBuffer(body) ? body : Buffer.from(body ?? "");
  res.writeHead(status, {
    "Content-Length": payload.length,
    "Cache-Control": "no-store",
    ...headers,
  });
  res.end(payload);
}

function sendJson(res, status, data) {
  send(res, status, JSON.stringify(data), { "Content-Type": "application/json; charset=utf-8" });
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBody) {
      const error = new Error("Request is too large");
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function readJson(file, fallback = null) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

async function writeJson(file, data) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2));
  try {
    await fs.unlink(file);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  await fs.rename(tmp, file);
}

function projectPaths(id) {
  const dir = path.join(dataDir, id);
  return {
    dir,
    meta: path.join(dir, "project.json"),
    chapters: path.join(dir, "chapters"),
    cover: path.join(dir, "cover.bin"),
  };
}

function assertId(id) {
  if (!idPattern.test(id || "")) {
    const error = new Error("Unknown project");
    error.status = 400;
    throw error;
  }
}

async function loadChapter(file) {
  const chapter = await readJson(file);
  if (!chapter || !idPattern.test(chapter.id || "")) return null;
  return {
    id: chapter.id,
    title: String(chapter.title || ""),
    content: String(chapter.content || ""),
    excludeFromNumbering: Boolean(chapter.excludeFromNumbering),
    excludeFromStatistics: Boolean(chapter.excludeFromStatistics),
    createdAt: chapter.createdAt || new Date().toISOString(),
    updatedAt: chapter.updatedAt || chapter.createdAt || new Date().toISOString(),
  };
}

async function loadProject(id) {
  assertId(id);
  const paths = projectPaths(id);
  const meta = await readJson(paths.meta);
  if (!meta) return null;
  const order = Array.isArray(meta.chapterOrder) ? meta.chapterOrder : [];
  const chapters = [];
  for (const chapterId of order) {
    if (!idPattern.test(chapterId)) continue;
    const chapter = await loadChapter(path.join(paths.chapters, `${chapterId}.json`));
    if (chapter) chapters.push(chapter);
  }
  const stats = summarize(chapters);
  return {
    id: meta.id,
    title: String(meta.title || "Untitled book"),
    createdAt: meta.createdAt,
    updatedAt: meta.updatedAt,
    cover: meta.cover || null,
    settings: cleanSettings(meta.settings),
    activity: cleanActivity(meta.activity),
    chapters,
    stats,
  };
}

function summarize(chapters) {
  return chapters.reduce(
    (total, chapter) => {
      const stats = textStats(chapter.content || "");
      total.pages += stats.pages;
      total.words += stats.words;
      total.chars += stats.chars;
      return total;
    },
    { chapters: chapters.length, pages: 0, words: 0, chars: 0 }
  );
}

function publicProject(project, { withChapters = false } = {}) {
  const body = {
    id: project.id,
    title: project.title,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    coverUrl: project.cover ? `/api/projects/${project.id}/cover?v=${encodeURIComponent(project.updatedAt || "")}` : null,
    stats: project.stats,
  };
  if (withChapters) {
    body.chapters = project.chapters;
    body.settings = project.settings;
    body.activity = project.activity;
  }
  return body;
}

async function listProjects() {
  await fs.mkdir(dataDir, { recursive: true });
  const entries = await fs.readdir(dataDir, { withFileTypes: true });
  const projects = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || !idPattern.test(entry.name)) continue;
    const project = await loadProject(entry.name);
    if (project) projects.push(publicProject(project));
  }
  projects.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  return projects;
}

async function createProject(title) {
  const now = new Date().toISOString();
  const id = randomUUID();
  const chapterId = randomUUID();
  const paths = projectPaths(id);
  const chapter = {
    id: chapterId,
    title: "Chapter 1",
    content: "",
    createdAt: now,
    updatedAt: now,
  };
  await writeJson(path.join(paths.chapters, `${chapterId}.json`), chapter);
  await writeJson(paths.meta, {
    id,
    title: cleanTitle(title) || "Untitled book",
    createdAt: now,
    updatedAt: now,
    cover: null,
    chapterOrder: [chapterId],
  });
  return loadProject(id);
}

function cleanTitle(title) {
  return String(title || "").replace(/\s+/g, " ").trim().slice(0, 180);
}

function positiveInt(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return null;
  return Math.min(100000, Math.round(number));
}

function cleanSettings(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const seen = new Set();
  const genres = [];
  for (const tag of Array.isArray(source.genres) ? source.genres : []) {
    const text = String(tag || "").replace(/\s+/g, " ").trim().slice(0, 40);
    const key = text.toLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    genres.push(text);
    if (genres.length >= 12) break;
  }
  let shortestChapter = positiveInt(source.shortestChapter);
  let longestChapter = positiveInt(source.longestChapter);
  if (shortestChapter != null && longestChapter != null && longestChapter < shortestChapter) {
    const swap = shortestChapter;
    shortestChapter = longestChapter;
    longestChapter = swap;
  }
  return {
    genres,
    targetPages: positiveInt(source.targetPages),
    shortestChapter,
    longestChapter,
  };
}

function cleanActivity(raw) {
  const activity = {};
  if (!raw || typeof raw !== "object") return activity;
  for (const [day, value] of Object.entries(raw)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) continue;
    const count = Math.round(Number(value));
    if (!Number.isFinite(count) || count <= 0) continue;
    activity[day] = Math.min(count, 1000000);
  }
  return activity;
}

async function saveProject(id, payload) {
  const existing = await loadProject(id);
  if (!existing) return null;
  const now = new Date().toISOString();
  const incoming = Array.isArray(payload.chapters) ? payload.chapters : [];
  const previous = new Map(existing.chapters.map((chapter) => [chapter.id, chapter]));
  const chapters = [];
  const seen = new Set();

  for (const raw of incoming) {
    if (!raw || !idPattern.test(raw.id || "") || seen.has(raw.id)) continue;
    seen.add(raw.id);
    const prior = previous.get(raw.id);
    const title = String(raw.title || "");
    const content = String(raw.content || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\t/g, " ");
    const excludeFromNumbering = Boolean(raw.excludeFromNumbering);
    const excludeFromStatistics = Boolean(raw.excludeFromStatistics);
    const changed =
      !prior ||
      prior.title !== title ||
      prior.content !== content ||
      Boolean(prior.excludeFromNumbering) !== excludeFromNumbering ||
      Boolean(prior.excludeFromStatistics) !== excludeFromStatistics;
    chapters.push({
      id: raw.id,
      title,
      content,
      excludeFromNumbering,
      excludeFromStatistics,
      createdAt: prior?.createdAt || raw.createdAt || now,
      updatedAt: changed ? now : prior.updatedAt,
    });
  }

  const paths = projectPaths(id);
  await fs.mkdir(paths.chapters, { recursive: true });
  const kept = new Set(chapters.map((chapter) => chapter.id));
  for (const chapter of existing.chapters) {
    if (!kept.has(chapter.id)) {
      await fs.rm(path.join(paths.chapters, `${chapter.id}.json`), { force: true });
    }
  }
  for (const chapter of chapters) {
    await writeJson(path.join(paths.chapters, `${chapter.id}.json`), chapter);
  }

  const title = cleanTitle(payload.title) || "Untitled book";
  const settings = cleanSettings(payload.settings);
  const activity = cleanActivity(payload.activity);
  const metaChanged = title !== existing.title || chapters.length !== existing.chapters.length;
  const contentChanged = chapters.some((chapter) => {
    const prior = previous.get(chapter.id);
    return !prior || prior.updatedAt !== chapter.updatedAt;
  });
  const planChanged = JSON.stringify(settings) !== JSON.stringify(existing.settings);
  const activityChanged = JSON.stringify(activity) !== JSON.stringify(existing.activity);
  await writeJson(paths.meta, {
    id,
    title,
    createdAt: existing.createdAt,
    updatedAt: metaChanged || contentChanged || planChanged || activityChanged ? now : existing.updatedAt,
    cover: existing.cover,
    settings,
    activity,
    chapterOrder: chapters.map((chapter) => chapter.id),
  });
  return loadProject(id);
}

async function saveCover(id, dataUrl) {
  const project = await loadProject(id);
  if (!project) return null;
  const match = /^data:(image\/(?:png|jpeg|webp|gif));base64,([a-z0-9+/=\s]+)$/i.exec(String(dataUrl || ""));
  if (!match) {
    const error = new Error("Use a PNG, JPEG, WebP, or GIF image");
    error.status = 400;
    throw error;
  }
  const buf = Buffer.from(match[2].replace(/\s/g, ""), "base64");
  if (!buf.length || buf.length > 4 * 1024 * 1024) {
    const error = new Error("Cover image must be under 4 MB");
    error.status = 400;
    throw error;
  }
  const paths = projectPaths(id);
  await fs.writeFile(paths.cover, buf);
  const meta = await readJson(paths.meta);
  meta.cover = { mime: match[1].toLowerCase() === "image/jpg" ? "image/jpeg" : match[1].toLowerCase() };
  meta.updatedAt = new Date().toISOString();
  await writeJson(paths.meta, meta);
  return loadProject(id);
}

async function deleteCover(id) {
  const project = await loadProject(id);
  if (!project) return null;
  const paths = projectPaths(id);
  await fs.rm(paths.cover, { force: true });
  const meta = await readJson(paths.meta);
  meta.cover = null;
  meta.updatedAt = new Date().toISOString();
  await writeJson(paths.meta, meta);
  return loadProject(id);
}

async function serveCover(id, res) {
  const project = await loadProject(id);
  if (!project?.cover) {
    send(res, 404, "Not found");
    return;
  }
  const paths = projectPaths(id);
  const buf = await fs.readFile(paths.cover);
  send(res, 200, buf, { "Content-Type": project.cover.mime || "application/octet-stream" });
}

async function serveStatic(url, res) {
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";
  const file = path.normalize(path.join(publicDir, pathname));
  if (!file.startsWith(publicDir)) {
    send(res, 403, "Forbidden");
    return;
  }
  try {
    const data = await fs.readFile(file);
    const type = types[path.extname(file).toLowerCase()] || "application/octet-stream";
    send(res, 200, data, { "Content-Type": type });
  } catch (error) {
    if (error.code === "ENOENT") send(res, 404, "Not found");
    else throw error;
  }
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const parts = url.pathname.split("/").filter(Boolean);

    if (parts[0] === "api" && parts[1] === "projects") {
      if (parts.length === 2 && req.method === "GET") {
        sendJson(res, 200, await listProjects());
        return;
      }
      if (parts.length === 2 && req.method === "POST") {
        const body = JSON.parse((await readBody(req)).toString("utf8") || "{}");
        const project = await createProject(body.title);
        sendJson(res, 201, publicProject(project, { withChapters: true }));
        return;
      }
      if (parts.length >= 3) {
        const id = parts[2];
        if (parts.length === 3 && req.method === "GET") {
          const project = await loadProject(id);
          if (!project) return sendJson(res, 404, { error: "Book not found" });
          return sendJson(res, 200, publicProject(project, { withChapters: true }));
        }
        if (parts.length === 3 && req.method === "PUT") {
          const body = JSON.parse((await readBody(req)).toString("utf8") || "{}");
          const project = await saveProject(id, body);
          if (!project) return sendJson(res, 404, { error: "Book not found" });
          return sendJson(res, 200, publicProject(project, { withChapters: true }));
        }
        if (parts.length === 3 && req.method === "DELETE") {
          assertId(id);
          await fs.rm(projectPaths(id).dir, { recursive: true, force: true });
          return send(res, 204, "");
        }
        if (parts[3] === "cover" && req.method === "GET") {
          await serveCover(id, res);
          return;
        }
        if (parts[3] === "cover" && req.method === "POST") {
          const body = JSON.parse((await readBody(req)).toString("utf8") || "{}");
          const project = await saveCover(id, body.dataUrl);
          if (!project) return sendJson(res, 404, { error: "Book not found" });
          return sendJson(res, 200, publicProject(project, { withChapters: true }));
        }
        if (parts[3] === "cover" && req.method === "DELETE") {
          const project = await deleteCover(id);
          if (!project) return sendJson(res, 404, { error: "Book not found" });
          return sendJson(res, 200, publicProject(project, { withChapters: true }));
        }
      }
      sendJson(res, 404, { error: "Not found" });
      return;
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      send(res, 405, "Method not allowed");
      return;
    }
    await serveStatic(url, res);
  } catch (error) {
    const status = error.status || (error instanceof SyntaxError ? 400 : 500);
    sendJson(res, status, { error: error.message || "Server error" });
  }
});

server.listen(port, () => {
  console.log(`Book Assistant running at http://localhost:${port}`);
});
