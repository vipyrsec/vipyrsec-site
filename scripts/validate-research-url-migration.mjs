import { promises as fs } from 'node:fs';
import path from 'node:path';
import slugify from 'limax';

const rootDir = process.cwd();
const contentDir = path.join(rootDir, 'src/content/research');
const pagesDir = path.join(rootDir, 'src/pages');
const vercelConfigPath = path.join(rootDir, 'vercel.json');

const RESEARCH_BASE = '/research';
const RESERVED_ROOT_ROUTES = new Set(['/research', '/category', '/tag']);
const PAGE_ROUTE_EXTENSIONS = new Set(['.astro', '.md', '.mdx', '.js', '.ts']);
const POST_CONTENT_EXTENSIONS = new Set(['.md', '.mdx']);

const trimSlash = (value = '') => value.replace(/^\/+|\/+$/g, '');
const cleanSlug = (value = '') =>
  trimSlash(value)
    .split('/')
    .map((segment) => slugify(segment))
    .join('/');

const toLegacyUrl = (slug) => `/${slug}`;
const toNewUrl = (slug) => `${RESEARCH_BASE}/${slug}`;

const readDirNames = async (dirPath) => {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries;
};

const getPostSlugs = async () => {
  const entries = await readDirNames(contentDir);

  return entries
    .filter((entry) => entry.isFile() && POST_CONTENT_EXTENSIONS.has(path.extname(entry.name)))
    .map((entry) => cleanSlug(path.basename(entry.name, path.extname(entry.name))))
    .sort();
};

const getTopLevelRoutes = async () => {
  const entries = await readDirNames(pagesDir);
  const routes = new Set(RESERVED_ROOT_ROUTES);

  for (const entry of entries) {
    if (!entry.isFile()) continue;

    const extension = path.extname(entry.name);
    if (!PAGE_ROUTE_EXTENSIONS.has(extension)) continue;

    const stem = path.basename(entry.name, extension);
    if (stem.startsWith('[') || stem === '404') continue;

    routes.add(stem === 'index' ? '/' : `/${stem}`);
  }

  return Array.from(routes).sort();
};

const getRedirectMappings = async () => {
  const vercelConfig = JSON.parse(await fs.readFile(vercelConfigPath, 'utf8'));
  const redirects = Array.isArray(vercelConfig.redirects) ? vercelConfig.redirects : [];

  return redirects
    .filter((redirect) => typeof redirect?.source === 'string' && typeof redirect?.destination === 'string')
    .map((redirect) => ({
      source: redirect.source,
      destination: redirect.destination,
      permanent: redirect.permanent === true,
    }))
    .sort((a, b) => a.source.localeCompare(b.source));
};

const getCanonicalOverrides = async () => {
  const entries = await readDirNames(contentDir);
  const overrides = [];

  for (const entry of entries) {
    if (!entry.isFile() || !POST_CONTENT_EXTENSIONS.has(path.extname(entry.name))) continue;

    const filePath = path.join(contentDir, entry.name);
    const fileContents = await fs.readFile(filePath, 'utf8');
    const [, frontmatter = ''] = fileContents.split(/^---$/m);

    if (!frontmatter) continue;

    const canonicalLine = frontmatter
      .split('\n')
      .find((line) => line.trim().startsWith('canonical:') || line.trim().startsWith('metadata.canonical:'));

    if (canonicalLine) {
      overrides.push({
        file: path.relative(rootDir, filePath),
        canonical: canonicalLine.trim(),
      });
    }
  }

  return overrides;
};

const posts = await getPostSlugs();
const legacyUrls = posts.map(toLegacyUrl);
const newUrls = posts.map(toNewUrl);
const redirects = await getRedirectMappings();
const topLevelRoutes = await getTopLevelRoutes();
const canonicalOverrides = await getCanonicalOverrides();

const redirectGroups = redirects.reduce((acc, redirect) => {
  const existing = acc.get(redirect.source) ?? [];
  existing.push(redirect);
  acc.set(redirect.source, existing);
  return acc;
}, new Map());

const collisions = legacyUrls.filter((legacyUrl) => topLevelRoutes.includes(legacyUrl));
const missingRedirects = legacyUrls.filter((legacyUrl) => !redirectGroups.has(legacyUrl));
const duplicateRedirectSources = Array.from(redirectGroups.entries())
  .filter(([, entries]) => entries.length !== 1)
  .map(([source]) => source);
const incorrectDestinations = legacyUrls.flatMap((legacyUrl) => {
  const expectedDestination = toNewUrl(trimSlash(legacyUrl));
  const entries = redirectGroups.get(legacyUrl) ?? [];

  return entries
    .filter((entry) => entry.destination !== expectedDestination || !entry.permanent)
    .map((entry) => ({
      source: legacyUrl,
      destination: entry.destination,
      permanent: entry.permanent,
      expectedDestination,
    }));
});
const duplicateCanonicals = newUrls.filter((url, index) => newUrls.indexOf(url) !== index);
const orphanedPosts = posts.filter(
  (slug) => !legacyUrls.includes(toLegacyUrl(slug)) || !newUrls.includes(toNewUrl(slug))
);

const report = {
  postSlugs: posts,
  legacyUrls,
  newUrls,
  redirects,
  topLevelRoutes,
};

console.log(JSON.stringify(report, null, 2));

const errors = [];

if (collisions.length > 0) {
  errors.push(`Legacy post URL collisions with non-blog routes: ${collisions.join(', ')}`);
}

if (missingRedirects.length > 0) {
  errors.push(`Missing legacy redirects: ${missingRedirects.join(', ')}`);
}

if (duplicateRedirectSources.length > 0) {
  errors.push(`Redirect sources must map exactly once: ${duplicateRedirectSources.join(', ')}`);
}

if (incorrectDestinations.length > 0) {
  errors.push(
    `Redirects with incorrect destination or permanence: ${incorrectDestinations
      .map(
        ({ source, destination, permanent, expectedDestination }) =>
          `${source} -> ${destination} (permanent=${permanent}, expected ${expectedDestination})`
      )
      .join('; ')}`
  );
}

if (orphanedPosts.length > 0) {
  errors.push(`Orphaned posts detected: ${orphanedPosts.join(', ')}`);
}

if (duplicateCanonicals.length > 0) {
  errors.push(`Duplicate canonical URLs detected: ${duplicateCanonicals.join(', ')}`);
}

if (canonicalOverrides.length > 0) {
  errors.push(
    `Canonical overrides found in post frontmatter and must be reviewed: ${canonicalOverrides
      .map(({ file, canonical }) => `${file} [${canonical}]`)
      .join(', ')}`
  );
}

if (errors.length > 0) {
  console.error('\nValidation failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('\nValidation passed.');
