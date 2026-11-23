// Quests — vision board. Experiments come from Sanity (`quest` documents) and are pinned
// as polaroids around the central note; a red string runs from pin to pin.
import { t } from "./i18n.js"; // first: translates the page before anything else runs
import { sanityQuery, imageUrl } from "./sanity.js";
import { addMarkers } from "./marker.js";
import { play, initSoundToggle } from "./sound.js";
import "./glass.js";

const QUERY = `*[_type == "quest"] | order(ordre asc) {
  _id, titre, statut, description, outils, lien, "slug": slug.current,
  "apercu": apercu { alt, hotspot, "url": asset->url, "ext": asset->extension, "lqip": asset->metadata.lqip }
}`;
const STATUS_LABEL = { done: t("status.done"), "in-progress": t("status.in-progress"), next: t("status.next") };

const board = document.querySelector("[data-board]");
const grid = document.querySelector("[data-grid]");
const note = board.querySelector(".board__note");
const status = document.querySelector("[data-status]");
const count = document.querySelector("[data-count]");
const template = document.getElementById("quest-template");
const stringSvg = board.querySelector("[data-string]");
const stringPath = board.querySelector("[data-string-path]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function buildQuest(q, index) {
  const li = template.content.firstElementChild.cloneNode(true);
  const set = (field, value) => li.querySelectorAll(`[data-field="${field}"]`).forEach((el) => { el.textContent = value ?? ""; });
  const st = STATUS_LABEL[q.statut] ? q.statut : "in-progress";
  set("titre", q.titre);
  set("numero", t("quests.number", { n: String(index + 1).padStart(2, "0") }));
  set("description", q.description);
  set("outils", (q.outils || []).join(" · "));
  set("statut", `${STATUS_LABEL[st]}: `);
  li.querySelector('[data-field="statut-icon"]').classList.add(`status-icon--${st}`);
  if (st === "next") li.classList.add("polaroid--next");
  // a scrap of paper peeks out behind each polaroid
  const SCRAPS = ["scrap-pink", "scrap-green", "scrap-cream", "scrap-white"];
  const scrap = li.querySelector("[data-scrap]"), sname = `assets/img/quests/${SCRAPS[index % SCRAPS.length]}`;
  scrap.srcset = `${sname}-m.webp 190w, ${sname}-l.webp 285w, ${sname}.webp 380w`; // shown 328 px wide
  scrap.sizes = "328px";
  scrap.src = `${sname}.webp`;
  // the whole polaroid opens the detail page (title link stretched over the card)
  const open = li.querySelector(".polaroid__open");
  if (q.slug) open.href = `quest.html?q=${encodeURIComponent(q.slug)}`;

  const img = li.querySelector('[data-field="apercu"]');
  if (q.apercu?.url && st !== "next") {
    // animated GIFs keep their animation (served as is); images cropped to 5:4 WebP
    img.src = q.apercu.ext === "gif" ? q.apercu.url : imageUrl(q.apercu, { width: 720, height: 576 });
    if (q.apercu.ext !== "gif") { // the polaroid photo is 280 px wide on every screen
      img.srcset = [360, 560].map((w) => `${imageUrl(q.apercu, { width: w, height: w * 4 / 5 })} ${w}w`).join(", ") + `, ${img.src} 720w`;
      img.sizes = "376px";
    }
    img.alt = q.apercu.alt || "";
    if (index > 3) img.loading = "lazy";
    if (q.apercu.lqip) li.querySelector(".polaroid__photo").style.setProperty("--lqip", `url("${q.apercu.lqip}")`);
  } else {
    img.remove();
  }

  const link = li.querySelector('[data-field="lien"]');
  if (q.lien && st !== "next") { link.href = q.lien; link.setAttribute("aria-label", t("quests.viewAria", { t: q.titre })); }
  else link.remove();
  return li;
}

// keep the middle column free for the note (its real height)
function reserveNote() { grid.style.setProperty("--note-h", `${note.offsetHeight + 24}px`); }

