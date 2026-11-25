<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import {
		DEFAULT_SCHOOL,
		HOUSING_TYPE_LABELS,
		REGION_PRESETS,
		SEX_LABELS,
		SEX_VALUES,
		USER_HOUSING_TYPES,
		type Sex,
		type UserHousingType
	} from '#lib/domain/constants.js';
	import TraitIcon from '#lib/components/TraitIcon.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let selectedSex = $state<Sex>('female');
	let housingChoice = $state<UserHousingType>('both');

	$effect(() => {
		if (form?.sex && SEX_VALUES.includes(form.sex as Sex)) {
			selectedSex = form.sex as Sex;
		}
		if (form?.housingType && USER_HOUSING_TYPES.includes(form.housingType as UserHousingType)) {
			housingChoice = form.housingType as UserHousingType;
		}
	});
</script>

<section class="onboarding-page">
	<div class="progress-bar" aria-hidden="true">
		<div class="progress-bar__fill" style="width: 65%"></div>
	</div>

	<div class="top-nav">
		<a class="back-btn" href={resolve('/login')} aria-label="로그인으로 돌아가기">
			<TraitIcon name="chevron-left" size={22} />
		</a>
	</div>

	<div class="onboarding-inner">
		<div class="heading-block">
			<h1 class="serif-heading">어떤 룸메이트를<br />찾고 계신가요?</h1>
			<p class="helper">기본 정보만 입력하면 바로 나에게 맞는 룸메이트를 탐색할 수 있어요.</p>
		</div>

		<form class="form-stack" method="POST" use:enhance>
			{#if form?.error}
				<p class="error-banner" role="alert">{form.error}</p>
			{/if}

			<div class="group-card">
				<p class="group-title">계정 정보</p>

				<label class="soft-input">
					<span class="soft-input__label">이메일</span>
					<input
						name="email"
						type="email"
						placeholder="me@university.ac.kr"
						value={form?.email ?? ''}
						autocomplete="email"
						required
					/>
				</label>

				<label class="soft-input">
					<span class="soft-input__label">비밀번호</span>
					<input
						name="password"
						type="password"
						placeholder="비밀번호 입력"
						autocomplete="new-password"
						required
					/>
				</label>
			</div>

			<div class="group-card">
				<p class="group-title">프로필 기본 정보</p>

				<label class="soft-input">
					<span class="soft-input__label">닉네임</span>
					<input
						name="nickname"
						type="text"
						maxlength="30"
						placeholder="프로필에 표시될 이름"
						value={form?.nickname ?? ''}
						required
					/>
				</label>

				<div class="pill-group">
					<span class="pill-group__label">성별</span>
					<input type="hidden" name="sex" value={selectedSex} />
					<div class="pill-row">
						{#each SEX_VALUES as sex (sex)}
							<button
								type="button"
								class="choice-pill"
								class:selected={selectedSex === sex}
								onclick={() => (selectedSex = sex)}
							>
								{SEX_LABELS[sex]}
							</button>
						{/each}
					</div>
				</div>

				<div class="row-2">
					<label class="soft-input">
						<span class="soft-input__label">출생연도</span>
						<input
							name="birthYear"
							type="number"
							min="1980"
							max="2012"
							value={form?.birthYear ?? 2004}
							required
						/>
					</label>

					<label class="soft-input">
						<span class="soft-input__label">입학연도</span>
						<input
							name="admissionYear"
							type="number"
							min="2000"
							max="2030"
							value={form?.admissionYear ?? 2023}
							required
						/>
					</label>
				</div>
			</div>

			<div class="group-card">
				<p class="group-title">학교 및 주거 선호</p>

				<label class="soft-input locked">
					<span class="soft-input__label">학교</span>
					<input type="hidden" name="school" value={DEFAULT_SCHOOL} />
					<select value={DEFAULT_SCHOOL} disabled aria-label="학교 (고정)">
						<option value={DEFAULT_SCHOOL}>{DEFAULT_SCHOOL}</option>
					</select>
				</label>

				<label class="soft-input">
					<span class="soft-input__label">전공</span>
					<input
						name="major"
						type="text"
						placeholder="예: 컴퓨터과학과"
						value={form?.major ?? ''}
						required
					/>
				</label>

				<div class="pill-group">
					<span class="pill-group__label">희망 주거 유형</span>
					<input type="hidden" name="housingType" value={housingChoice} />
					<div class="pill-row">
						{#each USER_HOUSING_TYPES as type (type)}
							<button
								type="button"
								class="choice-pill"
								class:selected={housingChoice === type}
								onclick={() => (housingChoice = type)}
							>
								{HOUSING_TYPE_LABELS[type]}
							</button>
						{/each}
					</div>
				</div>

				{#if housingChoice !== 'dorm'}
					<label class="soft-input">
						<span class="soft-input__label">희망 지역 (선택)</span>
						<select name="preferredRegion">
							<option value="">선택 안 함</option>
							{#each REGION_PRESETS as region (region)}
								<option value={region} selected={form?.preferredRegion === region}>
									{region}
								</option>
							{/each}
						</select>
					</label>
				{/if}
			</div>

			<div class="submit-wrap">
				<button class="btn-pill submit-btn" type="submit">다음 · 프로필 구성하기</button>
			</div>
		</form>
	</div>
</section>

<style>
	.onboarding-page {
		min-height: 100%;
		display: flex;
		flex-direction: column;
	}

	.progress-bar {
		width: 100%;
		height: 2px;
		background: rgba(0, 0, 0, 0.08);
	}

	.progress-bar__fill {
		height: 100%;
		background: var(--text-primary);
	}

	.top-nav {
		padding: 10px 14px 0;
	}

	.back-btn {
		display: inline-grid;
		place-items: center;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		color: var(--text-primary);
		text-decoration: none;
	}

	.back-btn:hover {
		background: rgba(0, 0, 0, 0.06);
	}

	.onboarding-inner {
		display: flex;
		flex-direction: column;
		gap: 24px;
		padding: 8px 20px 44px;
	}

	.heading-block {
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
	}

	.heading-block h1 {
		margin: 0;
		font-size: 27px;
		font-weight: 700;
		color: var(--text-primary);
	}

	.helper {
		margin: 0;
		max-width: 280px;
		font-size: 13.5px;
		line-height: 1.5;
		color: var(--text-secondary);
	}

	.form-stack {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.error-banner {
		margin: 0;
		padding: 12px 14px;
		border-radius: 14px;
		background: var(--danger-soft);
		color: var(--danger);
		font-size: 13px;
		font-weight: 500;
		text-align: center;
	}

	.group-card {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 18px 16px;
		border-radius: var(--radius-lg);
		border: 1px solid var(--border-card);
		background: var(--bg-surface);
	}

	.group-title {
		margin: 0 0 2px;
		font-size: 14px;
		font-weight: 700;
		color: var(--text-primary);
	}

	.row-2 {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
	}

	.soft-input {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 11px 14px;
		border-radius: 14px;
		border: 1px solid rgba(0, 0, 0, 0.1);
		background: rgba(255, 255, 255, 0.65);
		transition: border-color 150ms ease;
	}

	.soft-input.locked {
		background: rgba(0, 0, 0, 0.04);
		cursor: not-allowed;
	}

	.soft-input.locked select:disabled {
		color: var(--text-secondary);
		opacity: 1;
		cursor: not-allowed;
		pointer-events: none;
	}

	.soft-input:focus-within {
		border-color: var(--text-primary);
		background: #ffffff;
	}

	.soft-input__label {
		font-size: 11px;
		font-weight: 500;
		color: var(--text-muted);
	}

	.soft-input input,
	.soft-input select {
		border: 0;
		padding: 0;
		background: transparent;
		font-size: 15px;
		font-weight: 500;
		color: var(--text-primary);
		outline: none;
		width: 100%;
	}

	.soft-input input::placeholder {
		color: #a6a39d;
		font-weight: 400;
	}

	.pill-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding-top: 2px;
	}

	.pill-group__label {
		font-size: 12.5px;
		font-weight: 600;
		color: var(--text-secondary);
	}

	.pill-row {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.choice-pill {
		height: 38px;
		padding: 0 16px;
		border-radius: var(--radius-pill);
		border: 1px solid rgba(0, 0, 0, 0.14);
		background: rgba(255, 255, 255, 0.55);
		color: var(--text-primary);
		font-size: 13.5px;
		font-weight: 500;
		cursor: pointer;
		transition:
			background-color 140ms ease,
			color 140ms ease,
			border-color 140ms ease;
	}

	.choice-pill.selected {
		background: var(--bg-chip-active);
		border-color: var(--bg-chip-active);
		color: var(--text-inverse);
	}

	.submit-wrap {
		display: flex;
		justify-content: center;
		margin-top: 6px;
	}

	.submit-btn {
		width: 100%;
	}
</style>
