/* My Study Journal — logica dell'app.
   Dati salvati solo nel browser (localStorage, chiave "msj-data-v1").
   Lo stato dell'interfaccia (sezione aperta, filtri, ecc.) vive solo in memoria:
   chiudendo la finestra tutto torna alla copertina. */
(() => {
"use strict";

/* ---------- utilità ---------- */
const KEY = "msj-data-v1";
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad = n => String(n).padStart(2, "0");
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => ymd(new Date());
const parseYmd = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const toDmy = s => { const [y, m, d] = s.split("-"); return `${d}/${m}/${y}`; };
const fromDmy = s => {
  const m = String(s).trim().match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/);
  if (!m) return null;
  const d = new Date(+m[3], +m[2] - 1, +m[1]);
  if (d.getDate() !== +m[1] || d.getMonth() !== +m[2] - 1) return null;
  return ymd(d);
};
const nowIso = () => new Date().toISOString();
const fmtLong = s => parseYmd(s).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const fmtTime = iso => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
function relDay(s) {
  if (s === today()) return "Today";
  const y = new Date(); y.setDate(y.getDate() - 1);
  if (s === ymd(y)) return "Yesterday";
  const d = parseYmd(s);
  const opt = { day: "numeric", month: "short" };
  if (d.getFullYear() !== new Date().getFullYear()) opt.year = "numeric";
  return d.toLocaleDateString("en-GB", opt);
}
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/* ---------- dati ---------- */
function blank() {
  return { version: 1, startDate: today(), done: {}, entries: {}, notes: [], log: [], opens: {} };
}
let D;
try { D = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { D = blank(); }
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(D)); }
  catch (e) { toast("Impossibile salvare: esporta un backup"); }
}
function log(a, id) {
  D.log.push({ t: nowIso(), a, id });
  if (D.log.length > 5000) D.log.splice(0, D.log.length - 5000);
}
D.opens[today()] = (D.opens[today()] || 0) + 1;
save();

/* ---------- piano ---------- */
const TYPES = { L: "Lezione", P: "Progetto", E: "Esercizio", C: "Controllo", R: "Diario" };
const XP = { R: 5, L: 10, C: 10, E: 20, P: 30, bonus: 50 };
const pts = id => { const t = TASK[id]; return !t ? 0 : (t.day.step.final ? 50 : (XP[t.type] || 10)); };
const sessionPts = d => Object.entries(D.done).filter(([, x]) => x.date === d).reduce((a, [id]) => a + pts(id), 0);
const DAYS = [], TASK = {}, STEPS = [];
let order = 0;
window.PLAN.forEach(b => b.steps.forEach(s => {
  s.block = b; s.dayIdx = []; STEPS.push(s);
  s.days.forEach((arr, di) => {
    const day = { g: DAYS.length, step: s, di, tasks: [] };
    arr.forEach((raw, ti) => {
      const id = `${s.n}-${di}-${ti}`;
      const [txt, ...links] = raw.slice(2).split("|");
      TASK[id] = { id, type: raw[0], text: txt.trim(), links: links.map(x => x.trim()).filter(Boolean), day, order: order++ };
      day.tasks.push(id);
    });
    s.dayIdx.push(day.g); DAYS.push(day);
  });
}));
const BADGES = { A: "🌐 Web builder", B: "⚡ JavaScript ninja", C: "⚛️ React crafter", D: "🗄️ Data keeper", F: "🏯 Kanji app" };

const isDone = id => !!D.done[id];
const entryDates = () => Object.keys(D.entries).sort();
const stepTasks = s => s.dayIdx.flatMap(g => DAYS[g].tasks);
const stepComplete = s => stepTasks(s).every(isDone);

/* ---------- sessioni: riporto dei task non fatti ----------
   - Riporto <= 30 min: i task non finiti vanno all'inizio della sessione successiva.
   - Riporto > 30 min: riporto + prossime 4 sessioni vengono ridistribuiti in sessioni da ~90 min
     (in ordine di piano); se non bastano 4 sessioni il piano si allunga.
   D.queue = sessioni già ridistribuite che vengono prima dei giorni del piano.
   D.absorbed = giorni del piano assorbiti nella coda. D.movedFrom[id] = data della sessione d'origine. */
const MIN = { R: 10, C: 10, L: 30, E: 20, P: 60 };
const minsOf = id => { const t = TASK[id]; return !t ? 0 : (t.day.step.final ? 90 : (MIN[t.type] || 20)); };
const SESSION_MIN = 90, CARRY_LIMIT = 30, WINDOW = 4;
D.queue = D.queue || []; D.absorbed = D.absorbed || []; D.movedFrom = D.movedFrom || {};
const byOrder = (a, b) => TASK[a].order - TASK[b].order;
const sumMin = ids => ids.reduce((a, id) => a + minsOf(id), 0);

function planPointer(extraAbsorbed = []) {
  let max = -1;
  Object.values(D.entries).forEach(e => e.planDays.forEach(g => { if (g > max) max = g; }));
  [...D.absorbed, ...extraAbsorbed].forEach(g => { if (g > max) max = g; });
  return max + 1;
}
function nextPlanDay() { let g = planPointer(); while (g < DAYS.length && DAYS[g].tasks.every(isDone)) g++; return g; }
const liveQueue = () => D.queue.map(q => q.filter(id => TASK[id] && !isDone(id))).filter(q => q.length);
function planDaysFrom(g, n) {
  const out = [];
  while (out.length < n && g < DAYS.length) { if (!DAYS[g].tasks.every(isDone)) out.push({ tasks: [...DAYS[g].tasks], g }); g++; }
  return out;
}
function upcoming(n, queue = liveQueue(), extraAbsorbed = []) {
  const out = queue.slice(0, n).map(q => ({ tasks: q, queued: true }));
  return out.concat(planDaysFrom(planPointer(extraAbsorbed), n - out.length));
}
function balance(items, n) {
  const target = sumMin(items) / n, out = [[]];
  let acc = 0;
  items.forEach(id => {
    const m = minsOf(id);
    if (out[out.length - 1].length && out.length < n && acc + m / 2 > target * out.length) out.push([]);
    out[out.length - 1].push(id); acc += m;
  });
  return out;
}
function freshPlan() {
  const t = today(), last = entryDates().filter(d => d < t).pop(), q = liveQueue(), inQueue = new Set(q.flat());
  const carry = last ? D.entries[last].tasks.filter(id => TASK[id] && !isDone(id) && !inQueue.has(id)).sort(byOrder) : [];
  const carryMin = sumMin(carry), up = upcoming(WINDOW, q);
  const notePart = carry.length ? `${carry.length} unfinished ${carry.length === 1 ? "task" : "tasks"} from ${relDay(last)} (about ${carryMin} min)` : "";
  if (carryMin <= CARRY_LIMIT) {
    const first = up[0];
    const tasks = [...carry, ...(first ? first.tasks.filter(id => !carry.includes(id) && !isDone(id)) : [])];
    return { tasks, carry, from: last, spread: false,
      planDays: first && first.g != null ? [first.g] : [], absorbed: [],
      newQueue: first && first.queued ? q.slice(1) : q,
      note: carry.length ? `${notePart} ${carry.length === 1 ? "was" : "were"} added at the start of today.` : "" };
  }
  const items = [...carry];
  up.forEach(sx => sx.tasks.forEach(id => { if (!items.includes(id) && !isDone(id)) items.push(id); }));
  const n = Math.max(WINDOW, Math.ceil(sumMin(items) / SESSION_MIN)), sessions = balance(items, n);
  const qUsed = up.filter(sx => sx.queued).length, absorbed = up.filter(sx => sx.g != null).map(sx => sx.g);
  return { tasks: sessions[0], carry, from: last, spread: true, planDays: [], absorbed,
    newQueue: sessions.slice(1).concat(q.slice(qUsed)),
    note: `${notePart} ${carry.length === 1 ? "was" : "were"} spread over the next ${sessions.length} sessions, about ${Math.round(sumMin(items) / sessions.length)} min each.` };
}
const todayTasks = () => (D.entries[today()] ? D.entries[today()].tasks : freshPlan().tasks);
function ensureTodayEntry() {
  const t = today();
  if (!D.entries[t]) {
    const f = freshPlan();
    D.entries[t] = { tasks: f.tasks, planDays: f.planDays, startedAt: nowIso(), updatedAt: nowIso(), completedAt: null, note: f.note || "" };
    D.queue = f.newQueue; D.absorbed.push(...f.absorbed);
    f.carry.forEach(id => { D.movedFrom[id] = f.from; });
    log(f.spread ? "start-day-reflow" : "start-day", t);
  }
  return D.entries[t];
}
/* sessioni future (dopo quella di oggi), per "Next session →" */
function futureSession(k) {
  let list;
  if (D.entries[today()]) list = upcoming(k);
  else { const f = freshPlan(); list = upcoming(k, f.newQueue, [...f.absorbed, ...f.planDays]); }
  const s = list[k - 1];
  return s && s.tasks.length ? { tasks: s.tasks, g: TASK[s.tasks[0]].day.g, queued: !!s.queued } : null;
}
function setDone(id, val) {
  const t = today();
  if (val) {
    const e = ensureTodayEntry();
    if (!e.tasks.includes(id)) e.tasks.push(id);
    D.done[id] = { at: nowIso(), date: t };
    e.updatedAt = nowIso();
    if (e.tasks.every(isDone) && !e.completedAt) e.completedAt = nowIso();
    log("check", id);
  } else {
    delete D.done[id];
    log("uncheck", id);
    const e = D.entries[t];
    if (e) {
      e.completedAt = null; e.updatedAt = nowIso();
      if (!Object.values(D.done).some(x => x.date === t)) { delete D.entries[t]; log("unstart-day", t); }
    }
  }
  save();
}
function continueNextDay() {
  const e = ensureTodayEntry(), next = upcoming(1)[0];
  if (!next) return false;
  if (next.queued) D.queue = liveQueue().slice(1); else e.planDays.push(next.g);
  next.tasks.forEach(id => { if (!e.tasks.includes(id)) e.tasks.push(id); });
  e.completedAt = null; e.updatedAt = nowIso();
  log("continue", next.g ?? "queue"); save();
  return true;
}
function currentG() {
  const cur = todayTasks().find(id => !isDone(id));
  return cur ? TASK[cur].day.g : Math.min(nextPlanDay(), DAYS.length - 1);
}

/* ---------- XP e gradi ---------- */
function xpNow() {
  let xp = 0, max = 0;
  STEPS.forEach(s => {
    stepTasks(s).forEach(id => { const v = pts(id); max += v; if (isDone(id)) xp += v; });
    max += XP.bonus; if (stepComplete(s)) xp += XP.bonus;
  });
  return { xp, max };
}
const RANKS = [
  { f: 0, k: "入", jp: "入門", it: "Beginner" }, { f: .06, k: "見", jp: "見習い", it: "Apprentice" },
  { f: .22, k: "職", jp: "職人", it: "Craftsman" }, { f: .48, k: "達", jp: "達人", it: "Expert" }, { f: .8, k: "師", jp: "師匠", it: "Master" }
];
function rank() {
  const { xp, max } = xpNow();
  let r = RANKS[0], next = null;
  RANKS.forEach((x, i) => { if (xp >= Math.round(x.f * max)) { r = x; next = RANKS[i + 1] || null; } });
  return { ...r, xp, max, next: next ? { ...next, at: Math.round(next.f * max) } : null };
}

/* ---------- stato dell'interfaccia (solo in memoria) ---------- */
const ui = {
  open: false, section: null, view: { kind: "date", date: today() },
  composer: null, todayTag: "all", allTasks: false, editing: null, answering: null,
  page: { plan: "home", today: "home", notes: "home", history: "home" }, hq: "", hp: null, histSpread: 0, cameFrom: {}, editingHome: null, planSpread: 0, pp: null, pendingBlock: null,
  planOpen: new Set(), planScrolled: false, lastCurrent: null, allAnim: false, selected: null, editText: null, editImages: [], imgTarget: null, lastRange: null, tf: { date: null, q: "" }, nf: { date: null, q: "" }, scroll: {}, lastSection: null, flipping: false
};
const ORDER = { plan: 0, today: 1, notes: 2, history: 3, trash: 4 };

