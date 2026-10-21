import * as api from "./api.js";
import { countWords, textStats } from "./layout.js";
import { NormEditor, syncMetrics } from "./editor.js";
import { imprintPage, privacyPage } from "./legal.js";

const app = document.querySelector("#app");
const state = {
  projects: [],
  project: null,
  editor: null,
  dirty: false,
  rev: 0,
  saving: false,
  collapsed: false,
  privacyLang: "de",
  pendingPage: null,
  route: { name: "home" },
};

const covers = [
  ["#243f39", "#7d9a8d"],
  ["#3c2f2a", "#b08a6e"],
  ["#2c3140", "#8893a8"],
  ["#3f2a33", "#b47b88"],
  ["#2e3424", "#969c72"],
  ["#243244", "#7b97b0"],
];

function icon(name) {
  const paths = {
    back: '<path d="M15 6 9 12l6 6"/>',
    chevron: '<path d="M14 6 8 12l6 6"/>',
    dashboard: '<rect x="4" y="4" width="7" height="7" rx="1.4"/><rect x="13" y="4" width="7" height="7" rx="1.4"/><rect x="4" y="13" width="7" height="7" rx="1.4"/><rect x="13" y="13" width="7" height="7" rx="1.4"/>',
    book: '<path d="M5 5.5h9.5A3.5 3.5 0 0 1 18 9v9.5H8.5A3.5 3.5 0 0 0 5 22V5.5Z"/><path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H18"/>',
    trash: '<path d="M5 7h14"/><path d="M9 7V5h6v2"/><path d="M8 7l.7 12h6.6L16 7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    download: '<path d="M12 4v10"/><path d="m8 10 4 4 4-4"/><path d="M5 19h14"/>',
    upload: '<path d="M12 20V10"/><path d="m8 14 4-4 4 4"/><path d="M5 20h14"/>',
    settings: '<path d="M4 8h16M4 16h16"/><circle cx="9" cy="8" r="2.2"/><circle cx="15" cy="16" r="2.2"/>',
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg>`;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function editedLabel(iso) {
  if (!iso) return "Not yet";
  const delta = Date.now() - new Date(iso).getTime();
  const min = Math.round(delta / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min} min ago`;
  const hours = Math.round(min / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 14) return `${days} d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function coverStyle(id) {
  const index = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % covers.length;
  const [from, to] = covers[index];
  return `background: linear-gradient(160deg, ${from}, ${to});`;
}

function chapterNumberMap(chapters) {
  const map = new Map();
  let number = 0;
  for (const chapter of chapters) {
    map.set(chapter.id, chapter.excludeFromNumbering ? "" : String(++number));
  }
  return map;
}

function numberedChapterCount(chapters) {
  return chapters.filter((chapter) => !chapter.excludeFromNumbering).length;
}

function projectStats(project) {
  return (project.chapters || []).reduce(
    (total, chapter) => {
      const stats = textStats(chapter.content || "");
      total.pages += stats.pages;
      total.words += stats.words;
      total.chars += stats.chars;
      return total;
    },
    { chapters: project.chapters?.length || 0, pages: 0, words: 0, chars: 0 }
  );
}

function parseRoute() {
  const parts = (location.hash.replace(/^#/, "") || "/").split("/").filter(Boolean);
  if (parts[0] === "imprint") return { name: "imprint" };
  if (parts[0] === "privacy") return { name: "privacy" };
  if (parts[0] !== "book" || !parts[1]) return { name: "home" };
  const bookId = parts[1];
  if (parts[2] === "manuscript") return { name: "manuscript", bookId };
  if (parts[2] === "chapter" && parts[3]) return { name: "chapter", bookId, chapterId: parts[3] };
  return { name: "dashboard", bookId };
}

function go(hash) {
  if (location.hash === hash) onRoute();
  else location.hash = hash;
}

function markDirty() {
  state.dirty = true;
  state.rev += 1;
  paintSave("Unsaved", "is-dirty");
}

function paintSave(text, kind) {
  const node = document.querySelector("#save-state");
  if (!node) return;
  node.textContent = text;
  node.className = `save-state${kind ? ` ${kind}` : ""}`;
}

function blankSettings() {
  return { genres: [], targetPages: null, shortestChapter: null, longestChapter: null };
}

function normalizeSettings(raw) {
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
  const number = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return Math.min(100000, Math.round(parsed));
  };
  let shortestChapter = number(source.shortestChapter);
  let longestChapter = number(source.longestChapter);
  if (shortestChapter != null && longestChapter != null && longestChapter < shortestChapter) {
    const swap = shortestChapter;
    shortestChapter = longestChapter;
    longestChapter = swap;
  }
  return { genres, targetPages: number(source.targetPages), shortestChapter, longestChapter };
}

function localDay(date = new Date()) {
  if (Number.isNaN(date.getTime())) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function wordsChanged(before, after) {
  const counts = (text) => {
    const map = new Map();
    for (const word of String(text || "").match(/\S+/g) || []) map.set(word, (map.get(word) || 0) + 1);
    return map;
  };
  const left = counts(before);
  const right = counts(after);
  let changed = 0;
  for (const word of new Set([...left.keys(), ...right.keys()])) {
    changed += Math.abs((left.get(word) || 0) - (right.get(word) || 0));
  }
  return changed;
}

function prepareProject(project) {
  project.settings = normalizeSettings(project.settings);
  project.activity = project.activity && typeof project.activity === "object" ? { ...project.activity } : {};
  if (!Object.keys(project.activity).length) {
    for (const chapter of project.chapters) {
      const words = countWords(chapter.content || "");
      const day = localDay(new Date(chapter.updatedAt || ""));
      if (!words || !day) continue;
      project.activity[day] = (project.activity[day] || 0) + words;
    }
  }
  state.activityBaseline = new Map(project.chapters.map((chapter) => [chapter.id, chapter.content || ""]));
}

function recordWritingActivity() {
  const project = state.project;
  if (!project) return;
  if (!state.activityBaseline) state.activityBaseline = new Map();
  let total = 0;
  const seen = new Set();
  for (const chapter of project.chapters) {
    seen.add(chapter.id);
    const before = state.activityBaseline.has(chapter.id) ? state.activityBaseline.get(chapter.id) : "";
    total += wordsChanged(before, chapter.content || "");
    state.activityBaseline.set(chapter.id, chapter.content || "");
  }
  for (const [id, content] of state.activityBaseline) {
    if (seen.has(id)) continue;
    total += wordsChanged(content, "");
    state.activityBaseline.delete(id);
  }
  if (!total) return;
  const day = localDay();
  project.activity = { ...(project.activity || {}), [day]: ((project.activity || {})[day] || 0) + total };
}

function saveBody(project) {
  return {
    title: project.title,
    settings: project.settings,
    activity: project.activity,
    chapters: project.chapters,
  };
}

async function flushSave() {
  if (!state.project || !state.dirty || state.saving) return;
  recordWritingActivity();
  const rev = state.rev;
  const snapshot = {
    id: state.project.id,
    title: state.project.title,
    settings: state.project.settings,
    activity: state.project.activity,
    chapters: state.project.chapters.map((chapter) => ({ ...chapter })),
  };
  state.saving = true;
  paintSave("Saving…");
  try {
    await api.saveProject(snapshot);
    if (state.rev === rev) {
      state.dirty = false;
      paintSave("Saved");
    } else {
      paintSave("Unsaved", "is-dirty");
    }
  } catch (error) {
    paintSave(error.message || "Not saved", "is-error");
  } finally {
    state.saving = false;
    if (state.dirty && state.rev !== rev) flushSave();
  }
}

function modal({ title, text, confirmLabel, danger, field, dismissOnly, match }) {
  return new Promise((resolve) => {
    const wrap = document.createElement("div");
    wrap.className = "backdrop";
    wrap.innerHTML = `
      <form class="dialog">
        <h2>${escapeHtml(title)}</h2>
        ${text ? `<p>${escapeHtml(text)}</p>` : ""}
        ${field ? `<input type="text" name="value" value="${escapeAttr(field.value || "")}" placeholder="${escapeAttr(field.placeholder || "")}" autocomplete="off" />` : ""}
        <div class="dialog-actions">
          ${dismissOnly ? "" : `<button type="button" class="ghost" data-cancel>Cancel</button>`}
          <button type="submit" class="${danger ? "danger-btn" : "primary"}"${match != null ? " disabled" : ""}>${confirmLabel}</button>
        </div>
      </form>
    `;
    const close = (value) => {
      wrap.remove();
      resolve(value);
    };
    wrap.addEventListener("click", (event) => {
      if (event.target === wrap) close(null);
    });
    wrap.querySelector("[data-cancel]")?.addEventListener("click", () => close(null));
    const input = wrap.querySelector("input");
    const submit = wrap.querySelector("[type=submit]");
    if (match != null && input) {
      input.addEventListener("input", () => {
        submit.disabled = input.value !== match;
      });
    }
    wrap.querySelector("form").addEventListener("submit", (event) => {
      event.preventDefault();
      if (match != null) {
        if (!input || input.value !== match) return;
        close(true);
        return;
      }
      close(field ? input.value.trim() : true);
    });
    document.body.appendChild(wrap);
    (input || submit).focus();
    if (input && match == null) input.select();
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

async function renderHome() {
  state.editor?.destroy();
  state.editor = null;
  state.project = null;
  app.innerHTML = `
    <main class="home">
      <header class="home-head">
        <div>
          <p class="eyebrow">Library</p>
          <h1>Book Assistant</h1>
        </div>
        <button class="primary" id="new-book" type="button">New book</button>
      </header>
      <p class="banner" id="home-error" hidden></p>
      <section class="book-grid" id="book-grid"></section>
      <div class="side-actions library-actions">
        <button class="side-tool" id="export-books" type="button">${icon("download")} Export</button>
        <button class="side-tool" id="import-books" type="button">${icon("upload")} Import</button>
      </div>
    </main>
  `;
  document.querySelector("#new-book").addEventListener("click", createBook);
  document.querySelector("#export-books").addEventListener("click", exportBooks);
  document.querySelector("#import-books").addEventListener("click", importBooks);
  try {
    state.projects = await api.listProjects();
    paintProjects();
  } catch (error) {
    const banner = document.querySelector("#home-error");
    banner.hidden = false;
    banner.textContent = error.message || "Could not load books";
  }
}

function paintProjects() {
  const grid = document.querySelector("#book-grid");
  if (!state.projects.length) {
    grid.innerHTML = `<p class="empty-library">No books yet. Create a project and start the first chapter.</p>`;
    return;
  }
  grid.innerHTML = state.projects
    .map((project) => {
      const letter = (project.title || "B").trim().charAt(0).toUpperCase() || "B";
      const cover = project.coverUrl
        ? `<img src="${escapeAttr(project.coverUrl)}" alt="" />`
        : `<div class="cover-fallback" style="${coverStyle(project.id)}">${escapeHtml(letter)}</div>`;
      const stats = project.stats || { chapters: 0, pages: 0, words: 0 };
      return `
        <article class="book-card" data-id="${project.id}">
          <div class="book-face">
            <button class="card-delete" type="button" data-delete aria-label="Delete ${escapeAttr(project.title)}">${icon("trash")}</button>
            <div class="cover">
              ${cover}
              <div class="cover-actions">
                <label class="chip">Cover<input class="cover-input" type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden /></label>
              </div>
            </div>
            <div class="card-body">
              <h2 class="card-title" data-title>${escapeHtml(project.title)}</h2>
              <div class="meta">
                <div class="meta-inner">
                  <dl>
                    <div><dt>Chapters</dt><dd>${formatNumber(stats.chapters)}</dd></div>
                    <div><dt>Pages</dt><dd>${formatNumber(stats.pages)}</dd></div>
                    <div><dt>Words</dt><dd>${formatNumber(stats.words)}</dd></div>
                    <div><dt>Edited</dt><dd data-time="${escapeAttr(project.updatedAt)}">${editedLabel(project.updatedAt)}</dd></div>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  grid.querySelectorAll(".book-card").forEach((card) => {
    const id = card.dataset.id;
    card.addEventListener("click", (event) => {
      if (event.target.closest("button, label, input")) return;
      go(`#/book/${id}`);
    });
    card.querySelector("[data-delete]").addEventListener("click", () => removeBook(id));
    card.querySelector("[data-title]").addEventListener("dblclick", (event) => {
      event.stopPropagation();
      renameBookOnCard(id, card.querySelector("[data-title]"));
    });
    card.querySelector(".cover-input").addEventListener("change", (event) => {
      const file = event.target.files?.[0];
      if (file) uploadCover(id, file);
    });
  });
}

async function createBook() {
  const title = await modal({
    title: "New book",
    confirmLabel: "Create",
    field: { value: "", placeholder: "Book title" },
  });
  if (title == null) return;
  const project = await api.createProject(title || "Untitled book");
  go(`#/book/${project.id}`);
}

async function removeBook(id) {
  const project = state.projects.find((item) => item.id === id);
  const title = project?.title || "Untitled book";
  const ok = await modal({
    title: "Delete book",
    text: `Type “${title}” to delete this book and all of its chapters.`,
    confirmLabel: "Delete",
    danger: true,
    field: { value: "", placeholder: "Book name" },
    match: title,
  });
  if (!ok) return;
  await api.deleteProject(id);
  state.projects = state.projects.filter((item) => item.id !== id);
  paintProjects();
}

async function renameBookOnCard(id, node) {
  const title = await modal({
    title: "Rename book",
    confirmLabel: "Save",
    field: { value: state.projects.find((item) => item.id === id)?.title || "", placeholder: "Book title" },
  });
  if (title == null) return;
  const full = await api.getProject(id);
  full.title = title || "Untitled book";
  const saved = await api.saveProject(full);
  const index = state.projects.findIndex((item) => item.id === id);
  if (index >= 0) state.projects[index] = saved;
  if (node.isConnected) node.textContent = saved.title;
}

async function uploadCover(id, file) {
  const dataUrl = await readFile(file);
  const updated = await api.uploadCover(id, dataUrl);
  const index = state.projects.findIndex((item) => item.id === id);
  if (index >= 0) state.projects[index] = { ...state.projects[index], ...updated };
  if (state.project?.id === id) {
    state.project.coverUrl = updated.coverUrl;
    state.project.updatedAt = updated.updatedAt;
    paintDashboard();
  }
  if (state.route.name === "home") paintProjects();
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function openProject(bookId) {
  if (state.project?.id === bookId && document.querySelector(".shell")) {
    showSection();
    return;
  }
  if (state.dirty) await flushSave();
  state.editor?.destroy();
  state.editor = null;
  try {
    state.project = await api.getProject(bookId);
    prepareProject(state.project);
  } catch (error) {
    app.innerHTML = `<main class="home"><p class="banner">${escapeHtml(error.message)}</p></main>`;
    return;
  }
  mountShell();
  showSection();
}

function mountShell() {
  const project = state.project;
  app.innerHTML = `
    <div class="shell${state.collapsed ? " is-collapsed" : ""}">
      <aside class="sidebar">
        <div class="side-inner">
          <div class="side-head">
            <button class="back" id="back" type="button">${icon("back")} Books</button>
            <div class="side-book" id="side-book">${escapeHtml(project.title)}</div>
          </div>
          <button class="nav-btn" type="button" data-view="dashboard">${icon("dashboard")} Dashboard</button>
          <button class="nav-btn" type="button" data-view="manuscript">${icon("book")} Manuscript</button>
          <div class="side-label">Chapters</div>
          <div class="chapter-scroll"><ul class="chapter-list" id="chapter-list"></ul></div>
          <div class="side-actions">
            <button class="add-chapter" id="add-chapter" type="button">${icon("plus")} New chapter</button>
            <button class="side-tool" id="export-books" type="button">${icon("download")} Export</button>
            <button class="side-tool" id="import-books" type="button">${icon("upload")} Import</button>
          </div>
        </div>
      </aside>
      <button class="sidebar-toggle" id="sidebar-toggle" type="button" aria-label="Collapse sidebar">${icon("chevron")}</button>
      <section class="workspace">
        <header class="topbar" id="topbar">
          <div class="stats" id="stats"></div>
          <div class="top-actions">
            <div class="chapter-options" id="chapter-options" hidden>
              <label class="numbering-toggle">
                <input type="checkbox" id="exclude-numbering" />
                Exclude from numbering
              </label>
              <label class="numbering-toggle">
                <input type="checkbox" id="exclude-statistics" />
                Exclude from statistics
              </label>
            </div>
            <div class="save-state" id="save-state">Saved</div>
          </div>
        </header>
        <div class="titlebar" id="titlebar">
          <input class="chapter-title" id="chapter-title" aria-label="Chapter title" placeholder="Chapter title" />
        </div>
        <div class="stage" id="stage">
          <div class="desk" id="desk"></div>
          <aside class="rail">
            <div class="rail-head"><span>Pages</span><strong id="page-indicator">1 / 1</strong></div>
            <div class="thumbs" id="thumbs"></div>
          </aside>
        </div>
        <div class="dashboard" id="dashboard" hidden></div>
      </section>
    </div>
  `;
  document.querySelector("#back").addEventListener("click", () => go("#/"));
  document.querySelector("#sidebar-toggle").addEventListener("click", () => {
    state.collapsed = !state.collapsed;
    api.saveSettings({ collapsed: state.collapsed });
    document.querySelector(".shell").classList.toggle("is-collapsed", state.collapsed);
  });
  document.querySelectorAll(".nav-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const view = button.dataset.view;
      go(view === "manuscript" ? `#/book/${project.id}/manuscript` : `#/book/${project.id}`);
    });
  });
  document.querySelector("#add-chapter").addEventListener("click", addChapter);
  document.querySelector("#export-books").addEventListener("click", exportBooks);
  document.querySelector("#import-books").addEventListener("click", importBooks);
  document.querySelector("#chapter-title").addEventListener("input", onTitleInput);
  document.querySelector("#exclude-numbering").addEventListener("change", (event) => {
    const chapter = currentChapter();
    if (!chapter) return;
    chapter.excludeFromNumbering = event.target.checked;
    touch(chapter);
    syncChapterList(false);
    updateStats();
    flushSave();
  });
  document.querySelector("#exclude-statistics").addEventListener("change", (event) => {
    const chapter = currentChapter();
    if (!chapter) return;
    chapter.excludeFromStatistics = event.target.checked;
    touch(chapter);
    flushSave();
  });
  state.editor = new NormEditor(document.querySelector("#desk"), document.querySelector("#thumbs"));
  state.editor.onChange = (text) => {
    const chapter = currentChapter();
    if (!chapter || chapter.content === text) return;
    chapter.content = text;
    touch(chapter);
    updateStats();
  };
  state.editor.onActivePage = ({ current, total }) => {
    const node = document.querySelector("#page-indicator");
    if (node) node.textContent = total ? `${current} / ${total}` : "0 / 0";
  };
  state.editor.onEditChapter = ({ chapterId, chapterPage }) => {
    state.pendingPage = chapterPage;
    go(`#/book/${project.id}/chapter/${chapterId}`);
  };
  syncChapterList(true);
}

