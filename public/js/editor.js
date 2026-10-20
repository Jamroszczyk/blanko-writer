import {
  LINES_PER_PAGE,
  applyPageEdit,
  displayCaretFromSource,
  pageIsFull,
  paginate,
} from "./layout.js";

export function syncMetrics() {
  const probe = document.createElement("span");
  probe.style.cssText =
    'position:fixed;left:-9999px;top:0;white-space:pre;font:15px/28px "Noto Sans Mono","Cascadia Mono",Consolas,monospace;font-variant-ligatures:none;';
  probe.textContent = "0".repeat(60);
  document.body.appendChild(probe);
  const measured = probe.getBoundingClientRect().width;
  probe.remove();
  if (measured > 20) {
    document.documentElement.style.setProperty("--page-text-width", `${Math.ceil(measured) + 2}px`);
    document.documentElement.style.setProperty("--chars-em", (measured / 15).toFixed(4));
  }
}

function normalize(src) {
  return String(src || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\t/g, " ");
}

function lineCol(value, caret) {
  const before = value.slice(0, caret);
  const parts = before.split("\n");
  return { line: parts.length - 1, col: parts[parts.length - 1].length };
}

function caretFromLineCol(value, line, col) {
  const lines = value.split("\n");
  const index = Math.max(0, Math.min(line, lines.length - 1));
  const clamped = Math.max(0, Math.min(col, lines[index].length));
  let pos = 0;
  for (let i = 0; i < index; i += 1) pos += lines[i].length + 1;
  return pos + clamped;
}

export class NormEditor {
  constructor(desk, thumbs) {
    this.desk = desk;
    this.thumbs = thumbs;
    this.sheets = [];
    this.source = "";
    this.readOnly = false;
    this.mode = "chapter";
    this.active = 0;
    this.lock = false;
    this.composing = false;
    this.menu = null;
    this.onChange = null;
    this.onActivePage = null;
    this.onEditChapter = null;
    this.observer = new IntersectionObserver((entries) => this.onIntersect(entries), {
      root: this.desk,
      threshold: [0.4, 0.6, 0.8],
    });
    this.onPointer = (event) => {
      if (this.menu && !this.menu.contains(event.target)) this.closeMenu();
    };
    document.addEventListener("pointerdown", this.onPointer);
  }

  setChapter(text) {
    this.mode = "chapter";
    this.readOnly = false;
    this.source = normalize(text);
    this.renderModels(this.chapterModels(this.source), { silent: true, focus: false });
    this.desk.scrollTop = 0;
  }

  setManuscript(chapters) {
    this.mode = "manuscript";
    this.readOnly = true;
    this.source = "";
    const models = [];
    let pageNumber = 1;
    let numbered = 0;
    chapters.forEach((chapter, chapterIndex) => {
      const chapterNumber = chapter.excludeFromNumbering ? null : ++numbered;
      const pages = paginate(chapter.content || "");
      pages.forEach((page, chapterPage) => {
        models.push({
          ...page,
          synthetic: false,
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          chapterIndex,
          chapterNumber,
          chapterPage,
          isStart: chapterPage === 0,
          pageNumber,
        });
        pageNumber += 1;
      });
    });
    if (!models.length) {
      this.clearSheets();
      this.desk.innerHTML = `<div class="empty-read">No chapters yet. Add one from the sidebar to start the manuscript.</div>`;
      this.onActivePage?.({ current: 0, total: 0 });
      return;
    }
    this.renderModels(models, { silent: true, focus: false });
    this.desk.scrollTop = 0;
  }

  chapterModels(source) {
    const pages = paginate(source);
    const models = pages.map((page, index) => ({
      ...page,
      synthetic: false,
      chapterPage: index,
      isStart: false,
      pageNumber: index + 1,
    }));
    if (pageIsFull(pages[pages.length - 1])) {
      const end = source.length;
      models.push({
        lines: [{ start: end, end, text: "", hard: false }],
        sourceStart: end,
        sourceEnd: end,
        text: "",
        display: "",
        synthetic: true,
        chapterPage: models.length,
        isStart: false,
        pageNumber: models.length + 1,
      });
    }
    return models;
  }

