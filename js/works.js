// Works — loads the projects from Sanity and deals the folders onto the page.
import { t } from "./i18n.js"; // first: translates the page before anything else runs
import { sanityQuery, imageUrl } from "./sanity.js";
import { addMarkers } from "./marker.js";
import "./glass.js";
import { play, playScroll, initSoundToggle } from "./sound.js";

const QUERY = `*[_type == "projet"] | order(ordre asc) {
  _id, titre, description, annee, type, outils, lien,
  "image": image { alt, hotspot, "url": asset->url, "lqip": asset->metadata.lqip }
}`;

const grid = document.querySelector("[data-grid]");
const status = document.querySelector("[data-status]");
const count = document.querySelector("[data-count]");
const template = document.getElementById("folder-template");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const DECOS = [
  { cls: "folder__deco--tape", src: "assets/img/works/deco-tape-kraft.webp", w: 260, h: 138 },
  { cls: "folder__deco--clip", src: "assets/img/works/deco-paperclip.webp", w: 148, h: 132 },
];

function fill(node, field, value) {
  node.querySelectorAll(`[data-field="${field}"]`).forEach((el) => { el.textContent = value ?? ""; });
}

function buildFolder(project, index) {
  const li = template.content.firstElementChild.cloneNode(true);
  li.style.setProperty("--i", index);
  fill(li, "numero", String(index + 1).padStart(2, "0"));
  fill(li, "titre", project.titre);
  fill(li, "description", project.description);
  fill(li, "annee", project.annee);
  fill(li, "type", project.type);
  fill(li, "outils", (project.outils || []).join(", "));

  const img = li.querySelector('[data-field="image"]');
  if (project.image?.url) {
    img.src = imageUrl(project.image, { width: 1184, height: 646 });
    img.srcset = `${imageUrl(project.image, { width: 592, height: 323 })} 592w, ${img.src} 1184w`;
    img.sizes = "(min-width: 52rem) 42vw, 90vw";
    img.alt = project.image.alt || "";
    if (index > 0) img.loading = "lazy"; // only the first folder is visible on arrival
    else img.fetchPriority = "high";    // …and it is the largest thing painted first (LCP)
    if (project.image.lqip) li.querySelector(".folder__photo-frame").style.setProperty("--lqip", `url("${project.image.lqip}")`);
  } else {
    img.remove();
  }

  const link = li.querySelector('[data-field="lien"]');
  if (project.lien) {
    link.href = project.lien;
    link.setAttribute("aria-label", t("works.viewLiveAria", { t: project.titre }));
  } else {
    link.closest("div").remove();
  }

  const deco = DECOS[index % DECOS.length];
  const d = document.createElement("img");
  Object.assign(d, { src: deco.src, alt: "", width: deco.w, height: deco.h, className: `folder__deco ${deco.cls}` });
  d.setAttribute("aria-hidden", "true");
  li.querySelector(".folder__photo").append(d);
  return li;
}

// ---------------------------------------------------------------------------
// Motion. Two modes:
//  • Stack (desktop): the scene (header + title + pile) is pinned; scrolling only
//    brings the next folder up onto the pile. Native scroll is kept (no wheel
//    hijacking), a gentle snap finishes the move to the nearest folder, and the
//    page scrolls normally again after the last one.
//  • List (small screens, reduced motion, or a folder that wouldn't fit the
//    screen): folders one under the other, each animated as it comes into view.
// ---------------------------------------------------------------------------
const scene = document.querySelector("[data-scene]");
const progress = document.querySelector("[data-progress]");
const pad = (n) => String(n).padStart(2, "0");

// content arrival of one folder (paused timeline, played when the folder lands)
function arrival(f, i) {
  const q = (sel) => f.querySelectorAll(sel);
  const side = i % 2 ? 1 : -1;
  return gsap.timeline({ paused: true })
    .from(q(".folder__tab"), { yPercent: 100, rotation: side * -8, duration: 0.45, ease: "back.out(3)" })
    .from(q(".folder__photo"), { y: 140, x: side * -60, rotation: side * 28, scale: 0.7, autoAlpha: 0, duration: 0.85, ease: "back.out(1.5)" }, "-=0.25")
    .from(q(".folder__deco"), { scale: 2.6, autoAlpha: 0, rotation: -40, duration: 0.45, ease: "back.out(2.4)" }, "-=0.2")
    .from(q(".folder__kicker, .folder__title"), { y: 24, autoAlpha: 0, duration: 0.45, stagger: 0.08, ease: "power3.out" }, "-=0.9")
    .fromTo(q(".folder__title-mark"), { "--mark": "0%" }, { "--mark": "100%", duration: 0.6, ease: "power2.inOut" }, "-=0.35")
    .from(q(".folder__description, .folder__meta > div"), { y: 14, autoAlpha: 0, duration: 0.35, stagger: 0.06, ease: "power2.out" }, "-=0.5")
    .from(q(".folder__number"), { y: -30, autoAlpha: 0, rotation: side * 12, duration: 0.5, ease: "back.out(2)" }, "-=0.6");
}

function setProgress(i, n) { if (progress) progress.textContent = `${pad(i + 1)} / ${pad(n)}`; }

