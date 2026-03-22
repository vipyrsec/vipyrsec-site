import type { MetaData, MetaDataOpenGraph, MetaDataTwitter } from '~/types';

export interface SiteConfig {
  name: string;
  site: string;
  base: string;
  trailingSlash: boolean;
  googleSiteVerificationId: string;
}

export interface I18NConfig {
  language: string;
  textDirection: 'ltr' | 'rtl';
}

export interface BlogSectionConfig {
  isEnabled: boolean;
  pathname: string;
  robots: {
    index: boolean;
    follow: boolean;
  };
}

export interface BlogPostConfig {
  isEnabled: boolean;
  permalink: string;
  robots: {
    index: boolean;
    follow: boolean;
  };
}

export interface AppBlogConfig {
  isEnabled: boolean;
  postsPerPage: number;
  isRelatedPostsEnabled: boolean;
  relatedPostsCount: number;
  post: BlogPostConfig;
  list: BlogSectionConfig;
  category: BlogSectionConfig;
  tag: BlogSectionConfig;
}

export interface AnalyticsConfig {
  vendors: {
    googleAnalytics: {
      id?: string;
      partytown: boolean;
    };
  };
}

export interface UIConfig {
  theme: 'system' | 'light' | 'dark' | 'light:only' | 'dark:only';
}

export interface SiteMetadataConfig extends Omit<MetaData, 'title' | 'openGraph' | 'twitter'> {
  title: {
    default: string;
    template: string;
  };
  openGraph?: MetaDataOpenGraph & {
    siteName?: string;
  };
  twitter?: MetaDataTwitter;
}

export const SITE: SiteConfig = {
  name: 'Vipyr Security',
  site: 'https://vipyrsec.com',
  base: '/',
  trailingSlash: false,
  googleSiteVerificationId: '',
};

export const METADATA: SiteMetadataConfig = {
  title: {
    default: 'Vipyr Security',
    template: '%s — Vipyr Security',
  },
  description: 'Open source supply chain security research, malicious package detection, and takedown coordination.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    siteName: 'Vipyr Security',
    images: [
      {
        url: '~/assets/images/vipyr-thumbnail.jpg',
        width: 1200,
        height: 630,
      },
    ],
    type: 'website',
  },
};

export const I18N: I18NConfig = {
  language: 'en',
  textDirection: 'ltr',
};

export const APP_BLOG: AppBlogConfig = {
  isEnabled: true,
  postsPerPage: 6,
  isRelatedPostsEnabled: true,
  relatedPostsCount: 4,
  post: {
    isEnabled: true,
    permalink: '/research/%slug%',
    robots: {
      index: true,
      follow: true,
    },
  },
  list: {
    isEnabled: true,
    pathname: 'research',
    robots: {
      index: true,
      follow: true,
    },
  },
  category: {
    isEnabled: true,
    pathname: 'category',
    robots: {
      index: true,
      follow: true,
    },
  },
  tag: {
    isEnabled: true,
    pathname: 'tag',
    robots: {
      index: false,
      follow: true,
    },
  },
};

export const ANALYTICS: AnalyticsConfig = {
  vendors: {
    googleAnalytics: {
      partytown: false,
    },
  },
};

export const UI: UIConfig = {
  theme: 'dark:only',
};