/* ---------- rendering ---------- */
function render() {
  const tn = trashNotes().length;
  $("#trashTabs").innerHTML = tn ? `<button class="tab trash" data-s="trash" title="Cestino">🗑<small>${tn}</small></button>` : "";
  document.querySelectorAll(".tab").forEach(b => b.classList.toggle("active", ui.open && b.dataset.s === ui.section));
  $("#coverSeal").textContent = rank().k;
  closeCal();
  if (!ui.open) return;
  const same = ui.lastSection === ui.section;
  document.querySelectorAll("[data-keep]").forEach(el => { ui.scroll[el.dataset.keep] = el.scrollTop; });
  const L = $("#left"), R = $("#right");
  L.className = "pin"; R.className = "pin";
  $("#spreadHead").classList.remove("show");
  const onHome = ui.section !== "trash" && ui.page[ui.section] === "home";
  renderSideTab(onHome);
  if (onHome) renderHome(L, R);
  else if (ui.section === "plan") renderPlan(L, R);
  else if (ui.section === "today") renderToday(L, R);
  else if (ui.section === "trash") renderTrash(L, R);
  else if (ui.section === "history") renderHistory(L, R);
  else renderNotes(L, R);
  if (same) document.querySelectorAll("[data-keep]").forEach(el => { if (ui.scroll[el.dataset.keep] != null) el.scrollTop = ui.scroll[el.dataset.keep]; });
  ui.lastSection = ui.section;
  saveUi();
  const ta = $("#cText"); if (ta && document.activeElement !== ta) caretEnd(ta);
}

function linkLabel(u) {
  let h = ""; try { h = new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return "link"; }
  return ({ "theodinproject.com": "Odin", "developer.mozilla.org": "MDN", "github.com": "GitHub", "docs.github.com": "GitHub Docs", "react.dev": "React", "nextjs.org": "Next.js", "help.figma.com": "Figma", "docs.claude.com": "Claude Code" })[h] || h;
}
function tlinks(t) {
  if (!t.links || !t.links.length) return "";
  return `<span class="tlinks">${t.links.map(u => `<a class="tlink" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(linkLabel(u))} ↗</a>`).join("")}</span>`;
}
function movedTag(id) {
  if (ui.section !== "today") return "";
  const from = D.movedFrom[id] || (ui.carryPreview && ui.carryPreview.ids.includes(id) ? ui.carryPreview.from : null);
  return from ? `<span class="moved-tag">from ${esc(relDay(from))}</span>` : "";
}
const UIKEY = "msj-ui-v1";
function saveUi() {
  if (!ui.open || !ui.section) return;
  try { localStorage.setItem(UIKEY, JSON.stringify({ section: ui.section, page: ui.page, view: ui.view, planSpread: ui.planSpread, histSpread: ui.histSpread, date: today() })); } catch (e) {}
}
function resumeLast() {
  let sv = null; try { sv = JSON.parse(localStorage.getItem(UIKEY)); } catch (e) {}
  if (!sv || !sv.section || !ORDER.hasOwnProperty(sv.section)) return;
  const s = sv.section === "trash" && !trashNotes().length ? "notes" : sv.section;
  Object.assign(ui.page, sv.page || {});
  let view = sv.view || { kind: "date", date: today() };
  if (view.kind === "intro" || view.kind === "future" || (sv.date !== today() && view.kind === "date" && view.date === sv.date)) view = { kind: "date", date: today() };
  ui.planSpread = sv.planSpread || 0; ui.histSpread = sv.histSpread || 0;
  setTimeout(() => go(s, { page: s === "trash" ? "content" : (ui.page[s] || "home"), view, keepScroll: true }), 650);
}
// Il tag del tipo di task è un'icona; il nome compare come tooltip (hover o clic)
const TICON = { L: "📖", E: "✏️", P: "🛠️", C: "🔍", R: "📓" };
function pill(type) { return `<span class="pill ico ${type}" data-tip="${TYPES[type] || ""}">${TICON[type] || "•"}</span>`; }
function taskRow(id, o = {}) {
  const t = TASK[id]; if (!t) return "";
  const done = isDone(id);
  const copy = t.type === "C" && !o.disabled ? `<button class="btn copy" data-copy="${t.day.step.n}">copia richiesta</button>` : "";
  return `<label class="task ${done ? "done" : ""}"><input type="checkbox" class="chk" data-task="${id}" ${done ? "checked" : ""} ${o.disabled ? "disabled" : ""}>
    <span class="t">${pill(t.type)}${esc(t.text)}${tlinks(t)}${o.disabled ? "" : movedTag(id)}${o.ctx ? `<br><small style="color:var(--faint)">Scaglione ${t.day.step.n} · day ${t.day.di + 1}</small>` : ""}</span>${copy}</label>`;
}

/* --- Full plan --- */
/* --- Full plan a pagine --- */
const BLOCK_TABS = { A: "Weeks 1–7", B: "Weeks 8–15", C: "Weeks 16–22", D: "Weeks 23–24", F: "Final" };
function planItems() {
  const items = [];
  window.PLAN.forEach(b => b.steps.forEach((s, si) => {
    items.push({ type: "step", step: s, block: si === 0 ? b : null });
    s.dayIdx.forEach(g => items.push({ type: "day", g }));
  }));
  return items;
}
function itemHtml(it, cg) {
  if (it.type === "step") {
    const s = it.step, tasks = stepTasks(s), done = tasks.filter(isDone).length;
    return (it.block ? `<div class="pp-block"><div class="pp-block-t">${esc(it.block.title)}</div><div class="pp-block-d">${esc(it.block.weeks)} · ${esc(it.block.desc)}</div></div>` : "") +
      `<div class="pp-step"><div class="num ${done === tasks.length ? "ok" : ""}">${done === tasks.length ? "✓" : s.n}</div><div><div class="pp-step-t">${s.final ? "" : "Scaglione " + s.n + " · "}${esc(s.title)}</div>
      <div class="pp-step-w">${esc(s.weeks)} · ${s.days.length} days · ${done}/${tasks.length} done</div></div></div><div class="what">${esc(s.what)}</div>`;
  }
  if (it.type === "cont") return `<div class="pp-cont">${it.step.final ? "" : "Scaglione " + it.step.n + " · "}${esc(it.step.title)} (continued)</div>`;
  const d = DAYS[it.g], now = it.g === cg;
  return `<div class="pp-day" data-g="${it.g}"><div class="day-h ${now ? "now" : ""}">Day ${d.di + 1}${now ? " · next session ✎" : ""}</div>${d.tasks.map(id => taskRow(id)).join("")}</div>`;
}
function paginate(body) {
  const W = body.clientWidth, H = body.clientHeight, key = W + "x" + H;
  if (ui.pp && ui.pp.key === key) return ui.pp;
  const m = document.createElement("div");
  m.style.cssText = `position:absolute;visibility:hidden;left:0;top:0;width:${W}px`;
  body.appendChild(m);
  const hOf = html => { m.innerHTML = html; return m.offsetHeight; };
  const pages = [];
  let cur = null, used = 0;
  const newPage = () => { cur = []; pages.push(cur); used = 0; };
  planItems().forEach(it => {
    if (it.type === "step") { newPage(); cur.push(it); used += hOf(itemHtml(it, -1)); cur.step = it.step; return; }
    const h = hOf(itemHtml(it, -1)) + 6;
    if (used + h > H && cur.length) {
      const st = cur.step; newPage(); cur.step = st;
      const c = { type: "cont", step: st }; cur.push(c); used += hOf(itemHtml(c, -1));
    }
    cur.push(it); used += h;
  });
  m.remove();
  const daySpread = {}, blockSpread = {}, blockPage = {};
  pages.forEach((pg, i) => pg.forEach(it => {
    if (it.type === "day" && daySpread[it.g] == null) daySpread[it.g] = Math.floor(i / 2);
    if (it.type === "step" && it.block && blockSpread[it.block.id] == null) { blockSpread[it.block.id] = Math.floor(i / 2); blockPage[it.block.id] = i; }
  }));
  ui.pp = { key, pages, daySpread, blockSpread, blockPage, spreads: Math.ceil(pages.length / 2) };
  return ui.pp;
}
function renderPlan(L, R) {
  const r = rank(), pct = r.xp / r.max * 100, cg = currentG();
  L.innerHTML = `<div class="pp-top">${homeBtn("plan")}<div class="progress pp-prog"><i style="width:${pct}%"></i></div><span class="pp-pct">${Math.round(pct)}%</span></div>
    <div class="pp-body" id="ppL"></div><button class="pp-arrow left" id="ppPrev" title="Previous page">‹</button>`;
  R.innerHTML = `<div class="pp-top right"><button class="btn sec" id="ppToday">Today's tasks →</button></div>
    <div class="pp-body" id="ppR"></div><button class="pp-arrow right" id="ppNext" title="Next page">›</button>`;
  const pp = paginate($("#ppL"));
  if (ui.pendingBlock) { ui.planSpread = pp.blockSpread[ui.pendingBlock] ?? 0; ui.pendingBlock = null; ui.planScrolled = true; }
  if (!ui.planScrolled) { ui.planSpread = pp.daySpread[cg] ?? 0; ui.planScrolled = true; }
  ui.planSpread = Math.max(0, Math.min(ui.planSpread || 0, pp.spreads - 1));
  const s = ui.planSpread, fill = (el, pg) => { el.innerHTML = pg ? pg.map(it => itemHtml(it, cg)).join("") : `<p class="empty">お疲れ様 — the end of the plan</p>`; };
  fill($("#ppL"), pp.pages[s * 2]); fill($("#ppR"), pp.pages[s * 2 + 1]);
  $("#ppPrev").disabled = s === 0; $("#ppNext").disabled = s >= pp.spreads - 1;
  renderSideTab(false);
}
function planFlipTo(target) {
  const pp = ui.pp; if (!pp) return;
  target = Math.max(0, Math.min(target, pp.spreads - 1));
  if (target === ui.planSpread) return;
  const diff = target - ui.planSpread;
  flip(diff > 0 ? 1 : -1, Math.min(Math.abs(diff), 6), () => { ui.planSpread = target; render(); });
}
function openBlock(id) {
  if (ui.section === "plan" && ui.page.plan === "content" && ui.pp) { planFlipTo(ui.pp.blockSpread[id] ?? 0); return; }
  ui.pendingBlock = id;
  go("plan", { page: "content", keepScroll: true });
}
window.addEventListener("resize", () => { clearTimeout(window.__rz); window.__rz = setTimeout(() => { ui.pp = null; ui.hp = null; if (ui.open) render(); }, 150); });

/* --- History: le sessioni completate, dalla più recente, a pagine --- */
function histSessions(all) {
  const byDate = {};
  Object.entries(D.done).forEach(([id, x]) => { if (TASK[id]) (byDate[x.date] = byDate[x.date] || []).push(id); });
  const q = all ? "" : ui.hq.trim().toLowerCase();
  return Object.keys(byDate).sort().reverse().map(date => {
    const ids = byDate[date].sort((a, b) => D.done[a].at.localeCompare(D.done[b].at));
    const shown = q ? ids.filter(id => TASK[id].text.toLowerCase().includes(q)) : ids;
    const notes = liveNotes().filter(n => n.date === date);
    return { date, ids, shown, pts: ids.reduce((a, id) => a + pts(id), 0), first: D.done[ids[0]].at, last: D.done[ids[ids.length - 1]].at,
      nn: notes.filter(n => n.type === "note").length, nq: notes.filter(n => n.type === "question").length };
  }).filter(sx => sx.shown.length);
}
function histHead(sx, cont) {
  const dt = parseYmd(sx.date), g = TASK[sx.ids[0]].day.g;
  const wd = dt.toLocaleDateString("en-GB", { weekday: "long" }), dm = dt.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const e = D.entries[sx.date], tot = Math.max(sx.ids.length, e && e.tasks ? e.tasks.length : 0);
  const span = sx.ids.length > 1 ? ` · ${fmtTime(sx.first)}–${fmtTime(sx.last)}` : "";
  return `<div class="hs-head ${cont ? "cont" : ""}"><span class="hs-date">Week ${weekOf(g)} · ${wd} · ${dm}${cont ? " (continued)" : ""}</span>${cont ? "" : `<span class="hs-meta">${sx.ids.length}/${tot} tasks done, ${sx.pts} points${span}</span>`}</div>`;
}
function histRow(id) {
  const t = TASK[id];
  return `<div class="hs-row"><span class="hs-ok">✓</span><span class="hs-t">${pill(t.type)}${esc(t.text)}${tlinks(t)}</span><span class="hs-tm">${fmtTime(D.done[id].at)}</span></div>`;
}
function histPaginate(body) {
  const W = body.clientWidth, H = body.clientHeight, list = histSessions();
  const key = `${W}x${H}|${ui.hq}|${Object.keys(D.done).length}|${D.notes.length}`;
  if (ui.hp && ui.hp.key === key) return ui.hp;
  const m = document.createElement("div");
  m.style.cssText = `position:absolute;visibility:hidden;left:0;top:0;width:${W}px`;
  body.appendChild(m);
  const hOf = html => { m.innerHTML = html; return m.offsetHeight; };
  const pages = [[]], dateSpread = {};
  let used = 0;
  const put = (html, sx) => {
    const h = hOf(html);
    if (used + h > H && pages[pages.length - 1].length) {
      pages.push([]); used = 0;
      if (sx) { const c = histHead(sx, true); pages[pages.length - 1].push(c); used += hOf(c); }
    }
    pages[pages.length - 1].push(html); used += h;
  };
  list.forEach(sx => {
    put(`<div class="hs-start"></div>` + histHead(sx));
    dateSpread[sx.date] = Math.floor((pages.length - 1) / 2);
    sx.shown.forEach(id => put(histRow(id), sx));
    const extra = [sx.nn ? `${sx.nn} ${sx.nn === 1 ? "note" : "notes"}` : "", sx.nq ? `${sx.nq} ${sx.nq === 1 ? "question" : "questions"}` : ""].filter(Boolean).join(" · ");
    put(`<div class="hs-foot">${extra ? "+ " + extra : ""}</div>`);
  });
  if (list.length) put(`<p class="hs-end">— the first page of your journal —</p>`);
  m.remove();
  ui.hp = { key, pages, dateSpread, spreads: Math.max(1, Math.ceil(pages.length / 2)), empty: !list.length };
  return ui.hp;
}
function fillHistory() {
  const bl = $("#hL"), br = $("#hR"); if (!bl) return;
  bl.innerHTML = ""; br.innerHTML = "";
  const hp = histPaginate(bl);
  ui.histSpread = Math.max(0, Math.min(ui.histSpread || 0, hp.spreads - 1));
  const s = ui.histSpread;
  if (hp.empty) bl.innerHTML = `<p class="empty">${Object.keys(D.done).length ? "Nothing matches your search" : "Nothing completed yet. Your first ✓ will appear here."}</p>`;
  else { bl.innerHTML = (hp.pages[s * 2] || []).join(""); br.innerHTML = (hp.pages[s * 2 + 1] || []).join(""); }
  $("#hPrev").disabled = s === 0; $("#hNext").disabled = s >= hp.spreads - 1;
}
function renderHistory(L, R) {
  L.innerHTML = `<div class="pp-top">${homeBtn("history")}</div><div class="pp-body" id="hL"></div><button class="pp-arrow left" id="hPrev" title="Newer">‹</button>`;
  R.innerHTML = `<div class="pp-top right"><div class="search h-search">🔍<input id="hQ" placeholder="Search the history" value="${esc(ui.hq)}"><button class="clear-x" id="hQClear" ${ui.hq ? "" : "hidden"}>✕</button></div>
    <button class="btn sec" id="hDates">All sessions <span class="chev-d">⌄</span></button></div><div class="pp-body" id="hR"></div><button class="pp-arrow right" id="hNext" title="Older">›</button>`;
  fillHistory();
}
function histFlipTo(target) {
  const hp = ui.hp; if (!hp) return;
  target = Math.max(0, Math.min(target, hp.spreads - 1));
  if (target === ui.histSpread) return;
  const diff = target - ui.histSpread;
  flip(diff > 0 ? 1 : -1, Math.min(Math.abs(diff), 6), () => { ui.histSpread = target; render(); });
}

