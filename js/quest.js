// Quest detail page — quest.html?q=<slug>. Content from Sanity (`quest`).
import { t } from "./i18n.js"; // first: translates the page before anything else runs
import { sanityQuery, imageUrl } from "./sanity.js";
import { addMarkers } from "./marker.js";
import { initSoundToggle } from "./sound.js";
import "./glass.js";

const QUERY = `{
  "list": *[_type == "quest"] | order(ordre asc) { titre, "slug": slug.current },
  "quest": *[_type == "quest" && slug.current == $slug][0] {
    titre, statut, description, outils, lien, contenu,
    "apercu": apercu { alt, hotspot, "url": asset->url, "ext": asset->extension, "lqip": asset->metadata.lqip },
    "galerie": galerie[] { alt, legende, hotspot, "url": asset->url, "ext": asset->extension }
  }
}`;
const STATUS_LABEL = { done: t("status.done"), "in-progress": t("status.in-progress"), next: t("status.next") };

const root = document.querySelector("[data-quest]");
const detail = document.querySelector("[data-detail]");
const status = document.querySelector("[data-status]");
const slug = new URLSearchParams(location.search).get("q") || "";
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const F = (name) => detail.querySelector(`[data-field="${name}"]`);

function demoQuest() {
  return {
    list: Array.from({ length: 3 }, (_, i) => ({ titre: `Experiment ${i + 1}`, slug: `demo-${i}` })),
    quest: { titre: `Experiment ${Number(slug.split("-")[1] || 0) + 1}`, statut: "in-progress", description: "Placeholder — add your quests in Sanity.", outils: ["GSAP"], contenu: [] },
  };
}

function render({ list, quest }) {
  const index = list.findIndex((q) => q.slug === slug);
  const st = STATUS_LABEL[quest.statut] ? quest.statut : "in-progress";
  document.title = `${quest.titre} — Side quests — Shaiba Imane`;

  F("numero").textContent = t("quests.number", { n: String(index + 1).padStart(2, "0") });
  F("titre").textContent = quest.titre;
  F("description").textContent = quest.description || "";
  F("statut").textContent = STATUS_LABEL[st];
  F("statut-icon").classList.add(`status-icon--${st}`);
  F("outils").textContent = (quest.outils || []).join(", ");

  const img = F("apercu");
  if (quest.apercu?.url) {
    img.src = quest.apercu.ext === "gif" ? quest.apercu.url : imageUrl(quest.apercu, { width: 1200, height: 960 });
    img.alt = quest.apercu.alt || "";
  } else img.remove();

  const link = F("lien");
  if (quest.lien) link.href = quest.lien; else detail.querySelector('[data-row="lien"]').remove();

  F("statut-meta").textContent = STATUS_LABEL[st];

  const gallery = F("galerie");
  (quest.galerie || []).filter((g) => g.url).forEach((g, i) => {
    const li = document.createElement("li");
    li.className = "quest-detail__shot";
    const fig = document.createElement("figure");
    const im = document.createElement("img");
    im.src = g.ext === "gif" ? g.url : imageUrl(g, { width: 900, height: 720 });
    im.alt = g.alt || ""; im.loading = "lazy"; im.width = 900; im.height = 720;
    fig.append(im);
    if (g.legende) { const c = document.createElement("figcaption"); c.textContent = g.legende; fig.append(c); }
    li.style.setProperty("--tilt", `${i % 2 ? 2 : -2}deg`);
    li.append(fig);
    gallery.append(li);
  });
  if (!gallery.children.length) gallery.remove();

  detail.hidden = false;
  root.setAttribute("aria-busy", "false");
  status.textContent = "";
  addMarkers(detail);

  if (!reduceMotion && window.gsap) {
    gsap.timeline()
      .from(".quest-detail__polaroid", { y: -80, rotation: -14, autoAlpha: 0, duration: 0.6, ease: "back.out(1.4)" })
      .from(".quest-detail__polaroid .pin", { y: -24, scale: 2, autoAlpha: 0, duration: 0.25, ease: "back.out(3)" }, "-=0.1")
      .from(".quest-detail__intro > *", { y: 18, autoAlpha: 0, duration: 0.4, stagger: 0.07, ease: "power2.out" }, "-=0.35")
      .fromTo(".quest-detail__title .folder__title-mark", { "--mark": "0%" }, { "--mark": "100%", duration: 0.6, ease: "power2.inOut" }, "-=0.3");
  }
}

function notFound(msg) {
  root.setAttribute("aria-busy", "false");
  status.dataset.error = "";
  status.textContent = msg;
  const back = document.createElement("a");
  back.href = "quests.html"; back.textContent = t("quest.back"); back.className = "works__retry";
  status.append(" ", back);
}

async function load() {
  if (slug.startsWith("demo-")) return render(demoQuest());
  if (!slug) return notFound(t("quest.missing"));
  try {
    const data = await sanityQuery(QUERY, { slug });
    if (!data?.quest) return notFound(t("quest.gone"));
    render(data);
  } catch (err) {
    console.error("[quest] Sanity fetch failed:", err);
    notFound(t("quest.error"));
  }
}

addMarkers();
initSoundToggle();
load();
