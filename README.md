# Vipyr Security Website

📌 <https://vipyrsec.com/>

This repository is the standalone codebase for the Vipyr Security website. It is no longer maintained as a template-derived site.

## Quick Start

- Use Node.js `24+`.
- Run `npm install`.
- Run `npm run dev` and open `http://localhost:4321`.

## Commands

| Command           | Action                                     |
| :---------------- | :----------------------------------------- |
| `npm install`     | Install dependencies                       |
| `npm run dev`     | Start local dev server at `localhost:4321` |
| `npm run build`   | Build the production site to `./dist/`     |
| `npm run preview` | Preview the production build locally       |
| `npm run check`   | Run Astro checks, ESLint, and Prettier     |
| `npm run fix`     | Run ESLint autofixes and Prettier          |

## Stack

- Astro `6`
- Tailwind CSS `4` via `@tailwindcss/vite`
- Static output

## Deployment

The site is configured for static deployment on Vercel.

- Vercel can deploy this project with zero Astro-specific server setup because the site builds to `dist/`.
- The checked-in [vercel.json](/home/rem/github/vipyrsec/vipyrsec-site/vercel.json) keeps cache headers for `/_astro/*` assets and makes the build settings explicit.
- To deploy manually with the Vercel CLI, run `vercel` from the project root and promote with `vercel --prod` when ready.
