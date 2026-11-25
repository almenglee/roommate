<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Header from '#lib/components/Header.svelte';
	import LikeComposerSheet from '#lib/components/LikeComposerSheet.svelte';
	import ProfileCard from '#lib/components/ProfileCard.svelte';
	import TraitIcon from '#lib/components/TraitIcon.svelte';
	import { HOUSING_TYPE_LABELS } from '#lib/domain/constants.js';
	import { formatRelativeTime } from '#lib/domain/format.js';
	import { formatBudget } from '#lib/domain/profile.js';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let likeSheetOpen = $state(false);
	let localLiked = $state(false);
	let localMatchId = $state<string | null>(null);
	let toastMessage = $state('');

	$effect(() => {
		localLiked = data.alreadyLiked;
		localMatchId = data.existingMatchId;
	});

	const budgetText = $derived(formatBudget(data.post.budgetDeposit, data.post.budgetMonthly));

	function handleLikeSent(result: {
		matched: boolean;
		matchId: string | null;
		targetNickname: string;
	}) {
		if (result.matched && result.matchId) {
			localMatchId = result.matchId;
		} else {
			localLiked = true;
			toastMessage = `${result.targetNickname}님에게 관심을 보냈어요`;
			setTimeout(() => {
				toastMessage = '';
			}, 2600);
		}
		void invalidateAll();
	}
</script>

<Header title="모집글" backHref="/posts" alwaysCompact>
	{#snippet actions()}
		{#if data.isAuthor}
			<a class="edit-pill" href={resolve('/posts/[id]/edit', { id: data.post.id })}>수정</a>
		{/if}
	{/snippet}
</Header>

{#if toastMessage}
	<div class="toast-wrap" role="status">
		<span class="toast">{toastMessage}</span>
	</div>
{/if}

<section class="detail-page">
	<article class="surface-card post-card">
		<p class="post-meta-line">
			{HOUSING_TYPE_LABELS[data.post.housingType]} · {data.post.recruitCount}명 모집 · {formatRelativeTime(
				data.post.createdAt
			)}
		</p>

		<h1 class="post-title">{data.post.title}</h1>

		{#if data.post.region || budgetText}
			<div class="conditions-box">
				{#if data.post.region}
					<div class="cond-row">
						<TraitIcon name="map-pin" size={17} />
						<span>{data.post.region}</span>
					</div>
				{/if}
				{#if budgetText}
					<div class="cond-row">
						<TraitIcon name="wallet" size={17} />
						<span>{budgetText}</span>
					</div>
				{/if}
			</div>
		{/if}

		<p class="post-body">{data.post.content}</p>

		{#if data.isAuthor}
			<div class="owner-actions">
				<a
					class="btn-pill-secondary owner-btn"
					href={resolve('/posts/[id]/edit', { id: data.post.id })}
				>
					수정
				</a>

				<form
					method="POST"
					action="?/delete"
					onsubmit={(e) => {
						if (!confirm('이 모집글을 삭제할까요?')) e.preventDefault();
					}}
				>
					<button class="delete-pill" type="submit">삭제</button>
				</form>
			</div>
		{/if}
	</article>

	<div class="section-label">작성자 프로필</div>

	<ProfileCard profile={data.authorProfile} compact prioritizeMatched={!data.isAuthor} />

	{#if !data.isAuthor}
		<div class="cta-bar">
			{#if localMatchId}
				<a class="btn-pill full-width" href={resolve('/matches/[id]', { id: localMatchId })}>
					이미 매칭됨 · 채팅방으로 이동
				</a>
			{:else if localLiked}
				<button class="btn-pill full-width" type="button" disabled>관심을 보냈어요</button>
			{:else}
				<button class="btn-pill full-width" type="button" onclick={() => (likeSheetOpen = true)}>
					<TraitIcon name="heart" size={18} strokeWidth={2.1} />
					<span>작성자에게 관심 보내기</span>
				</button>
			{/if}
		</div>
	{/if}
</section>

{#if !data.isAuthor}
	<LikeComposerSheet
		bind:open={likeSheetOpen}
		targetUserId={data.authorProfile.user.id}
		targetNickname={data.authorProfile.user.nickname}
		postId={data.post.id}
		onSent={handleLikeSent}
	/>
{/if}

<style>
	.edit-pill {
		display: inline-flex;
		align-items: center;
		height: 32px;
		padding: 0 13px;
		border-radius: var(--radius-pill);
		border: 1px solid var(--border-control);
		background: var(--bg-surface);
		color: var(--text-primary);
		font-size: 12.5px;
		font-weight: 600;
		text-decoration: none;
	}

	.toast-wrap {
		position: fixed;
		top: 62px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 60;
		pointer-events: none;
	}

	.toast {
		display: inline-block;
		padding: 9px 16px;
		border-radius: var(--radius-pill);
		background: rgba(26, 26, 26, 0.92);
		color: #ffffff;
		font-size: 13px;
		font-weight: 500;
		box-shadow: var(--shadow-float);
		white-space: nowrap;
	}

	.detail-page {
		display: flex;
		flex-direction: column;
		gap: var(--card-gap);
		padding: 12px var(--page-gutter) 32px;
	}

	.post-card {
		display: flex;
		flex-direction: column;
		gap: 14px;
		padding: 18px 16px;
	}

	.post-meta-line {
		margin: 0;
		font-size: 12.5px;
		font-weight: 500;
		color: var(--text-muted);
	}

	.post-title {
		margin: 0;
		font-size: 20px;
		font-weight: 700;
		line-height: 1.35;
		letter-spacing: -0.02em;
	}

	.conditions-box {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 12px 14px;
		border-radius: 10px;
		background: var(--bg-surface-soft);
	}

	.cond-row {
		display: flex;
		align-items: center;
		gap: 9px;
		font-size: 13.5px;
		font-weight: 500;
		color: var(--text-primary);
	}

	.post-body {
		margin: 0;
		font-size: 15px;
		line-height: 1.65;
		color: var(--text-primary);
		white-space: pre-wrap;
		word-break: break-word;
	}

	.owner-actions {
		display: flex;
		align-items: center;
		gap: 8px;
		padding-top: 12px;
		border-top: 1px solid var(--border-hairline);
	}

	.owner-btn {
		flex: 1;
		height: 40px;
		font-size: 13.5px;
	}

	.delete-pill {
		height: 40px;
		padding: 0 16px;
		border-radius: var(--radius-pill);
		border: 1px solid #f2c8c8;
		background: var(--danger-soft);
		color: var(--danger);
		font-size: 13.5px;
		font-weight: 600;
		cursor: pointer;
	}

	.section-label {
		padding: 4px 2px 0;
		font-size: 13px;
		font-weight: 700;
		color: var(--text-secondary);
	}

	.cta-bar {
		padding-top: 4px;
	}

	.full-width {
		width: 100%;
	}
</style>