  renderModels(models, { silent = false, caret = null, bias = "right", focus = false } = {}) {
    this.closeMenu();
    this.desk.querySelector(".empty-read")?.remove();
    while (this.sheets.length < models.length) this.sheets.push(this.createSheet());
    while (this.sheets.length > models.length) {
      const sheet = this.sheets.pop();
      this.observer.unobserve(sheet.el);
      sheet.el.remove();
      sheet.thumb.remove();
    }

    models.forEach((model, index) => {
      const sheet = this.sheets[index];
      sheet.model = model;
      sheet.el.dataset.index = String(index);
      sheet.el.classList.toggle("is-start", Boolean(model.isStart));
      const kicker = sheet.el.querySelector(".sheet-kicker");
      if (this.mode === "manuscript" && model.isStart) {
        kicker.hidden = false;
        const label = kicker.querySelector(".kicker-label");
        label.hidden = !model.chapterNumber;
        label.textContent = model.chapterNumber ? `Chapter ${model.chapterNumber}` : "";
        kicker.querySelector(".kicker-title").textContent = model.chapterTitle || "Untitled chapter";
      } else {
        kicker.hidden = true;
      }
      sheet.el.querySelector(".sheet-num").textContent = String(model.pageNumber);
      const textarea = sheet.ta;
      textarea.readOnly = this.readOnly;
      if (textarea.value !== model.display) textarea.value = model.display;
      this.fillThumb(sheet);
    });

    if (caret != null) this.placeCaret(caret, bias, focus);
    else this.updateActive(Math.min(this.active, models.length - 1), { scrollThumb: false });
    if (!silent && this.mode === "chapter") this.onChange?.(this.source);
    this.emitPages();
  }

  createSheet() {
    const el = document.createElement("article");
    el.className = "sheet";
    el.innerHTML = `
      <div class="sheet-kicker" hidden>
        <span class="kicker-label"></span>
        <span class="kicker-title"></span>
      </div>
      <div class="sheet-body">
        <div class="gutter" aria-hidden="true">${Array.from({ length: LINES_PER_PAGE }, (_, i) => `<span>${i + 1}</span>`).join("")}</div>
        <textarea class="page-text" wrap="off" spellcheck="true" autocomplete="off" aria-label="Page text"></textarea>
      </div>
      <footer class="sheet-foot"><span class="sheet-num"></span></footer>
    `;
    const thumb = document.createElement("div");
    thumb.className = "thumb";
    thumb.innerHTML = `
      <div class="thumb-sheet">
        <div class="thumb-kicker" hidden></div>
        <div class="thumb-fit">
          <pre class="thumb-text"></pre>
        </div>
      </div>
      <div class="thumb-foot">
        <span class="thumb-num"></span>
        <button type="button" class="thumb-more" hidden aria-label="Page actions">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="18" cy="12" r="1.2"/></svg>
        </button>
      </div>
    `;
    const sheet = { el, thumb, ta: el.querySelector("textarea"), model: null };
    sheet.ta.addEventListener("compositionstart", () => {
      this.composing = true;
    });
    sheet.ta.addEventListener("compositionend", () => {
      this.composing = false;
      this.handleInput(sheet);
    });
    sheet.ta.addEventListener("input", () => {
      if (!this.composing) this.handleInput(sheet);
    });
    sheet.ta.addEventListener("keydown", (event) => this.onKeyDown(event, sheet));
    sheet.ta.addEventListener("focus", () => {
      const index = this.sheets.indexOf(sheet);
      if (index >= 0) this.updateActive(index, { scrollThumb: true });
    });
    thumb.addEventListener("click", (event) => {
      if (event.target.closest(".thumb-more")) return;
      this.scrollToIndex(this.sheets.indexOf(sheet), { focus: !this.readOnly });
    });
    thumb.querySelector(".thumb-more").addEventListener("click", (event) => {
      event.stopPropagation();
      this.openMenu(sheet, event.currentTarget);
    });
    this.desk.appendChild(el);
    this.thumbs.appendChild(thumb);
    this.observer.observe(el);
    return sheet;
  }

  fillThumb(sheet) {
    const model = sheet.model;
    const kicker = sheet.thumb.querySelector(".thumb-kicker");
    if (this.mode === "manuscript" && model.isStart) {
      kicker.hidden = false;
      kicker.textContent = model.chapterTitle || "Untitled chapter";
    } else {
      kicker.hidden = true;
      kicker.textContent = "";
    }
    sheet.thumb.querySelector(".thumb-text").textContent = model.display || "";
    sheet.thumb.querySelector(".thumb-num").textContent = String(model.pageNumber);
    const more = sheet.thumb.querySelector(".thumb-more");
    more.hidden = this.mode !== "manuscript";
  }