/* --- Today --- */
function noteCounts(list) { return { n: list.some(x => x.type === "note"), q: list.some(x => x.type === "question") }; }
function notesPanel(date) {
  const isT = date === today();
  const items = liveNotes().filter(n => n.date === date).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  let html = `<h2 class="h-title nq-title">Notes and questions</h2>`;
  if (ui.composer) {
    const q = ui.composer.type === "question", withAns = q && ui.composer.answer !== null;
    return html + `<div class="composer"><div class="row"><span class="lab">${q ? "❓ New question" : "📝 New note"}</span><span class="spacer"></span>
      <button class="btn sec" id="cImg" title="Add image (or paste one)">🖼</button><button class="btn ter" id="cCancel">Cancel</button><button class="btn primary" id="cSave">✓ Done</button></div>
      <div class="qa"><div class="editor" contenteditable="true" id="cText" data-ph="${q ? "What do you want to ask?" : "Write your note…"}">${toEditorHtml(ui.composer.text)}</div>
      ${q && !withAns ? `<button class="btn sec add-ans" id="cAddAns">+ Add answer</button>` : ""}
      ${withAns ? `<div class="ans-line"></div><textarea id="cAns" placeholder="Write the answer…">${esc(ui.composer.answer)}</textarea>` : ""}</div>
      <div class="hint">Enter to save · Shift+Enter for a new line · paste or 🖼 to add images · links become clickable</div></div>`;
  }
  // Add buttons: secondary (brown) buttons with only the icon; the label shows as a tooltip on hover (data-tip, see style.css)
  if (isT) html += `<div class="add-row"><button class="btn add" data-add="note" data-tip="New note" aria-label="New note">+ 📝</button><button class="btn add" data-add="question" data-tip="New question" aria-label="New question">+ ❓</button></div>`;
  // The filter row is ALWAYS drawn (even with no notes), so nothing jumps down when the first note of a new type is added
  const c = noteCounts(items), both = c.n && c.q;
  // With fewer than 2 types there is nothing to filter: we always show everything, so a filter left on "Notes"/"Questions" goes back to "all"
  if (!both) ui.todayTag = "all";
  const tag = ui.todayTag;
  const labels = { all: "All notes", note: "Notes", question: "Questions" };
  const tags = both
    ? ["all", "note", "question"].map(t => `<button class="ftag ${tag === t ? "on" : ""}" data-tag="${t}">${labels[t]}</button>`).join("")
    // Only one type (or none): "All notes" is shown but disabled — same look as the normal state, just not clickable
    : `<button class="ftag" disabled>${labels.all}</button>`;
  html += `<div class="ftags"><span class="ftags-lab">Filter:</span>${tags}</div>`;
  if (!items.length) return html + (isT ? "" : `<p class="empty">No notes on this day</p>`);
  const list = items.filter(n => tag === "all" || n.type === tag);
  return html + `<div class="scroll" data-keep="todayCards" style="flex:1"><div class="cards">${list.map(n => cardHtml(n)).join("")}</div></div>`;
}
function linkify(t) {
  return esc(t).replace(/(\bhttps?:\/\/[^\s<]+|\bwww\.[^\s<]+)/gi, m => {
    const trail = (m.match(/[.,;:!?)\]]+$/) || [""])[0], url = trail ? m.slice(0, -trail.length) : m;
    const href = /^www\./i.test(url) ? "https://" + url : url;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>${trail}`;
  });
}
const IMG_RE = /(\[\[img:[a-z0-9]+\]\])/i, IMG_ONE = /^\[\[img:([a-z0-9]+)\]\]$/i;
const imgIds = t => [...String(t || "").matchAll(/\[\[img:([a-z0-9]+)\]\]/gi)].map(m => m[1]);
const plain = t => String(t || "").replace(/\[\[img:[a-z0-9]+\]\]/gi, "🖼").replace(/\n{3,}/g, "\n\n").trim();
const tightImgs = t => String(t || "").replace(/\n+(\[\[img:[a-z0-9]+\]\])/gi, "\n$1").replace(/(\[\[img:[a-z0-9]+\]\])\n+/gi, "$1\n");
function richText(t, n) {
  const html = tightImgs(t).split(IMG_RE).map(p => { const m = p.match(IMG_ONE); return m ? `<span class="th inl-view"><img class="thumb" data-img="${m[1]}" alt=""></span>` : linkify(p); }).join("");
  const legacy = n ? (n.images || []).filter(id => !imgIds(t).includes(id)) : [];
  return html + thumbs(legacy);
}
function editorImg(id) { return `<span class="th inl" contenteditable="false"><img class="thumb" data-img="${id}" alt=""><button class="th-x" data-rmimg="${id}" title="Remove image">×</button></span>`; }
function toEditorHtml(t) {
  return String(t || "").split(IMG_RE).map(p => { const m = p.match(IMG_ONE); return m ? editorImg(m[1]) : esc(p).replace(/\n/g, "<br>"); }).join("");
}
function serialize(el) {
  let out = "";
  const walk = node => node.childNodes.forEach(c => {
    if (c.nodeType === 3) out += c.nodeValue;
    else if (c.nodeName === "BR") out += "\n";
    else if (c.classList && c.classList.contains("th")) { const im = c.querySelector("img"); if (im) out += `\n[[img:${im.dataset.img}]]\n`; }
    else { if (/^(DIV|P)$/.test(c.nodeName) && out && !out.endsWith("\n")) out += "\n"; walk(c); }
  });
  walk(el);
  return tightImgs(out).replace(/[\u00a0]/g, " ").replace(/\u200b/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
const val = el => !el ? "" : (el.isContentEditable ? serialize(el) : el.value);
function caretEnd(el) {
  el.focus();
  if (!el.isContentEditable) { el.setSelectionRange(el.value.length, el.value.length); return; }
  const r = document.createRange(); r.selectNodeContents(el); r.collapse(false);
  const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); ui.lastRange = r.cloneRange();
}
function thumbs(ids, editable) {
  if (!ids || !ids.length) return "";
  return `<div class="thumbs">${ids.map(id => `<span class="th"><img class="thumb" data-img="${id}" alt="">${editable ? `<button class="th-x" data-rmimg="${id}" title="Remove image">×</button>` : ""}</span>`).join("")}</div>`;
}
function cardHtml(n, o = {}) {
  const isQ = n.type === "question";
  const ic = `<div class="ic">${isQ ? "❓" : "📝"}</div>`;
  const sel = ui.selected === n.id ? "selected" : "";
  if (o.trash) {
    return `<div class="card trash-card ${isQ ? "q" : ""} ${sel}" data-card="${n.id}">${ic}<div class="body">${isQ ? `<div class="qtext">${richText(n.text, n)}</div>` : `<div class="txt">${richText(n.text, n)}</div>`}${isQ && n.answer ? `<div class="ans"><div class="atext">${linkify(n.answer)}</div></div>` : ""}
      <div class="when">written ${relDay(n.date).toLowerCase()} · deleted at ${fmtTime(n.deletedAt)}</div></div>
      <div class="tools wide"><button class="btn sec" data-restore="${n.id}">Ripristina</button><button class="btn ter danger" data-purge="${n.id}">Elimina</button></div></div>`;
  }
  if (ui.editing === n.id) {
    return `<div class="card ${isQ ? "q" : ""}">${ic}<div class="body"><div class="editor" contenteditable="true" data-edit="${n.id}">${toEditorHtml(ui.editText ?? editSource(n))}</div>
      <div class="edit-act"><button class="btn sec" id="eImg" title="Add image">🖼 Image</button><span class="spacer"></span><button class="btn ter" data-cancel>Cancel</button><button class="btn primary" data-save-edit="${n.id}">✓ Save</button></div></div></div>`;
  }
  let ans = "";
  if (isQ && ui.answering === n.id) {
    ans = `<div class="ans"><textarea data-answer="${n.id}" placeholder="Write the answer…">${esc(n.answer || "")}</textarea>
      <div class="edit-act"><button class="btn ter" data-cancel>Cancel</button><button class="btn primary" data-save-answer="${n.id}">Save answer</button></div></div>`;
  } else if (isQ && n.answer) ans = `<div class="ans"><div class="atext">${linkify(n.answer)}</div></div>`;
  const tools = `<div class="tools"><button title="Edit" data-edit-btn="${n.id}">✍🏻</button>${isQ ? `<button title="Answer" data-answer-btn="${n.id}">❗️</button>` : ""}${o.goto ? `<button title="Open the journal page" data-goto="${n.id}">📖</button>` : ""}</div>`;
  return `<div class="card ${isQ ? "q" : ""} ${sel}" data-card="${n.id}">${ic}<div class="body">${isQ ? `<div class="qtext">${richText(n.text, n)}</div>` : `<div class="txt">${richText(n.text, n)}</div>`}${ans}<div class="when">${fmtTime(n.createdAt)}${n.updatedAt !== n.createdAt ? " · edited" : ""}</div></div>${tools}<button class="trash-btn" data-trash="${n.id}" title="Move to trash">🗑</button></div>`;
}
function stepByN(n) { return STEPS.find(x => String(x.n) === String(n)); }
const weekOf = g => Math.floor(g / 5) + 1;
function viewStep() {
  const v = ui.view;
  if (v.kind === "future") { const fs = futureSession(v.k); return fs && TASK[fs.tasks[0]].day.step; }
  const e = D.entries[v.date], tasks = v.date === today() ? todayTasks() : (e ? e.tasks : []);
  const first = tasks.find(id => !isDone(id)) || tasks[0];
  return first ? TASK[first].day.step : (e && DAYS[e.planDays[0]] ? DAYS[e.planDays[0]].step : null);
}
function viewG() {
  const v = ui.view;
  if (v.kind === "future") { const fs = futureSession(v.k); return fs ? fs.g : 0; }
  const e = D.entries[v.date], tasks = v.date === today() ? todayTasks() : (e ? e.tasks : []);
  const first = tasks.find(id => !isDone(id)) || tasks[0];
  return first ? TASK[first].day.g : (e ? e.planDays[0] : 0);
}
function renderIntro(L, R) {
  const v = ui.view, st = stepByN(v.n); if (!st) return;
  const tasks = stepTasks(st), ex = tasks.filter(id => TASK[id].type === "E").length;
  const projects = tasks.filter(id => TASK[id].type === "P").map(id => TASK[id].text);
  const g0 = st.dayIdx[0], g1 = st.dayIdx[st.dayIdx.length - 1], w0 = weekOf(g0), w1 = weekOf(g1);
  L.innerHTML = `<div class="nav-row">${homeBtn("today")}</div>
    <div class="intro-left"><div class="intro-num">${st.final ? st.n : st.n}</div>
    <div class="intro-sub">${st.final ? "Final project" : `Scaglione ${st.n} of 14`} · ${w0 === w1 ? "week " + w0 : `weeks ${w0}–${w1}`} · ${st.days.length} ${st.days.length === 1 ? "day" : "days"}</div>
    <div class="intro-block">${esc(st.block.title)}</div></div>`;
  R.innerHTML = `<div class="home intro"><h2 class="home-title">${esc(st.title)}</h2>
    <div class="intro-lab">What you'll learn</div><p class="intro-p">${esc(st.what)}</p>
    ${projects.length ? `<div class="intro-lab">Mini-project</div><ul class="intro-ul">${projects.slice(0, 4).map(t => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
    ${ex ? `<div class="intro-lab">Exercises without AI</div><p class="intro-p">${ex} exercises, then Claude checks them.</p>` : ""}
    <div class="home-foot"><button class="btn sec home-go" id="introGo">${v.auto ? "Start the first session →" : "Back to the session →"}</button></div></div>`;
}
function renderToday(L, R) {
  let v = ui.view; const t = today();
  if (v.kind === "intro") { renderIntro(L, R); return; }
  if (v.kind === "date" && v.date === t) {
    const cur = todayTasks().find(id => !isDone(id)), d = cur && TASK[cur].day;
    if (d && d.di === 0 && !(D.introSeen || {})[d.step.n]) { ui.view = { kind: "intro", n: d.step.n, back: { kind: "date", date: t }, auto: true }; renderIntro(L, R); return; }
  }
  const isTodayView = v.kind === "date" && v.date === t;
  const nav = `<div class="nav-row">${homeBtn("today")}</div>`;

  if (v.kind === "future") {
    const fs = futureSession(v.k), g = fs ? fs.g : 0, day = fs ? DAYS[g] : null;
    L.innerHTML = nav + (day ? `<h2 class="h-title nq-title">Coming up</h2><div class="context-card">
      <div class="hand" style="font-size:24px">Scaglione ${day.step.n} · ${esc(day.step.title)}</div>
      <div style="color:var(--muted);font-size:12.5px">${esc(day.step.block.title)} — day ${day.di + 1} of ${day.step.days.length}</div>
      <div class="what">${esc(day.step.what)}</div></div><p class="empty">Notes are written on the day ✎</p>` : `<p class="empty">The plan ends here</p>`);
    R.innerHTML = day ? dayNav() + dateRow(`Week ${weekOf(g)} · upcoming session ${v.k}`, "pencil", fs.queued ? "rearranged · not started" : "planned · not started") + `
      <div class="tod-title"><h2 class="h-title">Tasks of the day</h2></div>
      <div class="meta"><span>about ${sumMin(fs.tasks)} min</span><span></span></div>
      <div class="scroll" style="flex:1">${fs.tasks.map(id => taskRow(id, { disabled: true })).join("")}</div>` : "";
    return;
  }

  L.innerHTML = nav + notesPanel(v.date);
  const e = D.entries[v.date];
  ui.carryPreview = null;
  if (isTodayView && !e) { const f = freshPlan(); ui.carryPreview = { ids: f.carry, from: f.from }; }
  const tasks = isTodayView ? todayTasks() : (e ? e.tasks : []);
  const done = tasks.filter(isDone).length;
  const short = parseYmd(v.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" });
  const head = dayNav() + dateRow(`Week ${weekOf(viewG())} · ${short}`, e ? "active" : "pencil", !e && isTodayView ? "not started yet · tick something to begin" : "") + `
    <div class="tod-title"><h2 class="h-title">Tasks of the day</h2><span class="spacer"></span>${tasks.length ? `<button class="btn ter eye" id="allBtn">👁 ${ui.allTasks ? "hide tasks" : "all tasks"}</button>` : ""}</div>
    <div class="progress"><i style="width:${tasks.length ? done / tasks.length * 100 : 0}%"></i></div>
    <div class="meta"><span>${done} / ${tasks.length} done</span><span>about ${sumMin(tasks)} min</span></div>`
    + (isTodayView ? (() => { const note = e ? e.note : freshPlan().note; return note ? `<div class="carry-note">↪ ${esc(note)}</div>` : ""; })() : "");
  let body = "";
  if (isTodayView) {
    const cur = tasks.find(id => !isDone(id));
    body += `<div class="step-list">${tasks.filter(isDone).map(id => taskRow(id)).join("")}</div>`;
    if (cur) {
      const c = TASK[cur];
      const anim = ui.lastCurrent !== cur; ui.lastCurrent = cur;
      body += `<div class="current-task ${anim ? "anim" : ""}"><div style="font-size:11.5px;color:var(--muted);margin-bottom:6px">Scaglione ${c.day.step.n} · ${esc(c.day.step.title)}</div>
        <div class="row" style="align-items:flex-start"><input type="checkbox" class="chk" data-task="${cur}"><div class="t">${pill(c.type)}${esc(c.text)}${tlinks(c)}${movedTag(cur)}</div></div>
        <div class="act">${c.type === "C" ? `<button class="btn" data-copy="${c.day.step.n}">📋 copia richiesta</button>` : ""}<button class="btn primary" data-complete="${cur}">✓ Done</button></div></div>`;
    } else if (tasks.length) {
      const more = upcoming(1).length > 0;
      body += `<div class="celebrate"><div class="big">Day complete! お疲れ様 🎉</div>
        ${more ? `<p style="font-size:13px;margin:6px 0 10px">Still have energy? You can start the next day of the plan.</p><button class="btn primary" data-continue>Continue with the next day →</button>` : `<p>You finished the whole plan!</p>`}</div>`;
    } else body += `<p class="empty">Nothing planned</p>`;
  } else {
    body += e ? tasks.map(id => taskRow(id)).join("") : `<p class="empty">Nothing written on this day</p>`;
  }
  if (ui.allTasks && tasks.length) body += `<div class="all-panel ${ui.allAnim ? "anim" : ""}"><h4>All tasks of the day</h4>${tasks.map(id => taskRow(id)).join("")}</div>`;
  R.innerHTML = head + `<div class="scroll" data-keep="todayR" style="flex:1">${body}</div>`;
}

function dayNav() {
  const v = ui.view, isT = v.kind === "date" && v.date === today();
  const prevOff = v.kind === "date" && !entryDates().some(d => d < v.date);
  const nextOff = v.kind === "future" ? !futureSession(v.k + 1) : (isT && !futureSession(1));
  return `<div class="day-nav"><button class="btn sec" id="goTo">All sessions <span class="chev-d">⌄</span></button><span class="gap"></span>
    <button class="btn sec" id="dayPrev" ${prevOff ? "disabled" : ""}>← Previous session</button><button class="btn sec" id="dayNext" ${nextOff ? "disabled" : ""}>Next session →</button>${isT ? "" : `<button class="btn sec" id="goToday">Go today</button>`}</div>`;
}
function homeBtn(section) {
  const name = { plan: "Full plan", today: "Daily tasks", notes: "Notes and questions", history: "History" }[section];
  return `<button class="btn ter home-btn" data-home="${section}">📒 ${name} home</button>`;
}
function renderSideTab(onHome) {
  const lt = $("#leftTabs");
  document.querySelectorAll(".tabs .tab").forEach(b => b.classList.remove("moved"));
  document.querySelectorAll(".tab.sub").forEach(b => b.classList.toggle("lit", ui.open && ui.section === "plan"));
  if (!ui.open || onHome || ui.section === "trash") { lt.innerHTML = ""; return; }
  const moving = [$(`.tabs:not(.tabs-left) .tab[data-s="${ui.section}"]`)];
  if (ui.section === "plan" && ui.pp) document.querySelectorAll(".tabs:not(.tabs-left) .tab.sub").forEach(b => {
    if ((ui.pp.blockPage[b.dataset.block] ?? 1e9) <= ui.planSpread * 2) moving.push(b);
  });
  lt.innerHTML = moving.filter(Boolean).map(o => {
    o.classList.add("moved");
    const isSub = o.classList.contains("sub");
    return `<button class="tab ${isSub ? "sub lit" : ui.section + " active"} left" ${isSub ? `data-block="${o.dataset.block}"` : `data-s="${ui.section}"`} style="top:${o.offsetTop}px">${o.innerHTML}</button>`;
  }).join("");
}

function dateRow(text, cls, small) {
  const st = viewStep();
  return `<div class="date-row">${st ? `<button class="btn sec" id="sectionGoal" data-n="${st.n}">🎯 Section goal</button>` : ""}<span class="spacer"></span>
    <div class="date-hand ${cls}">${text}${small ? `<small>${small}</small>` : ""}</div></div>`;
}

/* --- Homepage delle sezioni --- */
const HOME = {
  plan: { title: "The plan to master vibe coding", btn: "The plan", back: "Back to the plan",
    def: "Fourteen short steps from zero to building real apps. Each one ends with something small and useful, plus a few exercises to do without AI. Then the kanji app, as a real product." },
  today: { title: "Daily tasks" },
  history: { title: "History", btn: "See history", back: "Back to the history",
    def: "Everything you've completed, session by session, starting from the most recent. Search for a task or jump to a date." },
  notes: { title: "Notes and questions", btn: "Check notes and questions", back: "Back to notes and questions",
    def: "Everything that comes to mind while studying: notes to remember and questions to answer later, with links and screenshots." }
};
function homeDesc(s) {
  const txt = (D.home && D.home[s]) ?? HOME[s].def;
  if (ui.editingHome === s) return `<div class="home-desc editing"><textarea id="homeEdit">${esc(txt)}</textarea>
    <div class="edit-act"><button class="btn ter" id="homeCancel">Cancel</button><button class="btn primary" id="homeSave">✓ Save</button></div></div>`;
  return `<div class="home-desc"><p>${esc(txt)}</p><button class="home-pen" id="homePen" title="Edit description">✍🏻</button></div>`;
}
function renderHome(L, R) {
  const s = ui.section, h = HOME[s], c = ui.cameFrom[s];
  L.innerHTML = "";
  let body = "", label;
  if (s === "today") {
    const { xp, max } = xpNow(), pct = Math.round(xp / max * 100);
    const nextId = todayTasks().find(id => !isDone(id)), nt = nextId && TASK[nextId];
    body = `<div class="home-dash">
      <div class="meta"><span>Total progress</span><span>${pct}%</span></div>
      <div class="progress"><i style="width:${xp / max * 100}%"></i></div>
      <div class="chart-wrap"><div class="chart-scroll" id="chartScroll">${handChart()}</div></div>
      <div class="next-lab">Next task</div>
      ${nt ? `<div class="next-card">${pill(nt.type)}${esc(nt.text)}${tlinks(nt)}<div class="next-ctx">Scaglione ${nt.day.step.n} · ${esc(nt.day.step.title)}</div></div>` : `<div class="next-card done">All done for today. お疲れ様!</div>`}
    </div>`;
    if (c && c.view) {
      const v = c.view;
      label = v.kind === "future" ? `Back to upcoming session ${v.k} →` : (v.date === today() ? "Back to today's session →" : `Back to session · ${relDay(v.date)} →`);
    } else label = "Next session →";
  } else {
    body = homeDesc(s) + (s === "plan" ? `<div class="home-backup">Backup: <button class="btn ter" id="exportBtn">Export</button>·<button class="btn ter" id="importBtn">Import</button>·<button class="btn ter" id="resetBtn">Reset</button><input type="file" id="importFile" accept="application/json" hidden></div>` : "");
    label = (c ? h.back : h.btn) + " →";
  }
  R.innerHTML = `<div class="home"><h2 class="home-title">${h.title}</h2>${body}<div class="home-foot"><button class="btn ter home-go" id="homeGo">${label}</button></div></div>`;
  const sc = $("#chartScroll"); if (sc) sc.scrollLeft = sc.scrollWidth;
}
function handChart() {
  const t = today(), days = entryDates().filter(d => d < t);
  const vals = days.map(sessionPts), planned = todayTasks().reduce((a, id) => a + pts(id), 0), doneToday = sessionPts(t);
  const step = 64, padL = 26, H = 150, top = 26, bottom = 118;
  const maxV = Math.max(40, planned, doneToday, ...vals);
  const Y = v => bottom - (v / maxV) * (bottom - top);
  const xs = days.map((_, i) => padL + i * step), xT = padL + days.length * step + (days.length ? 18 : 0);
  const W = Math.max(xT + 60, 420);
  const wob = (i, k) => Math.sin(i * 12.9898 + k * 78.233) * 2.2;
  let path = "";
  xs.forEach((x, i) => {
    const y = Y(vals[i]);
    if (!i) { path += `M${x} ${y}`; return; }
    const px = xs[i - 1], py = Y(vals[i - 1]);
    path += ` C${px + step * .35} ${py + wob(i, 1)}, ${x - step * .35} ${y + wob(i, 2)}, ${x} ${y}`;
  });
  const lab = d => { const r = relDay(d); return r === "Yesterday" ? "yest." : r; };
  let g = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" class="hand-chart">`;
  g += `<line x1="8" y1="${bottom + 2}" x2="${W - 8}" y2="${bottom + 4}" class="hc-axis"/>`;
  if (path) g += `<path d="${path}" class="hc-line"/><path d="${path}" class="hc-line hc-line2" transform="translate(.8 .9)"/>`;
  xs.forEach((x, i) => {
    g += `<circle cx="${x}" cy="${Y(vals[i])}" r="4.2" class="hc-dot"/><text x="${x}" y="${Y(vals[i]) - 9}" class="hc-val">${vals[i]}</text><text x="${x}" y="${H - 10}" class="hc-date">${lab(days[i])}</text>`;
  });
  const yT = Y(planned);
  if (xs.length) g += `<path d="M${xs[xs.length - 1]} ${Y(vals[vals.length - 1])} L${xT} ${yT}" class="hc-dash"/>`;
  g += `<rect x="${xT - 24}" y="${top - 18}" width="48" height="${bottom - top + 22}" rx="10" class="hc-today-bg"/>`;
  if (doneToday) g += `<circle cx="${xT}" cy="${Y(doneToday)}" r="4.2" class="hc-dot"/><text x="${xT - 8}" y="${Y(doneToday) + 4}" class="hc-val" text-anchor="end">${doneToday}</text>`;
  g += `<circle cx="${xT}" cy="${yT}" r="5.2" class="hc-plan"/><text x="${xT}" y="${yT - 10}" class="hc-val hc-pv">${planned}</text><text x="${xT}" y="${H - 10}" class="hc-date hc-pv">today</text>`;
  return g + `</svg><div class="hc-legend"><span class="lg-a"></span>points per session <span class="lg-b"></span>planned today</div>`;
}

/* --- Notes --- */

/* --- Notes --- */
function renderNotes(L, R) {
  const sh = $("#spreadHead");
  sh.classList.add("show");
  sh.innerHTML = `<div class="sh-home">${homeBtn("notes")}</div><h2 class="h-title">Notes and questions</h2>
    <div class="filters"><div class="date-filter"><input id="nfDate" placeholder="dd/mm/yyyy" value="${ui.nf.date ? toDmy(ui.nf.date) : ""}">
      ${ui.nf.date ? `<button class="clear-x" id="nfClear" title="Clear date">✕</button>` : ""}<button class="icon-btn" id="nfCal" style="width:28px;height:28px" title="Pick a date">📅</button></div>
      <div class="search">🔍<input id="nfQ" placeholder="Search notes and questions" value="${esc(ui.nf.q)}"><button class="clear-x" id="nfQClear" title="Clear search" ${ui.nf.q ? "" : "hidden"}>✕</button></div></div>`;
  L.classList.add("notes-mode"); R.classList.add("notes-mode");
  renderNotesLists();
}
function renderNotesLists() {
  const L = $("#left"), R = $("#right");
  document.querySelectorAll("[data-keep]").forEach(el => { ui.scroll[el.dataset.keep] = el.scrollTop; });
  const q = ui.nf.q.trim().toLowerCase();
  const f = n => (!ui.nf.date || n.date === ui.nf.date) && (!q || (plain(n.text) + " " + (n.answer || "")).toLowerCase().includes(q));
  const sorted = liveNotes().filter(f).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const notes = sorted.filter(n => n.type === "note"), qs = sorted.filter(n => n.type === "question");
  const grouped = list => {
    if (!list.length) return `<p class="empty">${liveNotes().length ? "Nothing matches" : "Nothing here yet"}</p>`;
    let html = "", last = null;
    list.forEach(n => { if (n.date !== last) { html += `<div class="sep"><span>${relDay(n.date)}</span></div>`; last = n.date; } html += cardHtml(n, { goto: true }); });
    return `<div class="cards">${html}</div>`;
  };
  L.innerHTML = `<div class="col-title">📝 Notes <small>${notes.length}</small></div><div class="scroll" data-keep="nL" style="flex:1">${grouped(notes)}</div>`;
  R.innerHTML = `<div class="col-title">❓ Questions <small>${qs.length}</small></div><div class="scroll" data-keep="nR" style="flex:1">${grouped(qs)}</div>`;
  document.querySelectorAll("[data-keep]").forEach(el => { if (ui.scroll[el.dataset.keep] != null) el.scrollTop = ui.scroll[el.dataset.keep]; });
}

/* --- Cestino --- */
function renderTrash(L, R) {
  const sh = $("#spreadHead");
  sh.classList.add("show");
  sh.innerHTML = `<h2 class="h-title">Cestino</h2>
    <div class="filters"><div class="date-filter"><input id="tfDate" placeholder="dd/mm/yyyy" value="${ui.tf.date ? toDmy(ui.tf.date) : ""}">
      ${ui.tf.date ? `<button class="clear-x" id="tfClear" title="Clear date">✕</button>` : ""}<button class="icon-btn" id="tfCal" style="width:28px;height:28px" title="Deleted on…">📅</button></div>
      <div class="search">🔍<input id="tfQ" placeholder="Search the trash" value="${esc(ui.tf.q)}"><button class="clear-x" id="tfQClear" ${ui.tf.q ? "" : "hidden"}>✕</button></div></div>`;
  L.classList.add("notes-mode"); R.classList.add("notes-mode");
  renderTrashLists();
}
function renderTrashLists() {
  const L = $("#left"), R = $("#right");
  document.querySelectorAll("[data-keep]").forEach(el => { ui.scroll[el.dataset.keep] = el.scrollTop; });
  const q = ui.tf.q.trim().toLowerCase();
  const f = n => (!ui.tf.date || delDate(n) === ui.tf.date) && (!q || (plain(n.text) + " " + (n.answer || "")).toLowerCase().includes(q));
  const sorted = trashNotes().filter(f).sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));
  const grouped = list => {
    if (!list.length) return `<p class="empty">${trashNotes().length ? "Nothing matches" : "The trash is empty"}</p>`;
    let html = "", last = null;
    list.forEach(n => { const d = delDate(n); if (d !== last) { html += `<div class="sep"><span>Deleted ${relDay(d).replace(/^(Today|Yesterday)$/, m => m.toLowerCase())}</span></div>`; last = d; } html += cardHtml(n, { trash: true }); });
    return `<div class="cards">${html}</div>`;
  };
  const notes = sorted.filter(n => n.type === "note"), qs = sorted.filter(n => n.type === "question");
  L.innerHTML = `<div class="col-title">📝 Notes <small>${notes.length}</small></div><div class="scroll" data-keep="tL" style="flex:1">${grouped(notes)}</div>`;
  R.innerHTML = `<div class="col-title">❓ Questions <small>${qs.length}</small></div><div class="scroll" data-keep="tR" style="flex:1">${grouped(qs)}</div>`;
  document.querySelectorAll("[data-keep]").forEach(el => { if (ui.scroll[el.dataset.keep] != null) el.scrollTop = ui.scroll[el.dataset.keep]; });
}
function refreshLists() {
  if (ui.section === "trash") { if (!trashNotes().length) { render0Tabs(); go("notes"); return; } renderTrashLists(); render0Tabs(); }
  else if (ui.section === "notes") { renderNotesLists(); render0Tabs(); }
  else render();
}
function render0Tabs() {
  const tn = trashNotes().length;
  $("#trashTabs").innerHTML = tn ? `<button class="tab trash ${ui.section === "trash" ? "active" : ""}" data-s="trash" title="Cestino">🗑<small>${tn}</small></button>` : "";
}

