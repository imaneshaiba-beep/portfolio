// Liquid-glass refraction for the dock (Chromium: SVG filter inside backdrop-filter).
// A displacement map is generated for the dock's exact shape: neutral in the middle,
// strong bending along a bezel at the edges — the page behind is pulled in like
// through a thick glass lens. Each colour channel bends a little differently,
// which gives the rainbow fringe (dispersion) on the edges.
// Other browsers keep the CSS fallback (blur + saturation).

const FILTER_ID = "liquid-glass";
const BEZEL = 26;        // px: width of the curved edge
const STRENGTH = 78;     // px: max displacement (red); green/blue a bit less → dispersion
const NS = "http://www.w3.org/2000/svg";

// Displacement map (R = x, G = y, 128 = no shift) for a rounded rectangle.
function buildMap(w, h, radius) {
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(w, h);
  const hw = w / 2, hh = h / 2, r = Math.min(radius, hw, hh);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = x + 0.5 - hw, py = y + 0.5 - hh;
      const qx = Math.abs(px) - (hw - r), qy = Math.abs(py) - (hh - r);
      // signed distance to the rounded rect (negative inside) → depth from the edge
      const depth = -(Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r);
      let dx = 0, dy = 0;
      if (depth > 0 && depth < BEZEL) {
        let nx, ny; // outward normal of the closest edge
        if (qx > 0 && qy > 0) { const l = Math.hypot(qx, qy); nx = (qx / l) * Math.sign(px); ny = (qy / l) * Math.sign(py); }
        else if (qx > qy) { nx = Math.sign(px); ny = 0; }
        else { nx = 0; ny = Math.sign(py); }
        const t = 1 - depth / BEZEL;
        const k = t * t * (3 - 2 * t);           // smooth curve, strongest at the rim
        dx = nx * k; dy = ny * k;                // sample from outside → content bends in
      }
      const i = (y * w + x) * 4;
      img.data[i] = 128 + dx * 127;
      img.data[i + 1] = 128 + dy * 127;
      img.data[i + 2] = 128;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  // toBlob encodes the PNG off the main thread (toDataURL would block it for ~200 ms on a phone)
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob && URL.createObjectURL(blob)), "image/png"));
}

function channel(scale, matrix, name) {
  return `<feDisplacementMap in="SourceGraphic" in2="map" scale="${scale}" xChannelSelector="R" yChannelSelector="G" result="d${name}"/>
          <feColorMatrix in="d${name}" type="matrix" values="${matrix}" result="${name}"/>`;
}

let lastSize = "", mapUrl = null;
async function render(svg, dock) {
  const w = Math.round(dock.offsetWidth), h = Math.round(dock.offsetHeight);
  if (!w || !h || `${w}x${h}` === lastSize) return; // same size: the map is already right
  lastSize = `${w}x${h}`;
  const radius = parseFloat(getComputedStyle(dock).borderTopLeftRadius) || 34;
  const url = await buildMap(w, h, radius);
  if (!url || lastSize !== `${w}x${h}`) return; // resized again meanwhile: a newer map is coming
  if (mapUrl) URL.revokeObjectURL(mapUrl);
  mapUrl = url;
  svg.innerHTML = `
    <filter id="${FILTER_ID}" filterUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}" color-interpolation-filters="sRGB">
      <feImage href="${url}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" result="map"/>
      ${channel(STRENGTH, "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0", "red")}
      ${channel(STRENGTH * 0.9, "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0", "green")}
      ${channel(STRENGTH * 0.8, "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0", "blue")}
      <feBlend in="red" in2="green" mode="screen" result="rg"/>
      <feBlend in="rg" in2="blue" mode="screen"/>
    </filter>`;
  dock.classList.add("is-liquid"); // only once the filter exists (else the backdrop would be empty)
}

export function initLiquidGlass() {
  const dock = document.querySelector(".dock");
  if (!dock || document.getElementById("liquid-glass-defs")) return;
  const isChromium = !!navigator.userAgentData?.brands?.some((b) => /Chrom/i.test(b.brand));
  if (!isChromium) return;

  const svg = document.createElementNS(NS, "svg");
  svg.id = "liquid-glass-defs";
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.style.position = "absolute";
  document.body.append(svg);

  // the dock is hidden behind the intro at first: build the map when the browser is idle, not
  // during page load. The ResizeObserver also fires once right away, so it does the first render
  // (no second, identical render). Resizes are grouped per frame.
  let raf = 0;
  const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => render(svg, dock)); };
  const start = () => {
    if ("ResizeObserver" in window) new ResizeObserver(schedule).observe(dock);
    else render(svg, dock);
  };
  if ("requestIdleCallback" in window) requestIdleCallback(start, { timeout: 2000 });
  else setTimeout(start, 200);
}

initLiquidGlass();
