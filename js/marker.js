// Hover / focus effects for links, drawn like on paper.
// data-marker="fluo"   → highlighter swipe behind the text (CTAs)
// data-marker="line"   → marker stroke under the text (small links)
// data-marker="circle" → red felt-pen circle drawn around the word
// The text is wrapped in a span so the effect follows the text actually displayed
// (translations, other fonts). Animations are CSS only — see .marker in components.css.

const NS = "http://www.w3.org/2000/svg";
// Circle drawn on a 100 × 50 grid, absolute commands only (every number pair = x,y).
const CIRCLE = "M60 6C33 2 7 10 4 25C1 41 28 49 55 47C82 45 98 35 96 21C94 8 72 2 46 5C35 6 27 9 22 13";

function scalePath(d, sx, sy) {
  let i = 0;
  return d.replace(/-?\d*\.?\d+/g, (n) => (parseFloat(n) * (i++ % 2 === 0 ? sx : sy)).toFixed(1));
}

// Build the path in pixels (no SVG stretching → even stroke, reliable pathLength).
function drawCircle(svg) {
  const w = svg.clientWidth, h = svg.clientHeight;
  if (!w || !h) return;
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  svg.firstElementChild.setAttribute("d", scalePath(CIRCLE, w / 100, h / 50));
}

const resize = "ResizeObserver" in window
  ? new ResizeObserver((entries) => entries.forEach((e) => {
      const svg = e.target.querySelector(":scope > .marker-circle");
      if (svg) drawCircle(svg);
    }))
  : null;

export function addMarkers(root = document) {
  root.querySelectorAll("[data-marker]").forEach((el) => {
    if (el.querySelector(":scope > .marker")) return;
    const kind = ["line", "circle"].includes(el.dataset.marker) ? el.dataset.marker : "fluo";
    const span = document.createElement("span");
    span.className = `marker marker--${kind}`;
    span.append(...el.childNodes);
    el.append(span);

    if (kind === "circle") {
      const svg = document.createElementNS(NS, "svg");
      svg.setAttribute("class", "marker-circle");
      svg.setAttribute("aria-hidden", "true");
      const path = document.createElementNS(NS, "path");
      path.setAttribute("pathLength", "1");
      svg.append(path);
      span.append(svg);
      requestAnimationFrame(() => drawCircle(svg));
      resize?.observe(span);
    }
  });
}

// Touch screens have no hover: the call-to-action effects (highlighter swipe, felt-pen circle) play
// by themselves every few seconds on the ones that are on screen, so phone visitors see them too.
const AUTO = ".link-piece .marker, [data-field=\"lien\"] .marker";
if (window.matchMedia("(hover: none)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const onScreen = (el) => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; };
  const pulse = () => {
    document.querySelectorAll(AUTO).forEach((m, i) => {
      if (!onScreen(m)) return;
      setTimeout(() => {
        m.classList.add("is-auto");
        setTimeout(() => m.classList.remove("is-auto"), 1800);   // stays drawn 1.8 s, then wipes off
      }, i * 250);
    });
  };
  setTimeout(pulse, 1500);
  setInterval(pulse, 4500);
}
