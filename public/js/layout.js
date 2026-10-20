export const CHARS_PER_LINE = 60;
export const LINES_PER_PAGE = 30;

function pushLine(lines, src, start, end, hard) {
  const raw = src.slice(start, end);
  const text = hard ? raw.replace(/\n$/, "") : raw;
  lines.push({ start, end, text, hard });
}

export function toVisualLines(src) {
  const lines = [];
  let i = 0;
  while (i < src.length) {
    if (src[i] === "\n") {
      pushLine(lines, src, i, i + 1, true);
      i += 1;
      continue;
    }

    let j = i;
    let lastSpace = -1;
    while (j < src.length && src[j] !== "\n" && j - i < CHARS_PER_LINE) {
      if (src[j] === " " && j > i) lastSpace = j;
      j += 1;
    }

    const hitsLimit = j - i === CHARS_PER_LINE;
    const moreText = j < src.length && src[j] !== "\n";
    if (hitsLimit && moreText) {
      if (lastSpace > i) {
        const end = lastSpace + 1;
        pushLine(lines, src, i, end, false);
        i = end;
        continue;
      }
      const end = i + CHARS_PER_LINE;
      pushLine(lines, src, i, end, false);
      i = end;
      continue;
    }

    if (j < src.length && src[j] === "\n") {
      pushLine(lines, src, i, j + 1, true);
      i = j + 1;
      continue;
    }

    pushLine(lines, src, i, j, false);
    i = j;
  }

  if (lines.length === 0 || src.endsWith("\n")) {
    lines.push({ start: src.length, end: src.length, text: "", hard: false });
  }
  return lines;
}

export function reconstruct(lines) {
  let out = "";
  for (const line of lines) {
    out += line.text;
    if (line.hard) out += "\n";
  }
  return out;
}

export function paginate(src) {
  const text = src || "";
  const lines = toVisualLines(text);
  const pages = [];
  for (let index = 0; index < lines.length; index += LINES_PER_PAGE) {
    const chunk = lines.slice(index, index + LINES_PER_PAGE);
    const sourceStart = chunk[0].start;
    const sourceEnd = chunk[chunk.length - 1].end;
    const sourceText = text.slice(sourceStart, sourceEnd);
    pages.push({
      lines: chunk,
      sourceStart,
      sourceEnd,
      text: sourceText,
      display: chunk.map((line) => line.text).join("\n"),
    });
  }
  if (!pages.length) {
    pages.push({
      lines: [{ start: 0, end: 0, text: "", hard: false }],
      sourceStart: 0,
      sourceEnd: 0,
      text: "",
      display: "",
    });
  }
  return pages;
}

export function pageIsFull(page) {
  if (!page || page.lines.length < LINES_PER_PAGE) return false;
  return page.lines[LINES_PER_PAGE - 1].text.length >= CHARS_PER_LINE;
}

export function countWords(src) {
  const match = String(src || "")
    .trim()
    .match(/\S+/g);
  return match ? match.length : 0;
}

export function countChars(src) {
  return String(src || "").length;
}

export function textStats(src) {
  const text = src || "";
  return {
    pages: paginate(text).length,
    words: countWords(text),
    chars: text.length,
  };
}

export function displayCaretMap(lines) {
  const map = [0];
  let source = 0;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    for (let k = 0; k < line.text.length; k += 1) {
      source += 1;
      map.push(source);
    }
    if (index < lines.length - 1) {
      if (line.hard) source += 1;
      map.push(source);
    }
  }
  return map;
}

export function applyPageEdit(lines, oldDisplay, newDisplay, displayCaret) {
  const map = displayCaretMap(lines);
  if (map.length !== oldDisplay.length + 1) {
    return null;
  }
  let start = 0;
  const minLength = Math.min(oldDisplay.length, newDisplay.length);
  while (start < minLength && oldDisplay[start] === newDisplay[start]) start += 1;
  let suffix = 0;
  while (
    suffix < oldDisplay.length - start &&
    suffix < newDisplay.length - start &&
    oldDisplay[oldDisplay.length - 1 - suffix] === newDisplay[newDisplay.length - 1 - suffix]
  ) {
    suffix += 1;
  }
  const oldEnd = oldDisplay.length - suffix;
  const inserted = newDisplay
    .slice(start, newDisplay.length - suffix)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ");
  const sourceStart = map[start];
  const sourceEnd = map[oldEnd];
  const oldSource = reconstruct(lines);
  const source = oldSource.slice(0, sourceStart) + inserted + oldSource.slice(sourceEnd);

  let caret;
  if (displayCaret <= start) caret = map[Math.max(0, displayCaret)];
  else if (displayCaret <= start + inserted.length) caret = sourceStart + (displayCaret - start);
  else {
    const oldPos = oldEnd + (displayCaret - (start + inserted.length));
    const clamped = Math.min(Math.max(oldPos, 0), map.length - 1);
    caret = sourceStart + inserted.length + (map[clamped] - sourceEnd);
  }

  const bias = inserted.length >= sourceEnd - sourceStart ? "right" : "left";
  return { source, caret, bias };
}

export function displayCaretFromSource(lines, sourceCaret, bias = "right") {
  let display = 0;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const next = lines[index + 1];
    const textEnd = line.start + line.text.length;
    if (sourceCaret < textEnd || (sourceCaret === textEnd && bias === "left" && !next)) {
      return display + Math.max(0, sourceCaret - line.start);
    }
    if (sourceCaret === textEnd && next && next.start === line.end && !line.hard && bias === "right") {
      return display + line.text.length + 1;
    }
    if (sourceCaret < line.end || !next) {
      return display + line.text.length;
    }
    if (sourceCaret === line.end && next.start === line.end) {
      if (bias === "left") return display + line.text.length;
      return display + line.text.length + 1;
    }
    display += line.text.length;
    if (next) display += 1;
  }
  return display;
}
