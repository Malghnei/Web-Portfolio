<script lang="ts">
	import '@fontsource/jetbrains-mono/400.css';
	import '@fontsource/jetbrains-mono/700.css';
	import './layout.css';
	import favicon from '$lib/assets/favicon.ico';
	import Buffer from '$lib/components/editor/Buffer.svelte';
	import Navbar from '$lib/components/editor/Navbar.svelte';
	import PreviewPane from '$lib/components/preview/PreviewPane.svelte';
	import StatusBar from '$lib/components/editor/StatusBar.svelte';
	import TerminalWindow from '$lib/components/terminal/TerminalWindow.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import WhichKey from '$lib/components/editor/WhichKey.svelte';
	import {
		isEditableTarget,
		resolveKey,
		resolveTimeout,
		LEADER_TIMEOUT_MS,
		SEQUENCE_TIMEOUT_MS,
		type KeyAction
	} from '$lib/editor/keymap';
	import { editor, toggleTerminal } from '$lib/editor/state.svelte';
	import { siteContent } from '$lib/data/site';
	import { setRefsContext } from '$lib/refs/context';
	import { buildDictionary } from '$lib/refs/tokenize';

	let { children, data } = $props();

	// Home is a start screen with no preview pane.
	const home = $derived(page.url.pathname === '/');

	const TITLES: Record<string, string> = {
		'/': siteContent.name,
		'/about/': `about · ${siteContent.name}`,
		'/projects/': `projects · ${siteContent.name}`,
		'/terminal/': `terminal · ${siteContent.name}`
	};
	// Unlisted paths (project pages, the 404) fall back to the name; project pages override it below.
	const pageTitle = $derived(
		page.url.pathname.startsWith('/projects/') && page.url.pathname !== '/projects/' && !page.error
			? null
			: (TITLES[page.url.pathname] ?? siteContent.name)
	);
	const DESCRIPTION = `${siteContent.name}, a third-year Computer Science student at Western University interested in cybersecurity, machine learning, and embedded systems. ${siteContent.status}.`;

	// A getter, so readers always see the dictionary for the current data.
	const dict = $derived(buildDictionary(data.projects));
	setRefsContext({
		get dict() {
			return dict;
		}
	});

	let buffer = $state<ReturnType<typeof Buffer> | undefined>();
	let pending = '';
	let pendingTimer: ReturnType<typeof setTimeout> | undefined;
	const setPending = (keys: string) => {
		pending = keys;
		editor.pendingKeys = keys;
	};

	const runAction = async (action: KeyAction) => {
		switch (action.type) {
			case 'motion':
				return buffer?.motion(action.motion, action.count);
			case 'visual':
				return buffer?.startVisual(action.mode);
			case 'yank':
				return buffer?.yank();
			case 'exitVisual':
				return buffer?.exitVisual();
			case 'pageDown':
				return buffer?.pageDown();
			case 'pageUp':
				return buffer?.pageUp();
			case 'goto':
				return goto(action.path);
			case 'toggleTerminal':
				return toggleTerminal();
			case 'search':
				// Search lives on /projects; from elsewhere, go there first.
				if (page.url.pathname !== '/projects/') await goto('/projects/');
				document.getElementById('project-search')?.focus();
				return;
			case 'toggleHelp':
				editor.helpOpen = !editor.helpOpen;
				return;
			case 'closeHelp':
				editor.helpOpen = false;
				return;
			case 'open': {
				const target = editor.preview;
				// Home previews nothing, so Enter opens the link under the cursor; elsewhere it stays a no-op.
				if (!target) return home ? buffer?.openAtCursor() : undefined;
				if (target.kind === 'project') return goto(`/projects/${target.slug}/`);
				if (target.kind === 'tech') return goto(`/projects/?tag=${encodeURIComponent(target.name)}`);
				// Roles have no page to open; say so rather than doing nothing.
				if (target.kind === 'experience') {
					editor.message = 'roles have no page to open';
					return;
				}
				// window.open on mailto: can leave a blank tab behind.
				if (target.href.startsWith('mailto:')) location.href = target.href;
				else window.open(target.href, '_blank', 'noreferrer');
				return;
			}
		}
	};

	const onkeydown = (event: KeyboardEvent) => {
		if (event.defaultPrevented) return;
		// Space or Enter on a focused button or link keeps its native meaning.
		if ((event.key === ' ' || event.key === 'Enter') && event.target instanceof Element && event.target.closest('button, a, summary')) return;
		editor.message = null;

		const result = resolveKey(pending, {
			key: event.key,
			ctrlKey: event.ctrlKey,
			altKey: event.altKey,
			metaKey: event.metaKey,
			inEditable: isEditableTarget(event.target),
			onBody: event.target === document.body || event.target === document.documentElement,
			visual: editor.visual !== null,
			home
		});
		setPending('');
		clearTimeout(pendingTimer);

		if (result.kind === 'passthrough') return;
		if (result.kind === 'pending') {
			event.preventDefault();
			setPending(result.pending);
			// The leader waits longer, so its which-key popup can be read before it closes.
			const wait = result.pending === ' ' ? LEADER_TIMEOUT_MS : SEQUENCE_TIMEOUT_MS;
			pendingTimer = setTimeout(() => {
				const action = resolveTimeout(pending);
				setPending('');
				if (action) runAction(action);
			}, wait);
			return;
		}
		// Escape stays unprevented so it can still close browser UI.
		if (result.action.type !== 'closeHelp') event.preventDefault();
		runAction(result.action);
	};
</script>

<svelte:window {onkeydown} />

<svelte:head>
	<link rel="icon" href={favicon} />
	<!-- Project pages set their own title and description. -->
	{#if pageTitle}
		<title>{pageTitle}</title>
		<meta name="description" content={DESCRIPTION} />
	{/if}
</svelte:head>

<div class="app">
	<Navbar />
	<div class="workspace">
		<div class="main" class:home>
			<Buffer bind:this={buffer}>
				{@render children()}
			</Buffer>
		</div>
		{#if !home}
			<PreviewPane projects={data.projects} links={siteContent.links.items} />
		{/if}
		<TerminalWindow projects={data.projects} />
		<WhichKey />
	</div>
	<StatusBar />
</div>

<style>
	.app {
		height: 100dvh;
		display: grid;
		grid-template-rows: auto minmax(0, 1fr) auto;
		/* minmax(0, …): don't let the navbar's tab strip widen the whole app on phones */
		grid-template-columns: minmax(0, 1fr);
	}

	.workspace {
		position: relative;
		min-height: 0;
		display: flex;
		flex-direction: row;
	}

	/* Shrinkable: between 1280px and ~1376px the buffer's full width plus the pane's 40ch minimum
	   don't fit, and the buffer gives up the difference rather than overflowing the window. */
	.main {
		flex: 0 1 calc(80ch + var(--gutter) + 1ch);
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	/* No preview pane here, so the buffer takes the whole width. */
	.main.home {
		flex: 1;
	}

	@media (max-width: 1279px), (hover: none) {
		.main {
			flex: 1;
		}
	}
</style>
