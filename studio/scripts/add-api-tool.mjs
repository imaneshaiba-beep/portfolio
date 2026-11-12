// One-off: add "API" to the tools of the project "Cabinet infini".
import {getCliClient} from 'sanity/cli'
const client = getCliClient({apiVersion: '2025-02-19'})
const doc = await client.fetch('*[_type == "projet" && titre == "Cabinet infini"][0]{_id, outils}')
if (!doc) throw new Error('Cabinet infini not found')
if ((doc.outils || []).includes('API')) { console.log('already there:', doc.outils); process.exit(0) }
const res = await client.patch(doc._id).setIfMissing({outils: []}).append('outils', ['API']).commit()
console.log('outils now:', res.outils)
