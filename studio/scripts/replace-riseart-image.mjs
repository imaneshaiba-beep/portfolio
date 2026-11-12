// One-off: Rise Art preview = the purple bamboo / geisha collage from the home page.
import {getCliClient} from 'sanity/cli'
import {createReadStream} from 'node:fs'
const client = getCliClient({apiVersion: '2025-02-19'})
const doc = await client.fetch('*[_type == "quest" && slug.current == "rise-art-japonisme"][0]{_id}')
if (!doc) throw new Error('quest not found')
const asset = await client.assets.upload('image', createReadStream(new URL('./seed-assets/quest-riseart-collage.jpg', import.meta.url)), {filename: 'quest-riseart-collage.jpg'})
await client.patch(doc._id).set({
  apercu: {_type: 'image', alt: 'Rise Art: a purple collage of Japanese prints — bamboo, a parasol, geishas and calligraphy', asset: {_type: 'reference', _ref: asset._id}},
}).commit()
console.log('updated', doc._id, asset._id)
