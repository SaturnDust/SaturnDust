// Builds assets/card.svg: an animated "Photoshop window" profile card.
// Run: node scripts/build_card.js
const fs = require("fs");
const path = require("path");

// ---------- content shown on the canvas (edit here) ----------
const CODE = [
  [["kw", "const "], ["var", "razzan"], ["op", " = {"]],
  [["key", "  name"], ["op", ": "], ["str", '"Razzan Indrana"'], ["op", ","]],
  [["key", "  role"], ["op", ": "], ["str", '"Web Developer & Designer"'], ["op", ","]],
  [["key", "  location"], ["op", ": "], ["str", '"Jakarta, Indonesia"'], ["op", ","]],
  [["key", "  education"], ["op", ": "], ["str", '"S1 Sistem Informasi, UPJ"'], ["op", ","]],
  [["key", "  stack"], ["op", ": ["], ["str", '"React"'], ["op", ", "], ["str", '"Next.js"'], ["op", ", "], ["str", '"Tailwind"'], ["op", ", "], ["str", '"Supabase"'], ["op", "],"]],
  [["key", "  design"], ["op", ": ["], ["str", '"Figma"'], ["op", ", "], ["str", '"Photoshop"'], ["op", ", "], ["str", '"Illustrator"'], ["op", ", "], ["str", '"Canva"'], ["op", "],"]],
  [["key", "  tools"], ["op", ": ["], ["str", '"VS Code"'], ["op", ", "], ["str", '"Git"'], ["op", ", "], ["str", '"Vercel"'], ["op", ", "], ["str", '"Odoo"'], ["op", "],"]],
  [["key", "  learning"], ["op", ": "], ["str", '"Next.js"'], ["op", ","]],
  [["key", "  contact"], ["op", ": "], ["str", '"razzanindrana26@gmail.com"'], ["op", ","]],
  [["key", "  status"], ["op", ": "], ["str", '"open to work"'], ["op", ","]],
  [["op", "};"]],
];

// ---------- palette (Photoshop dark UI + portfolio accents) ----------
const C = {
  frame: "#1c1c1c", chrome: "#323232", chromeDark: "#262626", panel: "#2b2b2b",
  line: "#1a1a1a", lineSoft: "#3c3c3c", text: "#d6d6d6", dim: "#8f8f8f", dimmer: "#6a6a6a",
  pasteboard: "#282828", accent: "#31a8ff", selected: "#404040",
  kw: "#c792ea", var: "#82aaff", key: "#22d3ee", str: "#31f29b", op: "#9baad2",
  navyA: "#120e27", navyB: "#00193c", navyC: "#322240",
};

const W = 946, H = 640;
const FS = 15;           // code font size
const CW = 9.2;          // estimated width per character (monospace)
const LH = 22;           // line height
const CPS = 32;          // chars per second typing speed
const PAUSE = 0.18;      // pause between lines

// layout
const win = { x: 20, y: 20, w: 906, h: 600, r: 10 };
const titleH = 34, menuH = 24, optH = 30, tabH = 26, statusH = 22;
const toolW = 36, panelW = 230;
const canvasArea = {
  x: win.x + toolW, y: win.y + titleH + menuH + optH + tabH,
  w: win.w - toolW - panelW, h: win.h - titleH - menuH - optH - tabH - statusH,
};
const doc = { x: canvasArea.x + 28, y: canvasArea.y + 24, w: canvasArea.w - 56, h: canvasArea.h - 48 };
const code = { x: doc.x + 40, y: doc.y + 52 };

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ---------- typing animation ----------
let t = 0.9; // initial delay
const clips = [], lines = [];
CODE.forEach((segs, i) => {
  const text = segs.map((s) => s[1]).join("");
  const width = Math.ceil(text.length * CW) + 4;
  const start = t, dur = text.length / CPS, end = start + dur;
  t = end + PAUSE;
  const y = code.y + i * LH;
  clips.push(`<clipPath id="l${i}"><rect x="${code.x}" y="${y - FS - 2}" width="${width}" height="${LH}"><animate attributeName="width" values="0;0;${width}" keyTimes="0;${(start / end).toFixed(4)};1" dur="${end.toFixed(3)}s" fill="freeze"/></rect></clipPath>`);
  const tspans = segs.map(([cls, s]) => `<tspan fill="${C[cls]}">${esc(s)}</tspan>`).join("");
  lines.push(`<text x="${code.x}" y="${y}" clip-path="url(#l${i})" xml:space="preserve">${tspans}</text>`);
  lines.push(`<text x="${doc.x + 24}" y="${y}" text-anchor="end" fill="${C.dimmer}" font-size="11">${i + 1}</text>`);
});
const totalT = t;
const lastLine = CODE[CODE.length - 1].map((s) => s[1]).join("");
const cursorX = code.x + lastLine.length * CW + 1;
const cursorY = code.y + (CODE.length - 1) * LH;