function showSection() {
  const route = state.route;
  const dashboard = document.querySelector("#dashboard");
  const stage = document.querySelector("#stage");
  const topbar = document.querySelector("#topbar");
  const titlebar = document.querySelector("#titlebar");
  const writing = route.name !== "dashboard";
  dashboard.hidden = writing;
  stage.hidden = !writing;
  topbar.hidden = !writing;
  titlebar.hidden = !writing;
  document.querySelectorAll(".nav-btn").forEach((button) => {
    const active = (button.dataset.view === "manuscript" && route.name === "manuscript") || (button.dataset.view === "dashboard" && route.name === "dashboard");
    button.classList.toggle("is-active", active);
  });
  const chapterOptions = document.querySelector("#chapter-options");
  if (chapterOptions) chapterOptions.hidden = route.name !== "chapter";
  syncChapterList(false);
  if (route.name === "dashboard") paintDashboard();
  if (route.name === "manuscript") showManuscript();
  if (route.name === "chapter") showChapter(route.chapterId);
}

function currentChapter() {
  return state.project?.chapters.find((chapter) => chapter.id === state.route.chapterId) || null;
}

function touch(chapter) {
  const now = new Date().toISOString();
  if (chapter) chapter.updatedAt = now;
  state.project.updatedAt = now;
  markDirty();
}

