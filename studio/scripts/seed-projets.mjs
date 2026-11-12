// One-off seed: creates the two current projects (content from the brief) with their images.
// Run from the studio folder: npx sanity exec <this file> --with-user-token
import {getCliClient} from 'sanity/cli'
import {createReadStream} from 'node:fs'
import {homedir} from 'node:os'

const client = getCliClient({apiVersion: '2025-02-19'})
const desk = homedir() + '/Desktop/portolio/image/'

const projets = [
  {
    titre: 'Cabinet infini',
    description: 'A bottomless cabinet of curiosities. Thousands of posters, picked by graphic designers from all over the world, glide, renew themselves and never stop. Catch them, open them, get lost in them.',
    annee: '2026',
    type: 'School project',
    outils: ['GSAP', 'Tailwind CSS', 'Figma'],
    lien: 'https://3tiweb.techniques-graphiques.be/shaibanova/cabinet-infini/',
    ordre: 1,
    file: 'cabinet infinie.png',
    alt: 'Cabinet infini homepage: a wall of colourful posters',
  },
  {
    titre: 'Marais de Biestebroeck',
    description: 'A 1.5-hectare urban marsh threatened by a real-estate project, and a collective fighting to save it. I designed the website that carries their fight: telling the story of the place, rallying supporters, collecting signatures.',
    annee: '2025',
    type: 'Client project (school context)',
    outils: ['WordPress', 'PHP', 'Figma'],
    lien: 'https://maraisbiestebroeck.be/',
    ordre: 2,
    file: 'photo_marais.webp',
    alt: 'The Biestebroeck marsh with a brick building behind wild vegetation',
  },
]

const existing = await client.fetch('*[_type == "projet"].titre')
for (const p of projets) {
  if (existing.includes(p.titre)) { console.log('skip (exists):', p.titre); continue }
  const asset = await client.assets.upload('image', createReadStream(desk + p.file), {filename: p.file})
  const {file, alt, ...fields} = p
  const doc = await client.create({
    _type: 'projet',
    ...fields,
    image: {_type: 'image', alt, asset: {_type: 'reference', _ref: asset._id}},
  })
  console.log('created:', doc.titre, doc._id)
}
