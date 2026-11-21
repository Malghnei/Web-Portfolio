<script lang="ts">
	import { editor } from '$lib/editor/state.svelte';

	// Grouped so the list reads in chunks, as nvim's which-key groups its mappings.
	const GROUPS: { name: string; keys: [string, string][] }[] = [
		{
			name: 'move',
			keys: [
				['h j k l', 'move'],
				['w b e', 'next / back / word end'],
				['0 $', 'line start / end'],
				['gg / G', 'top / bottom']
			]
		},
		{
			name: 'select',
			keys: [
				['v / V', 'visual / visual line'],
				['y', 'yank selection']
			]
		},
		{
			name: 'go',
			keys: [
				['␣', 'pages (h / a / p)'],
				['/', 'search projects'],
				['⏎', 'open preview'],
				['ctrl+/', 'toggle terminal']
			]
		},
		{
			name: 'misc',
			keys: [
				['?', 'toggle this help'],
				['esc', 'exit visual / close']
			]
		}
	];

	const LEADER: [string, string][] = [
		['h', 'home'],
		['a', 'about'],
		['p', 'projects']
	];

	const leader = $derived(editor.pendingKeys === ' ');
</script>

{#if leader}
	<div class="which-key" role="dialog" aria-label="leader keys">
		<p class="title">─ ␣ pages ─</p>
		{#each LEADER as [key, label] (key)}
			<p><span class="key">{key}</span>{label}</p>
		{/each}
	</div>
{:else if editor.helpOpen}
	<div class="which-key" role="dialog" aria-label="keyboard shortcuts">
		<p class="title">─ keys ─</p>
		{#each GROUPS as group (group.name)}
			<p class="group">{group.name}</p>
			{#each group.keys as [key, label] (key)}
				<p><span class="key">{key}</span>{label}</p>
			{/each}
		{/each}
	</div>
{/if}

<style>
	.which-key {
		position: absolute;
		right: 1ch;
		bottom: 0.5lh;
		z-index: 40;
		padding: 0.5lh 2ch;
		background: var(--nord-1);
		border: 1px solid var(--nord-3);
	}

	p {
		margin: 0;
	}

	.title {
		color: var(--nord-9);
	}

	.group {
		color: var(--nord-8);
	}

	.group:not(:nth-child(2)) {
		margin-top: 0.5lh;
	}

	.key {
		display: inline-block;
		width: 10ch;
		margin-left: 2ch;
		color: var(--nord-13);
	}
</style>
