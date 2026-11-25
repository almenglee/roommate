<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import Header from '#lib/components/Header.svelte';
	import ProfileCard from '#lib/components/ProfileCard.svelte';
	import TraitIcon from '#lib/components/TraitIcon.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let busyAction = $state<'accept' | 'reject' | null>(null);
</script>

<Header
	title={data.like.profile.user.nickname}
	compactTitle={data.like.profile.user.nickname}
	backHref="/likes"
	hideLargeTitle
	revealOffset={48}
/>

<div class="like-detail-body">
	{#if data.like.post || data.like.message}
		<div class="like-context">
			{#if data.like.post}
				<a class="post-ref" href={resolve('/posts/[id]', { id: data.like.post.id })}>
					모집글 · {data.like.post.title}
				</a>
			{/if}

			{#if data.like.message}
				<div class="speech-wrap">
					<p class="speech-bubble">{data.like.message}</p>
				</div>
			{/if}
		</div>
	{/if}

	<div class="candidate-stage">
		<ProfileCard profile={data.like.profile} prioritizeMatched={true} />
	</div>
</div>

<div class="floating-action-overlay">
	<form
		method="POST"
		action="?/reject"
		use:enhance={() => {
			busyAction = 'reject';
			return async ({ update }) => {
				await update();
				busyAction = null;
			};
		}}
	>
		<button
			class="pass-fab"
			type="submit"
			disabled={busyAction !== null}
			aria-label={`${data.like.profile.user.nickname}님의 관심 거절`}
		>
			<TraitIcon name="x" size={24} strokeWidth={2.2} />
		</button>
	</form>

	<form
		method="POST"
		action="?/accept"
		use:enhance={() => {
			busyAction = 'accept';
			return async ({ update }) => {
				await update();
				busyAction = null;
			};
		}}
	>
		<button
			class="accept-fab"
			type="submit"
			disabled={busyAction !== null}
			aria-label={`${data.like.profile.user.nickname}님의 관심 수락하고 채팅하기`}
		>
			<TraitIcon name="chat" size={23} strokeWidth={2.1} />
		</button>
	</form>
</div>

<style>
	.like-detail-body {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 6px var(--page-gutter) 96px;
	}

	.like-context {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.post-ref {
		display: block;
		padding: 9px 12px;
		border-radius: 10px;
		background: var(--bg-surface-soft);
		color: var(--text-secondary);
		font-size: 12.5px;
		font-weight: 500;
		text-decoration: none;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.speech-wrap {
		display: flex;
		align-items: flex-start;
		padding-bottom: 4px;
	}

	.speech-bubble {
		position: relative;
		display: inline-block;
		max-width: 100%;
		margin: 0;
		padding: 9px 14px;
		border-radius: 12px 12px 12px 3px;
		background: var(--bg-chip);
		color: var(--text-primary);
		font-size: 14px;
		font-weight: 500;
		line-height: 1.45;
		word-break: keep-all;
	}

	.speech-bubble::after {
		content: '';
		position: absolute;
		left: 0;
		bottom: -5px;
		width: 10px;
		height: 7px;
		background: var(--bg-chip);
		clip-path: polygon(0 0, 100% 0, 0 100%);
	}

	.candidate-stage {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.floating-action-overlay {
		position: fixed;
		z-index: 35;
		left: 50%;
		bottom: var(--nav-offset, 20px);
		transform: translateX(-50%);
		width: min(100%, var(--app-max-width));
		padding: 0 var(--page-gutter);
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		pointer-events: none;
		transition: bottom 180ms ease;
	}

	.floating-action-overlay form {
		pointer-events: auto;
	}

	.pass-fab,
	.accept-fab {
		box-shadow: var(--shadow-float);
		cursor: pointer;
		transition:
			transform 120ms ease,
			background-color 140ms ease;
	}

	.pass-fab {
		display: grid;
		place-items: center;
		width: 52px;
		height: 52px;
		padding: 0;
		border-radius: 50%;
		border: 1px solid rgba(0, 0, 0, 0.1);
		background: rgba(255, 255, 255, 0.94);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		color: var(--text-primary);
	}

	.pass-fab:hover:not(:disabled) {
		background: #ffffff;
	}

	.accept-fab {
		display: grid;
		place-items: center;
		width: 52px;
		height: 52px;
		padding: 0;
		border-radius: 50%;
		border: 1px solid rgba(255, 255, 255, 0.18);
		background: rgba(26, 26, 26, 0.92);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		color: #ffffff;
	}

	.accept-fab:hover:not(:disabled) {
		background: var(--accent-plum);
	}

	.pass-fab:active:not(:disabled),
	.accept-fab:active:not(:disabled) {
		transform: scale(0.95);
	}

	.pass-fab:disabled,
	.accept-fab:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
</style>