// ---------- small UI helpers ----------
const menu = ["File", "Edit", "Image", "Layer", "Type", "Select", "Filter", "3D", "View", "Plugins", "Window", "Help"];
let mx = win.x + 54;
const menuItems = menu.map((m) => { const s = `<text x="${mx}" y="${win.y + titleH + 16}" fill="${C.text}" font-size="12">${m}</text>`; mx += m.length * 7.2 + 16; return s; }).join("");

// tool icons drawn with primitives so they render identically everywhere (no emoji / glyph fonts)
const icon = (kind, cx, cy, col) => {
  const s = `fill="none" stroke="${col}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"`;
  switch (kind) {
    case "move": return `<path d="M${cx - 5} ${cy - 6} L${cx + 5} ${cy} L${cx} ${cy + 1} L${cx + 2} ${cy + 6} L${cx} ${cy + 7} L${cx - 2} ${cy + 2} L${cx - 5} ${cy + 4} Z" ${s}/>`;
    case "marquee": return `<rect x="${cx - 6}" y="${cy - 5}" width="12" height="10" ${s} stroke-dasharray="2 1.5"/>`;
    case "lasso": return `<ellipse cx="${cx}" cy="${cy - 2}" rx="6" ry="4" ${s}/><path d="M${cx - 3} ${cy + 1} q-2 4 1 6" ${s}/>`;
    case "crop": return `<path d="M${cx - 3} ${cy - 7} V${cy + 3} H${cx + 7} M${cx - 7} ${cy - 3} H${cx + 3} V${cy + 7}" ${s}/>`;
    case "eyedropper": return `<path d="M${cx - 6} ${cy + 6} L${cx + 2} ${cy - 2} M${cx + 1} ${cy - 5} l4 4 M${cx + 3} ${cy - 7} l4 4" ${s}/>`;
    case "brush": return `<path d="M${cx + 6} ${cy - 6} L${cx - 1} ${cy + 1} M${cx - 1} ${cy + 1} q-5 0 -5 5 q4 1 6 -3" ${s}/>`;
    case "eraser": return `<path d="M${cx - 6} ${cy + 3} l6 -8 l6 5 l-5 7 h-4 z M${cx - 2} ${cy + 7} h8" ${s}/>`;
    case "type": return `<text x="${cx}" y="${cy + 6}" text-anchor="middle" fill="${col}" font-size="16" font-family="Georgia, 'Times New Roman', serif" font-weight="700">T</text>`;
    case "pen": return `<path d="M${cx} ${cy - 7} l5 7 l-5 7 l-5 -7 z M${cx} ${cy - 7} v14" ${s}/>`;
    case "hand": return `<path d="M${cx - 5} ${cy} v-4 M${cx - 2} ${cy - 2} v-5 M${cx + 1} ${cy - 2} v-5 M${cx + 4} ${cy - 1} v-3 M${cx - 5} ${cy} q0 7 5 7 q5 0 5 -7" ${s}/>`;
    case "zoom": return `<circle cx="${cx - 1}" cy="${cy - 1}" r="5" ${s}/><path d="M${cx + 3} ${cy + 3} l4 4" ${s}/>`;
  }
  return "";
};
const tools = ["move", "marquee", "lasso", "crop", "eyedropper", "brush", "eraser", "type", "pen", "hand", "zoom"];
const toolIcons = tools.map((g, i) => {
  const y = canvasArea.y - tabH + 14 + i * 30;
  const active = g === "type";
  return `${active ? `<rect x="${win.x + 4}" y="${y - 2}" width="${toolW - 8}" height="24" rx="3" fill="${C.selected}"/>` : ""}${icon(g, win.x + toolW / 2, y + 10, active ? C.accent : C.dim)}`;
}).join("");