function listMode(folders) {
  document.body.classList.remove("is-stacked");
  if (progress) progress.textContent = ""; // the counter only makes sense with the pinned stack
  // phones / tablets: a pile of "sticky" folders. Native scroll; each folder stops at the top and the
  // next one slides over it, leaving its tab showing (like dividers). A folder taller than the screen
  // just scrolls normally, so nothing is ever hidden before being read.
  if (window.matchMedia("(max-width: 52rem)").matches) {
    document.body.classList.add("is-pile");
    const fit = () => folders.forEach((f) => f.classList.toggle("no-stick", f.offsetHeight > window.innerHeight - 48));
    fit();
    window.addEventListener("resize", fit);
  }
  if (reduceMotion || !window.gsap || !window.ScrollTrigger) return;
  folders.forEach((f, i) => {
    const tl = arrival(f, i);
    // fills as soon as it enters the screen, once (no empty folder waiting at the bottom of a phone)
    ScrollTrigger.create({
      trigger: f, start: "top 92%", once: true,
      onEnter: () => { tl.play(); playScroll("folder"); },
    });
  });
}

function stackMode(folders) {
  const n = folders.length;
  const stack = grid;
  document.body.classList.add("is-stacked");
  stack.style.setProperty("--n", n);

  // every folder must fit in the pinned scene, otherwise fall back to the list
  const fits = () => folders.every((f) => {
    const body = f.querySelector(".folder__body");
    return body.scrollHeight <= body.clientHeight + 2;
  });
  if (!fits()) { document.body.classList.remove("is-stacked"); return false; }

  const side = (i) => (i % 2 ? 1 : -1);
  gsap.set(folders, { transformOrigin: "50% 0%" });
  gsap.set(folders.slice(1), { y: () => stack.clientHeight + 40, rotation: (i) => side(i + 1) * 4 });
  const arrivals = folders.map(arrival);

  let current = 0;
  arrivals[0].play();
  setProgress(0, n);

  const tl = gsap.timeline({
    defaults: { duration: 1 },
    scrollTrigger: {
      trigger: scene,
      start: "top top",
      end: () => "+=" + Math.round((n - 1) * window.innerHeight * 0.9),
      pin: true,
      scrub: 0.6,
      invalidateOnRefresh: true,
      snap: n > 1 ? { snapTo: "labels", duration: { min: 0.2, max: 0.6 }, delay: 0.12, ease: "power1.inOut" } : false,
      onUpdate: (self) => {
        const idx = Math.round(self.progress * (n - 1));
        if (idx === current) return;
        if (idx > current) { for (let k = current + 1; k <= idx; k++) arrivals[k].play(); }
        else { for (let k = current; k > idx; k--) arrivals[k].reverse(); }
        play("folder"); // lands on / lifted off the pile
        current = idx;
        setProgress(idx, n);
      },
    },
  });
  tl.addLabel("f0");
  for (let i = 1; i < n; i++) {
    tl.to(folders[i], { y: 0, rotation: 0, ease: "power2.out" }, `f${i - 1}`)
      .to(folders[i - 1], { scale: 0.95, ease: "none" }, `f${i - 1}`)
      .addLabel(`f${i}`);
  }
  return true;
}

function stackFolders(folders) {
  if (!folders.length) return;
  setProgress(0, folders.length);
  const canStack = window.gsap && window.ScrollTrigger && !reduceMotion && window.matchMedia("(min-width: 52rem)").matches;
  if (window.gsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  // measure once the fonts are in (they change the text height)
  document.fonts.ready.then(() => { if (!(canStack && stackMode(folders))) listMode(folders); });
}

// Error shown inside the page (not hidden under the dock), with a hint when the page
// is opened from an address Sanity doesn't allow (CORS).
const ALLOWED_ORIGINS = ["http://127.0.0.1:8765", "http://localhost:8765", "http://127.0.0.1:5500", "http://localhost:5500"];
function showError(err) {
  grid.setAttribute("aria-busy", "false");
  const card = document.createElement("li");
  card.className = "works__error";
  const msg = document.createElement("p");
  msg.textContent = t("works.errorTitle");
  const hint = document.createElement("p");
  hint.className = "works__error-hint";
  hint.textContent = ALLOWED_ORIGINS.includes(location.origin)
    ? t("works.checkConnection")
    : `This address (${location.origin}) is not allowed by Sanity yet: open http://127.0.0.1:8765/works.html or add it in Sanity → API → CORS origins.`;
  const retry = document.createElement("button");
  retry.type = "button";
  retry.className = "works__retry";
  retry.textContent = t("works.retry");
  retry.addEventListener("click", load, { once: true });
  card.append(msg, hint, retry);
  grid.replaceChildren(card);
  status.textContent = t("works.error");
  console.error("[works] Sanity fetch failed:", err);
}

async function load() {
  delete status.dataset.error;
  status.textContent = t("works.loading");
  grid.setAttribute("aria-busy", "true");
  try {
    let projects = await sanityQuery(QUERY);
    // Preview only: works.html?demo=5 repeats the projects to see a full stack.
    const demo = parseInt(new URLSearchParams(location.search).get("demo"), 10);
    if (demo > projects.length && projects.length) {
      projects = Array.from({ length: demo }, (_, i) => ({ ...projects[i % projects.length], _id: `demo-${i}` }));
    }
    const folders = projects.map(buildFolder);
    grid.replaceChildren(...folders);
    count.textContent = `(${projects.length})`;
    grid.setAttribute("aria-busy", "false");
    status.textContent = projects.length ? "" : t("works.empty");
    if (!projects.length) status.dataset.error = "";
    addMarkers(grid);
    stackFolders(folders);
  } catch (err) {
    showError(err);
  }
}

addMarkers();
initSoundToggle();
// a little paper flap when a folder is hovered
grid.addEventListener("mouseover", (e) => {
  const f = e.target.closest(".folder:not(.folder--loading)");
  if (f && !f.contains(e.relatedTarget)) play("paper");
});
load();
