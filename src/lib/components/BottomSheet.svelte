<script lang="ts">
	import type { Snippet } from 'svelte';
	import TraitIcon from '#lib/components/TraitIcon.svelte';

	let {
		open = $bindable(false),
		title = '',
		onClose = undefined,
		children,
		footer = undefined
	}: {
		open: boolean;
		title?: string;
		onClose?: () => void;
		children: Snippet;
		footer?: Snippet;
	} = $props();

	function close() {
		open = false;
		onClose?.();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (open && event.key === 'Escape') {
			close();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div class="sheet-backdrop" role="presentation" onclick={close}>
		<div
			class="sheet"
			role="dialog"
			aria-modal="true"
			aria-label={title || '옵션 선택'}
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<div class="sheet-handle-wrap">
				<span class="sheet-handle" aria-hidden="true"></span>
			</div>

			<div class="sheet-header">
				<h2>{title}</h2>
				<button class="close-btn" type="button" onclick={close} aria-label="닫기">
					<TraitIcon name="x" size={20} />
				</button>
			</div>

			<div class="sheet-body">
				{@render children()}
			</div>

			{#if footer}
				<div class="sheet-footer">
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.sheet-backdrop {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: flex;
		align-items: flex-end;
		justify-content: center;
		background: rgba(20, 18, 16, 0.42);
		backdrop-filter: blur(2px);
		animation: fadeIn 160ms ease;
	}

	.sheet {
		width: 100%;
		max-width: var(--app-max-width);
		max-height: 84dvh;
		display: flex;
		flex-direction: column;
		background: var(--bg-surface);
		border-radius: 22px 22px 0 0;
		box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.16);
		overflow: hidden;
		animation: slideUp 200ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.sheet-handle-wrap {
		display: flex;
		justify-content: center;
		padding: 10px 0 4px;
	}

	.sheet-handle {
		width: 38px;
		height: 4px;
		border-radius: 999px;
		background: #d9d9d9;
	}

	.sheet-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 6px 18px 12px;
		border-bottom: 1px solid var(--border-hairline);
	}

	.sheet-header h2 {
		margin: 0;
		font-size: 17px;
		font-weight: 700;
		color: var(--text-primary);
	}

	.close-btn {
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		border: 0;
		border-radius: 50%;
		background: var(--bg-surface-soft);
		color: var(--text-primary);
		cursor: pointer;
	}

	.sheet-body {
		flex: 1;
		overflow-y: auto;
		padding: 16px 18px 20px;
	}

	.sheet-footer {
		padding: 12px 18px max(16px, env(safe-area-inset-bottom));
		border-top: 1px solid var(--border-hairline);
		background: var(--bg-surface);
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slideUp {
		from {
			transform: translateY(28px);
			opacity: 0.85;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}
</style>
