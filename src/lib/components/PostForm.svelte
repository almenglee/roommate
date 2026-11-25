<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		HOUSING_TYPE_LABELS,
		POST_HOUSING_TYPES,
		REGION_PRESETS,
		type PostHousingType
	} from '#lib/domain/constants.js';

	export interface PostFormInitial {
		housingType: PostHousingType;
		recruitCount: number;
		region: string;
		budgetDeposit: string;
		budgetMonthly: string;
		title: string;
		content: string;
	}

	let {
		initial,
		submitLabel = '모집글 등록',
		errorMessage = ''
	}: {
		initial: PostFormInitial;
		submitLabel?: string;
		errorMessage?: string;
	} = $props();

	let housingType = $state<PostHousingType>('dorm');
	let recruitCount = $state(1);
	let region = $state('');
	let budgetDeposit = $state('');
	let budgetMonthly = $state('');
	let title = $state('');
	let content = $state('');
	let submitting = $state(false);

	$effect(() => {
		housingType = initial.housingType;
		recruitCount = initial.recruitCount || 1;
		region = initial.region;
		budgetDeposit = initial.budgetDeposit;
		budgetMonthly = initial.budgetMonthly;
		title = initial.title;
		content = initial.content;
	});
</script>

<form
	class="post-form"
	method="POST"
	use:enhance={() => {
		submitting = true;
		return async ({ update }) => {
			await update({ reset: false });
			submitting = false;
		};
	}}
>
	{#if errorMessage}
		<p class="error-banner" role="alert">{errorMessage}</p>
	{/if}

	<div class="surface-card form-card">
		<div class="pill-group">
			<span class="group-label">주거 유형</span>
			<input type="hidden" name="housingType" value={housingType} />
			<div class="pill-row">
				{#each POST_HOUSING_TYPES as type (type)}
					<button
						type="button"
						class="choice-pill"
						class:selected={housingType === type}
						onclick={() => (housingType = type)}
					>
						{HOUSING_TYPE_LABELS[type]}
					</button>
				{/each}
			</div>
		</div>

		<div class="pill-group">
			<span class="group-label">모집 인원</span>
			<input type="hidden" name="recruitCount" value={recruitCount} />
			<div class="pill-row">
				{#each [1, 2, 3, 4] as count (count)}
					<button
						type="button"
						class="choice-pill choice-pill--sm"
						class:selected={recruitCount === count}
						onclick={() => (recruitCount = count)}
					>
						{count}명
					</button>
				{/each}
			</div>
		</div>

		<label class="field-box">
			<span class="field-box__label">
				{housingType === 'off_campus' ? '희망 지역 (필수)' : '지역 (선택)'}
			</span>
			<select name="region" bind:value={region} required={housingType === 'off_campus'}>
				<option value="">선택 안 함</option>
				{#each REGION_PRESETS as r (r)}
					<option value={r}>{r}</option>
				{/each}
			</select>
		</label>

		{#if housingType === 'off_campus'}
			<div class="row-2">
				<label class="field-box">
					<span class="field-box__label">보증금 (만원 · 1인 기준)</span>
					<input
						name="budgetDeposit"
						type="number"
						min="0"
						step="100"
						placeholder="예: 1000"
						bind:value={budgetDeposit}
					/>
				</label>
				<label class="field-box">
					<span class="field-box__label">월세 (만원 · 1인 기준)</span>
					<input
						name="budgetMonthly"
						type="number"
						min="0"
						step="5"
						placeholder="예: 55"
						bind:value={budgetMonthly}
					/>
				</label>
			</div>
		{/if}
	</div>

	<div class="surface-card form-card">
		<label class="field-box">
			<span class="field-box__label">제목</span>
			<input
				name="title"
				type="text"
				maxlength="80"
				placeholder="예: 단월동 정문 도보 5분 투룸 룸메이트 구해요"
				bind:value={title}
				required
			/>
		</label>

		<label class="field-box">
			<span class="field-box__label">상세 내용</span>
			<textarea
				name="content"
				rows="6"
				maxlength="1500"
				placeholder="방 조건, 원하는 룸메이트 성향, 생활 규칙 등을 자유롭게 적어주세요."
				bind:value={content}
				required></textarea>
			<span class="char-count">{content.length} / 1500</span>
		</label>
	</div>

	<button class="btn-pill submit-btn" type="submit" disabled={submitting}>
		{submitting ? '저장하는 중...' : submitLabel}
	</button>
</form>

<style>
	.post-form {
		display: flex;
		flex-direction: column;
		gap: var(--card-gap);
		padding: 12px var(--page-gutter) 32px;
	}

	.error-banner {
		margin: 0;
		padding: 11px 14px;
		border-radius: 12px;
		background: var(--danger-soft);
		color: var(--danger);
		font-size: 13px;
		font-weight: 500;
	}

	.form-card {
		display: flex;
		flex-direction: column;
		gap: 14px;
		padding: 16px;
	}

	.pill-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.group-label {
		font-size: 12.5px;
		font-weight: 600;
		color: var(--text-secondary);
	}

	.pill-row {
		display: flex;
		flex-wrap: wrap;
		gap: 7px;
	}

	.choice-pill {
		height: 36px;
		padding: 0 15px;
		border-radius: var(--radius-pill);
		border: 1px solid var(--border-control);
		background: var(--bg-surface);
		color: var(--text-primary);
		font-size: 13.5px;
		font-weight: 500;
		cursor: pointer;
	}

	.choice-pill--sm {
		height: 32px;
		padding: 0 12px;
		font-size: 12.5px;
	}

	.choice-pill.selected {
		background: var(--bg-chip-active);
		border-color: var(--bg-chip-active);
		color: var(--text-inverse);
	}

	.row-2 {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
	}

	.field-box {
		display: flex;
		flex-direction: column;
		gap: 5px;
		padding: 10px 12px;
		border-radius: 12px;
		border: 1px solid var(--border-hairline);
		background: var(--bg-surface-soft);
	}

	.field-box:focus-within {
		border-color: var(--text-primary);
		background: #ffffff;
	}

	.field-box__label {
		font-size: 11px;
		font-weight: 600;
		color: var(--text-muted);
	}

	.field-box input,
	.field-box select,
	.field-box textarea {
		border: 0;
		padding: 0;
		background: transparent;
		font-size: 14.5px;
		font-weight: 500;
		line-height: 1.5;
		outline: none;
		width: 100%;
		resize: vertical;
	}

	.field-box textarea {
		font-weight: 400;
	}

	.char-count {
		align-self: flex-end;
		font-size: 11px;
		color: var(--text-muted);
	}

	.submit-btn {
		width: 100%;
	}
</style>
