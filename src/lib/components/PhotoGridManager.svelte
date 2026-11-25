<script lang="ts">
	import { MAX_PROFILE_PHOTOS } from '#lib/domain/constants.js';
	import type { ProfilePhotoItem } from '#lib/domain/profile.js';
	import TraitIcon from '#lib/components/TraitIcon.svelte';

	let {
		photos = $bindable<ProfilePhotoItem[]>([]),
		onChanged = undefined
	}: {
		photos: ProfilePhotoItem[];
		onChanged?: (next: ProfilePhotoItem[]) => void;
	} = $props();

	let fileInput: HTMLInputElement;
	let busy = $state(false);
	let errorMessage = $state('');
	let dragIndex = $state<number | null>(null);

	const slots = $derived(
		Array.from({ length: MAX_PROFILE_PHOTOS }, (_, idx) => photos[idx] ?? null)
	);

	function triggerUpload() {
		if (busy || photos.length >= MAX_PROFILE_PHOTOS) return;
		errorMessage = '';
		fileInput?.click();
	}

	async function handleFileChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (!file) return;

		busy = true;
		errorMessage = '';
		try {
			const formData = new FormData();
			formData.append('file', file);

			const res = await fetch('/api/profile/photos', {
				method: 'POST',
				body: formData
			});

			if (!res.ok) {
				const data = (await res.json().catch(() => null)) as { message?: string } | null;
				errorMessage = data?.message ?? '사진 업로드에 실패했습니다.';
				return;
			}

			const data = (await res.json()) as { photos: ProfilePhotoItem[] };
			photos = data.photos;
			onChanged?.(data.photos);
		} catch {
			errorMessage = '네트워크 오류가 발생했습니다.';
		} finally {
			busy = false;
		}
	}

	async function deletePhoto(photoId: string) {
		if (busy) return;
		busy = true;
		errorMessage = '';
		try {
			const res = await fetch(`/api/profile/photos/${encodeURIComponent(photoId)}`, {
				method: 'DELETE'
			});

			if (!res.ok) {
				const data = (await res.json().catch(() => null)) as { message?: string } | null;
				errorMessage = data?.message ?? '사진 삭제에 실패했습니다.';
				return;
			}

			const data = (await res.json()) as { photos: ProfilePhotoItem[] };
			photos = data.photos;
			onChanged?.(data.photos);
		} catch {
			errorMessage = '사진 삭제 중 오류가 발생했습니다.';
		} finally {
			busy = false;
		}
	}

	async function movePhoto(fromIndex: number, toIndex: number) {
		if (
			busy ||
			fromIndex === toIndex ||
			fromIndex < 0 ||
			toIndex < 0 ||
			fromIndex >= photos.length ||
			toIndex >= photos.length
		) {
			return;
		}

		const nextOrder = [...photos];
		const [moved] = nextOrder.splice(fromIndex, 1);
		nextOrder.splice(toIndex, 0, moved);

		const previous = photos;
		photos = nextOrder.map((p, idx) => ({ ...p, displayOrder: idx }));
		busy = true;
		errorMessage = '';

		try {
			const res = await fetch('/api/profile/photos/reorder', {
				method: 'PATCH',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ photoIds: nextOrder.map((p) => p.id) })
			});

			if (!res.ok) {
				photos = previous;
				const data = (await res.json().catch(() => null)) as { message?: string } | null;
				errorMessage = data?.message ?? '순서 변경에 실패했습니다.';
				return;
			}

			const data = (await res.json()) as { photos: ProfilePhotoItem[] };
			photos = data.photos;
			onChanged?.(data.photos);
		} catch {
			photos = previous;
			errorMessage = '순서 변경 중 오류가 발생했습니다.';
		} finally {
			busy = false;
		}
	}

	function handleDrop(targetIndex: number) {
		if (dragIndex !== null && targetIndex < photos.length) {
			void movePhoto(dragIndex, targetIndex);
		}
		dragIndex = null;
	}
</script>

