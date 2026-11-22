(() => {
  "use strict";

  const reader = document.getElementById("skill-reader");
  if (!reader || typeof window.skillMarkdown !== "string") return;

  const sources = new Map(Object.entries(window.skillReferences || {}));
  sources.set("SKILL.md", window.skillMarkdown);
  const trail = [];
  const listItem = /^\s*(?:(\d+)\.|[-*])\s+(.+)$/;
  const heading = /^(#{1,6})\s+(.+)$/;

  function codeBlock(text) {
    const pre = document.createElement("pre");
    const code = document.createElement("code");
    code.textContent = text;
    pre.append(code);
    return pre;
  }

  function link(label, address, path, article) {
    if (/^https?:\/\//i.test(address)) {
      const external = document.createElement("a");
      external.textContent = label;
      external.href = address;
      external.target = "_blank";
      external.rel = "noopener noreferrer";
      return external;
    }
    const target = new URL(address, "https://local.invalid/" + path);
    const name = target.pathname.slice(1);
    if (target.origin !== "https://local.invalid" || !sources.has(name)) {
      return document.createTextNode(label);
    }
    const button = document.createElement("button");
    button.type = "button";
    button.className = "reader-link";
    button.textContent = label;
    button.addEventListener("click", () => {
      const links = Array.from(article.querySelectorAll(".reader-link"));
      trail.push({ path, position: links.indexOf(button) });
      show(name, true);
    });
    return button;
  }

  function inline(parent, text, path, article) {
    const tokens = /(`([^`]+)`)|\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^\s)]+)\)/g;
    let start = 0;
    for (const match of text.matchAll(tokens)) {
      parent.append(text.slice(start, match.index));
      if (match[5]) {
        parent.append(link(match[4], match[5], path, article));
      } else {
        const node = document.createElement(match[2] ? "code" : "strong");
        node.textContent = match[2] || match[3];
        parent.append(node);
      }
      start = match.index + match[0].length;
    }
    parent.append(text.slice(start));
  }

  function tableCells(line) {
    const values = [""];
    const parts = line.slice(1, -1).split(/(`[^`]*`|\|)/);
    for (const part of parts) {
      if (part === "|") values.push("");
      else values[values.length - 1] += part;
    }
    return values;
  }

  function table(rows, path, article) {
    const wrapper = document.createElement("div");
    wrapper.className = "reader-table";
    const grid = document.createElement("table");
    const head = grid.createTHead();
    const body = grid.createTBody();
    rows.forEach((line, index) => {
      if (index === 1 && /^\|[\s:|-]+\|$/.test(line)) return;
      const row = (index === 0 ? head : body).insertRow();
      for (const value of tableCells(line)) {
        const cell = document.createElement(index === 0 ? "th" : "td");
        if (index === 0) cell.scope = "col";
        inline(cell, value.trim(), path, article);
        row.append(cell);
      }
    });
    wrapper.append(grid);
    return wrapper;
  }

  function isNewBlock(line) {
    return !line.trim() || line.startsWith("```") || line.startsWith("|") ||
      heading.test(line) || listItem.test(line) || line === "---";
  }

  function render(article, text, path) {
    const body = text.replace(/\r\n/g, "\n").replace(/^---\n[\s\S]*?\n---(?:\n|$)/, "");
    const lines = body.split("\n");
    let index = 0;
    while (index < lines.length) {
      const line = lines[index++].trimEnd();
      if (!line.trim()) continue;
      if (line.startsWith("```")) {
        const code = [];
        while (index < lines.length && !lines[index].startsWith("```")) {
          code.push(lines[index++]);
        }
        index++;
        article.append(codeBlock(code.join("\n")));
      } else if (line.startsWith("|")) {
        const rows = [line];
        while (index < lines.length && lines[index].startsWith("|")) rows.push(lines[index++].trimEnd());
        article.append(table(rows, path, article));
      } else if (line === "---") {
        article.append(document.createElement("hr"));
      } else if (heading.test(line)) {
        const [, marks, title] = line.match(heading);
        const node = document.createElement("h" + Math.min(6, marks.length + 2));
        inline(node, title, path, article);
        article.append(node);
      } else if (listItem.test(line)) {
        const ordered = Boolean(line.match(listItem)[1]);
        const list = document.createElement(ordered ? "ol" : "ul");
        if (ordered) list.start = Number(line.match(listItem)[1]);
        let item = line;
        while (true) {
          const entry = document.createElement("li");
          inline(entry, item.match(listItem)[2], path, article);
          list.append(entry);
          const next = lines[index]?.match(listItem);
          if (!next || Boolean(next[1]) !== ordered) break;
          item = lines[index++];
        }
        article.append(list);
      } else {
        const paragraph = document.createElement("p");
        const content = [line];
        while (index < lines.length && !isNewBlock(lines[index])) content.push(lines[index++]);
        inline(paragraph, content.join(" "), path, article);
        article.append(paragraph);
      }
    }
  }

  function show(path, focusTitle = false) {
    const article = document.createElement("article");
    article.className = "markdown";
    if (/\.md$/i.test(path)) {
      render(article, sources.get(path), path);
    } else {
      const title = document.createElement("h3");
      title.textContent = path.split("/").pop();
      article.append(title, codeBlock(sources.get(path)));
    }
    reader.replaceChildren();
    if (trail.length) {
      const previous = trail[trail.length - 1];
      const back = document.createElement("button");
      back.type = "button";
      back.className = "reader-back";
      back.textContent = "← Voltar para " + previous.path.split("/").pop();
      back.addEventListener("click", () => {
        trail.pop();
        show(previous.path);
        reader.querySelectorAll(".reader-link")[previous.position]?.focus();
      });
      reader.append(back);
    }
    reader.append(article);
    if (focusTitle) {
      const title = article.querySelector("h3") || article;
      title.tabIndex = -1;
      title.focus({ preventScroll: true });
      reader.scrollIntoView({ block: "start" });
    }
  }

  show("SKILL.md");
})();