const layers = [
  { name: "about.js", kind: "T", active: true },
  { name: "skills", kind: "T" },
  { name: "projects", kind: "▣" },
  { name: "grid-pattern", kind: "▦" },
  { name: "Background", kind: "▩", locked: true },
];
const px = win.x + win.w - panelW;
const layersTop = win.y + titleH + 250;
const layerRows = layers.map((l, i) => {
  const y = layersTop + 56 + i * 26;
  return `<rect x="${px + 1}" y="${y}" width="${panelW - 2}" height="26" fill="${l.active ? C.selected : "none"}"/>
<rect x="${px + 8}" y="${y + 6}" width="14" height="14" rx="2" fill="none" stroke="${C.dim}" stroke-width="1"/><circle cx="${px + 15}" cy="${y + 13}" r="3" fill="${C.text}"/>
<rect x="${px + 30}" y="${y + 4}" width="18" height="18" rx="2" fill="${l.kind === "T" ? "#ffffff" : C.navyB}"/>
<text x="${px + 39}" y="${y + 17}" text-anchor="middle" fill="${l.kind === "T" ? "#000" : C.key}" font-size="11" font-family="Segoe UI, Arial, sans-serif" font-weight="700">${l.kind}</text>
<text x="${px + 56}" y="${y + 17}" fill="${C.text}" font-size="12" font-family="Segoe UI, Arial, sans-serif">${l.name}</text>
${l.locked ? `<rect x="${px + panelW - 22}" y="${y + 11}" width="9" height="7" rx="1" fill="${C.dim}"/><path d="M${px + panelW - 20} ${y + 11} v-2.5 a2.5 2.5 0 0 1 5 0 v2.5" fill="none" stroke="${C.dim}" stroke-width="1.2"/>` : ""}`;
}).join("");

const swatches = ["#22d3ee", "#31f29b", "#f29531", "#c792ea", "#82aaff", "#9baad2", "#120e27", "#00193c", "#322240", "#040a1c", "#ffffff", "#000000"];
const swatchRects = swatches.map((c, i) => `<rect x="${px + 12 + (i % 6) * 34}" y="${win.y + titleH + menuH + optH + 124 + Math.floor(i / 6) * 22}" width="28" height="16" rx="2" fill="${c}" stroke="${C.line}" stroke-width="1"/>`).join("");

// ---------- assemble ----------
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Consolas, 'Courier New', Menlo, monospace" font-size="${FS}px">
<title>Razzan Indrana - profile card (Photoshop UI)</title>
<defs>
<clipPath id="win"><rect x="${win.x}" y="${win.y}" width="${win.w}" height="${win.h}" rx="${win.r}"/></clipPath>
<clipPath id="docclip"><rect x="${doc.x}" y="${doc.y}" width="${doc.w}" height="${doc.h}"/></clipPath>
<linearGradient id="navy" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.navyA}"/><stop offset="0.55" stop-color="${C.navyB}"/><stop offset="1" stop-color="${C.navyC}"/></linearGradient>
<linearGradient id="border" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#31a8ff"/><stop offset="0.5" stop-color="#22d3ee"/><stop offset="1" stop-color="#c792ea"/></linearGradient>
<pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M28 0H0V28" fill="none" stroke="#ffffff" stroke-opacity="0.045" stroke-width="1"/></pattern>
<pattern id="checker" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#bdbdbd"/><rect x="6" y="6" width="6" height="6" fill="#bdbdbd"/><rect x="6" width="6" height="6" fill="#e6e6e6"/><rect y="6" width="6" height="6" fill="#e6e6e6"/></pattern>
<filter id="shadow" x="-5%" y="-5%" width="110%" height="115%"><feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000" flood-opacity="0.45"/></filter>
${clips.join("\n")}
</defs>

<!-- window shadow + frame -->
<rect x="${win.x}" y="${win.y}" width="${win.w}" height="${win.h}" rx="${win.r}" fill="${C.frame}" filter="url(#shadow)"/>
<rect x="${win.x}" y="${win.y}" width="${win.w}" height="${win.h}" rx="${win.r}" fill="none" stroke="url(#border)" stroke-opacity="0.6"/>