function onTitleInput(event) {
  const chapter = currentChapter();
  if (!chapter || state.route.name !== "chapter") return;
  chapter.title = event.target.value;
  touch(chapter);
  syncChapterList(false);
  updateStats();
}

function showChapter(chapterId) {
  const chapter = state.project.chapters.find((item) => item.id === chapterId);
  if (!chapter) {
    go(`#/book/${state.project.id}`);
    return;
  }
  const title = document.querySelector("#chapter-title");
  title.readOnly = false;
  if (document.activeElement !== title) title.value = chapter.title;
  const exclude = document.querySelector("#exclude-numbering");
  if (exclude) exclude.checked = Boolean(chapter.excludeFromNumbering);
  const excludeStats = document.querySelector("#exclude-statistics");
  if (excludeStats) excludeStats.checked = Boolean(chapter.excludeFromStatistics);
  const same = state.editor.mode === "chapter" && state.editor.chapterId === chapterId;
  state.editor.chapterId = chapterId;
  if (!same) state.editor.setChapter(chapter.content || "");
  if (state.pendingPage != null) {
    state.editor.scrollToPage(state.pendingPage);
    state.pendingPage = null;
  }
  updateStats();
}

function showManuscript() {
  const title = document.querySelector("#chapter-title");
  title.readOnly = true;
  title.value = state.project.title || "Manuscript";
  state.editor.chapterId = null;
  state.editor.setManuscript(state.project.chapters);
  updateStats();
}

