import { textStats } from "./layout.js";

const DB_NAME = "book-assistant";
const DB_VERSION = 1;

let databasePromise = null;

function openDatabase() {
  if (databasePromise) return databasePromise;
  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("projects")) db.createObjectStore("projects", { keyPath: "id" });
      if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta", { keyPath: "key" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return databasePromise;
}

function requestStore(storeName, mode, run) {
  return openDatabase().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const result = run(tx.objectStore(storeName));
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error("Storage request was aborted"));
      })
  );
}

function readStore(storeName, run) {
  return openDatabase().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readonly");
        let value;
        const request = run(tx.objectStore(storeName));
        request.onsuccess = () => {
          value = request.result;
        };
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => resolve(value);
        tx.onerror = () => reject(tx.error);
      })
  );
}

function blankSettings() {
  return { genres: [], targetPages: null, shortestChapter: null, longestChapter: null };
}

function summarize(chapters) {
  return (chapters || []).reduce(
    (total, chapter) => {
      const stats = textStats(chapter.content || "");
      total.pages += stats.pages;
      total.words += stats.words;
      total.chars += stats.chars;
      return total;
    },
    { chapters: chapters?.length || 0, pages: 0, words: 0, chars: 0 }
  );
}

function present(project, { full = false } = {}) {
  const body = {
    id: project.id,
    title: project.title,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    coverUrl: project.coverDataUrl || null,
    stats: summarize(project.chapters),
  };
  if (full) {
    body.settings = project.settings || blankSettings();
    body.activity = project.activity || {};
    body.coverDataUrl = project.coverDataUrl || null;
    body.chapters = project.chapters || [];
  }
  return body;
}

function cleanChapter(chapter, now) {
  return {
    id: chapter.id || crypto.randomUUID(),
    title: String(chapter.title || ""),
    content: String(chapter.content || ""),
    excludeFromNumbering: Boolean(chapter.excludeFromNumbering),
    excludeFromStatistics: Boolean(chapter.excludeFromStatistics),
    createdAt: chapter.createdAt || now,
    updatedAt: chapter.updatedAt || now,
  };
}

function cleanProject(raw) {
  const now = new Date().toISOString();
  const cover = typeof raw.coverDataUrl === "string" && raw.coverDataUrl.startsWith("data:image/") ? raw.coverDataUrl : null;
  return {
    id: raw.id || crypto.randomUUID(),
    title: String(raw.title || "Untitled book").replace(/\s+/g, " ").trim().slice(0, 180) || "Untitled book",
    createdAt: raw.createdAt || now,
    updatedAt: raw.updatedAt || now,
    settings: raw.settings && typeof raw.settings === "object" ? raw.settings : blankSettings(),
    activity: raw.activity && typeof raw.activity === "object" ? raw.activity : {},
    coverDataUrl: cover,
    chapters: Array.isArray(raw.chapters) ? raw.chapters.filter(Boolean).map((chapter) => cleanChapter(chapter, now)) : [],
  };
}

export function requestPersistence() {
  const persist = navigator.storage?.persist;
  if (!persist) return Promise.resolve(false);
  return persist.call(navigator.storage).catch(() => false);
}

export function getSettings() {
  return readStore("meta", (store) => store.get("settings")).then((row) => ({
    collapsed: Boolean(row?.collapsed),
    seenStorageNotice: Boolean(row?.seenStorageNotice),
  }));
}

export function saveSettings(patch) {
  return getSettings().then((current) =>
    requestStore("meta", "readwrite", (store) => {
      store.put({ key: "settings", ...current, ...patch });
    })
  );
}

export function listProjects() {
  return readStore("projects", (store) => store.getAll()).then((rows) =>
    (rows || [])
      .map((project) => present(project))
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
  );
}

export function getProject(id) {
  return readStore("projects", (store) => store.get(id)).then((project) => {
    if (!project) throw new Error("Book not found");
    return present(project, { full: true });
  });
}

