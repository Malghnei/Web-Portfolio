// Plain JS (not TS) so svelte.config.js can import it.
// Puts a numbered blank buffer line between top-level blocks of a write-up, as on the about page:
// none under a heading, one everywhere else. CSS margins can't do this: they'd leave unnumbered gaps.

/** @typedef {{ type: string, tagName?: string, children?: Node[] }} Node */

const BLANK = { type: 'raw', value: '<div class="line blank" aria-hidden="true"></div>' };
const HEADING = /^h[1-6]$/;

const rehypeBlankLines = () => (/** @type {Node} */ tree) => {
	/** @type {Node | undefined} */
	let prev;
	tree.children = (tree.children ?? []).flatMap((node) => {
		if (node.type !== 'element') return [node];
		const out = prev && !HEADING.test(prev.tagName ?? '') ? [BLANK, node] : [node];
		prev = node;
		return out;
	});
};

export default rehypeBlankLines;
