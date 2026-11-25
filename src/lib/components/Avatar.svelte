<script lang="ts">
	import fallbackAvatar from '#lib/assets/fallback.svg';

	let {
		photoKey = null,
		alt = '프로필 사진',
		size = 'md'
	}: {
		photoKey?: string | null;
		alt?: string;
		size?: 'xs' | 'sm' | 'md' | 'dm' | 'lg';
	} = $props();

	let loadFailed = $state(false);

	const src = $derived(
		photoKey && !loadFailed ? `/api/uploads/${encodeURIComponent(photoKey)}` : fallbackAvatar
	);

	$effect(() => {
		// Reset fallback state when photoKey changes
		void photoKey;
		loadFailed = false;
	});
</script>

<span class="avatar avatar--{size}">
	<img {src} {alt} onerror={() => (loadFailed = true)} />
</span>

<style>
	.avatar {
		display: inline-flex;
		flex: 0 0 auto;
		overflow: hidden;
		border-radius: 50%;
		background: var(--bg-surface-soft);
		border: 1px solid var(--border-hairline);
	}

	.avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.avatar--xs {
		width: 28px;
		height: 28px;
	}

	.avatar--sm {
		width: 36px;
		height: 36px;
	}

	.avatar--md {
		width: 48px;
		height: 48px;
	}

	.avatar--dm {
		width: 56px;
		height: 56px;
	}

	.avatar--lg {
		width: 64px;
		height: 64px;
	}
</style>