function updateStats() {
  const stats = document.querySelector("#stats");
  if (!stats || !state.project) return;
  if (state.route.name === "manuscript") {
    const total = projectStats(state.project);
    stats.innerHTML = statHtml([
      ["Last edited", editedLabel(state.project.updatedAt)],
      ["Words", formatNumber(total.words)],
      ["Characters", formatNumber(total.chars), "Including spaces"],
      ["Pages", formatNumber(total.pages)],
      ["Chapters", formatNumber(total.chapters)],
    ]);
    return;
  }
  const chapter = currentChapter();
  if (!chapter) return;
  const count = textStats(chapter.content || "");
  const number = chapterNumberMap(state.project.chapters).get(chapter.id);
  const numbered = numberedChapterCount(state.project.chapters);
  const pages = state.editor?.mode === "chapter" ? state.editor.visiblePageCount() : count.pages;
  stats.innerHTML = statHtml([
    ["Last edited", editedLabel(chapter.updatedAt)],
    ["Words", formatNumber(count.words)],
    ["Characters", formatNumber(count.chars), "Including spaces"],
    ["Pages", formatNumber(pages)],
    ["Order", number ? `Chapter ${number} of ${numbered}` : "Not numbered"],
  ]);
}

function statHtml(items) {
  return items
    .map(
      ([label, value, hint]) =>
        `<div class="stat" ${hint ? `title="${escapeAttr(hint)}"` : ""}><span>${label}</span><strong>${value}</strong></div>`
    )
    .join("");
}

function syncChapterList(force) {
  const list = document.querySelector("#chapter-list");
  if (!list || !state.project) return;
  const numbers = chapterNumberMap(state.project.chapters);
  const wanted = state.project.chapters.map((chapter) => chapter.id).join("|");
  if (force || list.dataset.order !== wanted) {
    list.dataset.order = wanted;
    list.innerHTML = state.project.chapters
      .map(
        (chapter) => `
        <li class="chapter-item" draggable="true" data-id="${chapter.id}">
          <span class="grip" aria-hidden="true">⋮⋮</span>
          <span class="chapter-num">${numbers.get(chapter.id) || ""}</span>
          <span class="chapter-name">${escapeHtml(chapter.title || "Untitled chapter")}</span>
          <button class="chapter-del" type="button" aria-label="Delete chapter">${icon("trash")}</button>
        </li>`
      )
      .join("");
    bindChapterRows(list);
  }
  list.querySelectorAll(".chapter-item").forEach((item) => {
    const chapter = state.project.chapters.find((entry) => entry.id === item.dataset.id);
    const name = item.querySelector(".chapter-name");
    const num = item.querySelector(".chapter-num");
    if (name && !name.querySelector("input")) name.textContent = chapter?.title || "Untitled chapter";
    if (num) num.textContent = numbers.get(chapter.id) || "";
    item.classList.toggle("is-active", state.route.name === "chapter" && state.route.chapterId === item.dataset.id);
  });
}

function bindChapterRows(list) {
  let dragId = null;
  list.querySelectorAll(".chapter-item").forEach((item) => {
    item.addEventListener("click", (event) => {
      if (event.target.closest("button, input") || item.dataset.dragged) {
        delete item.dataset.dragged;
        return;
      }
      const open = () => go(`#/book/${state.project.id}/chapter/${item.dataset.id}`);
      clearTimeout(state.chapterOpenTimer);
      if (state.route.name === "dashboard") state.chapterOpenTimer = setTimeout(open, 350);
      else open();
    });
    item.querySelector(".chapter-name").addEventListener("dblclick", (event) => {
      event.stopPropagation();
      clearTimeout(state.chapterOpenTimer);
      renameChapterInline(item.dataset.id, item.querySelector(".chapter-name"));
    });
    item.querySelector(".chapter-del").addEventListener("click", () => deleteChapter(item.dataset.id));
    item.addEventListener("dragstart", (event) => {
      dragId = item.dataset.id;
      item.classList.add("is-dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", dragId);
    });
    item.addEventListener("dragend", () => {
      item.dataset.dragged = "1";
      item.classList.remove("is-dragging");
      list.querySelectorAll(".chapter-item").forEach((row) => row.classList.remove("drop-before", "drop-after"));
    });
    item.addEventListener("dragover", (event) => {
      event.preventDefault();
      const rect = item.getBoundingClientRect();
      const after = event.clientY > rect.top + rect.height / 2;
      item.classList.toggle("drop-after", after);
      item.classList.toggle("drop-before", !after);
    });
    item.addEventListener("drop", (event) => {
      event.preventDefault();
      const after = item.classList.contains("drop-after");
      reorderChapters(dragId, item.dataset.id, after);
    });
  });
}