// Red string: note pin first, then every polaroid pin in order, with a slight sag.
// (not recomputed while the cards are still flying in)
let animating = false;
function drawString() {
  if (animating) return;
  const pins = [note, ...grid.querySelectorAll(".polaroid:not(.polaroid--loading) .polaroid__card")].map((el) => el.querySelector("[data-pin]")).filter(Boolean);
  if (pins.length < 2) { stringPath.setAttribute("d", ""); return; }
  const b = board.getBoundingClientRect();
  // the string is tied around the head of each wooden pin
  const pts = pins.map((p) => { const r = p.getBoundingClientRect(); return [r.left + r.width * 0.4 - b.left, r.top + r.height * 0.28 - b.top]; });
  // order: note → left column top → right column top → … (reading order is already zig-zag)
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const sag = Math.min(40, Math.hypot(x1 - x0, y1 - y0) * 0.06);
    d += ` Q${((x0 + x1) / 2).toFixed(1)} ${((y0 + y1) / 2 + sag).toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }
  stringSvg.setAttribute("viewBox", `0 0 ${b.width} ${b.height}`);
  stringPath.setAttribute("d", d);
}

// Entrance: the note is pinned, polaroids drop and pin one by one, then the string is drawn.
function animateBoard(cards) {
  drawString();
  if (reduceMotion || !window.gsap) return;
  const len = stringPath.getTotalLength?.() || 0;
  gsap.set(stringPath, { strokeDasharray: len, strokeDashoffset: len });
  animating = true;
  const tl = gsap.timeline({ delay: 0.1, onComplete: () => { animating = false; drawString(); } });
  tl.from(note, { y: -60, autoAlpha: 0, rotation: -8, duration: 0.6, ease: "back.out(1.6)" })
    .from(note.querySelector("[data-pin]"), { y: -30, scale: 2, autoAlpha: 0, duration: 0.25, ease: "back.out(3)" }, "-=0.15");
  cards.forEach((li, i) => {
    const card = li.querySelector(".polaroid__card");
    const side = i % 2 ? 1 : -1;
    tl.from(card, { y: -80, autoAlpha: 0, rotation: side * 16, duration: 0.45, ease: "power2.in", onStart: () => play("paper") }, i === 0 ? "-=0.1" : "-=0.28")
      .from(card.querySelector("[data-pin]"), { y: -24, scale: 2, autoAlpha: 0, duration: 0.2, ease: "back.out(3)" }, "-=0.05")
      .from(card.querySelector(".polaroid__label"), { scaleX: 0, duration: 0.25, ease: "power2.out" }, "-=0.1");
  });
  tl.to(stringPath, { strokeDashoffset: 0, duration: Math.min(2.4, 0.5 + cards.length * 0.3), ease: "power1.inOut" }, "-=0.1")
    .set(stringPath, { clearProps: "strokeDasharray,strokeDashoffset" });
}

function showMessage(title, hint, retry) {
  const card = document.createElement("li");
  card.className = "board__message";
  const titleEl = document.createElement("p"); titleEl.textContent = title;
  const h = document.createElement("p"); h.className = "board__message-hint"; h.textContent = hint;
  card.append(titleEl, h);
  if (retry) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "works__retry"; b.textContent = t("works.retry");
    b.addEventListener("click", load, { once: true });
    card.append(b);
  }
  grid.replaceChildren(card);
  drawString();
}

async function load() {
  status.textContent = t("quests.loading");
  grid.setAttribute("aria-busy", "true");
  try {
    let quests = await sanityQuery(QUERY);
    // Preview only: quests.html?demo=6 shows placeholder polaroids to see the board layout.
    const demo = parseInt(new URLSearchParams(location.search).get("demo"), 10);
    if (!quests.length && demo > 0) {
      const st = ["done", "in-progress", "next"];
      quests = Array.from({ length: demo }, (_, i) => ({ _id: `demo-${i}`, slug: `demo-${i}`, titre: `Experiment ${i + 1}`, statut: st[i % 3], description: "Placeholder — add your quests in Sanity.", outils: ["GSAP"] }));
    }
    grid.setAttribute("aria-busy", "false");
    count.textContent = quests.length;
    if (!quests.length) {
      showMessage(t("quests.emptyTitle"), t("quests.emptyText"));
      status.textContent = t("quests.empty");
      return;
    }
    const cards = quests.map(buildQuest);
    grid.replaceChildren(...cards);
    status.textContent = "";
    reserveNote();
    addMarkers(grid);
    await document.fonts.ready;
    reserveNote();
    animateBoard(cards);
  } catch (err) {
    console.error("[quests] Sanity fetch failed:", err);
    grid.setAttribute("aria-busy", "false");
    showMessage(t("quests.errorTitle"), t("works.checkConnection"), true);
    status.textContent = t("quests.error");
  }
}

// redraw the string when the layout changes
if ("ResizeObserver" in window) new ResizeObserver(() => { reserveNote(); drawString(); }).observe(board);
grid.addEventListener("transitionend", drawString);

addMarkers();
initSoundToggle();
// clicking anywhere on a polaroid opens its detail page (the title link stays the
// keyboard / screen-reader entry point; the external "View experiment" link keeps working)
grid.addEventListener("click", (e) => {
  if (e.target.closest("a")) return;
  const open = e.target.closest(".polaroid")?.querySelector(".polaroid__open[href]");
  if (open) location.href = open.href;
});
// phones: no hover, so the paper flap plays when a card is touched
if (window.matchMedia("(hover: none)").matches) {
  grid.addEventListener("pointerdown", (e) => { if (e.target.closest(".polaroid:not(.polaroid--loading)")) play("paper"); }, { passive: true });
}
grid.addEventListener("mouseover", (e) => {
  if (e.sourceCapabilities?.firesTouchEvents || window.matchMedia("(hover: none)").matches) return; // taps: handled above
  const c = e.target.closest(".polaroid:not(.polaroid--loading)");
  if (c && !c.contains(e.relatedTarget)) play("paper");
});
reserveNote();
load();
