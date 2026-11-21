// FR / EN switch for the whole site.
// - Static texts: elements with data-i18n="key" (text), data-i18n-html="key" (trusted markup from
//   this file only), data-i18n-aria / data-i18n-alt / data-i18n-title (attributes).
// - Long blocks (legal page): <div data-lang="en"> / <div data-lang="fr">, only the active one is shown.
// - Texts built by JavaScript use t("key").
// Choice: saved in this browser ("lang"); first visit → the browser language (French → FR, else EN).
// Switching reloads the page, so content built from Sanity and the animations start clean.
// Note: the handwritten font has no accents, so the French texts it displays avoid accented letters.

const DICT = {
  en: {
    "title.home": "Shaiba Imane — Front-end developer",
    "title.works": "Works — Shaiba Imane",
    "title.quests": "Side quests — Shaiba Imane",
    "title.quest": "Side quest — Shaiba Imane",
    "title.legal": "Legal notice, privacy & credits — Shaiba Imane",
    "lang.group": "Language",
    "nav.main": "Main",
    "dock.works": "works", "dock.quests": "quests", "dock.profile": "profile",
    "sound.on": "sound on", "sound.off": "sound off",
    "legal": "Legal notice",
    "home": "Home",
    "skip.about": "Skip to About", "skip.projects": "Skip to projects", "skip.quests": "Skip to quests", "skip.content": "Skip to content",
    // home
    "home.click": "click here to<br>see my work!",
    "home.intro": "Front-end developer with a graphic designer’s eye, I create visual worlds and bring them to life on screen through animation.",
    "home.work": "Work",
    "home.about": "ABout",
    "home.bio1": "I’m a front-end developer, and what gets me going is movement. A title that slides in, an image that reveals itself on scroll, a transition that makes you want to keep going: that’s where I have the most fun. GSAP and JS libraries are my best allies.",
    "home.bio2": "Before code, there was publishing. That’s where I caught the branding and visual identity bug. Today, I mix the two: I create graphic worlds and bring them to life on screen.",
    "home.bio3": "And I love what I do. Every day, I try a new tool or learn a new technique, and it never stops.",
    "home.bio4": "Next step: an internship from February to May 2027, in Brussels. If you like websites that move, we should get along.",
    "home.contact": "Contact",
    "home.contactMe": "Contact me",
    "home.skills": "Skills",
    "todo.title": "To do list",
    "todo.1": "I have an eye for the pixel that sticks out",
    "todo.2": "Part-time tutor, full-time patience",
    "todo.3": "I speak fluent human AND developer",
    "alt.polaroid": "Polaroid photo of Imane",
    "alt.badge": "Portrait of Imane Shaiba on a badge",
    // works
    "works.title": "Works",
    "works.loading": "Loading projects…",
    "works.year": "Year", "works.type": "Type", "works.tools": "Tools", "works.link": "Link",
    "works.viewLive": "View live site", "works.viewLiveAria": "View live site: {t}",
    "works.error": "The projects could not be loaded.",
    "works.errorTitle": "Oops, a little loading hiccup.",
    "works.checkConnection": "Check your internet connection, then try again.",
    "works.retry": "Retry",
    "works.empty": "No projects yet — come back soon.",
    // quests
    "quests.h1": "Side quests — the lab",
    "quests.loading": "Loading quests…",
    "quests.kicker": "The lab · ", "quests.kickerAfter": " quests",
    "quests.noteTitle": "Side<br>quests",
    "quests.noteText": "Every day, I try a new tool or learn a new technique, and it never stops.",
    "quests.noteSub": "Where I test things.",
    "quests.statusGroup": "Status",
    "status.done": "Quest complete", "status.in-progress": "In progress", "status.next": "Next quest",
    "quests.soon": "Coming soon",
    "quests.view": "View experiment →", "quests.viewAria": "View experiment: {t}",
    "quests.number": "Quest {n}",
    "quests.emptyTitle": "The first quest is on its way.",
    "quests.emptyText": "New experiments land here as soon as they are added.",
    "quests.empty": "No quests yet.",
    "quests.errorTitle": "The quests could not be loaded.",
    "quests.error": "The quests could not be loaded.",
    // quest detail
    "quest.all": "All quests",
    "quest.loading": "Loading the quest…",
    "quest.status": "Status", "quest.tools": "Tools", "quest.link": "Link",
    "quest.gallery": "Gallery",
    "quest.back": "Back to all quests",
    "quest.missing": "This quest doesn't exist.",
    "quest.gone": "This quest doesn't exist (anymore).",
    "quest.error": "The quest could not be loaded. Check your internet connection, then try again.",
    // legal
    "legal.toc": "On this page",
  },
  fr: {
    "title.home": "Shaiba Imane — Front-end developer",
    "title.works": "Projets — Shaiba Imane",
    "title.quests": "Side quests — Shaiba Imane",
    "title.quest": "Side quest — Shaiba Imane",
    "title.legal": "Mentions légales, vie privée & crédits — Shaiba Imane",
    "lang.group": "Langue",
    "nav.main": "Principale",
    "dock.works": "projets", "dock.quests": "quêtes", "dock.profile": "profil",
    "sound.on": "son activé", "sound.off": "son coupé",
    "legal": "Mentions légales",
    "home": "Accueil",
    "skip.about": "Aller à « À propos »", "skip.projects": "Aller aux projets", "skip.quests": "Aller aux quêtes", "skip.content": "Aller au contenu",
    // home
    "home.click": "cliquez ici pour<br>voir mon travail !",
    "home.intro": "Front-end developer avec un regard de graphiste, j’invente des univers visuels et je les fais vivre, pixel par pixel, en animation.", // handwritten: no accents
    "home.work": "Projets",
    "home.about": "A propos", // handwritten: no accents
    "home.bio1": "Je suis front-end developer, et ce qui me fait vibrer, c’est le mouvement. Un titre qui glisse, une image qui se révèle au scroll, une transition qui donne envie de continuer : c’est là que je m’amuse le plus. GSAP et les librairies JS sont mes meilleurs alliés.",
    "home.bio2": "Avant le code, il y a eu l’édition. C’est là que j’ai attrapé le virus du branding et de l’identité visuelle. Aujourd’hui, je mélange les deux : je crée des univers graphiques et je leur donne vie à l’écran.",
    "home.bio3": "Et j’aime ce que je fais. Chaque jour, je teste un nouvel outil ou j’apprends une nouvelle technique, et ça ne s’arrête jamais.",
    "home.bio4": "Prochaine étape : un stage de février à mai 2027, à Bruxelles. Si vous aimez les sites qui bougent, on devrait bien s’entendre.",
    "home.contact": "Contact",
    "home.contactMe": "Contactez-moi",
    "home.skills": "Compétences",
    "todo.title": "To do list",
    "todo.1": "J’ai l’œil pour le pixel qui dépasse",
    "todo.2": "Tuteur à mi-temps, patience à plein temps",
    "todo.3": "Je parle couramment humain ET développeur",
    "alt.polaroid": "Photo polaroïd d’Imane",
    "alt.badge": "Portrait d’Imane Shaiba sur un badge",
    // works
    "works.title": "Projets",
    "works.loading": "Chargement des projets…",
    "works.year": "Année", "works.type": "Type", "works.tools": "Outils", "works.link": "Lien",
    "works.viewLive": "Voir le site", "works.viewLiveAria": "Voir le site : {t}",
    "works.error": "Les projets n’ont pas pu être chargés.",
    "works.errorTitle": "Oups, petit souci de chargement.", // handwritten: no accents
    "works.checkConnection": "Vérifiez votre connexion internet, puis réessayez.",
    "works.retry": "Réessayer",
    "works.empty": "Pas encore de projets — revenez bientôt.",
    // quests
    "quests.h1": "Side quests — le labo",
    "quests.loading": "Chargement des quêtes…",
    "quests.kicker": "Le labo · ", "quests.kickerAfter": " quêtes",
    "quests.noteTitle": "Side<br>quests",
    "quests.noteText": "Chaque jour, je teste un nouvel outil ou une nouvelle technique, et ce n’est jamais fini.", // handwritten: no accents
    "quests.noteSub": "Là où je teste des trucs.",
    "quests.statusGroup": "Statut",
    "status.done": "Quête terminée", "status.in-progress": "En cours", "status.next": "Prochaine quête",
    "quests.soon": "Prochainement", // handwritten: no accents
    "quests.view": "Voir l’expérience →", "quests.viewAria": "Voir l’expérience : {t}",
    "quests.number": "Quête {n}",
    "quests.emptyTitle": "Patience : la suite arrive !", // handwritten: no accents
    "quests.emptyText": "Les nouvelles expériences atterrissent ici dès qu’elles sont ajoutées.",
    "quests.empty": "Pas encore de quêtes.",
    "quests.errorTitle": "Oups, petit souci de chargement.", // handwritten: no accents
    "quests.error": "Les quêtes n’ont pas pu être chargées.",
    // quest detail
    "quest.all": "Toutes les quêtes",
    "quest.loading": "Chargement de la quête…",
    "quest.status": "Statut", "quest.tools": "Outils", "quest.link": "Lien",
    "quest.gallery": "Galerie",
    "quest.back": "Retour à toutes les quêtes",
    "quest.missing": "Cette quête n’existe pas.",
    "quest.gone": "Cette quête n’existe pas (ou plus).",
    "quest.error": "La quête n’a pas pu être chargée. Vérifiez votre connexion internet, puis réessayez.",
    // legal
    "legal.toc": "Sur cette page",
  },
};