function renameChapterInline(id, node) {
  const chapter = state.project.chapters.find((item) => item.id === id);
  if (!chapter || node.querySelector("input")) return;
  const input = document.createElement("input");
  input.value = chapter.title;
  node.textContent = "";
  node.appendChild(input);
  input.focus();
  input.select();
  const finish = (save) => {
    if (save) {
      chapter.title = input.value;
      touch(chapter);
      if (state.route.chapterId === id) document.querySelector("#chapter-title").value = chapter.title;
      updateStats();
      refreshDashboard();
    }
    node.textContent = chapter.title || "Untitled chapter";
  };
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") input.blur();
    if (event.key === "Escape") {
      input.value = chapter.title;
      input.blur();
    }
  });
  input.addEventListener("blur", () => finish(true), { once: true });
}

async function deleteChapter(id) {
  const chapter = state.project.chapters.find((item) => item.id === id);
  if (!chapter) return;
  const ok = await modal({
    title: "Delete chapter",
    text: `Remove “${chapter.title || "Untitled chapter"}” from this book?`,
    confirmLabel: "Delete",
    danger: true,
  });
  if (!ok) return;
  const index = state.project.chapters.findIndex((item) => item.id === id);
  state.project.chapters.splice(index, 1);
  touch(null);
  syncChapterList(true);
  flushSave();
  if (state.route.chapterId === id) {
    const next = state.project.chapters[index] || state.project.chapters[index - 1];
    go(next ? `#/book/${state.project.id}/chapter/${next.id}` : `#/book/${state.project.id}`);
  } else if (state.route.name === "manuscript") {
    showManuscript();
  } else if (state.route.name === "dashboard") {
    paintDashboard();
  }
  updateStats();
}

function reorderChapters(dragId, targetId, after) {
  if (!dragId || dragId === targetId) return;
  const chapters = state.project.chapters;
  const from = chapters.findIndex((chapter) => chapter.id === dragId);
  let to = chapters.findIndex((chapter) => chapter.id === targetId);
  if (from < 0 || to < 0) return;
  const [moved] = chapters.splice(from, 1);
  if (from < to) to -= 1;
  chapters.splice(after ? to + 1 : to, 0, moved);
  touch(null);
  syncChapterList(true);
  updateStats();
  if (state.route.name === "manuscript") showManuscript();
  refreshDashboard();
  flushSave();
}

function addChapter() {
  const now = new Date().toISOString();
  const chapter = {
    id: crypto.randomUUID(),
    title: `Chapter ${state.project.chapters.length + 1}`,
    content: "",
    createdAt: now,
    updatedAt: now,
  };
  state.project.chapters.push(chapter);
  touch(chapter);
  syncChapterList(true);
  flushSave();
  go(`#/book/${state.project.id}/chapter/${chapter.id}`);
}

function refreshDashboard() {
  if (state.route?.name === "dashboard") paintDashboard();
}

function countedChapters(project) {
  return project.chapters.filter((chapter) => !chapter.excludeFromStatistics);
}

function countedPages(chapters) {
  return chapters.reduce((sum, chapter) => sum + textStats(chapter.content || "").pages, 0);
}

function estimatedChapterCount(settings) {
  const { targetPages, shortestChapter, longestChapter } = settings || {};
  if (!targetPages || !shortestChapter || !longestChapter) return null;
  const average = (shortestChapter + longestChapter) / 2;
  if (!average) return null;
  return Math.max(1, Math.round(targetPages / average));
}

function infoButton(text) {
  return `<button type="button" class="info" aria-label="${escapeAttr(text)}"><svg class="info-glyph" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="4.45" r="1.05"/><rect x="7.22" y="6.45" width="1.56" height="6.15" rx="0.78"/></svg><span class="info-tip">${escapeHtml(text)}</span></button>`;
}

function meterHtml({ title, extra, ratio, detail }) {
  const shown = ratio == null ? "—" : `${ratio}%`;
  const width = ratio == null ? 0 : Math.max(0, Math.min(100, ratio));
  return `
    <article class="meter">
      <div class="meter-head">
        <h3>${title}${extra || ""}</h3>
        <strong>${shown}</strong>
      </div>
      <div class="meter-track"><div class="meter-fill" style="width:${width}%"></div></div>
      <p>${detail}</p>
    </article>
  `;
}

function progressHtml(project) {
  const settings = project.settings || blankSettings();
  const chapters = countedChapters(project);
  const pages = countedPages(chapters);
  const pageRatio = settings.targetPages ? Math.round((pages / settings.targetPages) * 100) : null;
  const estimate = estimatedChapterCount(settings);
  const chapterRatio = estimate ? Math.round((chapters.length / estimate) * 100) : null;
  const pageDetail = settings.targetPages
    ? `${formatNumber(pages)} of ${formatNumber(settings.targetPages)} pages`
    : `${formatNumber(pages)} pages · set a planned length in settings`;
  const chapterDetail = estimate
    ? `${formatNumber(chapters.length)} of ${formatNumber(estimate)} chapters`
    : `${formatNumber(chapters.length)} chapters · set a planned length and a chapter range`;
  const estimateTip =
    "Planned pages divided by the average of the shortest and longest chapter, then rounded to a whole number.";
  return `
    <section class="dash-card dash-progress">
      ${meterHtml({ title: "Manuscript", ratio: pageRatio, detail: pageDetail })}
      ${meterHtml({
        title: "Estimated chapter count",
        extra: infoButton(estimateTip),
        ratio: chapterRatio,
        detail: chapterDetail,
      })}
    </section>
  `;
}

function activityYears(project) {
  const years = new Set([new Date().getFullYear()]);
  const created = new Date(project.createdAt || "");
  if (!Number.isNaN(created.getTime())) years.add(created.getFullYear());
  for (const day of Object.keys(project.activity || {})) {
    const year = Number(String(day).slice(0, 4));
    if (year) years.add(year);
  }
  return [...years].sort((a, b) => b - a);
}

