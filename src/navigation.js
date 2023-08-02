import { getPermalink, getBlogPermalink, getAsset } from './utils/permalinks';
import { getHomePermalink } from '~/utils/permalinks';

export const headerData = {
  links: [
    {
      text: 'Home',
      href: getHomePermalink(),
    },
    {
      text: 'About',
      href: getPermalink('/about'),
    },
    {
      text: 'Research',
      href: getBlogPermalink(),
    },
    {
      text: 'Projects',
      href: getPermalink('/projects'),
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
      title: 'Info',
      links: [
        { text: 'About', href: getPermalink('/about') },
        { text: 'Blog', href: getBlogPermalink() },
      ],
    },
    {
      title: 'Support',
      links: [
        { text: 'Contact', href: getPermalink('/contact') },
        { text: 'Discord', href: 'https://discord.gg/72vH6ZJNUW' },
      ],
    },
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