/* modal di conferma */
function confirmPurge(n) {
  const m = $("#modal"), kind = n.type === "question" ? "questa domanda" : "questa nota";
  m.innerHTML = `<div class="modal" role="dialog" aria-modal="true">
    <h3>Sei sicuro che vuoi eliminare definitivamente ${kind}?</h3>
    <div class="preview-card"><div class="preview" id="mPreview">${richText(n.text, n)}${n.type === "question" && n.answer ? `<div class="p-ans">${linkify(n.answer)}</div>` : ""}</div></div>
    <div class="m-act"><button class="btn primary" id="mKeep">No, mantieni</button><button class="btn ter danger" id="mPurge">Elimina definitivamente</button></div></div>`;
  m.hidden = false;
  m.dataset.id = n.id;
  setTimeout(() => { $("#mKeep").focus(); fadeEdges($("#mPreview")); }, 20);
  $("#mPreview").addEventListener("scroll", e => fadeEdges(e.target));
}
function fadeEdges(el) {
  if (!el) return;
  const more = el.scrollHeight - el.clientHeight > 2;
  el.classList.toggle("fade-top", more && el.scrollTop > 2);
  el.classList.toggle("fade-bottom", more && el.scrollTop + el.clientHeight < el.scrollHeight - 2);
}
function closeModal() { const m = $("#modal"); m.hidden = true; m.innerHTML = ""; }