function activityHtml(project) {
  const activity = project.activity || {};
  const years = activityYears(project);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const year = years.includes(state.activityYear) ? state.activityYear : today.getFullYear();
  state.activityYear = year;
  const first = new Date(year, 0, 1);
  first.setDate(first.getDate() - ((first.getDay() + 6) % 7));
  const last = new Date(year, 11, 31);
  const weeks = [];
  for (let cursor = new Date(first); cursor <= last && weeks.length < 53; cursor.setDate(cursor.getDate() + 7)) {
    weeks.push(new Date(cursor));
  }
  while (weeks.length < 53) weeks.unshift(null);
  let labeledMonth = "";
  const columns = weeks
    .map((weekStart) => {
      const cells = [];
      let monthLabel = "";
      for (let index = 0; index < 7; index++) {
        if (!weekStart) {
          cells.push(`<i class="heat-cell is-outside"></i>`);
          continue;
        }
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + index);
        const outside = date.getFullYear() !== year;
        const future = !outside && date > today;
        const count = outside || future ? 0 : activity[localDay(date)] || 0;
        if (!outside && date.getDate() === 1 && !future) {
          const month = date.toLocaleDateString(undefined, { month: "short" });
          if (month !== labeledMonth) {
            monthLabel = month;
            labeledMonth = month;
          }
        }
        const level = outside ? "is-outside" : future ? "is-future" : count >= 100 ? "is-many" : count >= 1 ? "is-some" : "";
        const label =
          outside || future
            ? ""
            : `${date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} — ${
                count ? `${formatNumber(count)} words` : "No writing"
              }`;
        cells.push(`<i class="heat-cell ${level}"${label ? ` title="${escapeAttr(label)}"` : ""}></i>`);
      }
      return `<div class="heat-col"><span class="heat-month">${escapeHtml(monthLabel)}</span>${cells.join("")}</div>`;
    })
    .join("");
  const options = years.map((value) => `<option value="${value}"${value === year ? " selected" : ""}>${value}</option>`).join("");
  return `
    <section class="dash-card dash-activity">
      <div class="activity-head">
        <h2>Activity</h2>
        <select class="year-select" id="activity-year" aria-label="Activity year">${options}</select>
      </div>
      <div class="heat-frame">
        <div class="heat-days" aria-hidden="true"><span></span><span>Mon</span><span></span><span>Wed</span><span></span><span>Fri</span><span></span><span></span></div>
        <div class="heat-scroll">
          <div class="heat-grid">${columns}</div>
        </div>
      </div>
      <div class="heat-legend"><span>Less</span><i class="heat-cell"></i><i class="heat-cell is-some"></i><i class="heat-cell is-many"></i><span>More</span></div>
    </section>
  `;
}

function bindActivityScroll() {
  const scroller = document.querySelector(".heat-scroll");
  if (!scroller) return;
  let pinning = false;
  const pinToEnd = () => {
    pinning = true;
    scroller.scrollLeft = scroller.scrollWidth;
    pinning = false;
  };
  if (state.activityPinned !== false) pinToEnd();
  else if (state.activityScroll != null) scroller.scrollLeft = state.activityScroll;
  const observer = new ResizeObserver(() => {
    if (!scroller.isConnected) {
      observer.disconnect();
      return;
    }
    if (state.activityPinned !== false) pinToEnd();
  });
  observer.observe(scroller);
  scroller.addEventListener("scroll", () => {
    if (pinning) return;
    const max = scroller.scrollWidth - scroller.clientWidth;
    state.activityPinned = scroller.scrollLeft >= max - 2;
    state.activityScroll = scroller.scrollLeft;
  });
}

function axisScale(value) {
  const padded = Math.max(1, Math.ceil(value * 1.15));
  const rough = Math.max(padded / 4, 1);
  const power = 10 ** Math.floor(Math.log10(rough));
  const fraction = rough / power;
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  const step = nice * power;
  return { max: Math.ceil(padded / step) * step, step };
}

function chapterBars(points, slot) {
  const plateau = slot * 0.62;
  const round = (number) => Math.round(number * 10) / 10;
  let path = "";
  points.forEach((point, index) => {
    const start = point.x - plateau / 2;
    const end = point.x + plateau / 2;
    if (!index) path += `M ${round(start)} ${round(point.y)}`;
    else {
      const previous = points[index - 1];
      const from = previous.x + plateau / 2;
      const gap = start - from;
      path += ` C ${round(from + gap / 2)} ${round(previous.y)}, ${round(start - gap / 2)} ${round(point.y)}, ${round(start)} ${round(point.y)}`;
    }
    path += ` L ${round(end)} ${round(point.y)}`;
  });
  return path;
}

