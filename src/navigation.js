import { getAsset, getBlogPermalink, getHomePermalink, getPermalink } from './utils/permalinks';

const aboutPermalink = getPermalink('/about');
const blogPermalink = getBlogPermalink();
const discordInviteLink = 'https://discord.gg/72vH6ZJNUW';

export const headerData = {
  links: [
    {
      text: 'Home',
      href: getHomePermalink(),
    },
    {
      text: 'About',
      href: aboutPermalink,
    },
    {
      text: 'Research',
      href: blogPermalink,
    },
    {
      text: 'Projects',
      href: getPermalink('/projects'),
    },
  ],
};

export const footerData = {
  links: [
    {
      title: 'Info',
      links: [
        { text: 'About', href: aboutPermalink },
        { text: 'Blog', href: blogPermalink },
      ],
    },
    {
      title: 'Support',
      links: [{ text: 'Discord', href: discordInviteLink }],
    },
  ],
  secondaryLinks: [],
  socialLinks: [
    { ariaLabel: 'RSS', icon: 'tabler:rss', href: getAsset('/rss.xml') },
    { ariaLabel: 'Discord', icon: 'tabler:brand-discord', href: discordInviteLink },
    { ariaLabel: 'GitHub', icon: 'tabler:brand-github', href: 'https://github.com/vipyrsec' },
  ],
  footNote: 'Vipyr Security © 2023 - All Rights Reserved',
};
