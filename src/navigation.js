import { getPermalink, getBlogPermalink, getAsset } from './utils/permalinks';

export const headerData = {
  links: [
    { text: 'About',
      href: getPermalink('/about')},
    {
      text: 'Research',
      href: getBlogPermalink(),
    },
    {
      text: 'Projects',
      href: '#',
    },
    {
      text: 'Contact',
      href: '#',
    },
  ],
};

export const footerData = {
  links: [
    {
      title: 'Product',
      links: [
        { text: 'Features', href: '#features' },
        { text: 'Projects', href: '#projects' },
      ],
    },
    {
      title: 'Support',
      links: [
        { text: 'Documentation', href: '#' },
        { text: 'Discord', href: 'https://discord.gg/72vH6ZJNUW' },
      ],
    },
    {
      title: 'Company',
      links: [
        { text: 'About', href: getPermalink('/about') },
        { text: 'Blog', href: getBlogPermalink() },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'Terms', href: getPermalink('/terms') },
    { text: 'Privacy Policy', href: getPermalink('/privacy') },
  ],
  socialLinks: [
    { ariaLabel: 'RSS', icon: 'tabler:rss', href: getAsset('/rss.xml') },
    { ariaLabel: 'Discord', icon: 'tabler:brand-discord', href: 'https://discord.gg/72vH6ZJNUW' },
    { ariaLabel: 'Github', icon: 'tabler:brand-github', href: 'https://github.com/vipyrsec' },
  ],
  footNote: `
   Vipyr Security © 2023 - All Rights Reserved
  `,
};
