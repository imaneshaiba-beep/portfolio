// "Pix", a tiny pixel buddy hiding on the home page: a little catch-me game that makes
// visitors explore the whole scrapbook.
// Click him → he jumps, says something, and runs off to his next hiding spot further along
// the page. Caught at every spot → a sticker party and an invitation to say hi.
// Desktop: he lives inside the horizontal strip (spots in % of the 4254 × 1080 artboard).
// Mobile / portrait: the strip becomes a vertical list, so he hops around the screen instead.
import { play } from "./sound.js";
import { introDone } from "./intro.js";
import { addMarkers } from "./marker.js";
import { lang } from "./i18n.js";

const MOBILE = window.matchMedia("(max-width: 52rem), (orientation: portrait)").matches;
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const anim = !!window.gsap && !REDUCED;

/* ---------- sprite: the site's own pixel folder sticker (sticker-folder.webp, 18 × 14 pixels of
   6 px), brought to life with a face, legs and arms drawn on the same pixel grid ---------- */
// folder colour: a different one on every visit, among all the colours he has worn
// (never the same as last time: the previous one is remembered in this browser)
const COLOURS = ["sticker-folder", "sticker-folder-orange", "sticker-folder-blue", "sticker-folder-pink"]; // yellow, orange, blue, pink
const FOLDER = (() => {
  let last = null;
  try { last = localStorage.getItem("pix-colour"); } catch { /* private mode: any colour */ }
  const choices = COLOURS.filter((c) => c !== last);
  const pick = choices[Math.floor(Math.random() * choices.length)];
  try { localStorage.setItem("pix-colour", pick); } catch { /* ignore */ }
  return `assets/img/home/${pick}.webp`;
})();
const INK = "#141414", PINK = "#ff8fb3";
const px = (cells, fill) => cells.map(([x, y]) => `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${fill}"/>`).join("");
const LEGS = px([[5, 13], [5, 14], [4, 15], [5, 15], [10, 13], [10, 14], [10, 15], [11, 15]], INK);
const CHEEKS = px([[4, 9], [10, 9]], PINK);
const SMILE = [[6, 9], [8, 9], [7, 10]];
const FRAMES = {
  idle: px([[5, 7], [5, 8], [9, 7], [9, 8], ...SMILE], INK) + CHEEKS + LEGS,
  blink: px([[4, 8], [5, 8], [9, 8], [10, 8], ...SMILE], INK) + CHEEKS + LEGS,
  happy: px([[4, 8], [5, 7], [6, 8], [8, 8], [9, 7], [10, 8], [6, 9], [7, 9], [8, 9], [7, 10],
    [0, 8], [-1, 7], [-1, 6], [18, 8], [19, 7], [19, 6]], INK) + px([[3, 9], [11, 9]], PINK) + LEGS,
};
function sprite() {
  return `<svg viewBox="-2 0 22 17" shape-rendering="crispEdges" aria-hidden="true">
    <image href="${FOLDER}" x="0" y="0" width="18" height="14" style="image-rendering: pixelated"/>
    ${Object.entries(FRAMES).map(([n, g]) => `<g class="buddy__frame buddy__frame--${n}">${g}</g>`).join("")}
  </svg>`;
}

