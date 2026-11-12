// Minimal, safe Portable Text renderer (Sanity rich text) — DOM nodes only, no innerHTML.
// Supports: normal / h3 / blockquote, bullet & numbered lists, strong / em / code, links.

function renderSpans(block, markDefs = []) {
  const frag = document.createDocumentFragment();
  for (const span of block.children || []) {
    let node = document.createTextNode(span.text || "");
    for (const mark of span.marks || []) {
      const def = markDefs.find((d) => d._key === mark);
      let wrap;
      if (def?._type === "link" && def.href && /^(https?:|mailto:)/.test(def.href)) {
        wrap = document.createElement("a");
        wrap.href = def.href;
        if (!def.href.startsWith("mailto:")) { wrap.target = "_blank"; wrap.rel = "noopener"; }
      } else if (["strong", "em", "code"].includes(mark)) {
        wrap = document.createElement(mark);
      }
      if (wrap) { wrap.append(node); node = wrap; }
    }
    frag.append(node);
  }
  return frag;
}

export function renderPortableText(blocks = []) {
  const frag = document.createDocumentFragment();
  let list = null;
  for (const block of blocks) {
    if (block._type !== "block") continue;
    if (block.listItem) {
      const tag = block.listItem === "number" ? "ol" : "ul";
      if (!list || list.tagName.toLowerCase() !== tag) { list = document.createElement(tag); frag.append(list); }
      const li = document.createElement("li");
      li.append(renderSpans(block, block.markDefs));
      list.append(li);
      continue;
    }
    list = null;
    const tag = { h3: "h3", blockquote: "blockquote" }[block.style] || "p";
    const el = document.createElement(tag);
    el.append(renderSpans(block, block.markDefs));
    frag.append(el);
  }
  return frag;
}