/* ---------- navigazione e animazioni ---------- */
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function flip(dir, count, mid) {
  if (reduced) { mid(); return; }
  ui.flipping = true;
  const leaf = $("#leaf"), n = Math.max(1, Math.min(count || 1, 6)), dur = n > 1 ? 340 : 900;
  let i = 0;
  const one = () => {
    leaf.className = "leaf " + (dir > 0 ? "fwd" : "back");
    leaf.style.display = "block";
    const sg = dir > 0 ? -1 : 1, far = dir > 0 ? "0 46% 46% 0 / 0 14% 14% 0" : "46% 0 0 46% / 14% 0 0 14%", flat = dir > 0 ? "0 10px 10px 0" : "10px 0 0 10px";
    const a = leaf.animate([
      { transform: "rotateY(0deg) skewY(0deg)", borderRadius: flat, filter: "brightness(1)", boxShadow: "0 0 0 rgba(0,0,0,0)" },
      { offset: .3, transform: `rotateY(${sg * 52}deg) skewY(${sg * 2.5}deg) scaleX(.97)`, borderRadius: far, filter: "brightness(.96)", boxShadow: `${-sg * 18}px 10px 30px rgba(0,0,0,.25)` },
      { offset: .55, transform: `rotateY(${sg * 100}deg) skewY(${sg * 1.5}deg) scaleX(.95)`, borderRadius: far, filter: "brightness(.86)", boxShadow: `${sg * 14}px 10px 26px rgba(0,0,0,.22)` },
      { transform: `rotateY(${sg * 180}deg) skewY(0deg)`, borderRadius: flat, filter: "brightness(1)", boxShadow: "0 0 0 rgba(0,0,0,0)" }
    ], { duration: dur, easing: "cubic-bezier(.42,.0,.25,1)" });
    if (i === n - 1) setTimeout(mid, dur * 0.5);
    a.onfinish = () => { i++; if (i < n) one(); else { leaf.style.display = "none"; ui.flipping = false; } };
  };
  one();
}
function go(section, opts = {}) {
  if (ui.flipping) return;
  const page = section === "trash" ? "content" : (opts.page || "home");
  const wasHere = ui.section === section && ui.page[section] === "content";
  const apply = () => {
    if (section !== ui.section || page !== ui.page[section]) { ui.composer = null; ui.editing = null; ui.answering = null; ui.allTasks = false; ui.editingHome = null; }
    if (section === "plan" && page === "content" && !wasHere) ui.planScrolled = !!opts.keepScroll;
    if (opts.view) { ui.view = opts.view; ui.composer = null; ui.allTasks = false; }
    if (section !== "trash") ui.page[section] = page;
    ui.section = section;
    render();
  };
  if (!ui.open) {
    ui.open = true;
    $("#book").classList.remove("closed"); $("#book").classList.add("open");
    apply();
    return;
  }
  if (section === ui.section && (section === "trash" || page === ui.page[section]) && !opts.view) return;
  let dir = opts.dir;
  if (!dir) dir = section === ui.section ? (page === "content" ? 1 : -1) : (ORDER[section] >= ORDER[ui.section] ? 1 : -1);
  flip(dir, opts.count || 1, apply);
}
function snapshot(section) {
  if (section === "today") return { view: { ...ui.view } };
  return { yes: true };
}
function goHome(section) {
  ui.cameFrom[section] = (ui.section === section && ui.page[section] === "content") ? snapshot(section) : null;
  go(section);
}
function leaveHome() {
  const s = ui.section, c = ui.cameFrom[s];
  ui.cameFrom[s] = null;
  if (s === "today") go("today", { page: "content", view: c ? c.view : { kind: "date", date: today() }, dir: 1 });
  else go(s, { page: "content", keepScroll: !!c, dir: 1 });
}
function viewKey(v) { return v.kind === "future" ? "9999-" + pad(v.k) : v.date; }
function goView(view) {
  const cur = viewKey(ui.view), nxt = viewKey(view);
  const dates = entryDates();
  const span = Math.abs(dates.filter(d => (d > cur && d <= nxt) || (d < cur && d >= nxt)).length) || 1;
  go("today", { page: "content", view, dir: nxt > cur ? 1 : -1, count: Math.min(span, 4) });
}