/* ---------- hiding spots + what he says ---------- */
// desktop: x / y in % of the artboard (where his feet land), left → right along the strip
const SPOTS_DESKTOP = [
  { x: 11.2, y: 69 },  // standing on the Ctrl+Z sticker
  { x: 39.6, y: 60 },  // on the beads of the name
  { x: 45.9, y: 12 },  // on top of the keyboard
  { x: 64.3, y: 32 },  // by the to-do list
  { x: 70.7, y: 55 },  // at the foot of the blue "Work" note
  { x: 95, y: 74 },    // on the "Contact me" paper
];
// mobile: like on desktop, he hides in the page and only moves when you tap him: each spot is a
// little gap between two blocks of the vertical scrapbook (order = the block he follows), left or right
const SPOTS_MOBILE = [
  { order: 2, side: "start" },  // after "click here to see my work"
  { order: 5, side: "end" },    // after the skills note
  { order: 7, side: "start" },  // after the keyboard
  { order: 9, side: "end" },    // after the badge
  { order: 11, side: "start" }, // after the blue "Work" note
  { order: 14, side: "end" },   // after "Contact me"
];
const SPOTS = MOBILE ? SPOTS_MOBILE : SPOTS_DESKTOP;
const FR = lang === "fr";
const ahead = MOBILE ? (FR ? " ↓ continuez à descendre !" : " ↓ keep scrolling!") : FR ? " → continuez à scroller !" : " → scroll on!";
// Facts about Imane only come from what the site already says (bio, to-do, skills).
const LINES = FR ? [
  `Salut ! Moi c’est Pix, le dossier d’Imane. Je transporte tous ses projets. Attrapez-moi encore 5 fois et je vous dis tout.${ahead}`,
  `Eh oui, c’est son nom. En perles. Elle ne fait pas dans l’Arial.${ahead}`,
  `Elle teste un nouvel outil chaque jour. Ce clavier a besoin de vacances.${ahead}`,
  `Elle repère un pixel qui dépasse à 3 km. D’ailleurs, votre curseur dépasse de 2px.${ahead}`,
  `Ses projets sont derrière le post-it bleu. Moi, je cliquerais. Je ne suis pas objectif : je suis un dossier.${ahead}`,
] : [
  `Hi! I'm Pix, Imane's folder. I carry all her projects. Catch me 5 more times and I'll spill everything.${ahead}`,
  `Yep, that's her name. In beads. She doesn't do Arial.${ahead}`,
  `She tries a new tool every single day. This keyboard needs a holiday.${ahead}`,
  `She spots a pixel sticking out from 3 km away. Your cursor is 2px off, by the way.${ahead}`,
  `Her projects are behind that blue note. I'd click it. I'm biased, I'm a folder.${ahead}`,
];
const WIN = FR
  ? "Vous m’avez attrapé 6 fois ! Vous avez clairement du goût. Elle cherche un stage à Bruxelles, de février à mai 2027… je dis ça, je dis rien ♥"
  : "You caught me 6 times! Clearly you have taste. She's looking for an internship in Brussels, February to May 2027… just saying ♥";
const CTA = FR ? "Dire bonjour →" : "Say hi →";
const EXTRA = FR ? [
  "Bon, bon, vous avez gagné. Allez lui écrire !",
  "Toujours là ? Elle vous engagerait pour tester ses sites.",
  "Fun fact : vous m’avez cliqué plus souvent qu’elle.",
  "Ctrl+Z n’annulera pas cette amitié.",
  "Elle parle couramment humain ET développeur. Moi, je parle dossier.",
  "Avant le code, elle était dans l’édition. Moi, j’étais un classeur.",
] : [
  "Okay okay, you win. Now go email her!",
  "Still clicking? She'd hire you as a tester.",
  "Fun fact: you've clicked me more than she has.",
  "Ctrl+Z won't undo this friendship.",
  "She speaks human AND developer. I only speak folder.",
  "Before code, she was in publishing. I was a ring binder.",
];
const hour = new Date().getHours();
const late = hour >= 22 || hour < 6;
const NUDGES = FR
  ? [MOBILE ? "psst… je suis un dossier. touchez-moi !" : "psst… je suis un dossier. cliquez-moi !", late ? "vous surfez à cette heure-ci ? respect." : "vous scrollez avec beaucoup d’élégance, vous savez.", "hé, le curseur ! par ici !"]
  : [MOBILE ? "psst… I'm a folder. tap me!" : "psst… I'm a folder. click me!", late ? "browsing at this hour? respect." : "you scroll very elegantly, you know.", "hey, cursor! down here!"];
// after the first catch: each time he shows up somewhere new, he reminds you to click / tap him,
// never twice the same way (visitors don't always guess that the game goes on)
const ACT = MOBILE ? (FR ? ["Touchez", "touchez", "toucher"] : ["Tap", "tap", "tap"]) : (FR ? ["Cliquez", "cliquez", "cliquer"] : ["Click", "click", "click"]);
const CALLS = FR ? [
  `Psst, c’est encore moi. ${ACT[0]}-moi !`,
  `Vous m’avez retrouvé ? ${ACT[0]}-moi pour la suite !`,
  `${ACT[0]}-moi, j’ai encore des choses à vous dire.`,
  `Eh oui, toujours moi. Un petit coup de ${MOBILE ? "doigt" : "clic"} ?`,
  `Je ne suis pas une déco : ${ACT[1]}-moi !`,
  `Encore un effort, ${ACT[1]}-moi !`,
  `Vous oubliez quelqu’un ? ${ACT[0]}-moi !`,
  `Coucou ! On continue ? ${ACT[0]}-moi.`,
] : [
  `Psst, it's me again. ${ACT[0]} me!`,
  `Found me? ${ACT[0]} me for the next bit!`,
  `${ACT[0]} me, I've got more to tell you.`,
  `Yep, still me. One little ${ACT[1]}?`,
  `I'm not decoration: ${ACT[1]} me!`,
  `Keep going, ${ACT[1]} me!`,
  `Forgetting someone? ${ACT[0]} me!`,
  `Hi again! Shall we go on? ${ACT[0]} me.`,
];