export function createProject(title) {
  const now = new Date().toISOString();
  const project = cleanProject({
    id: crypto.randomUUID(),
    title: title || "Untitled book",
    createdAt: now,
    updatedAt: now,
    chapters: [
      {
        id: crypto.randomUUID(),
        title: "Chapter 1",
        content: "",
        createdAt: now,
        updatedAt: now,
      },
    ],
  });
  return requestStore("projects", "readwrite", (store) => {
    store.put(project);
  }).then(() => present(project, { full: true }));
}

export function saveProject(project) {
  return readStore("projects", (store) => store.get(project.id)).then((existing) => {
    const now = new Date().toISOString();
    const stored = cleanProject({
      ...existing,
      ...project,
      id: project.id,
      createdAt: existing?.createdAt || project.createdAt || now,
      updatedAt: now,
      coverDataUrl: existing?.coverDataUrl || project.coverDataUrl || null,
      chapters: project.chapters || existing?.chapters || [],
    });
    return requestStore("projects", "readwrite", (store) => {
      store.put(stored);
    }).then(() => present(stored, { full: true }));
  });
}

export function deleteProject(id) {
  return requestStore("projects", "readwrite", (store) => {
    store.delete(id);
  });
}

export function uploadCover(id, dataUrl) {
  return readStore("projects", (store) => store.get(id)).then((project) => {
    if (!project) throw new Error("Book not found");
    if (!/^data:image\/(?:png|jpeg|webp|gif);base64,/i.test(String(dataUrl || ""))) {
      throw new Error("Use a PNG, JPEG, WebP, or GIF image");
    }
    project.coverDataUrl = dataUrl;
    project.updatedAt = new Date().toISOString();
    return requestStore("projects", "readwrite", (store) => {
      store.put(project);
    }).then(() => present(project));
  });
}

export function removeCover(id) {
  return readStore("projects", (store) => store.get(id)).then((project) => {
    if (!project) throw new Error("Book not found");
    project.coverDataUrl = null;
    project.updatedAt = new Date().toISOString();
    return requestStore("projects", "readwrite", (store) => {
      store.put(project);
    }).then(() => present(project));
  });
}

export function exportArchive() {
  return readStore("projects", (store) => store.getAll()).then((rows) => ({
    format: "book-assistant",
    version: 1,
    exportedAt: new Date().toISOString(),
    projects: (rows || []).map((project) => cleanProject(project)),
  }));
}

export function importArchive(data) {
  if (!data || data.format !== "book-assistant" || !Array.isArray(data.projects)) {
    return Promise.reject(new Error("Choose a Book Assistant export file"));
  }
  const projects = data.projects.map((project) => cleanProject(project));
  return openDatabase().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction("projects", "readwrite");
        const store = tx.objectStore("projects");
        store.clear();
        for (const project of projects) store.put(project);
        tx.oncomplete = () => resolve(projects.length);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error("Import failed"));
      })
  );
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function migrateFromServer() {
  const flag = await readStore("meta", (store) => store.get("migratedFromServer"));
  if (flag?.done) return;
  const existing = await readStore("projects", (store) => store.getAll());
  if (existing?.length) {
    await requestStore("meta", "readwrite", (store) => {
      store.put({ key: "migratedFromServer", done: true });
    });
    return;
  }
  let list;
  try {
    const response = await fetch("/api/projects");
    if (!response.ok) return;
    list = await response.json();
  } catch {
    return;
  }
  for (const item of Array.isArray(list) ? list : []) {
    const fullResponse = await fetch(`/api/projects/${item.id}`);
    if (!fullResponse.ok) continue;
    const full = await fullResponse.json();
    let coverDataUrl = null;
    if (full.coverUrl) {
      const coverResponse = await fetch(full.coverUrl);
      if (coverResponse.ok) coverDataUrl = await blobToDataUrl(await coverResponse.blob());
    }
    const project = cleanProject({ ...full, coverDataUrl });
    await requestStore("projects", "readwrite", (store) => {
      store.put(project);
    });
  }
  await requestStore("meta", "readwrite", (store) => {
    store.put({ key: "migratedFromServer", done: true });
  });
}