/* ---------- calendario ---------- */
let calEl = null, calAnchor = null;
function closeCal() { if (calEl) { calEl.remove(); calEl = null; calAnchor = null; } }
function openCal(anchor, { active, selected, onPick, label }) {
  if (calEl && calAnchor === anchor) { closeCal(); return; }
  closeCal();
  calAnchor = anchor;
  const minS = D.startDate < (entryDates()[0] || D.startDate) ? D.startDate : (entryDates()[0] || D.startDate);
  const minD = parseYmd(minS), maxD = new Date(), t = today();
  let cur = selected ? parseYmd(selected) : new Date();
  cur = new Date(cur.getFullYear(), cur.getMonth(), 1);
  calEl = document.createElement("div");
  calEl.className = "cal";
  const stage = $(".stage").getBoundingClientRect(), r = anchor.getBoundingClientRect();
  calEl.style.top = (r.bottom - stage.top + 6) + "px";
  calEl.style.left = Math.min(Math.max(8, r.left - stage.left - 40), stage.width - 280) + "px";
  const draw = (msg = "") => {
    const y = cur.getFullYear(), m = cur.getMonth();
    const first = (new Date(y, m, 1).getDay() + 6) % 7, nd = new Date(y, m + 1, 0).getDate();
    let cells = "";
    for (let i = 0; i < first; i++) cells += "<span></span>";
    for (let d = 1; d <= nd; d++) {
      const s = ymd(new Date(y, m, d));
      const ok = active.has(s) && s >= minS && s <= t;
      cells += `<button class="d ${s === selected ? "sel" : ""} ${s === t ? "today" : ""}" data-d="${s}" ${ok ? "" : "disabled"}>${d}</button>`;
    }
    const years = []; for (let yy = minD.getFullYear(); yy <= maxD.getFullYear(); yy++) years.push(yy);
    const canPrev = new Date(y, m, 1) > new Date(minD.getFullYear(), minD.getMonth(), 1);
    const canNext = new Date(y, m, 1) < new Date(maxD.getFullYear(), maxD.getMonth(), 1);
    calEl.innerHTML = `<div class="type"><input id="calType" placeholder="dd/mm/yyyy"><button class="btn primary" id="calGo">Go</button></div>
      <div class="msg">${esc(msg)}</div>
      <div class="mh"><button class="icon-btn" id="calPrev" style="width:26px;height:26px" ${canPrev ? "" : "disabled"}>‹</button>
        <select id="calM">${MONTHS.map((n, i) => `<option value="${i}" ${i === m ? "selected" : ""}>${n}</option>`).join("")}</select>
        <select id="calY">${years.map(yy => `<option ${yy === y ? "selected" : ""}>${yy}</option>`).join("")}</select>
        <span class="spacer"></span><button class="icon-btn" id="calNext" style="width:26px;height:26px" ${canNext ? "" : "disabled"}>›</button></div>
      <div class="grid">${["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(d => `<span class="dow">${d}</span>`).join("")}${cells}</div>
      <div class="legend">${esc(label)}</div>`;
  };
  const clamp = () => {
    const lo = new Date(minD.getFullYear(), minD.getMonth(), 1), hi = new Date(maxD.getFullYear(), maxD.getMonth(), 1);
    if (cur < lo) cur = lo; if (cur > hi) cur = hi;
  };
  const tryTyped = () => {
    const s = fromDmy($("#calType", calEl).value);
    if (!s) return draw("Use the format dd/mm/yyyy");
    if (s > t) return draw("That day is in the future");
    if (s < minS) return draw("Your journal starts on " + toDmy(minS));
    if (!active.has(s)) { cur = new Date(parseYmd(s).getFullYear(), parseYmd(s).getMonth(), 1); return draw("Nothing written on " + toDmy(s)); }
    const cb = onPick; closeCal(); cb(s);
  };
  calEl.addEventListener("click", e => {
    e.stopPropagation();
    const b = e.target.closest("button"); if (!b || b.disabled) return;
    if (b.id === "calPrev") { cur = new Date(cur.getFullYear(), cur.getMonth() - 1, 1); clamp(); draw(); }
    else if (b.id === "calNext") { cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1); clamp(); draw(); }
    else if (b.id === "calGo") tryTyped();
    else if (b.dataset.d) { const cb = onPick; closeCal(); cb(b.dataset.d); }
  });
  calEl.addEventListener("change", e => {
    if (e.target.id === "calM" || e.target.id === "calY") { cur = new Date(+$("#calY", calEl).value, +$("#calM", calEl).value, 1); clamp(); draw(); }
  });
  calEl.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.id === "calType") tryTyped(); });
  draw();
  $(".stage").appendChild(calEl);
  setTimeout(() => { const i = $("#calType", calEl); if (i) i.focus(); }, 30);
}
document.addEventListener("mousedown", e => {
  if (calEl && !calEl.contains(e.target) && e.target !== calAnchor && !(calAnchor && calAnchor.contains(e.target))) closeCal();
});

/* ---------- chiudere il quaderno cliccando fuori ---------- */
function hasUnsaved() {
  const he = document.querySelector("#homeEdit"); if (he && he.value.trim() !== ((D.home && D.home[ui.section]) ?? HOME[ui.section].def)) return true;
  if (ui.composer && ui.composer.text.trim()) return true;
  const ed = document.querySelector("[data-edit]"), ta = document.querySelector("[data-answer]");
  if (ed && ui.editing && val(ed) !== editSource(noteById(ui.editing))) return true;
  return !!(ta && ta.value.trim() && ta.value !== ta.defaultValue);
}
function closeBook() {
  if (!ui.open || ui.flipping) return;
  if (hasUnsaved()) { toast("Hai un testo non salvato: confermalo o annullalo prima di chiudere"); return; }
  closeCal();
  ui.open = false; ui.section = null; ui.lastSection = null; ui.cameFrom = {};
  ui.composer = null; ui.editing = null; ui.answering = null; ui.allTasks = false;
  const b = $("#book"); b.classList.remove("open"); b.classList.add("closed");
  render();
}
document.addEventListener("mousedown", e => {
  if (!ui.open) return;
  if (e.target.closest(".book, .cal, .toast, .modal-bg, .lightbox")) return;
  closeBook();
});

/* ---------- immagini (IndexedDB, separate dai dati) ---------- */
const IDB = (() => {
  let dbp;
  const open = () => dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open("msj-images", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("img");
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  }));
  const tx = (mode, fn) => open().then(db => new Promise((res, rej) => {
    const t = db.transaction("img", mode), req = fn(t.objectStore("img"));
    t.oncomplete = () => res(req && req.result); t.onerror = () => rej(t.error);
  }));
  return { put: (k, v) => tx("readwrite", st => st.put(v, k)), get: k => tx("readonly", st => st.get(k)), del: k => tx("readwrite", st => st.delete(k)).catch(() => {}) };
})();
const imgCache = new Map();
function hydrateImages(root = document) {
  root.querySelectorAll("img[data-img]:not([src])").forEach(async im => {
    const id = im.dataset.img;
    let u = imgCache.get(id);
    if (!u) { u = await IDB.get(id).catch(() => null); if (u) imgCache.set(id, u); }
    if (u) im.src = u; else im.closest(".th")?.classList.add("missing");
  });
}
new MutationObserver(() => hydrateImages()).observe(document.body, { childList: true, subtree: true });
function shrink(file) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => {
      const im = new Image();
      im.onload = () => {
        const k = Math.min(1, 1600 / Math.max(im.width, im.height));
        const c = document.createElement("canvas"); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
        const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height);
        res(c.toDataURL("image/jpeg", 0.85));
      };
      im.onerror = rej; im.src = fr.result;
    };
    fr.onerror = rej; fr.readAsDataURL(file);
  });
}
async function attachImages(files, target) {
  const ids = [];
  for (const f of files) {
    if (!f.type.startsWith("image/")) continue;
    try {
      const u = await shrink(f), id = "i" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      await IDB.put(id, u); imgCache.set(id, u); ids.push(id);
    } catch (e) { toast("Couldn't read this image"); }
  }
  if (!ids.length) return;
  const ed = target === "composer" ? $("#cText") : (target === "edit" ? $("[data-edit]") : null);
  if (!ed) { ids.forEach(id => IDB.del(id)); return; }
  insertImages(ed, ids);
  if (target === "composer" && ui.composer) ui.composer.text = serialize(ed); else ui.editText = serialize(ed);
  toast(ids.length > 1 ? `${ids.length} images added` : "Image added 🖼");
}
function insertImages(ed, ids) {
  ed.focus();
  let r = ui.lastRange && ed.contains(ui.lastRange.startContainer) ? ui.lastRange : null;
  if (!r) { r = document.createRange(); r.selectNodeContents(ed); r.collapse(false); }
  const frag = document.createDocumentFragment();
  let tail;
  ids.forEach(id => {
    const box = document.createElement("span"); box.innerHTML = editorImg(id);
    frag.appendChild(document.createElement("br")); frag.appendChild(box.firstChild);
    frag.appendChild(document.createElement("br"));
  });
  tail = document.createTextNode("\u200b"); frag.appendChild(tail);
  r.deleteContents(); r.insertNode(frag);
  const nr = document.createRange(); nr.setStart(tail, 1); nr.collapse(true);
  const sel = getSelection(); sel.removeAllRanges(); sel.addRange(nr); ui.lastRange = nr.cloneRange();
}
function removeImage(id) {
  const btn = document.querySelector(`[data-rmimg="${id}"]`), ed = btn && btn.closest(".editor");
  if (btn) btn.closest(".th").remove();
  if (ed && ed.id === "cText" && ui.composer) { ui.composer.text = serialize(ed); IDB.del(id); }
  else if (ed) ui.editText = serialize(ed);
}
function editSource(n) {
  if (!n) return "";
  const extra = (n.images || []).filter(id => !imgIds(n.text).includes(id));
  return n.text + extra.map(id => `\n[[img:${id}]]`).join("");
}
function cancelEditImages() {
  const n = ui.editing && noteById(ui.editing), ed = $("[data-edit]");
  if (n && ed) imgIds(serialize(ed)).filter(id => !(n.images || []).includes(id)).forEach(id => IDB.del(id));
  ui.editImages = []; ui.editText = null;
}
document.addEventListener("selectionchange", () => {
  const s = getSelection(); if (!s.rangeCount) return;
  const r = s.getRangeAt(0), node = r.startContainer, el = node.nodeType === 1 ? node : node.parentElement;
  if (el && el.closest && el.closest(".editor")) ui.lastRange = r.cloneRange();
});
function openLightbox(src) { const lb = $("#lightbox"); lb.innerHTML = `<img src="${src}" alt=""><button class="lb-x" title="Close">×</button>`; lb.hidden = false; }
function closeLightbox() { const lb = $("#lightbox"); lb.hidden = true; lb.innerHTML = ""; }
document.addEventListener("paste", e => {
  const t = e.target.closest ? e.target.closest(".editor") || e.target : e.target;
  const target = t.id === "cText" ? "composer" : (t.dataset && t.dataset.edit ? "edit" : null);
  if (!target) return;
  const files = [...(e.clipboardData?.files || [])].filter(f => f.type.startsWith("image/"));
  e.preventDefault();
  if (files.length) { attachImages(files, target); return; }
  const text = e.clipboardData ? e.clipboardData.getData("text/plain") : "";
  if (text) document.execCommand("insertText", false, text);
});

