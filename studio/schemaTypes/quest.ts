import {defineArrayMember, defineField, defineType} from 'sanity'
import {SparklesIcon} from '@sanity/icons/Sparkles'

// One experiment on the Quests page (Figma component "Card-quest").
export const quest = defineType({
  name: 'quest',
  type: 'document',
  icon: SparklesIcon,
  fields: [
    defineField({
      name: 'titre',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required().max(60),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      description: 'Address of the detail page: quest.html?q=<slug>',
      options: {source: 'titre', maxLength: 60},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'statut',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'Done', value: 'done'},
          {title: 'In progress', value: 'in-progress'},
          {title: 'Next', value: 'next'},
        ],
        layout: 'radio',
      },
      initialValue: 'in-progress',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.max(200),
    }),
    defineField({
      name: 'outils',
      title: 'Tools',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
    }),
    defineField({
      name: 'apercu',
      title: 'Preview',
      type: 'image',
      description: 'Still image or short animated GIF, 16:10. For real videos, host them on YouTube/Vimeo and use the link field.',
      options: {hotspot: true},
      fields: [
        defineField({name: 'alt', title: 'Alternative Text', type: 'string'}),
      ],
      hidden: ({document}) => document?.statut === 'next',
    }),
    defineField({
      name: 'contenu',
      title: 'Detail page content',
      description: 'What you tested, how, what you learned (shown on the detail page).',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [{title: 'Normal', value: 'normal'}, {title: 'Heading', value: 'h3'}, {title: 'Quote', value: 'blockquote'}],
          lists: [{title: 'Bullet', value: 'bullet'}, {title: 'Numbered', value: 'number'}],
          marks: {
            decorators: [{title: 'Bold', value: 'strong'}, {title: 'Italic', value: 'em'}, {title: 'Code', value: 'code'}],
            annotations: [defineArrayMember({name: 'link', type: 'object', fields: [defineField({name: 'href', type: 'url', validation: (r) => r.uri({scheme: ['http', 'https', 'mailto']})})]})],
          },
        }),
      ],
    }),
    defineField({
      name: 'galerie',
      title: 'Gallery',
      type: 'array',
      of: [defineArrayMember({type: 'image', options: {hotspot: true}, fields: [defineField({name: 'alt', title: 'Alternative Text', type: 'string'}), defineField({name: 'legende', title: 'Caption', type: 'string'})]})],
      options: {layout: 'grid'},
    }),
    defineField({
      name: 'lien',
      title: 'Link to the experiment',
      type: 'url',
      hidden: ({document}) => document?.statut === 'next',
    }),
    defineField({
      name: 'ordre',
      title: 'Order',
      type: 'number',
      validation: (rule) => rule.required().integer().min(1),
    }),
  ],
  orderings: [{title: 'Order', name: 'ordreAsc', by: [{field: 'ordre', direction: 'asc'}]}],
  preview: {
    select: {title: 'titre', statut: 'statut', media: 'apercu'},
    prepare: ({title, statut, media}) => ({title, subtitle: statut, media}),
  },
})
