<script lang="ts">
	import { tick, untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import Avatar from '#lib/components/Avatar.svelte';
	import BottomSheet from '#lib/components/BottomSheet.svelte';
	import ProfileCard from '#lib/components/ProfileCard.svelte';
	import TraitIcon from '#lib/components/TraitIcon.svelte';
	import { formatTimeShort } from '#lib/domain/format.js';
	import type { ChatMessageDTO } from '#lib/domain/chat.js';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let liveMessages = $state<ChatMessageDTO[]>([]);
	let liveMatchId = $state('');
	let draft = $state('');
	let sending = $state(false);
	let sendError = $state('');
	let profileSheetOpen = $state(false);
	let scrollContainer: HTMLElement | undefined = $state();

	const messageList = $derived.by(() => {
		const merged: ChatMessageDTO[] = [...data.initialMessages];
		if (liveMatchId === data.matchId) {
			for (const msg of liveMessages) {
				if (!merged.some((existing) => existing.id === msg.id)) {
					merged.push(msg);
				}
			}
		}
		return merged.sort((a, b) => a.createdAt - b.createdAt);
	});

	function mergeMessage(incoming: ChatMessageDTO) {
		if (incoming.matchId !== data.matchId) return;
		if (messageList.some((m) => m.id === incoming.id)) return;
		if (liveMatchId !== data.matchId) {
			liveMatchId = data.matchId;
			liveMessages = [incoming];
		} else {
			liveMessages = [...liveMessages, incoming];
		}
		void scrollToBottom();
	}

	async function scrollToBottom(instant = false) {
		await tick();
		if (!scrollContainer) return;
		scrollContainer.scrollTo({
			top: scrollContainer.scrollHeight,
			behavior: instant ? 'auto' : 'smooth'
		});
	}

	$effect(() => {
		const matchId = data.matchId;
		liveMatchId = matchId;
		liveMessages = [];
		void scrollToBottom(true);

		let eventSource: EventSource | null = null;
		let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
		let disposed = false;

		function connect() {
			if (disposed) return;
			const current = untrack(() => messageList);
			const lastTs = current.length > 0 ? current[current.length - 1].createdAt : 0;
			const qs = lastTs > 0 ? `?after=${lastTs}` : '';
			const es = new EventSource(`/api/matches/${encodeURIComponent(matchId)}/stream${qs}`);
			eventSource = es;

			es.addEventListener('message', (event) => {
				try {
					const parsed = JSON.parse((event as MessageEvent<string>).data) as ChatMessageDTO;
					mergeMessage(parsed);
					if (parsed.senderId !== data.currentUserId) {
						void fetch(`/api/matches/${encodeURIComponent(matchId)}/read`, { method: 'POST' });
					}
				} catch {
					// Ignore malformed frame
				}
			});

			es.onerror = () => {
				es.close();
				if (!disposed) {
					reconnectTimer = setTimeout(connect, 2500);
				}
			};
		}

		connect();

		return () => {
			disposed = true;
			if (reconnectTimer) clearTimeout(reconnectTimer);
			eventSource?.close();
		};
	});

	async function sendMessage(event?: SubmitEvent) {
		event?.preventDefault();
		const text = draft.trim();
		if (!text || sending) return;

		sending = true;
		sendError = '';
		try {
			const res = await fetch(`/api/matches/${encodeURIComponent(data.matchId)}/messages`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ content: text })
			});

			if (!res.ok) {
				const errBody = (await res.json().catch(() => null)) as { message?: string } | null;
				sendError = errBody?.message ?? '메시지 전송에 실패했습니다.';
				return;
			}

			const payload = (await res.json()) as { message: ChatMessageDTO };
			draft = '';
			mergeMessage(payload.message);
		} catch {
			sendError = '네트워크 오류가 발생했습니다.';
		} finally {
			sending = false;
		}
	}
</script>

