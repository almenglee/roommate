<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import Avatar from '#lib/components/Avatar.svelte';
	import Header from '#lib/components/Header.svelte';
	import PhotoGridManager from '#lib/components/PhotoGridManager.svelte';
	import ProfileCard from '#lib/components/ProfileCard.svelte';
	import TraitIcon from '#lib/components/TraitIcon.svelte';
	import TraitQuestionnaire from '#lib/components/TraitQuestionnaire.svelte';
	import {
		HOUSING_TYPE_LABELS,
		REGION_PRESETS,
		USER_HOUSING_TYPES,
		type UserHousingType
	} from '#lib/domain/constants.js';
	import type { ProfilePhotoItem, ProfileViewData } from '#lib/domain/profile.js';
	import { TRAIT_KEYS, type ProfileTraits } from '#lib/domain/traits.js';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let activeTab = $state<'edit' | 'preview'>('edit');
	let onboardingStep = $state<'basic' | 'traits'>('traits');
	let photos = $state<ProfilePhotoItem[]>([]);
	let traits = $state<ProfileTraits>({} as ProfileTraits);

	let nickname = $state('');
	let major = $state('');
	let housingChoice = $state<UserHousingType>('both');
	let preferredRegion = $state('');
	let budgetDeposit = $state('');
	let budgetMonthly = $state('');

	let saving = $state(false);
	let showSavedToast = $state(false);

	$effect(() => {
		photos = data.photos;
		traits = { ...data.traits };
		nickname = data.user.nickname;
		major = data.user.major;
		housingChoice = data.user.housingType;
		preferredRegion = data.user.preferredRegion ?? '';
		budgetDeposit = data.user.budgetDeposit != null ? String(data.user.budgetDeposit) : '';
		budgetMonthly = data.user.budgetMonthly != null ? String(data.user.budgetMonthly) : '';
	});

	$effect(() => {
		if (form?.saved) {
			showSavedToast = true;
			const timer = setTimeout(() => {
				showSavedToast = false;
			}, 2600);
			return () => clearTimeout(timer);
		}
	});

	const answeredTraitsCount = $derived(TRAIT_KEYS.filter((key) => Boolean(traits[key])).length);
	const canCompleteOnboarding = $derived(answeredTraitsCount === TRAIT_KEYS.length);

	const previewProfile = $derived<ProfileViewData>({
		user: {
			id: data.user.id,
			nickname: nickname.trim() || data.user.nickname,
			sex: data.user.sex,
			birthYear: data.user.birthYear,
			admissionYear: data.user.admissionYear,
			school: data.user.school,
			major: major.trim() || data.user.major,
			housingType: housingChoice,
			preferredRegion: housingChoice === 'dorm' ? null : preferredRegion || null,
			budgetDeposit: housingChoice === 'dorm' || !budgetDeposit ? null : Number(budgetDeposit),
			budgetMonthly: housingChoice === 'dorm' || !budgetMonthly ? null : Number(budgetMonthly)
		},
		photos,
		traits,
		compatibility: null
	});

	const firstPhotoKey = $derived(photos[0]?.storageKey ?? null);

	function handlePhotosChanged() {
		void invalidateAll();
	}
</script>