/* ---------- build ---------- */
const root = document.createElement("div");
root.className = `buddy ${MOBILE ? "buddy--flow" : "piece buddy--strip"}`;
root.innerHTML = `
  <button class="buddy__body" type="button" aria-label="${FR ? "Pix, le petit dossier pixel d’Imane : cliquez pour jouer" : "Pix, Imane's little pixel folder: click to play"}">${sprite()}</button>
  <p class="buddy__bubble" role="status" aria-live="polite" hidden></p>`;
const body = root.querySelector(".buddy__body");
const bubble = root.querySelector(".buddy__bubble");
(document.querySelector(".track") || document.body).append(root);

let spot = 0, busy = false, won = false, nudgeTimer, hideTimer;

function place(i) {
  const s = SPOTS[i];
  if (MOBILE) {
    root.style.order = s.order;
    root.style.alignSelf = s.side === "start" ? "flex-start" : "flex-end";
    root.classList.toggle("buddy--left", s.side === "end");    // on the right → bubble opens to the left
    root.classList.toggle("buddy--right", s.side === "start"); // on the left → bubble opens to the right
    return;
  }
  root.style.setProperty("--bx", `${s.x}%`);
  root.style.setProperty("--by", `${s.y}%`);
  root.classList.toggle("buddy--below", s.y < 28);   // no room above → bubble underneath
  root.classList.toggle("buddy--left", s.x > 90);    // near the right edge → bubble to the left
}
function frame(name) { root.dataset.frame = name; }
// a message stays long enough to be read: 1.2 s + 38 ms per character, between 2 s and 5 s
const readTime = (html = "") => {
  const chars = html.replace(/<[^>]*>/g, "").length;
  return Math.min(5000, Math.max(2000, 1200 + chars * 38));
};
function fitBubble() {
  if (!MOBILE) return;
  const r = root.getBoundingClientRect(), W = document.documentElement.clientWidth;
  const room = root.classList.contains("buddy--left") ? r.right - 12 : W - r.left - 12;
  bubble.style.maxWidth = `${Math.max(150, Math.min(250, room))}px`;
}
function say(html, ms = readTime(html)) {
  clearTimeout(hideTimer);
  bubble.innerHTML = html;
  fitBubble();
  bubble.hidden = false;
  if (anim) gsap.fromTo(bubble, { scale: 0.7, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.18, ease: "back.out(2.5)", overwrite: true });
  if (ms) hideTimer = setTimeout(hush, ms);
}
function hush() {
  if (bubble.hidden) return;
  if (!anim) { bubble.hidden = true; return; }
  gsap.to(bubble, { scale: 0.85, autoAlpha: 0, duration: 0.12, ease: "power2.in", onComplete: () => { bubble.hidden = true; } });
}

// small confetti of the site's own stickers
const PARTY = ["button-strawberry-gingham", "button-gingham-blue", "sticker-sparkles", "sticker-sun", "bead-01", "bead-05", "letter-07", "sticker-plant-flowers"];
function party() {
  if (!anim) return;
  const r = body.getBoundingClientRect();
  for (let i = 0; i < 22; i++) {
    const img = document.createElement("img");
    img.src = `assets/img/home/${PARTY[i % PARTY.length]}.webp`; img.alt = ""; img.className = "buddy__confetti";
    document.body.append(img);
    const a = (i / 22) * Math.PI * 2, d = gsap.utils.random(70, 170);
    gsap.timeline({ onComplete: () => img.remove() })
      .fromTo(img, { x: r.left + r.width / 2, y: r.top + r.height / 2, xPercent: -50, yPercent: -50, scale: 0, rotation: gsap.utils.random(-90, 90) },
        { x: `+=${Math.cos(a) * d}`, y: `+=${Math.sin(a) * d}`, scale: 1, duration: 0.5, ease: "back.out(2)" })
      .to(img, { y: "+=120", autoAlpha: 0, rotation: "+=120", duration: 0.9, ease: "power2.in" }, "+=0.4");
  }
}

function jump() {
  frame("happy");
  if (!anim) return Promise.resolve();
  return gsap.timeline()
    .to(body, { scaleY: 0.8, scaleX: 1.15, duration: 0.08, ease: "power2.out", transformOrigin: "50% 100%" })
    .to(body, { y: -22, scaleY: 1.1, scaleX: 0.92, duration: 0.22, ease: "power2.out" })
    .to(body, { y: 0, scaleY: 1, scaleX: 1, duration: 0.3, ease: "bounce.out" })
    .then();
}