/* ---------- menu "Other sessions" ---------- */
function openSessions(anchor, opts = {}) {
  if (calEl && calAnchor === anchor) { closeCal(); return; }
  closeCal();
  calAnchor = anchor;
  const t = today(), cur = "cur" in opts ? opts.cur : (ui.view.kind === "date" ? ui.view.date : null);
  const days = opts.dates || [...new Set([t, ...entryDates()])].sort().reverse();
  let html = "", lastMonth = null;
  days.forEach(d => {
    const dt = parseYmd(d), month = dt.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    if (month !== lastMonth) { html += `<div class="sm-sep"><span>${month}</span></div>`; lastMonth = month; }
    const e = D.entries[d];
    html += `<button class="sm-row ${d === cur ? "cur" : ""} ${e ? "" : "noentry"}" data-sess="${d}">
      ${d === t ? `<span class="sm-tag">today</span>` : ""}<span class="sm-date">${dt.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</span></button>`;
  });
  calEl = document.createElement("div");
  calEl.className = "sess-menu";
  calEl.innerHTML = `<div class="sm-list">${html}</div>`;
  const stage = $(".stage").getBoundingClientRect(), r = anchor.getBoundingClientRect();
  calEl.style.top = (r.bottom - stage.top + 6) + "px";
  calEl.style.left = (r.left - stage.left) + "px";
  calEl.addEventListener("click", e => {
    e.stopPropagation();
    const b = e.target.closest("[data-sess]"); if (!b) return;
    const d = b.dataset.sess; closeCal();
    if (opts.onPick) opts.onPick(d); else if (d !== cur) goView({ kind: "date", date: d });
  });
  $(".stage").appendChild(calEl);
  const c = calEl.querySelector(".sm-row.cur"); if (c) c.scrollIntoView({ block: "nearest" });
}

/* ---------- note ---------- */
function addNote(type, text) {
  const d = new Date(), id = "n" + d.getTime().toString(36) + Math.random().toString(36).slice(2, 6);
  D.notes.push({ id, type, text, answer: "", answeredAt: null, createdAt: d.toISOString(), updatedAt: d.toISOString(), date: ymd(d) });
  log("add-" + type, id); save();
  return id;
}
const noteById = id => D.notes.find(n => n.id === id);
const liveNotes = () => D.notes.filter(n => !n.deletedAt);
const trashNotes = () => D.notes.filter(n => n.deletedAt);
const delDate = n => ymd(new Date(n.deletedAt));

/* ---------- eventi ---------- */
document.addEventListener("click", e => {
  if (e.target.closest(".lightbox")) { closeLightbox(); return; }
  if (e.target.classList && e.target.classList.contains("thumb")) { if (e.target.src) openLightbox(e.target.src); e.stopPropagation(); return; }
  if (e.target.closest(".modal-bg")) { if (e.target.classList.contains("modal-bg")) closeModal(); return; }
  const card = e.target.closest("[data-card]");
  if (card && !e.target.closest("button, textarea, a, .thumbs")) {
    const id = card.dataset.card, on = ui.selected !== id;
    document.querySelectorAll(".card.selected").forEach(c => c.classList.remove("selected"));
    ui.selected = on ? id : null;
    if (on) card.classList.add("selected");
    return;
  }
  if (!card && ui.selected && !e.target.closest(".trash-btn")) {
    ui.selected = null;
    document.querySelectorAll(".card.selected").forEach(c => c.classList.remove("selected"));
  }
}, true);
document.addEventListener("click", e => {
  const el = e.target.closest("button, .tab, #cover, .step-h");
  if (!el) return;
  if (el.id === "cover") { go("today"); return; }
  if (el.classList.contains("tab")) { if (el.dataset.block) { openBlock(el.dataset.block); return; } const t = el.dataset.s; t === "trash" ? go("trash") : goHome(t); return; }
  if (el.dataset.home) { goHome(el.dataset.home); return; }
  if (el.classList.contains("step-h")) {
    const n = el.dataset.step;
    ui.planOpen.has(n) ? ui.planOpen.delete(n) : ui.planOpen.add(n);
    render(); return;
  }
  const ds = el.dataset;
  if (ds.complete) { complete(ds.complete); return; }
  if (ds.continue !== undefined) { if (continueNextDay()) { toast("New day of the plan added ✿"); render(); } return; }
  if (ds.copy) { e.preventDefault(); copyRequest(ds.copy); return; }
  if (ds.add) { ui.composer = { type: ds.add, text: "", answer: null, images: [] }; render(); return; }
  if (ds.tag) { ui.todayTag = ds.tag; render(); return; }
  if (ds.rmimg) { removeImage(ds.rmimg); return; }
  if (ds.editBtn) { ui.editing = ds.editBtn; ui.editText = null; ui.answering = null; rerenderKeep(); setTimeout(() => { const ed = $(`[data-edit="${ds.editBtn}"]`); if (ed) caretEnd(ed); }, 20); return; }
  if (ds.answerBtn) { ui.answering = ds.answerBtn; ui.editing = null; rerenderKeep(); focusSoon(`[data-answer="${ds.answerBtn}"]`); return; }
  if (ds.cancel !== undefined) { cancelEditImages(); ui.editing = null; ui.answering = null; rerenderKeep(); return; }
  if (ds.saveEdit) { saveEditing(); rerenderKeep(); return; }
  if (ds.saveAnswer) {
    const n = noteById(ds.saveAnswer), v = $(`[data-answer="${ds.saveAnswer}"]`).value.trim();
    if (n) { n.answer = v; n.answeredAt = v ? nowIso() : null; n.updatedAt = nowIso(); log("answer", n.id); save(); }
    ui.answering = null; rerenderKeep(); return;
  }
  if (ds.trash) {
    const n = noteById(ds.trash);
    if (n) { n.deletedAt = nowIso(); log("trash", n.id); save(); ui.selected = null; refreshLists(); toast(n.type === "question" ? "Domanda spostata nel cestino" : "Nota spostata nel cestino"); }
    return;
  }
  if (ds.restore) {
    const n = noteById(ds.restore);
    if (n) { delete n.deletedAt; log("restore", n.id); save(); ui.selected = null; refreshLists(); toast("Ripristinata ↩︎"); }
    return;
  }
  if (ds.purge) { const n = noteById(ds.purge); if (n) confirmPurge(n); return; }
  if (ds.goto) { const n = noteById(ds.goto); if (n) go("today", { page: "content", view: { kind: "date", date: n.date }, dir: -1, count: 3 }); return; }
  switch (el.id) {
    case "openToday": go("today", { page: "content", view: { kind: "date", date: today() } }); break;
    case "homeGo": leaveHome(); break;
    case "ppPrev": planFlipTo(ui.planSpread - 1); break;
    case "hPrev": histFlipTo(ui.histSpread - 1); break;
    case "hNext": histFlipTo(ui.histSpread + 1); break;
    case "hDates": openSessions(el, { dates: histSessions(true).map(x => x.date), cur: null, onPick: d => { if (ui.hp) histFlipTo(ui.hp.dateSpread[d] ?? 0); } }); break;
    case "hQClear": ui.hq = ""; $("#hQ").value = ""; el.hidden = true; ui.hp = null; ui.histSpread = 0; fillHistory(); break;
    case "ppNext": planFlipTo(ui.planSpread + 1); break;
    case "ppToday": planFlipTo(ui.pp ? (ui.pp.daySpread[currentG()] ?? 0) : 0); break;
    case "introGo": {
      const v = ui.view;
      if (v.auto) { D.introSeen = D.introSeen || {}; D.introSeen[v.n] = nowIso(); log("intro-seen", v.n); save(); }
      go("today", { page: "content", view: v.back || { kind: "date", date: today() }, dir: 1 });
      break;
    }
    case "sectionGoal": {
      const n = el.dataset.n;
      go("today", { page: "content", view: { kind: "intro", n, back: { ...ui.view } }, dir: -1 });
      break;
    }
    case "homePen": ui.editingHome = ui.section; render(); setTimeout(() => { const t = $("#homeEdit"); if (t) { t.focus(); t.setSelectionRange(t.value.length, t.value.length); } }, 20); break;
    case "homeCancel": ui.editingHome = null; render(); break;
    case "homeSave": { const v = $("#homeEdit").value.trim(); D.home = D.home || {}; D.home[ui.section] = v || HOME[ui.section].def; log("edit-home", ui.section); save(); ui.editingHome = null; render(); break; }
    case "allBtn": ui.allTasks = !ui.allTasks; ui.allAnim = ui.allTasks; render(); ui.allAnim = false; break;
    case "cCancel": imgIds(val($("#cText"))).forEach(id => IDB.del(id)); ui.composer = null; render(); break;
    case "cImg": ui.imgTarget = "composer"; $("#imgFile").click(); break;
    case "eImg": ui.imgTarget = "edit"; $("#imgFile").click(); break;
    case "cAddAns": ui.composer.answer = ""; render(); setTimeout(() => { const a = $("#cAns"); if (a) a.focus(); }, 20); break;
    case "cSave": {
      const v = val($("#cText")), imgs = imgIds(v);
      if (!v) { toast("Write something first"); return; }
      const type = ui.composer.type, ansEl = $("#cAns"), ans = ansEl ? ansEl.value.trim() : "";
      const nid = addNote(type, v);
      if (imgs.length) { noteById(nid).images = [...imgs]; save(); }
      if (ans) { const n = noteById(nid); n.answer = ans; n.answeredAt = nowIso(); save(); }
      ui.composer = null;
      // After adding a note we show "All notes", so the new note is always visible
      ui.todayTag = "all";
      render(); toast(type === "note" ? "Note saved 📝" : "Question saved ❓"); break;
    }
    case "dayPrev":
    case "prevDay": {
      const v = ui.view;
      if (v.kind === "future") goView(v.k > 1 ? { kind: "future", k: v.k - 1 } : { kind: "date", date: today() });
      else { const prev = entryDates().filter(d => d < v.date).pop(); if (prev) goView({ kind: "date", date: prev }); }
      break;
    }
    case "dayNext":
    case "nextTasks": {
      const v = ui.view;
      if (v.kind === "future") goView({ kind: "future", k: v.k + 1 });
      else if (v.date === today()) goView({ kind: "future", k: 1 });
      else { const nx = entryDates().find(d => d > v.date && d < today()); goView({ kind: "date", date: nx || today() }); }
      break;
    }
    case "goToday": goView({ kind: "date", date: today() }); break;
    case "goTo": openSessions(el); break;
    case "nfCal": {
      const active = new Set((ui.section === "trash" ? trashNotes().map(delDate) : liveNotes().map(n => n.date)));
      openCal(el, { active, selected: ui.nf.date, label: "Dark days have notes or questions.",
        onPick: d => { ui.nf.date = d; $("#nfDate").value = toDmy(d); renderNotesHead(); renderNotesLists(); } });
      break;
    }
    case "nfClear": ui.nf.date = null; renderNotesHead(); renderNotesLists(); break;
    case "tfCal": {
      const active = new Set(trashNotes().map(delDate));
      openCal(el, { active, selected: ui.tf.date, label: "Dark days: something was deleted that day.",
        onPick: d => { ui.tf.date = d; renderTrash($("#left"), $("#right")); } });
      break;
    }
    case "tfClear": ui.tf.date = null; renderTrash($("#left"), $("#right")); break;
    case "tfQClear": ui.tf.q = ""; $("#tfQ").value = ""; el.hidden = true; renderTrashLists(); break;
    case "mKeep": closeModal(); break;
    case "mPurge": {
      const id = $("#modal").dataset.id, i = D.notes.findIndex(n => n.id === id);
      if (i > -1) { (D.notes[i].images || []).forEach(x => IDB.del(x)); D.notes.splice(i, 1); log("purge", id); save(); }
      closeModal(); ui.selected = null; refreshLists(); toast("Eliminata definitivamente");
      break;
    }
    case "nfQClear": ui.nf.q = ""; $("#nfQ").value = ""; el.hidden = true; renderNotesLists(); break;
    case "exportBtn": exportData(); break;
    case "importBtn": $("#importFile").click(); break;
    case "resetBtn":
      if (el.dataset.sure) { localStorage.removeItem(KEY); D = blank(); save(); ui.planScrolled = false; render(); toast("Fresh start 💪"); }
      else { el.dataset.sure = "1"; el.textContent = "Sure? Click again"; }
      break;
  }
});
function renderNotesHead() { if (ui.section === "notes") renderNotes($("#left"), $("#right")); }
function rerenderKeep() { if (ui.section === "notes") renderNotesLists(); else render(); }
function focusSoon(sel) { setTimeout(() => { const el = $(sel); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }, 20); }

