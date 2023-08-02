import { getPermalink, getBlogPermalink, getAsset } from './utils/permalinks';
import { getHomePermalink } from "~/utils/permalinks";

export const headerData = {
  links: [
    {
      text: 'Home',
      href: getHomePermalink(),
    },
    { 
      text: 'About', 
      href: getPermalink('/about') },
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
      title: 'Support',
      links: [
        { text: 'Docs', href: '#' },
        { text: 'Discord', href: 'https://discord.gg/72vH6ZJNUW' },
      ],
    },
    {
      title: 'Vipyr',
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