<g clip-path="url(#win)">
<!-- title bar -->
<rect x="${win.x}" y="${win.y}" width="${win.w}" height="${titleH}" fill="${C.chromeDark}"/>
<rect x="${win.x + 10}" y="${win.y + 7}" width="20" height="20" rx="4" fill="#001e36"/>
<text x="${win.x + 20}" y="${win.y + 22}" text-anchor="middle" fill="${C.accent}" font-size="11" font-family="Segoe UI, Arial, sans-serif" font-weight="700">Ps</text>
<text x="${win.x + win.w / 2}" y="${win.y + 22}" text-anchor="middle" fill="${C.dim}" font-size="12" font-family="Segoe UI, Arial, sans-serif">Adobe Photoshop 2025 — razzan-indrana.psd</text>
<circle cx="${win.x + win.w - 62}" cy="${win.y + 17}" r="5" fill="#5a5a5a"/><circle cx="${win.x + win.w - 42}" cy="${win.y + 17}" r="5" fill="#5a5a5a"/><circle cx="${win.x + win.w - 22}" cy="${win.y + 17}" r="5" fill="#e06c75"/>

<!-- menu bar -->
<rect x="${win.x}" y="${win.y + titleH}" width="${win.w}" height="${menuH}" fill="${C.chrome}"/>
${menuItems}
<line x1="${win.x}" y1="${win.y + titleH + menuH}" x2="${win.x + win.w}" y2="${win.y + titleH + menuH}" stroke="${C.line}"/>

<!-- options bar (Type tool) -->
<rect x="${win.x}" y="${win.y + titleH + menuH}" width="${win.w}" height="${optH}" fill="${C.chrome}"/>
<text x="${win.x + 14}" y="${win.y + titleH + menuH + 20}" fill="${C.accent}" font-size="15" font-family="Segoe UI, Arial, sans-serif" font-weight="700">T</text>
<rect x="${win.x + 40}" y="${win.y + titleH + menuH + 6}" width="120" height="18" rx="3" fill="${C.chromeDark}" stroke="${C.lineSoft}"/><text x="${win.x + 48}" y="${win.y + titleH + menuH + 19}" fill="${C.text}" font-size="11" font-family="Segoe UI, Arial, sans-serif">IBM Plex Mono</text>
<rect x="${win.x + 168}" y="${win.y + titleH + menuH + 6}" width="70" height="18" rx="3" fill="${C.chromeDark}" stroke="${C.lineSoft}"/><text x="${win.x + 176}" y="${win.y + titleH + menuH + 19}" fill="${C.text}" font-size="11" font-family="Segoe UI, Arial, sans-serif">Regular</text>
<rect x="${win.x + 246}" y="${win.y + titleH + menuH + 6}" width="60" height="18" rx="3" fill="${C.chromeDark}" stroke="${C.lineSoft}"/><text x="${win.x + 254}" y="${win.y + titleH + menuH + 19}" fill="${C.text}" font-size="11" font-family="Segoe UI, Arial, sans-serif">15 pt</text>
<rect x="${win.x + 314}" y="${win.y + titleH + menuH + 6}" width="60" height="18" rx="3" fill="${C.chromeDark}" stroke="${C.lineSoft}"/><text x="${win.x + 322}" y="${win.y + titleH + menuH + 19}" fill="${C.text}" font-size="11" font-family="Segoe UI, Arial, sans-serif">Sharp</text>
<rect x="${win.x + 382}" y="${win.y + titleH + menuH + 7}" width="16" height="16" rx="2" fill="${C.key}" stroke="${C.lineSoft}"/>
<line x1="${win.x}" y1="${win.y + titleH + menuH + optH}" x2="${win.x + win.w}" y2="${win.y + titleH + menuH + optH}" stroke="${C.line}"/>

<!-- left toolbar -->
<rect x="${win.x}" y="${win.y + titleH + menuH + optH}" width="${toolW}" height="${win.h - titleH - menuH - optH - statusH}" fill="${C.chrome}"/>
${toolIcons}
<rect x="${win.x + 7}" y="${win.y + titleH + menuH + optH + 352}" width="14" height="14" fill="${C.key}" stroke="#fff" stroke-width="1"/>
<rect x="${win.x + 15}" y="${win.y + titleH + menuH + optH + 360}" width="14" height="14" fill="${C.navyA}" stroke="#fff" stroke-width="1"/>
<line x1="${win.x + toolW}" y1="${win.y + titleH + menuH + optH}" x2="${win.x + toolW}" y2="${win.y + win.h}" stroke="${C.line}"/>