  handleInput(sheet) {
    if (this.lock || this.readOnly || !sheet.model) return;
    const nextDisplay = sheet.ta.value;
    if (nextDisplay === sheet.model.display) return;
    const edited = applyPageEdit(sheet.model.lines, sheet.model.display, nextDisplay, sheet.ta.selectionStart);
    if (!edited) {
      sheet.ta.value = sheet.model.display;
      return;
    }
    const next =
      this.source.slice(0, sheet.model.sourceStart) + edited.source + this.source.slice(sheet.model.sourceEnd);
    const caret = sheet.model.sourceStart + edited.caret;
    this.commit(next, caret, edited.bias);
  }

  commit(next, caret, bias) {
    this.lock = true;
    try {
      this.source = normalize(next);
      this.renderModels(this.chapterModels(this.source), { silent: false, caret, bias, focus: true });
    } finally {
      this.lock = false;
    }
  }

  placeCaret(caret, bias, focus) {
    const models = this.sheets.map((sheet) => sheet.model);
    const index = this.locate(models, caret, bias);
    const sheet = this.sheets[index];
    if (!sheet) return;
    const displayCaret = sheet.model.synthetic
      ? 0
      : displayCaretFromSource(sheet.model.lines, caret, bias);
    const pageChanged = index !== this.active;
    this.updateActive(index, { scrollThumb: true, scrollDesk: pageChanged });
    if (!focus) return;
    const apply = () => {
      if (sheet.ta.value !== sheet.model.display) sheet.ta.value = sheet.model.display;
      sheet.ta.focus();
      const pos = Math.max(0, Math.min(displayCaret, sheet.ta.value.length));
      sheet.ta.setSelectionRange(pos, pos);
    };
    apply();
    queueMicrotask(apply);
  }

  locate(models, offset, bias) {
    for (let index = 0; index < models.length; index += 1) {
      const page = models[index];
      const next = models[index + 1];
      if (page.synthetic) return index;
      if (offset < page.sourceEnd || !next) {
        if (offset === page.sourceEnd && page.synthetic === false && next?.synthetic && bias === "right") return index + 1;
        return index;
      }
      if (offset === page.sourceEnd && next && next.sourceStart === offset) {
        return bias === "left" ? index : index + 1;
      }
    }
    return Math.max(0, models.length - 1);
  }

  onKeyDown(event, sheet) {
    const textarea = sheet.ta;
    const collapsed = textarea.selectionStart === textarea.selectionEnd;
    const index = this.sheets.indexOf(sheet);
    if (event.key === "Backspace" && !this.readOnly && collapsed && textarea.selectionStart === 0 && sheet.model.sourceStart > 0) {
      event.preventDefault();
      const at = sheet.model.sourceStart;
      this.commit(this.source.slice(0, at - 1) + this.source.slice(at), at - 1, "left");
      return;
    }
    if (
      event.key === "Delete" &&
      !this.readOnly &&
      collapsed &&
      textarea.selectionStart === textarea.value.length &&
      sheet.model.sourceEnd < this.source.length
    ) {
      event.preventDefault();
      const at = sheet.model.sourceEnd;
      this.commit(this.source.slice(0, at) + this.source.slice(at + 1), at, "right");
      return;
    }
    if (!collapsed || event.shiftKey || event.altKey || event.metaKey || event.ctrlKey) return;

    if (event.key === "ArrowLeft" && textarea.selectionStart === 0 && index > 0) {
      event.preventDefault();
      this.moveTo(index - 1, this.sheets[index - 1].ta.value.length);
      return;
    }
    if (event.key === "ArrowRight" && textarea.selectionStart === textarea.value.length && index < this.sheets.length - 1) {
      event.preventDefault();
      this.moveTo(index + 1, 0);
      return;
    }
    const { line, col } = lineCol(textarea.value, textarea.selectionStart);
    const lastLine = textarea.value.split("\n").length - 1;
    if (event.key === "ArrowUp" && line === 0 && index > 0) {
      event.preventDefault();
      const previous = this.sheets[index - 1].ta.value;
      const prevLast = previous.split("\n").length - 1;
      this.moveTo(index - 1, caretFromLineCol(previous, prevLast, col));
    } else if (event.key === "ArrowDown" && line === lastLine && index < this.sheets.length - 1) {
      event.preventDefault();
      const next = this.sheets[index + 1].ta.value;
      this.moveTo(index + 1, caretFromLineCol(next, 0, col));
    }
  }

  moveTo(index, displayCaret) {
    const sheet = this.sheets[index];
    if (!sheet) return;
    this.scrollToIndex(index, { focus: true });
    const pos = Math.max(0, Math.min(displayCaret, sheet.ta.value.length));
    sheet.ta.setSelectionRange(pos, pos);
  }

