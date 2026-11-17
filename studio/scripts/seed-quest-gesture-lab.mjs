// One-off seed: the Gesture Lab side quest (presented at the open house, Nov. 2026).
// Run from the studio folder: npx sanity exec scripts/seed-quest-gesture-lab.mjs --with-user-token
import {getCliClient} from 'sanity/cli'
import {createReadStream} from 'node:fs'

const client = getCliClient({apiVersion: '2025-02-19'})
const k = () => Math.random().toString(36).slice(2, 10)
const p = (text) => ({_type: 'block', _key: k(), style: 'normal', markDefs: [], children: [{_type: 'span', _key: k(), text, marks: []}]})
const li = (text) => ({...p(text), listItem: 'bullet', level: 1})
const h = (text) => ({...p(text), style: 'h3'})

const q = {
  titre: 'Gesture Lab',
  slug: 'gesture-lab',
  statut: 'done',
  description: 'Touch without touching: an iridescent 3D shape you sculpt with your hand through the webcam, entirely in the browser.',
  outils: ['three.js', 'GLSL', 'MediaPipe', 'TouchDesigner', 'Vercel'],
  lien: 'https://shaiba-imane-gesture-lab.vercel.app',
  file: 'quest-gesture-lab.jpg',
  alt: 'Gesture Lab: an iridescent dark 3D blob floating over the words "Touche sans toucher", with the gesture guide on the left',
  contenu: [
    h('What I tested'),
    li('Hand tracking in the browser with MediaPipe Hand Landmarker: 21 points per hand, about 30 frames per second'),
    li('Gestures as controls: move to aim, pinch to grab and rotate, quick pinch to change shape, open hand to make it breathe'),
    li('One sphere, three shapes (pebble, flower, twist) morphing in a GLSL vertex shader, with an iridescent cosine palette and a glitch effect'),
    li('A One Euro filter to smooth the hand cursor without lag'),
    li('A TouchDesigner version of the same shape and gestures, to film a high-quality video'),
    h('Privacy first'),
    p('The camera is optional and only starts after a click. The video is analysed on the device and never sent or recorded. Everything also works with the mouse, touch and keyboard.'),
    p('Presented at the school open house.'),
  ],
}

const existing = await client.fetch('*[_type == "quest"]{"slug": slug.current, ordre}')
if (existing.some((e) => e.slug === q.slug)) {
  console.log('skip (exists):', q.titre)
} else {
  const ordre = Math.max(0, ...existing.map((e) => e.ordre ?? 0)) + 1
  const asset = await client.assets.upload('image', createReadStream(new URL(`./seed-assets/${q.file}`, import.meta.url)), {filename: q.file})
  const {file, alt, slug, ...fields} = q
  const doc = await client.create({
    _type: 'quest', ...fields, ordre,
    slug: {_type: 'slug', current: slug},
    apercu: {_type: 'image', alt, asset: {_type: 'reference', _ref: asset._id}},
  })
  console.log('created:', doc.titre, doc._id, 'ordre', ordre)
}