function lengthChartHtml(project) {
  const settings = project.settings || blankSettings();
  const numbers = chapterNumberMap(project.chapters);
  const chapters = countedChapters(project).map((chapter) => ({
    id: chapter.id,
    title: chapter.title || "Untitled chapter",
    number: numbers.get(chapter.id) || "",
    pages: textStats(chapter.content || "").pages,
  }));
  if (!chapters.length) {
    const hidden = project.chapters.length > 0;
    return `
      <section class="dash-card dash-length">
        <h2>Chapter length</h2>
        <p class="chart-note">${hidden ? "Every chapter is excluded from statistics." : "No chapters yet."}</p>
      </section>
    `;
  }
  const width = 960;
  const height = 360;
  const left = 52;
  const right = 18;
  const top = 16;
  const bottom = 92;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const peak = Math.max(...chapters.map((chapter) => chapter.pages), settings.longestChapter || 0, 1);
  const scale = axisScale(peak);
  const yMax = scale.max;
  const yOf = (pages) => top + (1 - pages / yMax) * plotHeight;
  const baseline = yOf(0);
  const slot = plotWidth / chapters.length;
  const points = chapters.map((chapter, index) => ({
    x: left + slot * index + slot / 2,
    y: yOf(chapter.pages),
    id: chapter.id,
    title: chapter.title,
    number: chapter.number,
    pages: chapter.pages,
  }));
  const line = chapterBars(points, slot);
  const areaStart = Math.round((points[0].x - slot * 0.31) * 10) / 10;
  const areaEnd = Math.round((points[points.length - 1].x + slot * 0.31) * 10) / 10;
  const area = `${line} L ${areaEnd} ${Math.round(baseline * 10) / 10} L ${areaStart} ${Math.round(baseline * 10) / 10} Z`;
  const ticks = [];
  for (let value = 0; value <= yMax + 0.001; value += scale.step) ticks.push(value);
  const grid = points
    .map(
      (point) =>
        `<line x1="${point.x}" y1="${top}" x2="${point.x}" y2="${baseline}" stroke="#eadfd2" stroke-width="1"/>`
    )
    .join("");
  const tickMarks = ticks
    .map((value) => {
      const y = yOf(value);
      return `<text x="${left - 10}" y="${y + 4}" text-anchor="end" fill="#8b8276" font-size="12">${formatNumber(value)}</text>`;
    })
    .join("");
  const labels = points
    .map((point) => {
      const prefix = point.number ? `${point.number} ` : "";
      const room = Math.max(8, 24 - prefix.length);
      const title = point.title.length > room ? `${point.title.slice(0, room - 1)}…` : point.title;
      const label = prefix + title;
      const full = `${prefix}${point.title}`;
      const textWidth = Math.max(44, label.length * 6.6);
      const anchorY = baseline + 14;
      return `<a class="chapter-tick" href="#/book/${project.id}/chapter/${point.id}" aria-label="${escapeAttr(full)}">
        <title>${escapeHtml(full)}</title>
        <g transform="rotate(-40 ${point.x} ${anchorY})">
          <rect x="${point.x - textWidth}" y="${anchorY - 13}" width="${textWidth + 6}" height="20" fill="transparent"/>
          <text x="${point.x}" y="${anchorY}" font-size="12" text-anchor="end">${escapeHtml(label)}</text>
        </g>
      </a>`;
    })
    .join("");
  const pageLabels = points
    .map((point) => {
      const y = Math.max(top + 12, point.y - 10);
      return `<text class="page-count" x="${point.x}" y="${Math.round(y * 10) / 10}" text-anchor="middle">${formatNumber(point.pages)}</text>`;
    })
    .join("");
  const hits = points
    .map(
      (point) =>
        `<rect x="${point.x - slot / 2}" y="${top}" width="${slot}" height="${plotHeight}" fill="transparent"><title>${escapeHtml(`${point.title} · ${formatNumber(point.pages)} ${point.pages === 1 ? "page" : "pages"}`)}</title></rect>`
    )
    .join("");
  const hasRange = settings.shortestChapter && settings.longestChapter;
  const band = hasRange
    ? `<rect x="${left}" y="${yOf(settings.longestChapter)}" width="${plotWidth}" height="${Math.max(0, yOf(settings.shortestChapter) - yOf(settings.longestChapter))}" fill="rgba(30,61,54,0.08)"/>
       <line x1="${left}" y1="${yOf(settings.longestChapter)}" x2="${left + plotWidth}" y2="${yOf(settings.longestChapter)}" stroke="rgba(30,61,54,0.4)" stroke-dasharray="4 4"/>
       <line x1="${left}" y1="${yOf(settings.shortestChapter)}" x2="${left + plotWidth}" y2="${yOf(settings.shortestChapter)}" stroke="rgba(30,61,54,0.4)" stroke-dasharray="4 4"/>`
    : "";
  return `
    <section class="dash-card dash-length">
      <h2>Chapter length</h2>
      <svg class="length-chart" viewBox="0 0 ${width} ${height}" role="group" aria-label="Pages in each chapter">
        ${grid}
        ${band}
        <path d="${area}" fill="rgba(176,156,136,0.42)"/>
        <path d="${line}" fill="none" stroke="#8a7563" stroke-width="2.25" stroke-linejoin="round" stroke-linecap="round"/>
        ${pageLabels}
        ${tickMarks}
        <text x="16" y="${top + plotHeight / 2}" fill="#8b8276" font-size="12" text-anchor="middle" transform="rotate(-90 16 ${top + plotHeight / 2})">Pages</text>
        ${labels}
        ${hits}
      </svg>
      <div class="chart-legend">
        <span><i class="swatch swatch-curve"></i> Pages</span>
        ${hasRange ? `<span><i class="swatch swatch-band"></i> Shortest to longest</span>` : `<span>Set a shortest and longest chapter to mark the target range.</span>`}
      </div>
    </section>
  `;
}

function openSettings() {
  const project = state.project;
  if (!project) return;
  const settings = normalizeSettings(project.settings);
  const wrap = document.createElement("div");
  wrap.className = "backdrop";
  wrap.innerHTML = `
    <form class="dialog settings-dialog">
      <h2>Settings</h2>
      <label class="set-label" for="genre-input">Genre tags</label>
      <div class="tag-box" id="genre-box">
        <input id="genre-input" type="text" placeholder="Add a genre and press Enter" maxlength="40" />
      </div>
      <label class="set-label" for="target-pages">Planned length</label>
      <div class="set-inline">
        <input id="target-pages" type="number" min="1" step="1" inputmode="numeric" placeholder="300" value="${settings.targetPages ?? ""}" />
        <span>pages</span>
      </div>
      <label class="set-label">Chapter length</label>
      <div class="set-grid">
        <label class="set-inline">Shortest
          <input id="shortest-chapter" type="number" min="1" step="1" inputmode="numeric" value="${settings.shortestChapter ?? ""}" />
          <span>pages</span>
        </label>
        <label class="set-inline">Longest
          <input id="longest-chapter" type="number" min="1" step="1" inputmode="numeric" value="${settings.longestChapter ?? ""}" />
          <span>pages</span>
        </label>
      </div>
      <div class="dialog-actions">
        <button type="button" class="ghost" data-cancel>Cancel</button>
        <button type="submit" class="primary">Save</button>
      </div>
    </form>
  `;
  const genres = [...settings.genres];
  const box = wrap.querySelector("#genre-box");
  const input = wrap.querySelector("#genre-input");
  const paintTags = () => {
    box.querySelectorAll(".tag-chip").forEach((chip) => chip.remove());
    for (const genre of genres) {
      const chip = document.createElement("span");
      chip.className = "tag-chip";
      chip.innerHTML = `${escapeHtml(genre)}<button type="button" aria-label="Remove ${escapeAttr(genre)}">×</button>`;
      chip.querySelector("button").addEventListener("click", () => {
        const index = genres.indexOf(genre);
        if (index >= 0) genres.splice(index, 1);
        paintTags();
      });
      box.insertBefore(chip, input);
    }
  };
  const addGenres = (raw) => {
    for (const part of String(raw || "").split(",")) {
      const text = part.replace(/\s+/g, " ").trim().slice(0, 40);
      if (!text || genres.some((genre) => genre.toLowerCase() === text.toLowerCase())) continue;
      if (genres.length >= 12) break;
      genres.push(text);
    }
    paintTags();
  };
  paintTags();
  input.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== ",") return;
    event.preventDefault();
    addGenres(input.value);
    input.value = "";
  });
  const close = () => wrap.remove();
  wrap.addEventListener("click", (event) => {
    if (event.target === wrap) close();
  });
  wrap.querySelector("[data-cancel]").addEventListener("click", close);
  wrap.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });
  wrap.querySelector("form").addEventListener("submit", (event) => {
    event.preventDefault();
    addGenres(input.value);
    const number = (id) => {
      const value = wrap.querySelector(id).value.trim();
      return value ? Number(value) : null;
    };
    project.settings = normalizeSettings({
      genres,
      targetPages: number("#target-pages"),
      shortestChapter: number("#shortest-chapter"),
      longestChapter: number("#longest-chapter"),
    });
    touch(null);
    flushSave();
    close();
    paintDashboard();
  });
  document.body.appendChild(wrap);
  input.focus();
}