<!-- document tab -->
<rect x="${canvasArea.x}" y="${canvasArea.y - tabH}" width="${canvasArea.w}" height="${tabH}" fill="${C.chromeDark}"/>
<rect x="${canvasArea.x}" y="${canvasArea.y - tabH}" width="330" height="${tabH}" fill="${C.pasteboard}"/>
<text x="${canvasArea.x + 10}" y="${canvasArea.y - 8}" fill="${C.text}" font-size="12" font-family="Segoe UI, Arial, sans-serif">razzan-indrana.psd @ 100% (about.js, RGB/8) *</text>
<text x="${canvasArea.x + 312}" y="${canvasArea.y - 8}" fill="${C.dim}" font-size="12" font-family="Segoe UI, Arial, sans-serif">×</text>

<!-- pasteboard + document -->
<rect x="${canvasArea.x}" y="${canvasArea.y}" width="${canvasArea.w}" height="${canvasArea.h}" fill="${C.pasteboard}"/>
<rect x="${doc.x}" y="${doc.y}" width="${doc.w}" height="${doc.h}" fill="url(#checker)"/>
<g clip-path="url(#docclip)">
<rect x="${doc.x}" y="${doc.y}" width="${doc.w}" height="${doc.h}" fill="url(#navy)"/>
<rect x="${doc.x}" y="${doc.y}" width="${doc.w}" height="${doc.h}" fill="url(#grid)"/>
<text x="${code.x}" y="${doc.y + 22}" fill="${C.op}" font-size="11">// about.js  —  Hello there I’m,</text>
${lines.join("\n")}
<!-- links layer, fades in after typing -->
<g opacity="0"><animate attributeName="opacity" values="0;0;1" keyTimes="0;${((totalT + 0.3) / (totalT + 1.1)).toFixed(4)};1" dur="${(totalT + 1.1).toFixed(3)}s" fill="freeze"/>
<text x="${code.x}" y="${code.y + CODE.length * LH + 26}" fill="${C.op}" font-size="11">// links</text>
<text x="${code.x}" y="${code.y + CODE.length * LH + 48}" font-size="13" fill="${C.op}" xml:space="preserve"><tspan fill="${C.key}">github</tspan>  SaturnDust     <tspan fill="${C.key}">linkedin</tspan>  razzan-indrana     <tspan fill="${C.key}">behance</tspan>  razzanindrana</text>
<text x="${code.x}" y="${code.y + CODE.length * LH + 70}" font-size="13" fill="${C.op}" xml:space="preserve"><tspan fill="${C.key}">instagram</tspan>  kuwrakamu     <tspan fill="${C.key}">portfolio</tspan>  razzan-web-porto.vercel.app</text>
</g>
<rect x="${cursorX}" y="${cursorY - FS}" width="2" height="${FS + 3}" fill="${C.key}"><animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.5;0.5;1" dur="1s" repeatCount="indefinite"/></rect>
<!-- type-layer bounding box -->
<rect x="${code.x - 6}" y="${code.y - FS - 8}" width="${Math.ceil(Math.max(...CODE.map((s) => s.map((x) => x[1]).join("").length)) * CW) + 14}" height="${CODE.length * LH + 10}" fill="none" stroke="${C.accent}" stroke-opacity="0.55" stroke-dasharray="4 3"><animate attributeName="stroke-opacity" values="0;0;0.55" keyTimes="0;${((totalT - 0.2) / totalT).toFixed(4)};1" dur="${totalT.toFixed(3)}s" fill="freeze"/></rect>
</g>
<!-- rulers -->
<rect x="${canvasArea.x}" y="${canvasArea.y}" width="${canvasArea.w}" height="14" fill="${C.chrome}"/>
<rect x="${canvasArea.x}" y="${canvasArea.y}" width="14" height="${canvasArea.h}" fill="${C.chrome}"/>
${Array.from({ length: Math.floor(canvasArea.w / 50) }, (_, i) => `<line x1="${canvasArea.x + 14 + i * 50}" y1="${canvasArea.y + 8}" x2="${canvasArea.x + 14 + i * 50}" y2="${canvasArea.y + 14}" stroke="${C.dim}"/>`).join("")}
${Array.from({ length: Math.floor(canvasArea.h / 50) }, (_, i) => `<line x1="${canvasArea.x + 8}" y1="${canvasArea.y + 14 + i * 50}" x2="${canvasArea.x + 14}" y2="${canvasArea.y + 14 + i * 50}" stroke="${C.dim}"/>`).join("")}

