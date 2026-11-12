// One-off seed: the first two side quests (facts taken from the live sites).
// Run from the studio folder: npx sanity exec scripts/seed-quests.mjs --with-user-token
import {getCliClient} from 'sanity/cli'
import {createReadStream} from 'node:fs'

const client = getCliClient({apiVersion: '2025-02-19'})
const k = () => Math.random().toString(36).slice(2, 10)
const p = (text) => ({_type: 'block', _key: k(), style: 'normal', markDefs: [], children: [{_type: 'span', _key: k(), text, marks: []}]})
const li = (text) => ({...p(text), listItem: 'bullet', level: 1})
const h = (text) => ({...p(text), style: 'h3'})

const quests = [
  {
    titre: 'Rise Art — Japonisme',
    slug: 'rise-art-japonisme',
    statut: 'done',
    description: 'A gallery of 8 Japanese woodblock prints (ukiyo-e): hover a print to reveal its original colours.',
    outils: ['HTML', 'CSS', 'JavaScript'],
    lien: 'https://3tiweb.techniques-graphiques.be/shaibanova/RiseArt/galerie.html',
    ordre: 1,
    file: 'quest-riseart.jpg',
    alt: 'Rise Art gallery: "Les Estampes" in white and green on a black background',
    contenu: [
      h('What I tested'),
      li('Horizontal scroll in the hero'),
      li('Reveal on scroll, parallax and a custom cursor'),
      li('A glitch effect and an animated counter'),
      li('Hover to reveal the original colours of each print'),
      p('All in vanilla JavaScript (IntersectionObserver, requestAnimationFrame), without any library.'),
    ],
  },
  {
    titre: 'World population',
    slug: 'world-population',
    statut: 'done',
    description: 'An interactive world map: 12 countries and 16 World Bank indicators from 1960 to today, with a live population counter.',
    outils: ['D3.js', 'GSAP', 'Tailwind CSS', 'MySQL'],
    lien: 'https://snazzy-pasca-67455c.netlify.app/',
    ordre: 2,
    file: 'quest-population.jpg',
    alt: 'Dark world map with country cards (Belgium, France, Japan…) and a live counter of 8.3 billion inhabitants',
    contenu: [
      h('What I tested'),
      li('Mapping open data from the World Bank with D3.js (zoom, drag, colour scales)'),
      li('A live population estimate computed from global growth, birth and death rates'),
      li('A time travel slider from 1960 to the latest data'),
      li('Switching the data source: MySQL, JSON or a spreadsheet'),
      li('Text animations with GSAP SplitText'),
    ],
  },
]

const existing = await client.fetch('*[_type == "quest"].slug.current')
for (const q of quests) {
  if (existing.includes(q.slug)) { console.log('skip (exists):', q.titre); continue }
  const asset = await client.assets.upload('image', createReadStream(new URL(`./seed-assets/${q.file}`, import.meta.url)), {filename: q.file})
  const {file, alt, slug, ...fields} = q
  const doc = await client.create({
    _type: 'quest', ...fields,
    slug: {_type: 'slug', current: slug},
    apercu: {_type: 'image', alt, asset: {_type: 'reference', _ref: asset._id}},
  })
  console.log('created:', doc.titre, doc._id)
}
