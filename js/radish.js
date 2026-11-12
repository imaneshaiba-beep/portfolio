// "Radi", a little pixel radish living on the home page (same pixel-sticker style as Pix the folder:
// chunky pixels, black outline, dithered texture, hard grey shadow).
// He just sleeps: closed eyes, slow breathing, z z z. (Decorative: no interaction.)
// Desktop strip only (on mobile the scrapbook is a vertical list and Pix is enough company).
import { introDone } from "./intro.js";

const MOBILE = window.matchMedia("(max-width: 52rem), (orientation: portrait)").matches;
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const track = document.querySelector(".track");

if (!MOBILE && track) {
  /* ---------- sprite: 16 × 18 grid ---------- */
  // k ink · g leaf · G dark leaf · r radish · R shade · l highlight · w root
  const SHAPE = [
    "......kk.kk.....",
    ".....kggkggk....",
    "....kgGgkgGgk...",
    "....kggGkGggk...",
    ".....kggkggk....",
    "......kkgkk.....",
    ".......kgk......",
    ".....kkkkkkk....",
    "....krrrrrrrk...",
    "...krlrrrrrrrk..",
    "...krlrrrrrrrk..",
    "...krrrrrrrrRk..",
    "...krrrrrrrRRk..",
    "....krrrrrRRk...",
    ".....krrrRRk....",
    "......kkwkk.....",
    ".......kwk......",
    "........k.......",
  ];
  // two close tones per colour, laid in a checkerboard → the dithered texture of the site's pixel stickers
  const TONES = {
    k: ["#141414", "#141414"], g: ["#74c64f", "#62b343"], G: ["#3f8a2e", "#62b343"],
    r: ["#ee5267", "#dc4459"], R: ["#b4334b", "#dc4459"], l: ["#ffa3b1", "#ee5267"], w: ["#fff8ee", "#e9dfcf"],
  };
  const SHADOW = "#9a9a9a";
  const rect = (x, y, fill) => `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${fill}"/>`;
  const filled = (x, y) => SHAPE[y]?.[x] && SHAPE[y][x] !== ".";
  let art = "";
  SHAPE.forEach((row, y) => [...row].forEach((c, x) => {   // hard pixel shadow, 1 px down-right
    if (c !== "." && !filled(x + 1, y + 1)) art += rect(x + 1, y + 1, SHADOW);
  }));
  SHAPE.forEach((row, y) => [...row].forEach((c, x) => {
    if (TONES[c]) art += rect(x, y, TONES[c][(x + y) % 2]);
  }));
  const INK = "#141414", PINK = "#ffb3c1";
  const px = (cells, fill = INK) => cells.map(([x, y]) => rect(x, y, fill)).join("");
  const cheeks = px([[5, 12], [11, 12]], PINK);
  const SLEEP = px([[5, 11], [6, 11], [10, 11], [11, 11], [8, 13]]) + cheeks;

  /* ---------- build ---------- */
  const root = document.createElement("div");
  root.className = "buddy radish piece buddy--strip";
  root.style.setProperty("--bx", "26.6%");   // sitting on the top edge of the lined "skills" paper
  root.style.setProperty("--by", "44.8%");
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = `
    <span class="buddy__body">
      <svg viewBox="-1 -1 19 20" shape-rendering="crispEdges">${art}${SLEEP}</svg>
    </span>
    <span class="radish__z"><i>z</i><i>z</i><i>z</i></span>`;
  track.append(root);
  const body = root.querySelector(".buddy__body");
  const anim = !!window.gsap && !REDUCED;

  // breathing while asleep
  root.style.visibility = "hidden";
  introDone.then(() => {
    root.style.visibility = "";
    if (anim) gsap.to(body.querySelector("svg"), { scaleY: 0.96, scaleX: 1.02, transformOrigin: "50% 100%", duration: 1.6, repeat: -1, yoyo: true, ease: "sine.inOut" });
  });
}