<div class="chat-screen">
	<header class="chat-header">
		<a class="back-btn" href={resolve('/matches')} aria-label="대화 목록으로 돌아가기">
			<TraitIcon name="chevron-left" size={22} />
		</a>

		<button
			class="partner-trigger"
			type="button"
			onclick={() => (profileSheetOpen = true)}
			aria-label="상대 프로필 보기"
		>
			<Avatar
				photoKey={data.partnerFirstPhotoKey}
				alt={data.partnerProfile.user.nickname}
				size="sm"
			/>
			<div class="partner-info">
				<span class="partner-name">{data.partnerProfile.user.nickname}</span>
				<span class="partner-sub">{data.partnerProfile.user.major}</span>
			</div>
		</button>

		<button class="profile-pill" type="button" onclick={() => (profileSheetOpen = true)}>
			프로필
		</button>
	</header>

	<div class="message-list" bind:this={scrollContainer}>
		{#if messageList.length === 0}
			<div class="empty-chat">
				<Avatar
					photoKey={data.partnerFirstPhotoKey}
					alt={data.partnerProfile.user.nickname}
					size="lg"
				/>
				<p class="empty-title">{data.partnerProfile.user.nickname}님과 매칭되었어요</p>
				<p class="empty-desc">먼저 인사를 건네고 룸메이트 조건을 맞춰보세요.</p>
			</div>
		{:else}
			{#each messageList as msg (msg.id)}
				{@const isMine = msg.senderId === data.currentUserId}
				<div class="msg-row" class:mine={isMine}>
					{#if !isMine}
						<Avatar
							photoKey={data.partnerFirstPhotoKey}
							alt={data.partnerProfile.user.nickname}
							size="xs"
						/>
					{/if}

					<div class="bubble-group" class:mine={isMine}>
						<div class="bubble" class:mine={isMine}>{msg.content}</div>
						<span class="msg-time">{formatTimeShort(msg.createdAt)}</span>
					</div>
				</div>
			{/each}
		{/if}
	</div>

	{#if sendError}
		<p class="send-error" role="alert">{sendError}</p>
	{/if}

	<form class="composer-bar" onsubmit={sendMessage}>
		<input
			type="text"
			maxlength="1000"
			placeholder="메시지를 입력하세요..."
			bind:value={draft}
			autocomplete="off"
		/>
		<button
			class="send-btn"
			type="submit"
			disabled={sending || !draft.trim()}
			aria-label="메시지 보내기"
		>
			<TraitIcon name="send" size={18} strokeWidth={2} />
		</button>
	</form>
</div>

<BottomSheet bind:open={profileSheetOpen} title={`${data.partnerProfile.user.nickname}님의 프로필`}>
	<ProfileCard profile={data.partnerProfile} showHeader={false} prioritizeMatched={true} />
</BottomSheet>

<style>
	.chat-screen {
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow: hidden;
		background: var(--bg-app);
	}

	.chat-header {
		display: flex;
		align-items: center;
		gap: 8px;
		height: 56px;
		padding: 0 var(--page-gutter);
		background: rgba(255, 253, 254, 0.94);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border-bottom: 1px solid var(--border-hairline);
		flex: 0 0 auto;
	}

	.back-btn {
		display: grid;
		place-items: center;
		width: 34px;
		height: 34px;
		margin-left: -8px;
		border-radius: 50%;
		color: var(--text-primary);
		text-decoration: none;
	}

	.partner-trigger {
		display: flex;
		align-items: center;
		gap: 10px;
		flex: 1;
		min-width: 0;
		padding: 0;
		border: 0;
		background: transparent;
		text-align: left;
		cursor: pointer;
	}

	.partner-info {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.partner-name {
		font-size: 15.5px;
		font-weight: 700;
		color: var(--text-primary);
		line-height: 1.25;
	}

	.partner-sub {
		font-size: 12px;
		color: var(--text-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.profile-pill {
		height: 30px;
		padding: 0 11px;
		border-radius: var(--radius-pill);
		border: 1px solid var(--border-control);
		background: var(--bg-surface);
		color: var(--text-primary);
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
	}

	.message-list {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		padding: 16px var(--page-gutter);
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.empty-chat {
		margin: auto 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 24px 12px;
		text-align: center;
	}

	.empty-title {
		margin: 6px 0 0;
		font-size: 15.5px;
		font-weight: 700;
		color: var(--text-primary);
	}

	.empty-desc {
		margin: 0;
		font-size: 13.5px;
		color: var(--text-secondary);
	}

	.msg-row {
		display: flex;
		align-items: flex-end;
		gap: 8px;
	}

	.msg-row.mine {
		justify-content: flex-end;
	}

	.bubble-group {
		display: flex;
		align-items: flex-end;
		gap: 6px;
		max-width: 78%;
	}

	.bubble-group.mine {
		flex-direction: row-reverse;
	}

	.bubble {
		padding: 10px 13px;
		border-radius: 16px 16px 16px 5px;
		background: var(--bg-surface-soft);
		border: 1px solid var(--border-hairline);
		color: var(--text-primary);
		font-size: 14.5px;
		line-height: 1.48;
		word-break: break-word;
		white-space: pre-wrap;
	}

	.bubble.mine {
		border-radius: 16px 16px 5px 16px;
		background: var(--bg-chip-active);
		border-color: var(--bg-chip-active);
		color: var(--text-inverse);
		box-shadow: none;
	}

	.msg-time {
		font-size: 10.5px;
		color: var(--text-muted);
		white-space: nowrap;
		flex: 0 0 auto;
		margin-bottom: 2px;
	}

	.send-error {
		margin: 0 var(--page-gutter) 6px;
		padding: 8px 12px;
		border-radius: 10px;
		background: var(--danger-soft);
		color: var(--danger);
		font-size: 12.5px;
	}

	.composer-bar {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px var(--page-gutter) max(12px, env(safe-area-inset-bottom));
		background: var(--bg-surface);
		border-top: 1px solid var(--border-hairline);
		flex: 0 0 auto;
	}

	.composer-bar input {
		flex: 1;
		min-width: 0;
		height: 42px;
		padding: 0 15px;
		border-radius: var(--radius-pill);
		border: 1px solid var(--border-control);
		background: var(--bg-surface-soft);
		font-size: 14.5px;
		outline: none;
	}

	.composer-bar input:focus {
		border-color: var(--text-primary);
		background: #ffffff;
	}

	.send-btn {
		display: grid;
		place-items: center;
		flex: 0 0 42px;
		width: 42px;
		height: 42px;
		padding: 0;
		border: 0;
		border-radius: 50%;
		background: var(--bg-chip-active);
		color: #ffffff;
		cursor: pointer;
	}

	.send-btn:disabled {
		background: #dcdcdc;
		color: #919191;
		cursor: not-allowed;
	}
</style>
