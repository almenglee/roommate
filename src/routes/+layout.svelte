<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import Navigator from '#lib/components/Navigator.svelte';
	import type { LayoutData } from './$types';

	let { children, data }: { children: Snippet; data: LayoutData } = $props();

	let content: HTMLElement;
	let footerVisible = $state(true);
	let previousScrollTop = 0;

	const pathname = $derived(page.url.pathname);
	const isProfileOnboarding = $derived(
		pathname === '/profile' && page.url.searchParams.get('onboarding') === '1'
	);

	const isOnboardingBg = $derived(
		pathname === '/login' || pathname === '/signup' || isProfileOnboarding
	);

	const hideNavigator = $derived(
		isOnboardingBg ||
			/^\/likes\/[^/]+/.test(pathname) ||
			/^\/matches\/[^/]+/.test(pathname) ||
			pathname === '/posts/new' ||
			/^\/posts\/[^/]+\/edit/.test(pathname)
	);

	$effect(() => {
		// Reset scroll-hidden nav bar whenever navigating between routes
		void pathname;
		footerVisible = true;
		previousScrollTop = 0;
		if (content) {
			content.scrollTop = 0;
		}
	});

	function handleScroll() {
		if (!content) return;
		const current = content.scrollTop;
		const delta = current - previousScrollTop;

		if (current <= 4) {
			footerVisible = true;
		} else if (Math.abs(delta) > 6) {
			footerVisible = delta < 0;
		}

		previousScrollTop = current;
	}
</script>

<svelte:head>
	<title>{page.data.title ? `${page.data.title} · roommate` : 'roommate'}</title>
</svelte:head>

<div
	class="app-shell"
	class:onboarding-bg={isOnboardingBg}
	class:nav-hidden={!footerVisible || hideNavigator || !data.user}
>
	<main bind:this={content} onscroll={handleScroll} class:no-nav={hideNavigator}>
		{@render children()}
	</main>

	{#if !hideNavigator && data.user}
		<div class="navigator" class:hidden={!footerVisible}>
			<Navigator pendingLikesCount={data.pendingLikesCount} />
		</div>
	{/if}
</div>

<style>
	.app-shell {
		--nav-offset: calc(max(12px, env(safe-area-inset-bottom)) + 74px);
		position: relative;
		width: 100%;
		max-width: var(--app-max-width);
		height: 100dvh;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		background-color: var(--bg-app);
		overflow: hidden;
	}

	.app-shell.nav-hidden {
		--nav-offset: max(16px, env(safe-area-inset-bottom));
	}

	.app-shell.onboarding-bg {
		background-color: var(--bg-onboarding);
	}

	@media (min-width: 480px) {
		.app-shell {
			box-shadow: var(--shadow-frame);
		}
	}

	main {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		overscroll-behavior: contain;
		padding-bottom: 96px;
		scrollbar-width: none;
	}

	main::-webkit-scrollbar {
		display: none;
	}

	main.no-nav {
		padding-bottom: 0;
	}

	.navigator {
		position: absolute;
		z-index: 40;
		left: 50%;
		bottom: max(12px, env(safe-area-inset-bottom));
		width: calc(100% - 24px);
		transform: translateX(-50%);
		transition:
			transform 180ms ease,
			opacity 180ms ease;
	}

	.navigator.hidden {
		transform: translate(-50%, calc(100% + 28px));
		opacity: 0;
		pointer-events: none;
	}

	@media (prefers-reduced-motion: reduce) {
		.navigator {
			transition: none;
		}
	}
</style>
