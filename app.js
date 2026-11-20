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
const XP = { L: 10, P: 30, E: 15, C: 10, R: 5, bonus: 50 };
const DAYS = [], TASK = {}, STEPS = [];
let order = 0;
window.PLAN.forEach(b => b.steps.forEach(s => {
  s.block = b; s.dayIdx = []; STEPS.push(s);
  s.days.forEach((arr, di) => {
    const day = { g: DAYS.length, step: s, di, tasks: [] };
    arr.forEach((raw, ti) => {
      const id = `${s.n}-${di}-${ti}`;
      TASK[id] = { id, type: raw[0], text: raw.slice(2), day, order: order++ };
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

function nextPlanDay(excludeDate) {
  let max = -1;
  for (const [d, e] of Object.entries(D.entries)) {
    if (d === excludeDate) continue;
    e.planDays.forEach(g => { if (g > max) max = g; });
  }
  let g = max + 1;
  while (g < DAYS.length && DAYS[g].tasks.every(isDone)) g++;
  return g;
}
function freshTodayTasks() {
  const t = today(), seen = new Set(), carry = [];
  entryDates().filter(d => d < t).forEach(d => D.entries[d].tasks.forEach(id => {
    if (TASK[id] && !isDone(id) && !seen.has(id)) { seen.add(id); carry.push(id); }
  }));
  carry.sort((a, b) => TASK[a].order - TASK[b].order);
  const g = nextPlanDay(t), tasks = [...carry], planDays = [];
  if (g < DAYS.length) { planDays.push(g); DAYS[g].tasks.forEach(id => { if (!seen.has(id)) tasks.push(id); }); }
  return { tasks, planDays };
}
const todayTasks = () => (D.entries[today()] ? D.entries[today()].tasks : freshTodayTasks().tasks);
function ensureTodayEntry() {
  const t = today();
  if (!D.entries[t]) {
    const f = freshTodayTasks();
    D.entries[t] = { tasks: f.tasks, planDays: f.planDays, startedAt: nowIso(), updatedAt: nowIso(), completedAt: null };
    log("start-day", t);
  }
  return D.entries[t];
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
  const e = ensureTodayEntry(), g = nextPlanDay();
  if (g >= DAYS.length) return false;
  e.planDays.push(g);
  DAYS[g].tasks.forEach(id => { if (!e.tasks.includes(id)) e.tasks.push(id); });
  e.completedAt = null; e.updatedAt = nowIso();
  log("continue", g); save();
  return true;
}
function futureG(k) {
  const base = D.entries[today()] ? nextPlanDay() : nextPlanDay(today()) + 1;
  return base + k - 1;
}
function currentG() {
  const cur = todayTasks().find(id => !isDone(id));
  return cur ? TASK[cur].day.g : Math.min(nextPlanDay(), DAYS.length - 1);
}

/* ---------- XP e gradi ---------- */
function xpNow() {
  let xp = 0, max = 0;
  STEPS.forEach(s => {
    stepTasks(s).forEach(id => { const v = XP[TASK[id].type] || 10; max += v; if (isDone(id)) xp += v; });
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
  planOpen: new Set(), planScrolled: false, lastCurrent: null, allAnim: false, selected: null, editText: null, editImages: [], imgTarget: null, tf: { date: null, q: "" }, nf: { date: null, q: "" }, scroll: {}, lastSection: null, flipping: false
};
const ORDER = { plan: 0, today: 1, notes: 2, trash: 3 };

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
  if (ui.section === "plan") renderPlan(L, R);
  else if (ui.section === "today") renderToday(L, R);
  else if (ui.section === "trash") renderTrash(L, R);
  else renderNotes(L, R);
  if (same) document.querySelectorAll("[data-keep]").forEach(el => { if (ui.scroll[el.dataset.keep] != null) el.scrollTop = ui.scroll[el.dataset.keep]; });
  ui.lastSection = ui.section;
  const ta = $("#cText"); if (ta && document.activeElement !== ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
}

function pill(type) { return `<span class="pill ${type}">${TYPES[type] || ""}</span>`; }
function taskRow(id, o = {}) {
  const t = TASK[id]; if (!t) return "";
  const done = isDone(id);
  const copy = t.type === "C" && !o.disabled ? `<button class="btn copy" data-copy="${t.day.step.n}">copia richiesta</button>` : "";
  return `<label class="task ${done ? "done" : ""}"><input type="checkbox" class="chk" data-task="${id}" ${done ? "checked" : ""} ${o.disabled ? "disabled" : ""}>
    <span class="t">${pill(t.type)}${esc(t.text)}${o.ctx ? `<br><small style="color:var(--faint)">Scaglione ${t.day.step.n} · day ${t.day.di + 1}</small>` : ""}</span>${copy}</label>`;
}

/* --- Full plan --- */
function renderPlan(L, R) {
  const r = rank(), pct = r.xp / r.max * 100, cg = currentG(), curStep = DAYS[cg] ? DAYS[cg].step : null;
  if (!ui.planScrolled && curStep) ui.planOpen.add(String(curStep.n));
  let body = "";
  window.PLAN.forEach(b => {
    body += `<div class="block-h"><h3>${esc(b.title)} <small style="color:var(--muted);font-weight:600">· ${esc(b.weeks)}</small></h3><p>${esc(b.desc)}</p></div>`;
    b.steps.forEach(s => {
      const tasks = stepTasks(s), done = tasks.filter(isDone).length, complete = done === tasks.length;
      const open = ui.planOpen.has(String(s.n));
      let days = "";
      if (open) s.dayIdx.forEach((g, i) => {
        days += `<div class="day-h ${g === cg ? "now" : ""}">Day ${i + 1}${g === cg ? " · you are here ✎" : ""}</div>` + DAYS[g].tasks.map(id => taskRow(id)).join("");
      });
      body += `<div class="step ${open ? "open" : ""} ${complete ? "complete" : ""} ${s === curStep ? "current" : ""}" data-stepbox="${s.n}">
        <div class="step-h" data-step="${s.n}"><div class="num">${complete ? "✓" : s.n}</div>
          <div><div class="tt">${s.final ? "" : "Scaglione " + s.n + " · "}${esc(s.title)}</div><div class="wk">${esc(s.weeks)} · ${s.days.length} days</div></div>
          <div class="cnt">${done}/${tasks.length}<div class="mini"><i style="width:${done / tasks.length * 100}%"></i></div></div><div class="chev">▶</div></div>
        <div class="step-b"><div class="what">${esc(s.what)}</div>${days}</div></div>`;
    });
  });
  const badges = Object.entries(BADGES).map(([id, lab]) => {
    const b = window.PLAN.find(x => x.id === id);
    return `<span class="badge ${b.steps.every(stepComplete) ? "on" : ""}">${lab}</span>`;
  }).join("");
  L.innerHTML = `<div class="scroll" data-keep="plan" id="planScroll" style="flex:1">
    <div class="plan-head">
      <div class="rank-row"><div class="seal">${r.k}</div><div><b>${r.jp} · ${r.it}</b><div class="xp">${r.xp} / ${r.max} XP</div></div></div>
      <div class="progress"><i style="width:${pct}%"></i></div>
      <div class="meta"><span>${Math.round(pct)}% done</span><span>${r.next ? `next rank: ${r.next.jp} at ${r.next.at} XP` : "highest rank!"}</span></div>
      <div class="badges">${badges}</div>
    </div>
    ${body}
    <div class="plan-foot"><button class="btn" id="exportBtn">Export backup</button><button class="btn" id="importBtn">Import backup</button><button class="btn" id="resetBtn">Reset</button></div>
  </div><input type="file" id="importFile" accept="application/json" hidden>`;

  const tt = todayTasks(), day = DAYS[cg];
  R.innerHTML = `<h2 class="h-title">To do next</h2>
    <div style="color:var(--muted);font-size:13px;margin:4px 0 12px">${day ? `Scaglione ${day.step.n} · ${esc(day.step.title)} — day ${day.di + 1} of ${day.step.days.length}` : "Plan completed 🎉"}</div>
    <div class="scroll" data-keep="planR" style="flex:1">${tt.length ? tt.map(id => taskRow(id, { ctx: TASK[id].day.g !== cg })).join("") : `<p class="empty">Nothing left to do. お疲れ様!</p>`}</div>
    <div class="right-foot"><button class="btn ter" id="openToday">Open today's page →</button></div>`;

  if (!ui.planScrolled) {
    ui.planScrolled = true;
    requestAnimationFrame(() => {
      const sc = $("#planScroll"), box = curStep && $(`[data-stepbox="${curStep.n}"]`), head = $(".plan-head");
      if (sc && box) sc.scrollTop = box.offsetTop - head.offsetHeight - 14;
    });
  }
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
      <div class="qa"><textarea id="cText" placeholder="${q ? "What do you want to ask?" : "Write your note…"}">${esc(ui.composer.text)}</textarea>
      ${q && !withAns ? `<button class="btn sec add-ans" id="cAddAns">+ Add answer</button>` : ""}
      ${withAns ? `<div class="ans-line"></div><textarea id="cAns" placeholder="Write the answer…">${esc(ui.composer.answer)}</textarea>` : ""}</div>
      ${thumbs(ui.composer.images, true)}
      <div class="hint">Enter to save · Shift+Enter for a new line · paste or 🖼 to add images · links become clickable</div></div>`;
  }
  if (isT) html += `<div class="add-row"><button class="btn" data-add="note">+ 📝</button><button class="btn" data-add="question">+ ❓</button></div>`;
  if (!items.length) return html + (isT ? "" : `<p class="empty">No notes on this day</p>`);
  const c = noteCounts(items);
  let tag = ui.todayTag;
  let tags = "";
  if (c.n && c.q) {
    tags = ["all", "note", "question"].map(t => `<button class="tag ${tag === t ? "on" : ""}" data-tag="${t}">${{ all: "All", note: "Notes", question: "Questions" }[t]}</button>`).join("");
  } else {
    tag = c.n ? "note" : "question";
    tags = `<button class="tag on">${c.n ? "Notes" : "Questions"}</button>`;
  }
  const list = items.filter(n => tag === "all" || n.type === tag);
  return html + `<div class="tags">${tags}</div><div class="scroll" data-keep="todayCards" style="flex:1"><div class="cards">${list.map(n => cardHtml(n)).join("")}</div></div>`;
}
function linkify(t) {
  return esc(t).replace(/(\bhttps?:\/\/[^\s<]+|\bwww\.[^\s<]+)/gi, m => {
    const trail = (m.match(/[.,;:!?)\]]+$/) || [""])[0], url = trail ? m.slice(0, -trail.length) : m;
    const href = /^www\./i.test(url) ? "https://" + url : url;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>${trail}`;
  });
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
    return `<div class="card ${isQ ? "q" : ""} ${sel}" data-card="${n.id}">${ic}<div class="body">${isQ ? `<div class="qtext">${linkify(n.text)}</div>` : `<div class="txt">${linkify(n.text)}</div>`}${thumbs(n.images)}${isQ && n.answer ? `<div class="ans"><div class="atext">${linkify(n.answer)}</div></div>` : ""}
      <div class="when">written ${relDay(n.date).toLowerCase()} · deleted at ${fmtTime(n.deletedAt)}</div></div>
      <div class="tools wide"><button class="btn sec" data-restore="${n.id}">↩︎ Ripristina</button><button class="btn ter danger" data-purge="${n.id}">Elimina</button></div></div>`;
  }
  if (ui.editing === n.id) {
    return `<div class="card ${isQ ? "q" : ""}">${ic}<div class="body"><textarea data-edit="${n.id}">${esc(ui.editText ?? n.text)}</textarea>${thumbs(ui.editImages, true)}
      <div class="edit-act"><button class="btn sec" id="eImg" title="Add image">🖼 Image</button><span class="spacer"></span><button class="btn ter" data-cancel>Cancel</button><button class="btn primary" data-save-edit="${n.id}">✓ Save</button></div></div></div>`;
  }
  let ans = "";
  if (isQ && ui.answering === n.id) {
    ans = `<div class="ans"><textarea data-answer="${n.id}" placeholder="Write the answer…">${esc(n.answer || "")}</textarea>
      <div class="edit-act"><button class="btn ter" data-cancel>Cancel</button><button class="btn primary" data-save-answer="${n.id}">Save answer</button></div></div>`;
  } else if (isQ && n.answer) ans = `<div class="ans"><div class="atext">${linkify(n.answer)}</div></div>`;
  const tools = `<div class="tools"><button title="Edit" data-edit-btn="${n.id}">✍🏻</button>${isQ ? `<button title="Answer" data-answer-btn="${n.id}">❗️</button>` : ""}${o.goto ? `<button title="Open the journal page" data-goto="${n.id}">📖</button>` : ""}</div>`;
  return `<div class="card ${isQ ? "q" : ""} ${sel}" data-card="${n.id}">${ic}<div class="body">${isQ ? `<div class="qtext">${linkify(n.text)}</div>` : `<div class="txt">${linkify(n.text)}</div>`}${thumbs(n.images)}${ans}<div class="when">${fmtTime(n.createdAt)}${n.updatedAt !== n.createdAt ? " · edited" : ""}</div></div>${tools}<button class="trash-btn" data-trash="${n.id}" title="Move to trash">🗑</button></div>`;
}
function renderToday(L, R) {
  const v = ui.view, t = today(), isTodayView = v.kind === "date" && v.date === t;
  const prevDisabled = v.kind === "date" && !entryDates().some(d => d < v.date);
  const nav = `<div class="nav-row"><button class="icon-btn" id="prevDay" title="Previous page" ${prevDisabled ? "disabled" : ""}>←</button>
    <button class="btn" id="goTo">📅 Go to…</button>${isTodayView ? "" : `<button class="btn" id="goToday">Go Today</button>`}</div>`;

  if (v.kind === "future") {
    const g = futureG(v.k), day = DAYS[g];
    L.innerHTML = nav + (day ? `<h2 class="h-title nq-title">Coming up</h2><div class="context-card">
      <div class="hand" style="font-size:24px">Scaglione ${day.step.n} · ${esc(day.step.title)}</div>
      <div style="color:var(--muted);font-size:12.5px">${esc(day.step.block.title)} — day ${day.di + 1} of ${day.step.days.length}</div>
      <div class="what">${esc(day.step.what)}</div></div><p class="empty">Notes are written on the day ✎</p>` : `<p class="empty">The plan ends here</p>`);
    R.innerHTML = day ? dayNav() + `<div class="date-hand pencil">Day ${g + 1} of the plan<small>planned · not started</small></div>
      <div class="tod-title"><h2 class="h-title">Tasks of the day</h2></div>
      <div class="scroll" style="flex:1">${day.tasks.map(id => taskRow(id, { disabled: true })).join("")}</div>` : "";
    return;
  }

  L.innerHTML = nav + notesPanel(v.date);
  const e = D.entries[v.date];
  const tasks = isTodayView ? todayTasks() : (e ? e.tasks : []);
  const done = tasks.filter(isDone).length;
  const head = dayNav() + `<div class="date-hand ${e ? "active" : "pencil"}">${fmtLong(v.date)}${!e && isTodayView ? "<small>not started yet · tick something to begin</small>" : ""}</div>
    <div class="tod-title"><h2 class="h-title">Tasks of the day</h2><span class="spacer"></span>${tasks.length ? `<button class="btn ter eye" id="allBtn">👁 ${ui.allTasks ? "hide tasks" : "all tasks"}</button>` : ""}</div>
    <div class="progress"><i style="width:${tasks.length ? done / tasks.length * 100 : 0}%"></i></div>
    <div class="meta"><span>${done} / ${tasks.length} done</span><span></span></div>`;
  let body = "";
  if (isTodayView) {
    const cur = tasks.find(id => !isDone(id));
    body += `<div class="step-list">${tasks.filter(isDone).map(id => taskRow(id)).join("")}</div>`;
    if (cur) {
      const c = TASK[cur];
      const anim = ui.lastCurrent !== cur; ui.lastCurrent = cur;
      body += `<div class="current-task ${anim ? "anim" : ""}"><div style="font-size:11.5px;color:var(--muted);margin-bottom:6px">Scaglione ${c.day.step.n} · ${esc(c.day.step.title)}</div>
        <div class="row" style="align-items:flex-start"><input type="checkbox" class="chk" data-task="${cur}"><div class="t">${pill(c.type)}${esc(c.text)}</div></div>
        <div class="act">${c.type === "C" ? `<button class="btn" data-copy="${c.day.step.n}">📋 copia richiesta</button>` : ""}<button class="btn primary" data-complete="${cur}">✓ Done</button></div></div>`;
    } else if (tasks.length) {
      const more = nextPlanDay() < DAYS.length;
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
  const v = ui.view;
  const prevOff = v.kind === "date" && !entryDates().some(d => d < v.date);
  const nextOff = v.kind === "future" ? futureG(v.k) + 1 >= DAYS.length : (v.date === today() && futureG(1) >= DAYS.length);
  return `<div class="day-nav"><button class="btn ter" id="dayPrev" ${prevOff ? "disabled" : ""}>← previous</button><span>·</span><button class="btn ter" id="dayNext" ${nextOff ? "disabled" : ""}>next tasks →</button></div>`;
}

/* --- Notes --- */
function renderNotes(L, R) {
  const sh = $("#spreadHead");
  sh.classList.add("show");
  sh.innerHTML = `<h2 class="h-title">Notes and questions</h2>
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
  const f = n => (!ui.nf.date || n.date === ui.nf.date) && (!q || (n.text + " " + (n.answer || "")).toLowerCase().includes(q));
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
  const f = n => (!ui.tf.date || delDate(n) === ui.tf.date) && (!q || (n.text + " " + (n.answer || "")).toLowerCase().includes(q));
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
    <div class="preview">${esc(n.text)}</div>
    <div class="m-act"><button class="btn primary" id="mKeep">No, mantieni</button><button class="btn ter danger" id="mPurge">Elimina definitivamente</button></div></div>`;
  m.hidden = false;
  m.dataset.id = n.id;
  setTimeout(() => $("#mKeep").focus(), 20);
}
function closeModal() { const m = $("#modal"); m.hidden = true; m.innerHTML = ""; }

/* ---------- navigazione e animazioni ---------- */
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function flip(dir, count, mid) {
  if (reduced) { mid(); return; }
  ui.flipping = true;
  const leaf = $("#leaf"), n = Math.max(1, Math.min(count || 1, 5)), dur = n > 1 ? 280 : 620;
  let i = 0;
  const one = () => {
    leaf.className = "leaf " + (dir > 0 ? "fwd" : "back");
    leaf.style.display = "block";
    const a = leaf.animate([
      { transform: "rotateY(0deg)", filter: "brightness(1)" },
      { transform: `rotateY(${dir > 0 ? -90 : 90}deg)`, filter: "brightness(.85)" },
      { transform: `rotateY(${dir > 0 ? -180 : 180}deg)`, filter: "brightness(1)" }
    ], { duration: dur, easing: "cubic-bezier(.45,.05,.35,1)" });
    if (i === n - 1) setTimeout(mid, dur * 0.5);
    a.onfinish = () => { i++; if (i < n) one(); else { leaf.style.display = "none"; ui.flipping = false; } };
  };
  one();
}
function go(section, opts = {}) {
  if (ui.flipping) return;
  const apply = () => {
    if (section !== ui.section) { ui.composer = null; ui.editing = null; ui.answering = null; ui.allTasks = false; }
    if (section === "plan" && ui.section !== "plan") ui.planScrolled = false;
    if (section === "today" && !opts.view && ui.section !== "today") ui.view = { kind: "date", date: today() };
    if (opts.view) { ui.view = opts.view; ui.composer = null; ui.allTasks = false; }
    ui.section = section;
    render();
  };
  if (!ui.open) {
    ui.open = true;
    $("#book").classList.remove("closed"); $("#book").classList.add("open");
    apply();
    return;
  }
  if (section === ui.section && !opts.view) {
    if (section === "today" && !(ui.view.kind === "date" && ui.view.date === today())) { go("today", { view: { kind: "date", date: today() }, dir: 1 }); }
    return;
  }
  const dir = opts.dir || (ORDER[section] >= ORDER[ui.section] ? 1 : -1);
  flip(dir, opts.count || 1, apply);
}
function viewKey(v) { return v.kind === "future" ? "9999-" + pad(v.k) : v.date; }
function goView(view) {
  const cur = viewKey(ui.view), nxt = viewKey(view);
  const dates = entryDates();
  const span = Math.abs(dates.filter(d => (d > cur && d <= nxt) || (d < cur && d >= nxt)).length) || 1;
  go("today", { view, dir: nxt > cur ? 1 : -1, count: Math.min(span, 4) });
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
  if (ui.composer && (ui.composer.text.trim() || (ui.composer.images || []).length)) return true;
  const ta = document.querySelector("[data-edit], [data-answer]");
  return !!(ta && ta.value.trim() && ta.value !== ta.defaultValue);
}
function closeBook() {
  if (!ui.open || ui.flipping) return;
  if (hasUnsaved()) { toast("Hai un testo non salvato: confermalo o annullalo prima di chiudere"); return; }
  closeCal();
  ui.open = false; ui.section = null; ui.lastSection = null;
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
  if (target === "composer" && ui.composer) { ui.composer.images = [...(ui.composer.images || []), ...ids]; render(); }
  else if (target === "edit" && ui.editing) { ui.editImages = [...ui.editImages, ...ids]; rerenderKeep(); }
  else ids.forEach(id => IDB.del(id));
  toast(ids.length > 1 ? `${ids.length} images added` : "Image added 🖼");
}
function removeImage(id) {
  if (ui.composer && (ui.composer.images || []).includes(id)) { ui.composer.images = ui.composer.images.filter(x => x !== id); IDB.del(id); render(); return; }
  if (ui.editing) { ui.editText = ($("[data-edit]") || {}).value ?? ui.editText; ui.editImages = ui.editImages.filter(x => x !== id); rerenderKeep(); }
}
function cancelEditImages() {
  const n = ui.editing && noteById(ui.editing);
  if (n) ui.editImages.filter(id => !(n.images || []).includes(id)).forEach(id => IDB.del(id));
  ui.editImages = []; ui.editText = null;
}
function openLightbox(src) { const lb = $("#lightbox"); lb.innerHTML = `<img src="${src}" alt=""><button class="lb-x" title="Close">×</button>`; lb.hidden = false; }
function closeLightbox() { const lb = $("#lightbox"); lb.hidden = true; lb.innerHTML = ""; }
document.addEventListener("paste", e => {
  const t = e.target, target = (t.id === "cText" || t.id === "cAns") ? "composer" : (t.dataset && t.dataset.edit ? "edit" : null);
  if (!target) return;
  const files = [...(e.clipboardData?.files || [])].filter(f => f.type.startsWith("image/"));
  if (!files.length) return;
  e.preventDefault();
  if (target === "edit") ui.editText = t.value;
  attachImages(files, target);
});

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
  if (el.classList.contains("tab")) { go(el.dataset.s); return; }
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
  if (ds.editBtn) { const n0 = noteById(ds.editBtn); ui.editing = ds.editBtn; ui.editText = null; ui.editImages = [...((n0 && n0.images) || [])]; ui.answering = null; rerenderKeep(); focusSoon(`[data-edit="${ds.editBtn}"]`); return; }
  if (ds.answerBtn) { ui.answering = ds.answerBtn; ui.editing = null; rerenderKeep(); focusSoon(`[data-answer="${ds.answerBtn}"]`); return; }
  if (ds.cancel !== undefined) { cancelEditImages(); ui.editing = null; ui.answering = null; rerenderKeep(); return; }
  if (ds.saveEdit) {
    const n = noteById(ds.saveEdit), v = $(`[data-edit="${ds.saveEdit}"]`).value.trim();
    if (n && (v || ui.editImages.length)) {
      (n.images || []).filter(id => !ui.editImages.includes(id)).forEach(id => IDB.del(id));
      n.text = v; n.images = [...ui.editImages]; n.updatedAt = nowIso(); log("edit", n.id); save();
    }
    ui.editing = null; ui.editText = null; ui.editImages = []; rerenderKeep(); return;
  }
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
  if (ds.goto) { const n = noteById(ds.goto); if (n) go("today", { view: { kind: "date", date: n.date }, dir: -1, count: 3 }); return; }
  switch (el.id) {
    case "openToday": go("today"); break;
    case "allBtn": ui.allTasks = !ui.allTasks; ui.allAnim = ui.allTasks; render(); ui.allAnim = false; break;
    case "cCancel": (ui.composer.images || []).forEach(id => IDB.del(id)); ui.composer = null; render(); break;
    case "cImg": ui.imgTarget = "composer"; $("#imgFile").click(); break;
    case "eImg": ui.editText = ($("[data-edit]") || {}).value ?? ui.editText; ui.imgTarget = "edit"; $("#imgFile").click(); break;
    case "cAddAns": ui.composer.answer = ""; render(); setTimeout(() => { const a = $("#cAns"); if (a) a.focus(); }, 20); break;
    case "cSave": {
      const v = ($("#cText").value || "").trim(), imgs = ui.composer.images || [];
      if (!v && !imgs.length) { toast("Write something first"); return; }
      const type = ui.composer.type, ansEl = $("#cAns"), ans = ansEl ? ansEl.value.trim() : "";
      const nid = addNote(type, v);
      if (imgs.length) { noteById(nid).images = [...imgs]; save(); }
      if (ans) { const n = noteById(nid); n.answer = ans; n.answeredAt = nowIso(); save(); }
      ui.composer = null;
      const items = liveNotes().filter(n => n.date === today());
      const c = noteCounts(items);
      ui.todayTag = c.n && c.q ? "all" : type;
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
    case "goTo": {
      const active = new Set([...entryDates(), today()]);
      openCal(el, { active, selected: ui.view.kind === "date" ? ui.view.date : today(), label: "Dark days have a journal page; grey days are empty.",
        onPick: d => goView({ kind: "date", date: d }) });
      break;
    }
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
  if (e.target.id === "cText" && ui.composer) ui.composer.text = e.target.value;
  if (e.target.id === "cAns" && ui.composer) ui.composer.answer = e.target.value;
  if (e.target.dataset && e.target.dataset.edit) ui.editText = e.target.value;
  if (e.target.id === "tfQ") { ui.tf.q = e.target.value; const x = $("#tfQClear"); if (x) x.hidden = !ui.tf.q; renderTrashLists(); }
  if (e.target.id === "nfQ") { ui.nf.q = e.target.value; const x = $("#nfQClear"); if (x) x.hidden = !ui.nf.q; renderNotesLists(); }
});
document.addEventListener("keydown", e => {
  if (e.target.id === "nfDate" && e.key === "Enter") applyTypedFilter(e.target);
  if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
    const t = e.target;
    if (t.id === "cText" || t.id === "cAns") { e.preventDefault(); $("#cSave").click(); }
    else if (t.dataset && t.dataset.edit) { e.preventDefault(); $(`[data-save-edit="${t.dataset.edit}"]`).click(); }
    else if (t.dataset && t.dataset.answer) { e.preventDefault(); $(`[data-save-answer="${t.dataset.answer}"]`).click(); }
  }
  if (e.target.id === "tfDate" && e.key === "Enter") { const s2 = fromDmy(e.target.value); if (s2) { ui.tf.date = s2; renderTrash($("#left"), $("#right")); } else if (!e.target.value.trim()) { ui.tf.date = null; renderTrash($("#left"), $("#right")); } else toast("Use the format dd/mm/yyyy"); }
  if (e.key === "Escape" && !$("#lightbox").hidden) { closeLightbox(); return; }
  if (e.key === "Escape" && !$("#modal").hidden) { closeModal(); return; }
  if (e.key === "Escape" && ui.selected) { ui.selected = null; document.querySelectorAll(".card.selected").forEach(c => c.classList.remove("selected")); }
  if (e.key === "Escape") { if (calEl) closeCal(); else if (ui.composer) { ui.composer = null; render(); } else if (ui.editing || ui.answering) { ui.editing = ui.answering = null; rerenderKeep(); } }
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
  else toast(`+${XP[TASK[id].type] || 10} XP`);
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
  for (const id of D.notes.flatMap(n => n.images || [])) { const u = await IDB.get(id).catch(() => null); if (u) images[id] = u; }
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

render();
})();