const STORE = "lang";
function initialLang() {
  // a link can force the language: page.html?lang=fr (remembered from then on)
  const forced = new URLSearchParams(location.search).get("lang");
  if (forced === "fr" || forced === "en") { try { localStorage.setItem(STORE, forced); } catch { /* ignore */ } return forced; }
  try { const saved = localStorage.getItem(STORE); if (saved === "fr" || saved === "en") return saved; } catch { /* private mode */ }
  return (navigator.language || "").toLowerCase().startsWith("fr") ? "fr" : "en";
}
export const lang = initialLang();

export function t(key, vars = {}) {
  const s = DICT[lang][key] ?? DICT.en[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}

function apply(root = document) {
  document.documentElement.lang = lang;
  root.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll("[data-i18n-html]").forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  root.querySelectorAll("[data-i18n-aria]").forEach((el) => { el.setAttribute("aria-label", t(el.dataset.i18nAria)); });
  root.querySelectorAll("[data-i18n-alt]").forEach((el) => { el.alt = t(el.dataset.i18nAlt); });
  root.querySelectorAll("[data-lang]").forEach((el) => { el.hidden = el.dataset.lang !== lang; });
}

// the little switch, bottom left next to the sound button: shows the current language (FR or EN);
// one click switches to the other one
function addSwitch() {
  const other = lang === "fr" ? "en" : "fr";
  const box = document.createElement("div");
  box.className = "ui-lang notranslate";
  box.setAttribute("translate", "no");
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = lang.toUpperCase();
  b.setAttribute("aria-label", lang === "fr" ? "FR — langue : français, passer en anglais" : "EN — language: English, switch to French");
  b.title = lang === "fr" ? "Switch to English" : "Passer en français";
  b.addEventListener("click", () => {
    try { localStorage.setItem(STORE, other); } catch { /* ignore */ }
    // drop a ?lang= forced by a link, otherwise it would win over the new choice
    const url = new URL(location.href); url.searchParams.delete("lang");
    location.replace(url);
  });
  box.append(b);
  document.body.append(box);
  // phones: the tag sits right after "Shaiba Imane" → measure the real width of the name
  const name = document.querySelector(".ui-site-name");
  const measure = () => { if (name) document.documentElement.style.setProperty("--name-w", `${name.offsetWidth}px`); };
  measure();
  document.fonts?.ready.then(measure);
  window.addEventListener("resize", measure);
}

// <template> contents (cards cloned by works.js / quests.js) are translated too
apply();
document.querySelectorAll("template").forEach((tpl) => apply(tpl.content));
addSwitch();
document.documentElement.classList.remove("i18n-pending");
