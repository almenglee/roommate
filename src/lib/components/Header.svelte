<script lang="ts">
	import type { Snippet } from 'svelte';
	import { resolve } from '$app/paths';
	import TraitIcon from '#lib/components/TraitIcon.svelte';

	let {
		title = '',
		compactTitle = '',
		backHref = null,
		onBack = undefined,
		serif = false,
		alwaysCompact = false,
		hideLargeTitle = false,
		revealOffset = 44,
		left = undefined,
		actions = undefined,
		initialContent = undefined
	}: {
		title?: string;
		compactTitle?: string;
		backHref?: '/discover' | '/posts' | '/likes' | '/matches' | '/profile' | '/login' | null;
		onBack?: () => void;
		serif?: boolean;
		alwaysCompact?: boolean;
		hideLargeTitle?: boolean;
		revealOffset?: number;
		left?: Snippet;
		actions?: Snippet;
		initialContent?: Snippet;
	} = $props();

	let headerEl: HTMLElement;
	let largeTitleEl: HTMLElement | undefined = $state();
	let isScrolled = $state(false);
	let pastLargeTitle = $state(false);

	const showCompactTitle = $derived(alwaysCompact || pastLargeTitle);
	const displayCompactTitle = $derived(compactTitle || title);

	$effect(() => {
		if (!headerEl) return;
		const scroller = headerEl.closest('main');
		if (!scroller) return;

		function update() {
			const top = scroller!.scrollTop;
			isScrolled = top > 4;

			if (alwaysCompact) {
				pastLargeTitle = true;
			} else if (largeTitleEl) {
				const headerBottom = headerEl.getBoundingClientRect().bottom;
				const titleBottom = largeTitleEl.getBoundingClientRect().bottom;
				pastLargeTitle = titleBottom <= headerBottom + 8;
			} else {
				pastLargeTitle = top >= revealOffset;
			}
		}

		update();
		scroller.addEventListener('scroll', update, { passive: true });
		return () => scroller.removeEventListener('scroll', update);
	});
</script>

<header bind:this={headerEl} class="app-header" class:scrolled={isScrolled}>
	{#if initialContent}
		<div class="header-initial" class:hidden={showCompactTitle} aria-hidden={showCompactTitle}>
			{@render initialContent()}
		</div>
	{/if}

	<div class="header-left">
		{#if left}
			{@render left()}
		{:else if backHref}
			<a class="icon-btn" href={resolve(backHref)} aria-label="뒤로 가기">
				<TraitIcon name="chevron-left" size={22} />
			</a>
		{:else if onBack}
			<button class="icon-btn" type="button" onclick={onBack} aria-label="뒤로 가기">
				<TraitIcon name="chevron-left" size={22} />
			</button>
		{/if}
	</div>

	<div class="header-center" class:visible={showCompactTitle} aria-hidden={!showCompactTitle}>
		<span class="compact-title" class:serif-heading={serif}>{displayCompactTitle}</span>
	</div>

	<div class="header-actions">
		{#if actions}
			{@render actions()}
		{/if}
	</div>
</header>

{#if !alwaysCompact && !hideLargeTitle && title}
	<div bind:this={largeTitleEl} class="large-title-block">
		<h1 class:serif-heading={serif}>{title}</h1>
	</div>
{/if}

<style>
	.app-header {
		position: sticky;
		top: 0;
		z-index: 20;
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		gap: 8px;
		height: 52px;
		padding: 0 var(--page-gutter);
		background: var(--bg-app);
		border-bottom: 1px solid transparent;
		transition:
			border-color 180ms ease,
			background-color 180ms ease;
	}

	.header-initial {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		opacity: 1;
		transform: translateY(0);
		transition:
			opacity 160ms ease,
			transform 160ms ease;
	}

	.header-initial.hidden {
		opacity: 0;
		transform: translateY(-4px);
		pointer-events: none;
	}

	.app-header.scrolled {
		background: rgba(255, 253, 254, 0.92);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border-bottom-color: var(--border-hairline);
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 6px;
		min-width: 0;
	}

	.header-center {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 0;
		max-width: 220px;
		opacity: 0;
		transform: translateY(4px);
		pointer-events: none;
		transition:
			opacity 160ms ease,
			transform 160ms ease;
	}

	.header-center.visible {
		opacity: 1;
		transform: translateY(0);
		pointer-events: auto;
	}

	.compact-title {
		font-size: 16.5px;
		font-weight: 700;
		line-height: 1.25;
		letter-spacing: -0.02em;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.header-actions {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 6px;
		min-width: 0;
	}

	.icon-btn {
		display: grid;
		place-items: center;
		width: 34px;
		height: 34px;
		margin-left: -8px;
		border: 0;
		border-radius: 50%;
		background: transparent;
		color: var(--text-primary);
		cursor: pointer;
		text-decoration: none;
	}

	.icon-btn:hover {
		background: rgba(0, 0, 0, 0.06);
	}

	.large-title-block {
		display: flex;
		flex-direction: column;
		gap: 3px;
		padding: 2px var(--page-gutter) 8px;
	}

	.large-title-block h1 {
		margin: 0;
		font-size: 26px;
		font-weight: 700;
		line-height: 1.22;
		letter-spacing: -0.025em;
		color: var(--text-primary);
	}
</style>
