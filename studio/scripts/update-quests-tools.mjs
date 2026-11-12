// One-off: map-only thumbnail for "World population" + tools as given by Shaiba.
import {getCliClient} from 'sanity/cli'
import {createReadStream} from 'node:fs'
const client = getCliClient({apiVersion: '2025-02-19'})
const get = (slug) => client.fetch('*[_type == "quest" && slug.current == $slug][0]{_id}', {slug})
const pop = await get('world-population')
const rise = await get('rise-art-japonisme')
const asset = await client.assets.upload('image', createReadStream(new URL('./seed-assets/quest-population-map.jpg', import.meta.url)), {filename: 'quest-population-map.jpg'})
await client.patch(pop._id).set({
  outils: ['API', 'Tailwind CSS', 'Netlify'],
  apercu: {_type: 'image', alt: 'Dark world map: every country coloured in shades of blue according to a World Bank indicator', asset: {_type: 'reference', _ref: asset._id}},
}).commit()
await client.patch(rise._id).set({outils: ['HTML', 'CSS', 'JavaScript']}).commit()
console.log(await client.fetch('*[_type == "quest"] | order(ordre asc){titre, outils, "img": apercu.asset->url}'))
