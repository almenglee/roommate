<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	type TabId = 'discover' | 'posts' | 'likes' | 'matches' | 'profile';
	type TabPath = '/discover' | '/posts' | '/likes' | '/matches' | '/profile';

	let {
		pendingLikesCount = 0
	}: {
		pendingLikesCount?: number;
	} = $props();

	const tabs: { id: TabId; label: string; href: TabPath }[] = [
		{ id: 'discover', label: '탐색', href: '/discover' },
		{ id: 'posts', label: '모집글', href: '/posts' },
		{ id: 'likes', label: '관심', href: '/likes' },
		{ id: 'matches', label: '대화', href: '/matches' },
		{ id: 'profile', label: '프로필', href: '/profile' }
	];

	const activeTab = $derived.by((): TabId => {
		const path = page.url.pathname;
		if (path.startsWith('/posts')) return 'posts';
		if (path.startsWith('/likes')) return 'likes';
		if (path.startsWith('/matches')) return 'matches';
		if (path.startsWith('/profile')) return 'profile';
		return 'discover';
	});
</script>

<nav class="glass-nav" aria-label="메인 내비게이션">
	{#each tabs as tab (tab.id)}
		<a
			class:active={activeTab === tab.id}
			class="tab"
			href={resolve(tab.href)}
			aria-current={activeTab === tab.id ? 'page' : undefined}
		>
			<span class="icon-wrap">
				{#if tab.id === 'discover'}
					<svg viewBox="0 0 24 24" aria-hidden="true">
						<path d="M21 3 14.5 21l-3.8-7.7L3 10.5 21 3Z" />
						<path d="m10.7 13.3 4.1-4.1" />
					</svg>
				{:else if tab.id === 'posts'}
					<svg viewBox="0 0 24 24" aria-hidden="true">
						<rect x="4" y="3.5" width="16" height="17" rx="2.5" />
						<path d="M8 8.5h8M8 12.5h8M8 16.5h5" />
					</svg>
				{:else if tab.id === 'likes'}
					<svg viewBox="0 0 24 24" aria-hidden="true">
						<path
							d="M20.8 8.8c0 5.2-8.8 11-8.8 11s-8.8-5.8-8.8-11a4.6 4.6 0 0 1 8.8-1.9 4.6 4.6 0 0 1 8.8 1.9Z"
						/>
					</svg>
				{:else if tab.id === 'matches'}
					<svg viewBox="0 0 24 24" aria-hidden="true">
						<path
							d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"
						/>
					</svg>
				{:else}
					<svg viewBox="0 0 24 24" aria-hidden="true">
						<circle cx="12" cy="7" r="4" />
						<path d="M4 21v-2a8 8 0 0 1 16 0v2" />
					</svg>
				{/if}

				{#if tab.id === 'likes' && pendingLikesCount > 0}
					<span class="badge" aria-label={`받은 관심 ${pendingLikesCount}건`}>
						{pendingLikesCount > 9 ? '9+' : pendingLikesCount}
					</span>
				{/if}
			</span>

			<span class="label">{tab.label}</span>
		</a>
	{/each}
</nav>

<style>
	.glass-nav {
		box-sizing: border-box;
		display: flex;
		align-items: stretch;
		width: 100%;
		height: 64px;
		padding: 3px;

		border: 1px solid rgba(255, 255, 255, 0.58);
		border-radius: 35px;

		/* 투명한 창보다 뿌연 유백색 유리에 가깝게 */
		background: linear-gradient(
			145deg,
			rgba(255, 255, 255, 0.68) 0%,
			rgba(246, 242, 248, 0.54) 48%,
			rgba(255, 255, 255, 0.62) 100%
		);

		box-shadow:
			0 10px 30px rgba(41, 31, 46, 0.16),
			0 2px 8px rgba(41, 31, 46, 0.06),
			inset 0 1px 1px rgba(255, 255, 255, 0.9),
			inset 0 -1px 1px rgba(255, 255, 255, 0.32);

		-webkit-backdrop-filter: blur(20px) saturate(1.45);
		backdrop-filter: blur(12px) saturate(1.45);
	}

	.tab {
		position: relative;
		display: flex;
		flex: 1 1 0;
		min-width: 0;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 3px;
		border-radius: 30px;
		color: #202020;
		text-decoration: none;
		-webkit-tap-highlight-color: transparent;
	}

	.tab.active {
		background: rgba(216, 216, 216, 0.48);
	}

	.icon-wrap {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.tab svg {
		width: 22px;
		height: 22px;
		fill: none;
		stroke: currentColor;
		stroke-width: 2.1;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.badge {
		position: absolute;
		top: -5px;
		right: -9px;
		min-width: 16px;
		height: 16px;
		padding: 0 4px;
		border-radius: 999px;
		background: var(--accent-plum, #5d2e6d);
		color: #ffffff;
		font-size: 10px;
		font-weight: 700;
		line-height: 16px;
		text-align: center;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
	}

	.label {
		overflow: hidden;
		max-width: 100%;
		font-family: var(--font-sans);
		font-size: 10.5px;
		font-weight: 500;
		line-height: 13px;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	@media (prefers-reduced-motion: no-preference) {
		.tab {
			transition: background-color 160ms ease;
		}
	}
</style>