// he really travels to his next hiding spot: hopping and waddling all the way (GSAP Flip measures
// where he is and where he lands, on the horizontal strip as well as in the phone column)
async function runAway() {
  const next = spot + 1;
  if (!anim || !window.Flip) { spot = next; place(spot); frame("idle"); return; }
  const svg = body.querySelector("svg");
  const from = root.getBoundingClientRect();
  const state = Flip.getState(root);
  spot = next;
  place(spot);
  const to = root.getBoundingClientRect();
  const dist = Math.hypot(to.left - from.left, to.top - from.top);
  const duration = gsap.utils.clamp(0.7, 1.6, dist / 1000); // a long way takes a bit longer, never too long
  frame("happy");
  const waddle = gsap.to(svg, { rotation: 9, duration: 0.12, repeat: -1, yoyo: true, ease: "sine.inOut", transformOrigin: "50% 100%" });
  const hop = gsap.to(body, { y: -12, duration: 0.15, repeat: -1, yoyo: true, ease: "power1.out" });
  // he vanishes as he leaves and pops back as he lands, but stays faintly visible on the way
  // (a little ghost crossing the page), so you can follow where he goes
  const ghost = gsap.timeline()
    .to(root, { autoAlpha: 0.18, duration: duration * 0.3, ease: "power2.in" }, 0)
    .to(body, { scale: 0.6, duration: duration * 0.3, ease: "power2.in" }, 0)
    .to(root, { autoAlpha: 1, duration: duration * 0.3, ease: "power2.out" }, duration * 0.7)
    .to(body, { scale: 1, duration: duration * 0.3, ease: "back.out(2.5)" }, duration * 0.7);
  await Flip.from(state, { duration, ease: "power2.inOut" }).then();
  await ghost.then();
  waddle.kill(); hop.kill();
  gsap.to(svg, { rotation: 0, duration: 0.25, ease: "back.out(3)" });
  gsap.to(body, { y: 0, duration: 0.25, ease: "bounce.out" });
  frame("idle");
}

body.addEventListener("click", async () => {
  if (busy) return;
  busy = true;
  play("pop");
  const jumping = jump();
  if (won) {
    const extra = EXTRA[Math.floor(Math.random() * EXTRA.length)];
    say(extra);
    frame("idle");
  } else if (spot < SPOTS.length - 1) {
    const line = `${LINES[spot]}<span class="buddy__count">${spot + 1} / ${SPOTS.length}</span>`;
    say(line, readTime(line));
    await jumping;
    await new Promise((r) => setTimeout(r, readTime(line))); // he waits until you have read it
    hush();
    await new Promise((r) => setTimeout(r, 120));
    await runAway();
  } else {
    await jumping;
    won = true;
    play("jingle");
    party();
    say(`${WIN}<a class="buddy__cta" href="mailto:imane.shaiba@outlook.com" data-marker="fluo">${CTA}</a><span class="buddy__count">${SPOTS.length} / ${SPOTS.length}</span>`, 0);
    addMarkers(bubble);
    setTimeout(() => frame("idle"), 1200);
  }
  busy = false;
});

/* ---------- idle life: blinks, a little bob, and a nudge until the first click ---------- */
place(0);
frame("idle");
root.style.visibility = "hidden";
introDone.then(() => {
  root.style.visibility = "";
  if (anim) {
    gsap.fromTo(root, { scale: 0 }, { scale: 1, duration: 0.5, ease: "back.out(2.5)", delay: 0.8 });
    gsap.to(body.querySelector("svg"), { y: -2, duration: 0.6, repeat: -1, yoyo: true, ease: "sine.inOut" });
    const blink = () => { if (root.dataset.frame === "idle") { frame("blink"); setTimeout(() => root.dataset.frame === "blink" && frame("idle"), 140); } setTimeout(blink, gsap.utils.random(2200, 4200)); };
    setTimeout(blink, 2000);
  }
  // invitations: when he comes into view (first time at a spot, then every ~9 s while he waits)
  let n = 0, c = Math.floor(Math.random() * CALLS.length), visible = false;
  const invite = () => {
    if (busy || won || !visible || !bubble.hidden) return;
    say(spot === 0 ? NUDGES[n++ % NUDGES.length] : CALLS[c++ % CALLS.length]);
  };
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([e]) => {
      const was = visible;
      visible = e.isIntersecting && e.intersectionRatio > 0.6;
      if (visible && !was) setTimeout(invite, 700);
    }, { threshold: [0, 0.6, 1] }).observe(root);
  } else visible = true;
  setTimeout(invite, 2600);
  nudgeTimer = setInterval(invite, 9000);
});

