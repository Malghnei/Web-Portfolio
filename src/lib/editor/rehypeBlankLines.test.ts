import { describe, expect, it } from 'vitest';
import rehypeBlankLines from './rehypeBlankLines.js';

type Node = { type: string; tagName?: string; value?: string; children?: Node[] };

const el = (tagName: string): Node => ({ type: 'element', tagName, children: [] });
const text = (value: string): Node => ({ type: 'text', value });
const tags = (tree: Node) =>
	tree.children!.filter((n) => n.type !== 'text').map((n) => n.tagName ?? 'blank');

describe('rehypeBlankLines', () => {
	it('separates blocks with a blank line, except right under a heading', () => {
		const tree: Node = {
			type: 'root',
			children: [el('h2'), text('\n'), el('p'), text('\n'), el('p'), el('h2'), el('ul')]
		};
		rehypeBlankLines()(tree);
		expect(tags(tree)).toEqual(['h2', 'p', 'blank', 'p', 'blank', 'h2', 'ul']);
	});

	it('adds nothing before the first block', () => {
		const tree: Node = { type: 'root', children: [{ type: 'raw', value: '<script></script>' }, el('p')] };
		rehypeBlankLines()(tree);
		expect(tree.children!.map((n) => n.type)).toEqual(['raw', 'element']);
	});
});