<div class="photo-manager">
	<input
		bind:this={fileInput}
		class="sr-only"
		type="file"
		accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
		onchange={handleFileChange}
	/>

	<div class="photo-grid">
		{#each slots as photo, index (photo ? photo.id : `empty-${index}`)}
			{#if photo}
				<div
					class="slot slot--filled"
					class:dragging={dragIndex === index}
					draggable={!busy}
					role="listitem"
					ondragstart={() => (dragIndex = index)}
					ondragover={(e) => e.preventDefault()}
					ondrop={() => handleDrop(index)}
					ondragend={() => (dragIndex = null)}
				>
					<img
						src={`/api/uploads/${encodeURIComponent(photo.storageKey)}`}
						alt={`내 프로필 사진 ${index + 1}`}
					/>

					{#if index === 0}
						<span class="primary-badge">대표</span>
					{/if}

					<button
						type="button"
						class="delete-btn"
						disabled={busy}
						onclick={() => deletePhoto(photo.id)}
						aria-label={`사진 ${index + 1} 삭제`}
					>
						<TraitIcon name="x" size={14} strokeWidth={2.4} />
					</button>

					{#if photos.length > 1}
						<div class="order-controls">
							<button
								type="button"
								class="order-btn"
								disabled={busy || index === 0}
								onclick={() => movePhoto(index, index - 1)}
								aria-label="앞으로 이동"
							>
								‹
							</button>
							<button
								type="button"
								class="order-btn"
								disabled={busy || index === photos.length - 1}
								onclick={() => movePhoto(index, index + 1)}
								aria-label="뒤로 이동"
							>
								›
							</button>
						</div>
					{/if}
				</div>
			{:else}
				<button
					type="button"
					class="slot slot--empty"
					disabled={busy}
					onclick={triggerUpload}
					aria-label="사진 추가"
				>
					<span class="plus-circle">
						<TraitIcon name="plus" size={18} strokeWidth={2} />
					</span>
				</button>
			{/if}
		{/each}
	</div>

	{#if errorMessage}
		<p class="photo-error" role="alert">{errorMessage}</p>
	{/if}
</div>

<style>
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
	}

	.photo-manager {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.photo-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
	}

	.slot {
		position: relative;
		aspect-ratio: 1 / 1;
		border-radius: 12px;
		overflow: hidden;
	}

	.slot--filled {
		background: var(--bg-surface-soft);
		border: 1px solid var(--border-hairline);
		cursor: grab;
	}

	.slot--filled.dragging {
		opacity: 0.55;
	}

	.slot--filled img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.slot--empty {
		display: grid;
		place-items: center;
		border: 1.5px dashed var(--border-control);
		background: rgba(255, 255, 255, 0.55);
		color: var(--text-muted);
		cursor: pointer;
		transition:
			border-color 140ms ease,
			background-color 140ms ease;
	}

	.slot--empty:hover:not(:disabled) {
		border-color: var(--text-primary);
		background: rgba(255, 255, 255, 0.9);
		color: var(--text-primary);
	}

	.slot--empty:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.plus-circle {
		display: grid;
		place-items: center;
		width: 30px;
		height: 30px;
		border-radius: 50%;
		background: var(--bg-chip);
	}

	.primary-badge {
		position: absolute;
		top: 6px;
		left: 6px;
		padding: 2px 7px;
		border-radius: var(--radius-pill);
		background: rgba(26, 26, 26, 0.78);
		color: #ffffff;
		font-size: 10.5px;
		font-weight: 600;
		letter-spacing: -0.01em;
	}

	.delete-btn {
		position: absolute;
		top: 6px;
		right: 6px;
		display: grid;
		place-items: center;
		width: 24px;
		height: 24px;
		padding: 0;
		border: 0;
		border-radius: 50%;
		background: rgba(26, 26, 26, 0.72);
		color: #ffffff;
		cursor: pointer;
	}

	.delete-btn:hover {
		background: var(--danger);
	}

	.order-controls {
		position: absolute;
		left: 6px;
		right: 6px;
		bottom: 6px;
		display: flex;
		justify-content: space-between;
		pointer-events: none;
	}

	.order-btn {
		pointer-events: auto;
		display: grid;
		place-items: center;
		width: 24px;
		height: 24px;
		padding: 0;
		border: 0;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.88);
		color: var(--text-primary);
		font-size: 16px;
		font-weight: 700;
		line-height: 1;
		cursor: pointer;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18);
	}

	.order-btn:disabled {
		opacity: 0.3;
		cursor: default;
	}

	.photo-error {
		margin: 0;
		padding: 9px 12px;
		border-radius: 10px;
		background: var(--danger-soft);
		color: var(--danger);
		font-size: 12.5px;
		font-weight: 500;
	}
</style>