function paintDashboard() {
  const project = state.project;
  const root = document.querySelector("#dashboard");
  if (!root || !project) return;
  const letter = (project.title || "B").trim().charAt(0).toUpperCase() || "B";
  const cover = project.coverUrl
    ? `<img src="${escapeAttr(project.coverUrl)}" alt="" />`
    : `<div class="cover-fallback" style="${coverStyle(project.id)}">${escapeHtml(letter)}</div>`;
  const genres = (project.settings?.genres || [])
    .map((genre) => `<span class="genre-chip">${escapeHtml(genre)}</span>`)
    .join("");
  root.innerHTML = `
    <div class="dash-board">
    <div class="dash-hero">
      <div class="dash-cover">
        ${cover}
        <div class="cover-actions">
          <label class="chip">Cover<input id="dash-cover" type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden /></label>
        </div>
      </div>
      <div class="dash-intro">
        <div class="dash-heading">
          <input class="dash-title" id="dash-title" aria-label="Book title" value="${escapeAttr(project.title)}" placeholder="Untitled book" />
          <button class="settings-btn" id="open-settings" type="button">${icon("settings")} Settings</button>
        </div>
        ${genres ? `<div class="genre-row">${genres}</div>` : ""}
      </div>
    </div>
    <div class="dash-stack">
      ${progressHtml(project)}
      ${activityHtml(project)}
      ${lengthChartHtml(project)}
    </div>
    </div>
  `;
  document.querySelector("#side-book").textContent = project.title || "Untitled book";
  document.querySelector("#dash-title").addEventListener("input", (event) => {
    project.title = event.target.value;
    touch(null);
    document.querySelector("#side-book").textContent = project.title || "Untitled book";
  });
  document.querySelector("#dash-cover").addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (file) uploadCover(project.id, file);
  });
  document.querySelector("#open-settings").addEventListener("click", openSettings);
  document.querySelector("#activity-year")?.addEventListener("change", (event) => {
    state.activityYear = Number(event.target.value);
    state.activityPinned = true;
    state.activityScroll = null;
    paintDashboard();
  });
  bindActivityScroll();
}

async function onRoute() {
  state.route = parseRoute();
  ensureFooter();
  if (state.route.name === "imprint" || state.route.name === "privacy") {
    if (state.dirty) await flushSave();
    renderLegal(state.route.name);
    return;
  }
  if (state.route.name === "home") {
    if (state.dirty) await flushSave();
    await renderHome();
    return;
  }
  await openProject(state.route.bookId);
}

function ensureFooter() {
  let foot = document.querySelector(".site-foot");
  if (!foot) {
    foot = document.createElement("footer");
    foot.className = "site-foot";
    foot.innerHTML = `<a href="#/imprint">Impressum</a><a href="#/privacy">Datenschutz</a>`;
    document.body.appendChild(foot);
  }
  foot.querySelectorAll("a").forEach((link) => {
    link.classList.toggle("is-current", link.getAttribute("href") === location.hash);
  });
}

function renderLegal(name) {
  state.editor?.destroy();
  state.editor = null;
  app.innerHTML = name === "imprint" ? imprintPage() : privacyPage(state.privacyLang);
  app.querySelectorAll("[data-lang]").forEach((button) => {
    button.addEventListener("click", () => {
      state.privacyLang = button.dataset.lang;
      renderLegal("privacy");
    });
  });
}

window.addEventListener("hashchange", onRoute);
window.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
    event.preventDefault();
    flushSave();
  }
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") flushSave();
});
window.addEventListener("beforeunload", () => {
  if (!state.dirty || !state.project) return;
  recordWritingActivity();
  flushSave();
});
setInterval(() => {
  if (state.dirty) flushSave();
}, 5000);
setInterval(() => {
  document.querySelectorAll("[data-time]").forEach((node) => {
    node.textContent = editedLabel(node.dataset.time);
  });
  if (state.project && state.route.name !== "home") updateStats();
}, 30000);

function pickJsonFile() {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    let settled = false;
    const finish = (file) => {
      if (settled) return;
      settled = true;
      resolve(file);
    };
    input.addEventListener("change", () => finish(input.files?.[0] || null));
    input.addEventListener("cancel", () => finish(null));
    input.click();
  });
}

async function exportBooks() {
  api.requestPersistence();
  if (state.dirty) await flushSave();
  const archive = await api.exportArchive();
  const blob = new Blob([JSON.stringify(archive, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `book-assistant-${localDay()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

async function importBooks() {
  const ok = await modal({
    title: "Import books",
    text: "Are you sure you want to import existing data? This will override the currently existing data on ALL books and their texts and options. This is only meant as an option if you lost your progress or need to recover your work from a previously exported file.",
    confirmLabel: "Choose file",
    danger: true,
  });
  if (!ok) return;
  const file = await pickJsonFile();
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    await api.importArchive(data);
  } catch (error) {
    await modal({
      title: "Could not import",
      text: error.message || "That file could not be read.",
      confirmLabel: "OK",
      dismissOnly: true,
    });
    return;
  }
  state.dirty = false;
  state.project = null;
  state.editor?.destroy();
  state.editor = null;
  if (location.hash === "#/" || location.hash === "") await renderHome();
  else go("#/");
}

async function boot() {
  await api.requestPersistence();
  await api.migrateFromServer();
  const settings = await api.getSettings();
  state.collapsed = settings.collapsed;
  if (!location.hash) location.hash = "#/";
  await onRoute();
  if (!settings.seenStorageNotice) {
    await modal({
      title: "Your books stay in this browser",
      text: "This site stores the project data right in your browser on a regular basis. Deleting your browser data will delete your project data. If you want to delete your browser data, export your project using the export button in the bottom left and import it again once you have your data cleared. Importing data will also override anything you are currently seeing.",
      confirmLabel: "OK",
      dismissOnly: true,
    });
    await api.requestPersistence();
    await api.saveSettings({ seenStorageNotice: true });
  }
}

syncMetrics();
document.fonts?.ready.then(() => syncMetrics());
boot();