<!-- right panels -->
<rect x="${px}" y="${win.y + titleH + menuH + optH}" width="${panelW}" height="${win.h - titleH - menuH - optH - statusH}" fill="${C.panel}"/>
<line x1="${px}" y1="${win.y + titleH + menuH + optH}" x2="${px}" y2="${win.y + win.h}" stroke="${C.line}"/>
<!-- Color / Swatches -->
<rect x="${px}" y="${win.y + titleH + menuH + optH}" width="${panelW}" height="24" fill="${C.chromeDark}"/>
<text x="${px + 10}" y="${win.y + titleH + menuH + optH + 16}" fill="${C.text}" font-size="12" font-family="Segoe UI, Arial, sans-serif">Color</text>
<text x="${px + 56}" y="${win.y + titleH + menuH + optH + 16}" fill="${C.dim}" font-size="12" font-family="Segoe UI, Arial, sans-serif">Swatches</text>
<text x="${px + 122}" y="${win.y + titleH + menuH + optH + 16}" fill="${C.dim}" font-size="12" font-family="Segoe UI, Arial, sans-serif">Gradients</text>
<rect x="${px + 12}" y="${win.y + titleH + menuH + optH + 36}" width="${panelW - 24}" height="54" rx="3" fill="url(#navy)"/>
<rect x="${px + 12}" y="${win.y + titleH + menuH + optH + 36}" width="${panelW - 24}" height="54" rx="3" fill="none" stroke="${C.lineSoft}"/>
<text x="${px + 12}" y="${win.y + titleH + menuH + optH + 110}" fill="${C.dim}" font-size="11" font-family="Segoe UI, Arial, sans-serif">H  215°   S  65%   B  24%</text>
${swatchRects}
<!-- Layers -->
<rect x="${px}" y="${layersTop}" width="${panelW}" height="24" fill="${C.chromeDark}"/>
<text x="${px + 10}" y="${layersTop + 16}" fill="${C.text}" font-size="12" font-family="Segoe UI, Arial, sans-serif">Layers</text>
<text x="${px + 64}" y="${layersTop + 16}" fill="${C.dim}" font-size="12" font-family="Segoe UI, Arial, sans-serif">Channels</text>
<text x="${px + 128}" y="${layersTop + 16}" fill="${C.dim}" font-size="12" font-family="Segoe UI, Arial, sans-serif">Paths</text>
<rect x="${px + 8}" y="${layersTop + 30}" width="90" height="18" rx="3" fill="${C.chromeDark}" stroke="${C.lineSoft}"/><text x="${px + 14}" y="${layersTop + 43}" fill="${C.text}" font-size="11" font-family="Segoe UI, Arial, sans-serif">Normal</text>
<text x="${px + 108}" y="${layersTop + 43}" fill="${C.dim}" font-size="11" font-family="Segoe UI, Arial, sans-serif">Opacity:</text>
<rect x="${px + 158}" y="${layersTop + 30}" width="60" height="18" rx="3" fill="${C.chromeDark}" stroke="${C.lineSoft}"/><text x="${px + 164}" y="${layersTop + 43}" fill="${C.text}" font-size="11" font-family="Segoe UI, Arial, sans-serif">100%</text>
${layerRows}

<!-- status bar -->
<rect x="${win.x}" y="${win.y + win.h - statusH}" width="${win.w}" height="${statusH}" fill="${C.chromeDark}"/>
<text x="${win.x + 12}" y="${win.y + win.h - 7}" fill="${C.dim}" font-size="11" font-family="Segoe UI, Arial, sans-serif">100%</text>
<text x="${win.x + 70}" y="${win.y + win.h - 7}" fill="${C.dim}" font-size="11" font-family="Segoe UI, Arial, sans-serif">Doc: 1.20M/1.20M</text>
<text x="${win.x + win.w - 14}" y="${win.y + win.h - 7}" text-anchor="end" fill="${C.dim}" font-size="11" font-family="Segoe UI, Arial, sans-serif">Type tool  ·  Jakarta (UTC+7)  ·  github.com/SaturnDust</text>
</g>
</svg>
`;

const out = path.join(__dirname, "..", "assets", "card.svg");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, svg);
console.log(`wrote ${out} (${svg.length} bytes), animation ends at ${totalT.toFixed(1)}s`);
