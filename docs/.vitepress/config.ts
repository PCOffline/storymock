import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'storymock',
  description: 'Build mocks from stories. TypeScript-first mocking library.',
  cleanUrls: true,
  appearance: 'dark',

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'API Reference', link: '/reference/' },
      { text: 'Examples', link: '/examples' },
      {
        text: 'StackBlitz',
        link: 'https://stackblitz.com/github/storymock/storymock/tree/main',
      },
      {
        text: 'GitHub',
        link: 'https://github.com/storymock/storymock',
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Getting Started', link: '/guide/' },
            { text: 'Core Concepts', link: '/guide/concepts' },
            { text: 'Working with Fakers', link: '/guide/fakers' },
            { text: 'Working with Schemas', link: '/guide/schemas' },
            { text: 'Working with Stories', link: '/guide/stories' },
            { text: 'Configuration', link: '/guide/configuration' },
            { text: 'Errors', link: '/guide/errors' },
          ],
        },
      ],
      '/reference/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Quick Reference', link: '/reference/' },
            { text: 'Faker API', link: '/reference/faker' },
            { text: 'Schema API', link: '/reference/schema' },
            { text: 'Story API', link: '/reference/story' },
          ],
        },
      ],
      '/examples': [
        {
          text: 'Examples',
          items: [
            { text: 'Overview', link: '/examples' },
            {
              text: 'Fakers & Composability',
              link: '/examples#fakers-composability',
            },
            {
              text: 'Traits & Customization',
              link: '/examples#traits-customization',
            },
            {
              text: 'Conditional Fields',
              link: '/examples#conditional-fields',
            },
            { text: 'Story Composition', link: '/examples#story-composition' },
            { text: 'Story Inheritance', link: '/examples#story-inheritance' },
            {
              text: 'Seeding & Determinism',
              link: '/examples#seeding-determinism',
            },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/storymock/storymock' },
    ],

    search: {
      provider: 'local',
    },

    footer: {
      message: 'MIT License',
      copyright: 'storymock',
    },
  },
});
