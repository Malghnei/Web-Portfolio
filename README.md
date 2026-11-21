# Web Portfolio

Malik Alghneimin's portfolio, live at **[malikalghneimin.dev](https://malikalghneimin.dev/)**.

The site is a Neovim-style editor in the browser. Each page is a buffer with line numbers, a block cursor and a statusline. It reads like an ordinary website, but you can also drive it from the keyboard or from a built-in terminal.

## Using the site

| Key | Does |
| --- | --- |
| `h` `j` `k` `l`, `w` `b` `e`, `0` `$`, `gg` `G` | Move the cursor (counts work: `5j`) |
| `v` / `V`, then `y` | Visual / visual-line select, then yank to the clipboard |
| `Space` then `h` / `a` / `p` | Go to home, about or projects |
| `p` / `a` / `t` on home | Projects, about, terminal |
| `Enter` | Open whatever the preview pane is showing |
| `Ctrl` + `/` | Toggle the terminal (`help`, `ls`, `cd`, `cat`, `open`, `clear`, `exit`) |
| `?` | Show every key binding |

On touch screens, the keyboard layer stays out of the way: everything is a normal link or button.

## Stack

- [SvelteKit](https://svelte.dev/docs/kit) (Svelte 5 runes) with `adapter-static`: every page is prerendered
- [mdsvex](https://mdsvex.pngwn.io/) for project write-ups in Markdown
- Tailwind CSS 4 (mostly plain CSS against the Nord palette in `src/routes/layout.css`)
- JetBrains Mono, self-hosted
- Vitest for the unit tests

## Development

Requires Node 24 (the version CI uses).

```sh
npm install
npm run dev       # dev server on http://localhost:5173
npm test          # unit tests
npm run check     # svelte-check / type check
npm run build     # static site into dist/
npm run preview   # serve the built site
```

## Editing content

| What | Where |
| --- | --- |
| Name, role, status, about text, setup, links | `src/lib/data/site.ts` |
| Experience timeline | `experienceTimeline` in `src/lib/data/site.ts` |
| Projects | one Markdown file per project in `src/content/projects/` |
| Tech tag colours and categories | `src/lib/tags/categories.ts` |
| Home page name art | `src/lib/data/banner.txt`, `banner-mobile.txt` |

A project file starts with its metadata, then the write-up in Markdown:

```svelte
<script module lang="ts">
	export const metadata = {
		title: 'Kata',
		summary: 'One sentence for the card and the preview pane.',
		period: 'Aug. 2026',
		techStack: ['TypeScript', 'React Native'], // each tag must exist in categories.ts
		role: 'solo', // or 'contribution'
		domain: 'software', // or 'hardware'
		featured: true, // optional: listed on the home page
		repoUrl: 'https://github.com/…', // optional
		demoUrl: 'https://…' // optional
	};
</script>

## Overview
…
```

The build fails if `role`, `domain` or a tag is invalid, so a typo can't silently hide a project from the filters.

## Deployment

Every push to `main` runs `.github/workflows/deploy.yml`. The workflow builds the site and publishes `dist/` to GitHub Pages, which serves it on the custom domain `malikalghneimin.dev`. There is no manual deploy step.

## Layout

```
src/
  routes/          pages: home, about, projects, projects/[slug], error, legacy /terminal redirect
  lib/editor/      cursor, motions, keymap, visual mode, clipboard (pure logic, unit-tested)
  lib/components/  editor chrome (navbar, buffer, statusline, which-key), cards, preview pane, terminal
  lib/content/     project loading, ordering, filtering, metadata validation
  lib/terminal/    terminal command implementations
  content/projects project write-ups
```
