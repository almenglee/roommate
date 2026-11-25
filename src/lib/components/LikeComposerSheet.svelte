<script lang="ts">
	import { resolve } from '$app/paths';
	import BottomSheet from '#lib/components/BottomSheet.svelte';
	import TraitIcon from '#lib/components/TraitIcon.svelte';

	let {
		open = $bindable(false),
		targetUserId,
		targetNickname,
		postId = null,
		onSent = undefined
	}: {
		open: boolean;
		targetUserId: string;
		targetNickname: string;
		postId?: string | null;
		onSent?: (result: { matched: boolean; matchId: string | null; targetNickname: string }) => void;
	} = $props();

	let message = $state('');
	let sending = $state(false);
	let errorMessage = $state('');
	let matchedResult = $state<{ matchId: string; nickname: string } | null>(null);

	const quickPrompts = [
		'라이프스타일이 잘 맞을 것 같아요!',
		'룸메이트 조건 이야기 나눠보고 싶어요',
		'반가워요! 혹시 아직 룸메 구하고 계신가요?'
	];

	$effect(() => {
		if (open) {
			message = '';
			errorMessage = '';
			matchedResult = null;
		}
	});

	async function submitLike() {
		if (sending) return;
		sending = true;
		errorMessage = '';

		try {
			const res = await fetch('/api/likes', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					toUserId: targetUserId,
					postId,
					message: message.trim() || null
				})
			});

			if (!res.ok) {
				const data = (await res.json().catch(() => null)) as { message?: string } | null;
				errorMessage = data?.message ?? '관심 보내기에 실패했습니다.';
				return;
			}

			const data = (await res.json()) as {
				matched: boolean;
				matchId: string | null;
				targetNickname: string;
			};

			onSent?.(data);

			if (data.matched && data.matchId) {
				matchedResult = {
					matchId: data.matchId,
					nickname: data.targetNickname
				};
			} else {
				open = false;
			}
		} catch {
			errorMessage = '네트워크 오류가 발생했습니다.';
		} finally {
			sending = false;
		}
	}
</script>

<BottomSheet
	bind:open
	title={matchedResult ? '매칭이 성사되었어요!' : `${targetNickname}님에게 관심 보내기`}
>
	{#if matchedResult}
		<div class="match-celebration">
			<span class="match-icon">
				<TraitIcon name="heart" size={28} filled />
			</span>
			<h3 class="serif-heading">{matchedResult.nickname}님과 서로 통했어요</h3>
			<p>지금 바로 채팅방에서 룸메이트 조건을 편하게 이야기해 보세요.</p>
		</div>
	{:else}
		<div class="composer">
			<p class="composer-desc">
				짧은 인사말을 함께 남기면 매칭 확률이 높아져요. 메시지는 비워두고 보내도 괜찮아요.
			</p>

			<div class="quick-row">
				{#each quickPrompts as prompt (prompt)}
					<button
						type="button"
						class="quick-chip"
						class:active={message === prompt}
						onclick={() => (message = message === prompt ? '' : prompt)}
					>
						{prompt}
					</button>
				{/each}
			</div>

			<label class="msg-box">
				<textarea
					rows="3"
					maxlength="300"
					placeholder="예: 취침 시간과 깔끔한 성향이 비슷해 보여서 연락드려요!"
					bind:value={message}></textarea>
				<span class="char-count">{message.length} / 300</span>
			</label>

			{#if errorMessage}
				<p class="error-text" role="alert">{errorMessage}</p>
			{/if}
		</div>
	{/if}

	{#snippet footer()}
		{#if matchedResult}
			<div class="footer-stack">
				<a
					class="btn-pill full-width"
					href={resolve('/matches/[id]', { id: matchedResult.matchId })}
					onclick={() => (open = false)}
				>
					바로 채팅하기
				</a>
				<button class="btn-pill-secondary full-width" type="button" onclick={() => (open = false)}>
					계속 둘러보기
				</button>
			</div>
		{:else}
			<button class="btn-pill full-width" type="button" disabled={sending} onclick={submitLike}>
				{sending ? '보내는 중...' : '관심 보내기'}
			</button>
		{/if}
	{/snippet}
</BottomSheet>

<style>
	.composer {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.composer-desc {
		margin: 0;
		font-size: 13.5px;
		line-height: 1.5;
		color: var(--text-secondary);
	}

	.quick-row {
		display: flex;
		flex-wrap: wrap;
		gap: 7px;
	}

	.quick-chip {
		padding: 7px 12px;
		border-radius: var(--radius-pill);
		border: 1px solid var(--border-control);
		background: var(--bg-surface-soft);
		color: var(--text-primary);
		font-size: 12.5px;
		font-weight: 500;
		cursor: pointer;
		text-align: left;
	}

	.quick-chip.active {
		background: var(--accent-plum-soft);
		border-color: var(--accent-plum);
		color: var(--accent-plum);
	}

	.msg-box {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 12px;
		border-radius: 14px;
		border: 1px solid var(--border-control);
		background: var(--bg-surface-soft);
	}

	.msg-box:focus-within {
		border-color: var(--text-primary);
		background: #ffffff;
	}

	.msg-box textarea {
		border: 0;
		padding: 0;
		background: transparent;
		font-size: 14.5px;
		line-height: 1.5;
		resize: none;
		outline: none;
		width: 100%;
	}

	.char-count {
		align-self: flex-end;
		font-size: 11.5px;
		color: var(--text-muted);
	}

	.error-text {
		margin: 0;
		padding: 10px 12px;
		border-radius: 10px;
		background: var(--danger-soft);
		color: var(--danger);
		font-size: 13px;
	}

	.match-celebration {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		padding: 16px 8px 8px;
		text-align: center;
	}

	.match-icon {
		display: grid;
		place-items: center;
		width: 60px;
		height: 60px;
		border-radius: 50%;
		background: var(--accent-plum-soft);
		color: var(--accent-plum);
	}

	.match-celebration h3 {
		margin: 4px 0 0;
		font-size: 22px;
	}

	.match-celebration p {
		margin: 0;
		font-size: 14px;
		line-height: 1.5;
		color: var(--text-secondary);
	}

	.footer-stack {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.full-width {
		width: 100%;
	}
</style>
