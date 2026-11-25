<script lang="ts">
	import { resolve } from '$app/paths';
	import Avatar from '#lib/components/Avatar.svelte';
	import Header from '#lib/components/Header.svelte';
	import { formatRelativeTimeCompact } from '#lib/domain/format.js';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<Header title="대화" />

<section class="matches-page">
	{#if data.items.length === 0}
		<div class="empty-state">
			<h2 class="serif-heading">아직 시작된 대화가 없어요</h2>
			<p>탐색이나 모집글에서 관심을 보내고, 받은 관심을 수락하면 대화가 시작돼요.</p>
			<a class="btn-pill empty-cta" href={resolve('/discover')}>룸메이트 탐색하기</a>
		</div>
	{:else}
		<div class="dm-list">
			{#each data.items as item (item.id)}
				{@const isUnreadIncoming = Boolean(
					item.lastMessage && !item.lastMessage.isMine && !item.lastMessage.isRead
				)}
				{@const timestamp = item.lastMessage
					? item.lastMessage.isMine && item.lastMessage.readAt
						? item.lastMessage.readAt
						: item.lastMessage.createdAt
					: item.createdAt}
				<a class="dm-row" href={resolve('/matches/[id]', { id: item.id })}>
					<Avatar photoKey={item.partner.firstPhotoKey} alt={item.partner.nickname} size="dm" />

					<div class="dm-copy">
						<span class="dm-name" class:unread={isUnreadIncoming}>{item.partner.nickname}</span>
						<div class="dm-sub">
							<span class="dm-preview" class:unread={isUnreadIncoming}>
								{#if !item.lastMessage}
									매칭되었어요
								{:else if item.lastMessage.isMine}
									{item.lastMessage.isRead ? '읽음' : '보냄'}
								{:else}
									{item.lastMessage.content}
								{/if}
							</span>
							<span class="dm-dot" aria-hidden="true">·</span>
							<span class="dm-time">{formatRelativeTimeCompact(timestamp)}</span>
						</div>
					</div>

					{#if isUnreadIncoming}
						<span class="unread-dot" aria-label="읽지 않은 메시지"></span>
					{/if}
				</a>
			{/each}
		</div>
	{/if}
</section>

<style>
	.matches-page {
		display: flex;
		flex-direction: column;
		padding: 4px 0 24px;
	}

	.dm-list {
		display: flex;
		flex-direction: column;
	}

	.dm-row {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 8px var(--page-gutter);
		text-decoration: none;
		transition: background-color 140ms ease;
	}

	.dm-row:hover,
	.dm-row:active {
		background: rgba(0, 0, 0, 0.04);
	}

	.dm-copy {
		display: flex;
		flex-direction: column;
		gap: 3px;
		flex: 1;
		min-width: 0;
	}

	.dm-name {
		font-size: 15px;
		font-weight: 500;
		color: var(--text-primary);
		line-height: 1.3;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.dm-name.unread {
		font-weight: 700;
	}

	.dm-sub {
		display: flex;
		align-items: center;
		gap: 4px;
		min-width: 0;
		font-size: 13.5px;
		line-height: 1.35;
		color: var(--text-muted);
	}

	.dm-preview {
		flex: 0 1 auto;
		min-width: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.dm-preview.unread {
		color: var(--text-primary);
		font-weight: 600;
	}

	.dm-dot,
	.dm-time {
		flex: 0 0 auto;
		white-space: nowrap;
	}

	.unread-dot {
		flex: 0 0 auto;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--accent-plum);
	}

	.empty-state {
		min-height: calc(100dvh - 240px);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 24px var(--page-gutter);
		text-align: center;
	}

	.empty-state h2 {
		margin: 0;
		font-size: 20px;
	}

	.empty-state p {
		margin: 0;
		font-size: 14px;
		line-height: 1.5;
		color: var(--text-secondary);
	}

	.empty-cta {
		margin-top: 10px;
		padding: 0 28px;
	}
</style>