document.addEventListener("change", e => {
  const id = e.target.dataset && e.target.dataset.task;
  if (id) { e.target.checked ? complete(id) : uncomplete(id); return; }
  if (e.target.id === "importFile") importData(e.target.files[0]);
  if (e.target.id === "imgFile") { const files = [...e.target.files]; e.target.value = ""; attachImages(files, ui.imgTarget); }
});
document.addEventListener("input", e => {
  if (e.target.id === "cText" && ui.composer) ui.composer.text = val(e.target);
  if (e.target.id === "cAns" && ui.composer) ui.composer.answer = e.target.value;
  if (e.target.dataset && e.target.dataset.edit) ui.editText = val(e.target);
  if (e.target.id === "hQ") { ui.hq = e.target.value; const x = $("#hQClear"); if (x) x.hidden = !ui.hq; ui.hp = null; ui.histSpread = 0; fillHistory(); }
  if (e.target.id === "tfQ") { ui.tf.q = e.target.value; const x = $("#tfQClear"); if (x) x.hidden = !ui.tf.q; renderTrashLists(); }
  if (e.target.id === "nfQ") { ui.nf.q = e.target.value; const x = $("#nfQClear"); if (x) x.hidden = !ui.nf.q; renderNotesLists(); }
});
document.addEventListener("keydown", e => {
  if (e.target.id === "nfDate" && e.key === "Enter") applyTypedFilter(e.target);
  if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
    const t = e.target.closest ? (e.target.closest(".editor") || e.target) : e.target;
    if (t.id === "cText" || t.id === "cAns") { e.preventDefault(); $("#cSave").click(); }
    else if (t.id === "homeEdit") { e.preventDefault(); $("#homeSave").click(); }
    else if (t.dataset && t.dataset.edit) { e.preventDefault(); $(`[data-save-edit="${t.dataset.edit}"]`).click(); }
    else if (t.dataset && t.dataset.answer) { e.preventDefault(); $(`[data-save-answer="${t.dataset.answer}"]`).click(); }
  }
  if (e.target.id === "tfDate" && e.key === "Enter") { const s2 = fromDmy(e.target.value); if (s2) { ui.tf.date = s2; renderTrash($("#left"), $("#right")); } else if (!e.target.value.trim()) { ui.tf.date = null; renderTrash($("#left"), $("#right")); } else toast("Use the format dd/mm/yyyy"); }
  if (e.key === "Escape" && !$("#lightbox").hidden) { closeLightbox(); return; }
  if (e.key === "Escape" && !$("#modal").hidden) { closeModal(); return; }
  if (e.key === "Escape" && ui.selected) { ui.selected = null; document.querySelectorAll(".card.selected").forEach(c => c.classList.remove("selected")); }
  // Esc = cancel. cancelEditImages() also deletes images pasted during this edit, so they don't stay around unused
  if (e.key === "Escape") { if (calEl) closeCal(); else if (ui.composer) { ui.composer = null; render(); } else if (ui.editing || ui.answering) { if (ui.editing) cancelEditImages(); ui.editing = ui.answering = null; rerenderKeep(); } }
});

/* ---------- edit with a double-click, save by clicking outside ---------- */
// Saves the note being edited (used by "✓ Save", Enter and click outside).
// If the text was emptied, we treat it as "cancel": the old text stays (no accidental deletions).
function saveEditing() {
  const id = ui.editing, n = noteById(id), ed = $(`[data-edit="${id}"]`), v = val(ed);
  if (n && v) {
    if (v !== editSource(n)) { // only save (and mark "edited") if something really changed
      const keep = imgIds(v);
      (n.images || []).filter(x => !keep.includes(x)).forEach(x => IDB.del(x));
      n.text = v; n.images = keep; n.updatedAt = nowIso(); log("edit", n.id); save();
    }
  } else cancelEditImages();
  ui.editing = null; ui.editText = null;
}
// Same idea for the answer under a question; an emptied answer keeps the old one
function saveAnswering() {
  const id = ui.answering, n = noteById(id), ta = $(`[data-answer="${id}"]`), v = ta ? ta.value.trim() : "";
  if (n && v && v !== (n.answer || "")) { n.answer = v; n.answeredAt = nowIso(); n.updatedAt = nowIso(); log("answer", n.id); save(); }
  ui.answering = null;
}

// How many characters come before the point (node, offset) inside "root".
// <br> counts as one character, like the "\n" it stands for. We use it to put the cursor where you double-clicked.
function charOffset(root, node, offset) {
  let count = 0, found = false;
  const walk = el => {
    for (const c of el.childNodes) {
      if (found) return;
      if (c === node) { count += c.nodeType === 3 ? offset : 0; found = true; return; }
      if (c.nodeType === 3) count += c.textContent.length;
      else if (c.nodeName === "BR") count += 1;
      else if (c.nodeType === 1 && c.contains(node)) { walk(c); return; }
      else if (c.nodeType === 1 && !c.matches(".th")) count += c.textContent.length; // images have no text
    }
  };
  if (node.nodeType === 1 && node === root) { // clicked on the box itself: count the children before "offset"
    [...root.childNodes].slice(0, offset).forEach(c => { count += c.nodeName === "BR" ? 1 : c.matches?.(".th") ? 0 : c.textContent.length; });
    return count;
  }
  walk(root);
  return count;
}
// The opposite: puts the cursor after "chars" characters inside the editor (or at the end if the text is shorter)
function caretAt(ed, chars) {
  ed.focus();
  let left = chars, target = null, off = 0;
  const walk = el => {
    for (const c of el.childNodes) {
      if (target) return;
      if (c.nodeType === 3) { if (left <= c.textContent.length) { target = c; off = left; return; } left -= c.textContent.length; }
      else if (c.nodeName === "BR") { if (left === 0) { target = el; off = [...el.childNodes].indexOf(c); return; } left -= 1; }
      else if (c.nodeType === 1 && !c.matches(".th")) walk(c);
    }
  };
  walk(ed);
  if (!target) { caretEnd(ed); return; }
  const r = document.createRange(); r.setStart(target, off); r.collapse(true);
  const s = getSelection(); s.removeAllRanges(); s.addRange(r); ui.lastRange = r.cloneRange();
}

document.addEventListener("dblclick", e => {
  const card = e.target.closest(".card[data-card]");
  // Not on buttons, links or images (those keep their own click), and never in the trash (read-only)
  if (!card || card.classList.contains("trash-card") || e.target.closest("button, a, img, .tools, textarea, .editor")) return;
  const id = card.dataset.card, n = noteById(id);
  if (!n) return;
  // Double-click on the answer of a question → edit the answer
  if (n.type === "question" && e.target.closest(".ans")) {
    ui.answering = id; ui.editing = null; rerenderKeep(); focusSoon(`[data-answer="${id}"]`); return;
  }
  // Otherwise → edit the note/question text, with the cursor where you clicked.
  // We remember the position as "number of characters" because the card is redrawn as an editor.
  const textEl = card.querySelector(".txt, .qtext");
  let chars = null;
  const pos = document.caretRangeFromPoint ? document.caretRangeFromPoint(e.clientX, e.clientY) : null;
  if (textEl && pos && textEl.contains(pos.startContainer)) chars = charOffset(textEl, pos.startContainer, pos.startOffset);
  getSelection().removeAllRanges(); // a double-click also selects a word: we don't want that
  ui.editing = id; ui.editText = null; ui.answering = null; rerenderKeep();
  setTimeout(() => { const ed = $(`[data-edit="${id}"]`); if (!ed) return; chars == null ? caretEnd(ed) : caretAt(ed, chars); }, 20);
});

// Click outside the card being edited = save.
// It listens in the "capture" phase (the "true" at the end), so it runs BEFORE the other click handlers:
// e.g. clicking outside the book saves first, then the book can close normally.
// We save the data right away but redraw the page only after the click has finished,
// otherwise the button you clicked (e.g. "Next session") would disappear before receiving the click.
let pendingRedraw = null; // the old editor box, if the page still has to be redrawn
document.addEventListener("mousedown", e => {
  if (!ui.editing && !ui.answering) return;
  const box = $(ui.editing ? `[data-edit="${ui.editing}"]` : `[data-answer="${ui.answering}"]`);
  const card = box && box.closest(".card");
  // Clicks inside the card (text, 🖼 button, Cancel/Save) or on popups (image preview, calendar, messages) don't count as "outside"
  if (!card || card.contains(e.target) || e.target.closest(".lightbox, .modal-bg, .cal, .toast")) return;
  if (ui.editing) saveEditing(); else saveAnswering();
  pendingRedraw = box;
}, true);
document.addEventListener("mouseup", () => {
  const box = pendingRedraw;
  if (!box) return;
  pendingRedraw = null;
  // setTimeout 0 = "right after the click handlers have run".
  // If the click already redrew the page (the old editor is gone) or a page is turning, there's nothing to do.
  setTimeout(() => { if (box.isConnected && !ui.flipping) rerenderKeep(); }, 0);
});
document.addEventListener("focusout", e => { if (e.target.id === "nfDate") applyTypedFilter(e.target, true); });
function applyTypedFilter(input, quiet) {
  const v = input.value.trim();
  if (!v) { if (ui.nf.date) { ui.nf.date = null; renderNotesHead(); } return; }
  const s = fromDmy(v);
  if (!s) { if (!quiet) toast("Use the format dd/mm/yyyy"); return; }
  if (s === ui.nf.date) return;
  ui.nf.date = s; renderNotesHead();
}

function complete(id) {
  const before = rank().jp, step = TASK[id].day.step, wasComplete = stepComplete(step);
  setDone(id, true);
  const after = rank().jp;
  render();
  if (after !== before) { toast(`🎉 New rank: ${after}!`); confetti(170); }
  else if (!wasComplete && stepComplete(step)) { toast(`✨ Scaglione ${step.n} complete! +${XP.bonus} XP`); confetti(120); }
  else toast(`+${pts(id)} XP`);
}
function uncomplete(id) { setDone(id, false); render(); }

function copyRequest(n) {
  const s = STEPS.find(x => String(x.n) === String(n));
  const ex = stepTasks(s).filter(id => TASK[id].type === "E").map(id => `${TASK[id].text}\n[incolla qui il tuo codice]\n`);
  const text = `Ciao Claude, puoi controllare i miei esercizi dello Scaglione ${s.n} (${s.title})?\n\n${ex.join("\n")}\nCosa è stato facile / dove mi sono bloccato:\n`;
  const ok = () => toast("📋 Copied! Paste it in your chat with Claude");
  if (navigator.clipboard) navigator.clipboard.writeText(text).then(ok, () => fallbackCopy(text, ok)); else fallbackCopy(text, ok);
}
function fallbackCopy(text, cb) {
  const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select();
  try { document.execCommand("copy"); cb(); } catch (e) { toast("Copy failed"); } ta.remove();
}
async function exportData() {
  const images = {};
  for (const id of new Set(D.notes.flatMap(n => [...(n.images || []), ...imgIds(n.text)]))) { const u = await IDB.get(id).catch(() => null); if (u) images[id] = u; }
  const blob = new Blob([JSON.stringify({ ...D, images }, null, 2)], { type: "application/json" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `my-study-journal-${today()}.json`; a.click();
  toast("Backup downloaded");
}
function importData(f) {
  if (!f) return;
  f.text().then(t => {
    try {
      const x = JSON.parse(t); if (!x.done || !x.entries) throw 0;
      const images = x.images || {}; delete x.images;
      Object.entries(images).forEach(([id, u]) => { IDB.put(id, u); imgCache.set(id, u); });
      D = Object.assign(blank(), x); save(); render(); toast("Backup imported");
    }
    catch (e) { toast("This file is not a valid backup"); }
  });
}

/* ---------- toast e coriandoli ---------- */
let tt;
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("show"), 2200); }
const cv = $("#confetti"), cx = cv.getContext("2d");
let parts = [];
function confetti(n) {
  if (reduced) return;
  cv.width = innerWidth; cv.height = innerHeight;
  const cols = ["#c0392b", "#d6a03a", "#4a8b5c", "#3a6ea5", "#ffb3a7"], start = !parts.length;
  for (let i = 0; i < n; i++) parts.push({ x: innerWidth * .62, y: innerHeight * .35, vx: (Math.random() - .5) * 14, vy: Math.random() * -12 - 2, s: Math.random() * 6 + 4, c: cols[i % cols.length], r: Math.random() * 6, life: 120 });
  if (start) requestAnimationFrame(tick);
}
function tick() {
  cx.clearRect(0, 0, cv.width, cv.height);
  parts.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .35; p.vx *= .99; p.r += .1; p.life--; cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.fillStyle = p.c; cx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6); cx.restore(); });
  parts = parts.filter(p => p.life > 0 && p.y < cv.height + 20);
  if (parts.length) requestAnimationFrame(tick); else cx.clearRect(0, 0, cv.width, cv.height);
}

/* finestra: alla prima apertura prova a dare la misura di un quaderno */
try { if (window.outerWidth > screen.availWidth * 0.97) { window.resizeTo(1320, 900); window.moveTo((screen.availWidth - 1320) / 2, (screen.availHeight - 900) / 2); } } catch (e) {}

// Tooltip dei tag: clic apre/chiude (senza spuntare il task), clic fuori o uscita del mouse chiude
document.addEventListener("click", e => {
  const p = e.target.closest(".pill.ico");
  document.querySelectorAll(".pill.tip-open").forEach(x => { if (x !== p) x.classList.remove("tip-open"); });
  if (p) { e.preventDefault(); e.stopPropagation(); p.classList.toggle("tip-open"); }
}, true);
document.addEventListener("mouseout", e => { const p = e.target.closest && e.target.closest(".pill.tip-open"); if (p && !p.contains(e.relatedTarget)) p.classList.remove("tip-open"); });
render();
resumeLast();
})();