  scrollToPage(pageIndex) {
    const index = this.sheets.findIndex((sheet) => sheet.model.chapterPage === pageIndex && !sheet.model.synthetic);
    this.scrollToIndex(index < 0 ? 0 : index, { focus: !this.readOnly });
  }

  scrollToIndex(index, { focus = false } = {}) {
    const sheet = this.sheets[index];
    if (!sheet) return;
    const desk = this.desk.getBoundingClientRect();
    const rect = sheet.el.getBoundingClientRect();
    this.desk.scrollTo({
      top: this.desk.scrollTop + (rect.top - desk.top) - 18,
      behavior: "smooth",
    });
    this.updateActive(index, { scrollThumb: true });
    if (focus) {
      sheet.ta.focus();
    }
  }

  updateActive(index, { scrollThumb = false, scrollDesk = false } = {}) {
    if (!this.sheets.length) return;
    const next = Math.max(0, Math.min(index, this.sheets.length - 1));
    this.active = next;
    this.sheets.forEach((sheet, sheetIndex) => {
      sheet.el.classList.toggle("is-active", sheetIndex === next);
      sheet.thumb.classList.toggle("is-active", sheetIndex === next);
    });
    if (scrollDesk) {
      const sheet = this.sheets[next];
      const desk = this.desk.getBoundingClientRect();
      const rect = sheet.el.getBoundingClientRect();
      const outOfView = rect.bottom < desk.top + 48 || rect.top > desk.bottom - 48;
      if (outOfView) {
        this.desk.scrollTo({
          top: this.desk.scrollTop + (rect.top - desk.top) - 18,
          behavior: "smooth",
        });
      }
    }
    if (scrollThumb) {
      const thumb = this.sheets[next].thumb;
      const parent = this.thumbs;
      const parentRect = parent.getBoundingClientRect();
      const rect = thumb.getBoundingClientRect();
      if (rect.top < parentRect.top || rect.bottom > parentRect.bottom) {
        parent.scrollTo({
          top: parent.scrollTop + (rect.top - parentRect.top) - 12,
          behavior: "smooth",
        });
      }
    }
    this.emitPages();
  }

  emitPages() {
    const total = this.sheets.length;
    this.onActivePage?.({
      current: total ? this.active + 1 : 0,
      total,
      pageNumber: total ? this.sheets[this.active].model.pageNumber : 0,
    });
  }

  onIntersect(entries) {
    const focused = this.sheets.find((sheet) => sheet.ta === document.activeElement);
    if (focused) {
      const rect = focused.el.getBoundingClientRect();
      const desk = this.desk.getBoundingClientRect();
      if (rect.bottom > desk.top + 48 && rect.top < desk.bottom - 48) return;
    }
    let best = null;
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      if (!best || entry.intersectionRatio > best.intersectionRatio) best = entry;
    }
    if (!best) return;
    const index = Number(best.target.dataset.index);
    if (Number.isFinite(index) && index !== this.active) this.updateActive(index, { scrollThumb: true });
  }

  openMenu(sheet, anchor) {
    this.closeMenu();
    const menu = document.createElement("div");
    menu.className = "menu";
    menu.innerHTML = `<button type="button">Edit in chapter</button>`;
    document.body.appendChild(menu);
    const rect = anchor.getBoundingClientRect();
    menu.style.top = `${rect.bottom + 6}px`;
    menu.style.left = `${Math.min(rect.right - 168, window.innerWidth - 180)}px`;
    menu.querySelector("button").addEventListener("click", () => {
      this.onEditChapter?.({
        chapterId: sheet.model.chapterId,
        chapterPage: sheet.model.chapterPage,
      });
      this.closeMenu();
    });
    this.menu = menu;
  }

  closeMenu() {
    this.menu?.remove();
    this.menu = null;
  }

  clearSheets() {
    this.observer.disconnect();
    this.sheets.forEach((sheet) => {
      sheet.el.remove();
      sheet.thumb.remove();
    });
    this.sheets = [];
    this.observer = new IntersectionObserver((entries) => this.onIntersect(entries), {
      root: this.desk,
      threshold: [0.4, 0.6, 0.8],
    });
  }

  visiblePageCount() {
    return this.sheets.length;
  }

  destroy() {
    this.closeMenu();
    document.removeEventListener("pointerdown", this.onPointer);
    this.observer.disconnect();
    this.sheets = [];
  }
}