{#if data.onboarding}
	<!-- Hinge-inspired Profile Onboarding Step -->
	<section class="onboarding-page">
		<div class="progress-bar" aria-hidden="true">
			<div
				class="progress-bar__fill"
				style={`width: ${onboardingStep === 'basic' ? '65%' : '100%'}`}
			></div>
		</div>

		<div class="top-nav">
			{#if onboardingStep === 'traits'}
				<button
					class="back-btn"
					type="button"
					onclick={() => (onboardingStep = 'basic')}
					aria-label="이전 단계로 돌아가기"
				>
					<TraitIcon name="chevron-left" size={22} />
				</button>
			{:else}
				<form method="POST" action="/logout">
					<button class="back-btn" type="submit" aria-label="로그인으로 돌아가기">
						<TraitIcon name="chevron-left" size={22} />
					</button>
				</form>
			{/if}
		</div>

		<div class="onboarding-inner">
			{#if onboardingStep === 'basic'}
				<div class="heading-block">
					<h1 class="serif-heading">기본 정보를<br />확인해 주세요</h1>
					<p class="helper">수정한 내용은 다음 단계 완료 시 함께 저장돼요.</p>
				</div>

				<div class="onboarding-form">
					<div class="onboarding-card">
						<p class="section-title">프로필 기본 정보</p>

						<label class="soft-input">
							<span class="soft-input__label">닉네임</span>
							<input type="text" maxlength="30" bind:value={nickname} required />
						</label>
					</div>

					<div class="onboarding-card">
						<p class="section-title">전공 및 주거 선호</p>

						<label class="soft-input">
							<span class="soft-input__label">전공</span>
							<input type="text" bind:value={major} />
						</label>

						<div class="pill-group">
							<span class="pill-group__label">희망 주거 유형</span>
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
								<select bind:value={preferredRegion}>
									<option value="">선택 안 함</option>
									{#each REGION_PRESETS as region (region)}
										<option value={region}>{region}</option>
									{/each}
								</select>
							</label>
						{/if}
					</div>

					<div class="onboarding-actions">
						<button
							class="btn-pill full-width"
							type="button"
							disabled={!nickname.trim() || !major.trim()}
							onclick={() => (onboardingStep = 'traits')}
						>
							다음 · 라이프스타일 설정하기
						</button>
					</div>
				</div>
			{:else}
				<div class="heading-block">
					<h1 class="serif-heading">라이프스타일을<br />알려주세요</h1>
					<p class="helper">서로의 라이프스타일이 얼마나 잘 맞는지 계산하는 데 사용돼요.</p>
				</div>

				{#if form?.error}
					<p class="error-banner" role="alert">{form.error}</p>
				{/if}

				<form
					class="onboarding-form"
					method="POST"
					action="?/saveOnboarding"
					use:enhance={() => {
						saving = true;
						return async ({ update }) => {
							await update();
							saving = false;
						};
					}}
				>
					<input type="hidden" name="nickname" value={nickname} />
					<input type="hidden" name="major" value={major} />
					<input type="hidden" name="housingType" value={housingChoice} />
					<input type="hidden" name="preferredRegion" value={preferredRegion} />

					<TraitQuestionnaire bind:traits variant="onboarding" />

					{#if housingChoice !== 'dorm'}
						<div class="onboarding-card">
							<p class="section-title">예산 상한 (선택)</p>
							<div class="row-2">
								<label class="soft-input">
									<span class="soft-input__label">보증금 상한 (만원)</span>
									<input
										name="budgetDeposit"
										type="number"
										min="0"
										step="100"
										placeholder="예: 1000"
										bind:value={budgetDeposit}
									/>
								</label>
								<label class="soft-input">
									<span class="soft-input__label">월세 상한 (만원)</span>
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
						</div>
					{/if}

					<div class="onboarding-card">
						<p class="section-title">프로필 사진 (선택 · 최대 6장)</p>
						<PhotoGridManager bind:photos onChanged={handlePhotosChanged} />
					</div>

					<div class="onboarding-actions">
						<button
							class="btn-pill full-width"
							type="submit"
							disabled={saving || !canCompleteOnboarding}
						>
							{saving ? '저장하는 중...' : '완료하고 탐색 시작하기'}
						</button>
					</div>
				</form>
			{/if}
		</div>
	</section>
{:else}
	<!-- Standard Profile Management Tab -->
	<Header title="내 프로필">
		{#snippet actions()}
			<form method="POST" action="/logout">
				<button class="logout-pill" type="submit">로그아웃</button>
			</form>
		{/snippet}
	</Header>

	<section class="profile-page">
		<div class="surface-card summary-card">
			<Avatar photoKey={firstPhotoKey} alt={nickname} size="lg" />
			<div class="summary-copy">
				<h2>{nickname}</h2>
				<p>{major}</p>
				<p class="muted">
					{HOUSING_TYPE_LABELS[housingChoice]} · 라이프스타일 {answeredTraitsCount}/{TRAIT_KEYS.length}
				</p>
			</div>
		</div>

		<div class="segmented" role="tablist" aria-label="프로필 보기 전환">
			<button
				type="button"
				role="tab"
				class="seg-btn"
				class:active={activeTab === 'edit'}
				aria-selected={activeTab === 'edit'}
				onclick={() => (activeTab = 'edit')}
			>
				프로필 편집
			</button>
			<button
				type="button"
				role="tab"
				class="seg-btn"
				class:active={activeTab === 'preview'}
				aria-selected={activeTab === 'preview'}
				onclick={() => (activeTab = 'preview')}
			>
				프로필 미리보기
			</button>
		</div>

		{#if form?.error}
			<p class="error-banner" role="alert">{form.error}</p>
		{/if}

		{#if showSavedToast}
			<p class="saved-banner" role="status">프로필 변경사항이 저장되었어요.</p>
		{/if}

		{#if activeTab === 'preview'}
			<div class="preview-wrap">
				<ProfileCard profile={previewProfile} />
			</div>
		{:else}
			<div class="edit-sections">
				<div class="edit-group">
					<div class="group-head">
						<h3>프로필 사진</h3>
						<span class="count-tag">{photos.length} / 6</span>
					</div>
					<PhotoGridManager bind:photos onChanged={handlePhotosChanged} />
				</div>

				<form
					class="edit-form"
					method="POST"
					action="?/saveProfile"
					use:enhance={() => {
						saving = true;
						return async ({ update }) => {
							await update({ reset: false });
							saving = false;
						};
					}}
				>
					<div class="edit-group">
						<div class="group-head">
							<h3>기본 정보 및 주거 선호</h3>
						</div>

						<div class="group-children">
							<div class="group-item">
								<label class="field-box">
									<span class="field-box__label">닉네임</span>
									<input
										name="nickname"
										type="text"
										maxlength="30"
										bind:value={nickname}
										required
									/>
								</label>
							</div>

							<div class="group-item">
								<label class="field-box">
									<span class="field-box__label">전공</span>
									<input name="major" type="text" bind:value={major} required />
								</label>
							</div>

							<div class="group-item">
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
							</div>

							{#if housingChoice !== 'dorm'}
								<div class="group-item">
									<label class="field-box">
										<span class="field-box__label">희망 지역</span>
										<select name="preferredRegion" bind:value={preferredRegion}>
											<option value="">선택 안 함</option>
											{#each REGION_PRESETS as region (region)}
												<option value={region}>{region}</option>
											{/each}
										</select>
									</label>
								</div>

								<div class="group-item">
									<div class="row-2">
										<label class="field-box">
											<span class="field-box__label">보증금 상한 (만원)</span>
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
											<span class="field-box__label">월세 상한 (만원)</span>
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
								</div>
							{/if}
						</div>
					</div>

					<div class="edit-group">
						<div class="group-head">
							<h3>라이프스타일</h3>
						</div>

						<TraitQuestionnaire bind:traits variant="flat" />
					</div>

					<div class="save-bar">
						<button class="btn-pill full-width" type="submit" disabled={saving}>
							{saving ? '저장 중...' : '변경사항 저장'}
						</button>
					</div>
				</form>
			</div>
		{/if}
	</section>
{/if}

<style>
	/* Onboarding Mode */
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
		transition: width 180ms ease;
	}

	.top-nav {
		padding: 10px 14px 0;
	}

	.back-btn {
		display: inline-grid;
		place-items: center;
		width: 36px;
		height: 36px;
		padding: 0;
		border: 0;
		border-radius: 50%;
		background: transparent;
		color: var(--text-primary);
		cursor: pointer;
		text-decoration: none;
	}

	.back-btn:hover {
		background: rgba(0, 0, 0, 0.06);
	}

	.onboarding-inner {
		display: flex;
		flex-direction: column;
		gap: 22px;
		padding: 8px 20px 44px;
	}

	.heading-block {
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
	}

	.heading-block h1 {
		margin: 0;
		font-size: 27px;
		font-weight: 700;
		color: var(--text-primary);
	}

	.helper {
		margin: 0;
		max-width: 290px;
		font-size: 13.5px;
		line-height: 1.5;
		color: var(--text-secondary);
	}

	.onboarding-form {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.onboarding-card {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 18px 16px;
		border-radius: var(--radius-lg);
		border: 1px solid var(--border-card);
		background: var(--bg-surface);
	}

	.section-title {
		margin: 0;
		font-size: 14.5px;
		font-weight: 700;
		color: var(--text-primary);
	}

	.soft-input {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 11px 14px;
		border-radius: 14px;
		border: 1px solid rgba(0, 0, 0, 0.1);
		background: rgba(255, 255, 255, 0.65);
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
		outline: none;
		width: 100%;
	}

	.onboarding-actions {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		margin-top: 6px;
	}

	/* Standard Profile Tab */
	.logout-pill {
		height: 32px;
		padding: 0 12px;
		border: 1px solid var(--border-control);
		border-radius: var(--radius-pill);
		background: var(--bg-surface);
		font-size: 12.5px;
		font-weight: 600;
		cursor: pointer;
	}

	.profile-page {
		display: flex;
		flex-direction: column;
		gap: var(--card-gap);
		padding: 14px var(--page-gutter) 24px;
	}

	.summary-card {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 16px;
	}

	.summary-copy h2 {
		margin: 0 0 3px;
		font-size: 20px;
	}

	.summary-copy p {
		margin: 0;
		font-size: 13.5px;
		color: var(--text-secondary);
	}

	.summary-copy .muted {
		margin-top: 3px;
		font-size: 12.5px;
		color: var(--text-muted);
	}

	.segmented {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 4px;
		padding: 4px;
		border-radius: var(--radius-pill);
		background: var(--bg-chip);
	}

	.seg-btn {
		height: 36px;
		border: 0;
		border-radius: var(--radius-pill);
		background: transparent;
		color: var(--text-secondary);
		font-size: 13.5px;
		font-weight: 600;
		cursor: pointer;
		transition:
			background-color 140ms ease,
			color 140ms ease;
	}

	.seg-btn.active {
		background: var(--bg-surface);
		color: var(--text-primary);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
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

	.saved-banner {
		margin: 0;
		padding: 11px 14px;
		border-radius: 12px;
		background: var(--success-soft);
		color: var(--success);
		font-size: 13px;
		font-weight: 600;
		text-align: center;
	}

	.edit-sections {
		display: flex;
		flex-direction: column;
		gap: 28px;
		padding-top: 6px;
	}

	.edit-form {
		display: flex;
		flex-direction: column;
		gap: 28px;
	}

	.edit-group {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.group-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
	}

	.group-head h3 {
		margin: 0;
		font-size: 14.5px;
		font-weight: 700;
		color: var(--text-primary);
	}

	.count-tag {
		font-size: 12.5px;
		font-weight: 600;
		color: var(--text-muted);
	}

	.group-children {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.group-item {
		padding-top: 14px;
		border-top: 1px solid var(--border-hairline);
	}

	.group-item:first-child {
		padding-top: 0;
		border-top: 0;
	}

	.row-2 {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
	}

	.field-box {
		display: flex;
		flex-direction: column;
		gap: 4px;
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
	.field-box select {
		border: 0;
		padding: 0;
		background: transparent;
		font-size: 14.5px;
		font-weight: 500;
		outline: none;
		width: 100%;
	}

	.pill-group {
		display: flex;
		flex-direction: column;
		gap: 7px;
	}

	.pill-group__label {
		font-size: 12px;
		font-weight: 600;
		color: var(--text-secondary);
	}

	.pill-row {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.choice-pill {
		height: 36px;
		padding: 0 14px;
		border-radius: var(--radius-pill);
		border: 1px solid var(--border-control);
		background: var(--bg-surface);
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

	.save-bar {
		padding-top: 4px;
	}

	.full-width {
		width: 100%;
	}

	.preview-wrap {
		display: flex;
		flex-direction: column;
	}
</style>
