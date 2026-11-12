import {defineArrayMember, defineField, defineType} from 'sanity'
import {FolderIcon} from '@sanity/icons/Folder'

// One project on the Works page (Figma component "Card-project").
export const projet = defineType({
  name: 'projet',
  title: 'Project',
  type: 'document',
  icon: FolderIcon,
  fields: [
    defineField({
      name: 'titre',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required().max(60),
    }),
    defineField({
      name: 'description',
      type: 'text',
      rows: 4,
      validation: (rule) => rule.required().max(320),
    }),
    defineField({
      name: 'annee',
      title: 'Year',
      type: 'string',
      description: 'e.g. 2026',
      validation: (rule) => rule.required().regex(/^\d{4}$/, {name: 'year'}),
    }),
    defineField({
      name: 'type',
      type: 'string',
      description: 'e.g. School project, Client project (school context)',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'outils',
      title: 'Tools',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
      validation: (rule) => rule.min(1),
    }),
    defineField({
      name: 'image',
      type: 'image',
      description: 'Shown at a 592 × 323 ratio (cropped around the hotspot).',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternative Text',
          type: 'string',
          validation: (rule) => rule.required().warning('Describe the image for screen readers'),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'lien',
      title: 'Live site URL',
      type: 'url',
      validation: (rule) => rule.uri({scheme: ['https', 'http']}),
    }),
    defineField({
      name: 'ordre',
      title: 'Order',
      type: 'number',
      description: '1 = first card',
      validation: (rule) => rule.required().integer().min(1),
    }),
  ],
  orderings: [{title: 'Order', name: 'ordreAsc', by: [{field: 'ordre', direction: 'asc'}]}],
  preview: {
    select: {title: 'titre', annee: 'annee', type: 'type', media: 'image'},
    prepare: ({title, annee, type, media}) => ({title, subtitle: [annee, type].filter(Boolean).join(' · '), media}),
  },
})
