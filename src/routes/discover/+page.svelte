<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import BottomSheet from '#lib/components/BottomSheet.svelte';
	import Header from '#lib/components/Header.svelte';
	import LikeComposerSheet from '#lib/components/LikeComposerSheet.svelte';
	import ProfileCard from '#lib/components/ProfileCard.svelte';
	import TraitIcon from '#lib/components/TraitIcon.svelte';
	import { REGION_PRESETS } from '#lib/domain/constants.js';
	import type { ProfileViewData } from '#lib/domain/profile.js';
	import { TRAIT_DEFINITIONS, type TraitKey } from '#lib/domain/traits.js';
	import type { PageData } from './$types';
	import type { HousingFilter, SexFilter } from './+page.server.js';

	let { data }: { data: PageData } = $props();

	let dismissedIds = $state<string[]>([]);
	let actionBusy = $state(false);
	let resettingPasses = $state(false);
	let toastMessage = $state('');

	let likeSheetOpen = $state(false);
	let filterSheetOpen = $state(false);

	type FilterSheetMode = 'all' | 'sex' | 'housing' | 'region' | 'budget' | 'traits';
	let filterMode = $state<FilterSheetMode>('all');

	// Local filter draft inside BottomSheet
	let draftSex = $state<SexFilter>('female');
	let draftHousing = $state<HousingFilter>('all');
	let draftRegion = $state('');
	let draftMaxDeposit = $state('');
	let draftMaxMonthly = $state('');
	let draftTraits = $state<Partial<Record<TraitKey, string[]>>>({});

	const FILTER_SHEET_TITLES: Record<FilterSheetMode, string> = {
		all: '탐색 필터',
		sex: '성별',
		housing: '주거 유형',
		region: '희망 지역',
		budget: '예산 상한',
		traits: '라이프스타일'
	};

	const showFilterFooter = $derived(
		filterMode === 'all' || filterMode === 'budget' || filterMode === 'traits'
	);

	$effect(() => {
		// Reset dismissed queue whenever loader filters/candidates refresh
		void data.candidates;
		dismissedIds = [];
	});

	const remainingCandidates = $derived.by((): ProfileViewData[] => {
		const dismissed = new Set(dismissedIds);
		return data.candidates.filter((c) => !dismissed.has(c.user.id));
	});

	const currentCandidate = $derived(remainingCandidates[0] ?? null);

	const activeTraitFilterKeys = $derived(Object.keys(data.filters.traits) as TraitKey[]);

	const activeTraitFilterCount = $derived(
		Object.values(data.filters.traits).reduce((sum, list) => sum + (list?.length ?? 0), 0)
	);

	const extraFilterCount = $derived.by(() => {
		let count = 0;
		if (data.filters.sex !== data.user.sex) count += 1;
		if (data.filters.housing !== 'all') count += 1;
		if (data.filters.region) count += 1;
		if (data.filters.maxDeposit !== null || data.filters.maxMonthly !== null) count += 1;
		if (activeTraitFilterCount > 0) count += 1;
		return count;
	});

	const sexChipLabel = $derived.by(() => {
		if (data.filters.sex === 'male') return '남성';
		if (data.filters.sex === 'female') return '여성';
		return '전체 성별';
	});

	const housingChipLabel = $derived.by(() => {
		if (data.filters.housing === 'dorm') return '기숙사';
		if (data.filters.housing === 'off_campus') return '자취·쉐어';
		return '주거 유형';
	});

	const budgetChipLabel = $derived.by(() => {
		const parts: string[] = [];
		if (data.filters.maxDeposit !== null) parts.push(`보증금 ${data.filters.maxDeposit}만↓`);
		if (data.filters.maxMonthly !== null) parts.push(`월 ${data.filters.maxMonthly}만↓`);
		return parts.length > 0 ? parts.join(' · ') : '예산';
	});

	function showToast(msg: string) {
		toastMessage = msg;
		setTimeout(() => {
			if (toastMessage === msg) toastMessage = '';
		}, 2400);
	}

	function openFilterSheet(mode: FilterSheetMode = 'all') {
		draftSex = data.filters.sex;
		draftHousing = data.filters.housing;
		draftRegion = data.filters.region;
		draftMaxDeposit = data.filters.maxDeposit != null ? String(data.filters.maxDeposit) : '';
		draftMaxMonthly = data.filters.maxMonthly != null ? String(data.filters.maxMonthly) : '';

		const copy: Partial<Record<TraitKey, string[]>> = {};
		for (const [k, v] of Object.entries(data.filters.traits) as [TraitKey, string[]][]) {
			if (v && v.length > 0) copy[k] = [...v];
		}
		draftTraits = copy;
		filterMode = mode;
		filterSheetOpen = true;
	}

	function toggleDraftTrait(key: TraitKey, value: string) {
		const current = draftTraits[key] ?? [];
		const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];

		const updated = { ...draftTraits };
		if (next.length > 0) {
			updated[key] = next;
		} else {
			delete updated[key];
		}
		draftTraits = updated;
	}

	function resetDraftFilters() {
		if (filterMode === 'budget') {
			draftMaxDeposit = '';
			draftMaxMonthly = '';
			return;
		}
		if (filterMode === 'traits') {
			draftTraits = {};
			return;
		}
		draftSex = data.user.sex;
		draftHousing = 'all';
		draftRegion = '';
		draftMaxDeposit = '';
		draftMaxMonthly = '';
		draftTraits = {};
	}

	function selectSexOption(value: SexFilter) {
		draftSex = value;
		if (filterMode === 'sex') {
			void applyFilters();
		}
	}

	function selectHousingOption(value: HousingFilter) {
		draftHousing = value;
		if (filterMode === 'housing') {
			void applyFilters();
		}
	}

	function selectRegionOption(value: string) {
		draftRegion = value;
		if (filterMode === 'region') {
			void applyFilters();
		}
	}

	async function applyFilters() {
		const params = new SvelteURLSearchParams();
		if (draftSex !== data.user.sex) params.set('sex', draftSex);
		if (draftHousing !== 'all') params.set('housing', draftHousing);
		if (draftRegion.trim()) params.set('region', draftRegion.trim());
		if (draftMaxDeposit.trim()) params.set('maxDeposit', draftMaxDeposit.trim());
		if (draftMaxMonthly.trim()) params.set('maxMonthly', draftMaxMonthly.trim());

		for (const [key, values] of Object.entries(draftTraits) as [TraitKey, string[]][]) {
			if (values && values.length > 0) {
				params.set(`trait_${key}`, values.join(','));
			}
		}

		filterSheetOpen = false;
		const qs = params.toString();
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		await goto(qs ? `${resolve('/discover')}?${qs}` : resolve('/discover'), {
			replaceState: false
		});
	}

	async function clearAllFilters() {
		await goto(resolve('/discover'));
	}

	function scrollMainTop() {
		const mainEl = document.querySelector('main');
		if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
	}

	async function handlePass() {
		if (!currentCandidate || actionBusy) return;
		const target = currentCandidate.user;
		actionBusy = true;

		try {
			const res = await fetch('/api/passes', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ toUserId: target.id })
			});
			if (res.ok) {
				dismissedIds = [...dismissedIds, target.id];
				scrollMainTop();
			}
		} finally {
			actionBusy = false;
		}
	}

	function handleLikeSent(result: {
		matched: boolean;
		matchId: string | null;
		targetNickname: string;
	}) {
		if (!currentCandidate) return;
		dismissedIds = [...dismissedIds, currentCandidate.user.id];
		scrollMainTop();
		if (!result.matched) {
			showToast(`${result.targetNickname}님에게 관심을 보냈어요`);
		}
		void invalidateAll();
	}

	async function handleResetPasses() {
		if (resettingPasses) return;
		resettingPasses = true;
		try {
			const res = await fetch('/api/passes', { method: 'DELETE' });
			if (res.ok) {
				dismissedIds = [];
				await invalidateAll();
				showToast('패스한 후보를 다시 불러왔어요');
			}
		} finally {
			resettingPasses = false;
		}
	}
</script>

<Header
	title="탐색"
	compactTitle={currentCandidate ? currentCandidate.user.nickname : '탐색'}
	hideLargeTitle={Boolean(currentCandidate)}
	revealOffset={48}
>
	{#snippet initialContent()}
		<div class="filter-bar" aria-label="빠른 필터">
			<button
				class="filter-icon-trigger"
				type="button"
				onclick={() => openFilterSheet('all')}
				aria-label="전체 필터 열기"
			>
				<TraitIcon name="sliders" size={20} strokeWidth={1.9} />
				{#if extraFilterCount > 0}
					<span class="filter-dot">{extraFilterCount}</span>
				{/if}
			</button>

			<button
				class="filter-pill"
				class:active={data.filters.sex !== 'all'}
				type="button"
				onclick={() => openFilterSheet('sex')}
			>
				<span>{sexChipLabel}</span>
				<TraitIcon name="chevron-down" size={14} />
			</button>

			<button
				class="filter-pill"
				class:active={data.filters.housing !== 'all'}
				type="button"
				onclick={() => openFilterSheet('housing')}
			>
				<span>{housingChipLabel}</span>
				<TraitIcon name="chevron-down" size={14} />
			</button>

			<button
				class="filter-pill"
				class:active={Boolean(data.filters.region)}
				type="button"
				onclick={() => openFilterSheet('region')}
			>
				<span>{data.filters.region || '지역'}</span>
				<TraitIcon name="chevron-down" size={14} />
			</button>

			<button
				class="filter-pill"
				class:active={data.filters.maxDeposit !== null || data.filters.maxMonthly !== null}
				type="button"
				onclick={() => openFilterSheet('budget')}
			>
				<span>{budgetChipLabel}</span>
				<TraitIcon name="chevron-down" size={14} />
			</button>

			<button
				class="filter-pill"
				class:active={activeTraitFilterCount > 0}
				type="button"
				onclick={() => openFilterSheet('traits')}
			>
				<span>
					{activeTraitFilterCount > 0 ? `라이프스타일 ${activeTraitFilterCount}` : '라이프스타일'}
				</span>
				<TraitIcon name="chevron-down" size={14} />
			</button>
		</div>
	{/snippet}
</Header>

{#if toastMessage}
	<div class="toast-wrap" role="status">
		<span class="toast">{toastMessage}</span>
	</div>
{/if}

<div class="discover-body">
	{#if currentCandidate}
		<div class="candidate-stage">
			<ProfileCard
				profile={currentCandidate}
				priorityTraitKeys={activeTraitFilterKeys}
				prioritizeMatched={true}
				onLike={() => (likeSheetOpen = true)}
				likeDisabled={actionBusy}
			/>
		</div>
	{:else}
		<div class="empty-state">
			<h2 class="serif-heading">조건에 맞는 후보를<br />모두 확인했어요</h2>
			<p>필터 조건을 넓히거나 패스한 후보를 다시 살펴보세요.</p>

			<div class="empty-actions">
				{#if data.passedCount + dismissedIds.length > 0}
					<button
						class="btn-pill full-width"
						type="button"
						disabled={resettingPasses}
						onclick={handleResetPasses}
					>
						{resettingPasses ? '불러오는 중...' : '패스한 후보 다시 보기'}
					</button>
				{/if}

				{#if extraFilterCount > 0}
					<button class="btn-pill-secondary full-width" type="button" onclick={clearAllFilters}>
						필터 초기화
					</button>
				{/if}
			</div>
		</div>
	{/if}
</div>

{#if currentCandidate}
	<div class="floating-action-overlay">
		<button
			class="pass-fab"
			type="button"
			disabled={actionBusy}
			onclick={handlePass}
			aria-label={`${currentCandidate.user.nickname}님 패스`}
		>
			<TraitIcon name="x" size={24} strokeWidth={2.2} />
		</button>

		<button
			class="like-fab"
			type="button"
			disabled={actionBusy}
			onclick={() => (likeSheetOpen = true)}
			aria-label={`${currentCandidate.user.nickname}님에게 관심 보내기`}
		>
			<TraitIcon name="heart" size={23} strokeWidth={2.1} />
		</button>
	</div>

	<LikeComposerSheet
		bind:open={likeSheetOpen}
		targetUserId={currentCandidate.user.id}
		targetNickname={currentCandidate.user.nickname}
		onSent={handleLikeSent}
	/>
{/if}

{#snippet filterFooter()}
	<div class="sheet-footer-row">
		<button class="btn-pill-secondary" type="button" onclick={resetDraftFilters}> 초기화 </button>
		<button class="btn-pill apply-btn" type="button" onclick={applyFilters}>
			{filterMode === 'all' ? '필터 적용' : '적용'}
		</button>
	</div>
{/snippet}

<BottomSheet
	bind:open={filterSheetOpen}
	title={FILTER_SHEET_TITLES[filterMode]}
	footer={showFilterFooter ? filterFooter : undefined}
>
	<div class="filter-sections">
		{#if filterMode === 'all' || filterMode === 'sex'}
			<div class="filter-section">
				{#if filterMode === 'all'}
					<p class="filter-title">성별</p>
				{/if}
				<div class="pill-wrap">
					{#each [{ value: 'female', label: '여성' }, { value: 'male', label: '남성' }, { value: 'all', label: '전체' }] as opt (opt.value)}
						<button
							type="button"
							class="opt-pill"
							class:selected={draftSex === opt.value}
							onclick={() => selectSexOption(opt.value as SexFilter)}
						>
							{opt.label}
						</button>
					{/each}
				</div>
			</div>
		{/if}

		{#if filterMode === 'all' || filterMode === 'housing'}
			<div class="filter-section">
				{#if filterMode === 'all'}
					<p class="filter-title">주거 유형</p>
				{/if}
				<div class="pill-wrap">
					{#each [{ value: 'all', label: '전체' }, { value: 'dorm', label: '기숙사' }, { value: 'off_campus', label: '자취·쉐어' }] as opt (opt.value)}
						<button
							type="button"
							class="opt-pill"
							class:selected={draftHousing === opt.value}
							onclick={() => selectHousingOption(opt.value as HousingFilter)}
						>
							{opt.label}
						</button>
					{/each}
				</div>
			</div>
		{/if}

		{#if filterMode === 'all' || filterMode === 'region'}
			<div class="filter-section">
				{#if filterMode === 'all'}
					<p class="filter-title">희망 지역</p>
				{/if}
				<div class="pill-wrap">
					<button
						type="button"
						class="opt-pill"
						class:selected={draftRegion === ''}
						onclick={() => selectRegionOption('')}
					>
						전체 지역
					</button>
					{#each REGION_PRESETS as region (region)}
						<button
							type="button"
							class="opt-pill"
							class:selected={draftRegion === region}
							onclick={() => selectRegionOption(region)}
						>
							{region}
						</button>
					{/each}
				</div>
			</div>
		{/if}

		{#if filterMode === 'all' || filterMode === 'budget'}
			<div class="filter-section">
				{#if filterMode === 'all'}
					<p class="filter-title">예산 상한 (만원)</p>
				{/if}
				<div class="row-2">
					<label class="budget-field">
						<span>보증금 이하</span>
						<input
							type="number"
							min="0"
							step="100"
							placeholder="제한 없음"
							bind:value={draftMaxDeposit}
						/>
					</label>
					<label class="budget-field">
						<span>월세 이하</span>
						<input
							type="number"
							min="0"
							step="5"
							placeholder="제한 없음"
							bind:value={draftMaxMonthly}
						/>
					</label>
				</div>
			</div>
		{/if}

		{#if filterMode === 'all' || filterMode === 'traits'}
			<div class="filter-section">
				{#if filterMode === 'all'}
					<p class="filter-title">라이프스타일 (다중 선택)</p>
				{/if}
				<div class="traits-filter-list">
					{#each TRAIT_DEFINITIONS as def (def.key)}
						<div class="trait-filter-group">
							<div class="trait-filter-head">
								<TraitIcon name={def.icon} size={16} strokeWidth={1.85} />
								<span>{def.label}</span>
							</div>
							<div class="pill-wrap">
								{#each def.options as opt (opt.value)}
									<button
										type="button"
										class="opt-pill opt-pill--sm"
										class:selected={(draftTraits[def.key] ?? []).includes(opt.value)}
										onclick={() => toggleDraftTrait(def.key, opt.value)}
									>
										{opt.shortLabel}
									</button>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</BottomSheet>

<style>
	.filter-icon-trigger {
		position: relative;
		display: inline-flex;
		flex: 0 0 auto;
		align-items: center;
		justify-content: center;
		height: 34px;
		padding: 0 4px;
		border: 0;
		background: transparent;
		color: var(--text-primary);
		cursor: pointer;
	}

	.filter-dot {
		position: absolute;
		top: 1px;
		right: -3px;
		min-width: 15px;
		height: 15px;
		padding: 0 3px;
		border-radius: 999px;
		background: var(--accent-plum);
		color: #ffffff;
		font-size: 9.5px;
		font-weight: 700;
		line-height: 15px;
		text-align: center;
	}

	.toast-wrap {
		position: fixed;
		top: 66px;
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

	.discover-body {
		display: flex;
		flex-direction: column;
		gap: 14px;
		padding: 6px var(--page-gutter) 96px;
	}

	.filter-bar {
		display: flex;
		align-items: center;
		width: 100%;
		padding: 0 var(--page-gutter);
		gap: 8px;
		overflow-x: auto;
		scrollbar-width: none;
	}

	.filter-bar::-webkit-scrollbar {
		display: none;
	}

	.filter-pill {
		display: inline-flex;
		flex: 0 0 auto;
		align-items: center;
		gap: 4px;
		height: 34px;
		padding: 0 13px;
		border-radius: var(--radius-pill);
		border: 1px solid var(--border-control);
		background: var(--bg-surface);
		color: var(--text-primary);
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
	}

	.filter-pill.active {
		background: var(--bg-chip-active);
		border-color: var(--bg-chip-active);
		color: var(--text-inverse);
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
		bottom: var(--nav-offset, 88px);
		transform: translateX(-50%);
		width: min(100%, var(--app-max-width));
		padding: 0 var(--page-gutter);
		display: flex;
		align-items: center;
		justify-content: space-between;
		pointer-events: none;
		transition: bottom 180ms ease;
	}

	.pass-fab,
	.like-fab {
		pointer-events: auto;
		display: grid;
		place-items: center;
		flex: 0 0 52px;
		width: 52px;
		height: 52px;
		padding: 0;
		border-radius: 50%;
		box-shadow: var(--shadow-float);
		cursor: pointer;
		transition:
			transform 120ms ease,
			background-color 140ms ease;
	}

	.pass-fab {
		border: 1px solid rgba(0, 0, 0, 0.1);
		background: rgba(255, 255, 255, 0.94);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		color: var(--text-primary);
	}

	.pass-fab:hover:not(:disabled) {
		background: #ffffff;
	}

	.like-fab {
		border: 1px solid rgba(255, 255, 255, 0.18);
		background: rgba(26, 26, 26, 0.92);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		color: #ffffff;
	}

	.like-fab:hover:not(:disabled) {
		background: var(--accent-plum);
	}

	.pass-fab:active:not(:disabled),
	.like-fab:active:not(:disabled) {
		transform: scale(0.94);
	}

	.pass-fab:disabled,
	.like-fab:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.empty-state {
		min-height: calc(100dvh - 180px);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 24px 12px;
		text-align: center;
	}

	.empty-state h2 {
		margin: 0;
		font-size: 22px;
	}

	.empty-state p {
		margin: 0;
		font-size: 14px;
		color: var(--text-secondary);
		line-height: 1.5;
	}

	.empty-actions {
		display: flex;
		flex-direction: column;
		gap: 8px;
		width: 100%;
		max-width: 240px;
		margin-top: 10px;
	}

	.full-width {
		width: 100%;
	}

	/* Filter BottomSheet content */
	.filter-sections {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.filter-section {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.filter-title {
		margin: 0;
		font-size: 14px;
		font-weight: 700;
		color: var(--text-primary);
	}

	.pill-wrap {
		display: flex;
		flex-wrap: wrap;
		gap: 7px;
	}

	.opt-pill {
		height: 36px;
		padding: 0 14px;
		border-radius: var(--radius-pill);
		border: 1px solid var(--border-control);
		background: var(--bg-surface);
		color: var(--text-primary);
		font-size: 13.5px;
		font-weight: 500;
		cursor: pointer;
	}

	.opt-pill--sm {
		height: 32px;
		padding: 0 12px;
		font-size: 12.5px;
	}

	.opt-pill.selected {
		background: var(--bg-chip-active);
		border-color: var(--bg-chip-active);
		color: var(--text-inverse);
	}

	.row-2 {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
	}

	.budget-field {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 9px 12px;
		border-radius: 12px;
		border: 1px solid var(--border-hairline);
		background: var(--bg-surface-soft);
	}

	.budget-field span {
		font-size: 11px;
		font-weight: 600;
		color: var(--text-muted);
	}

	.budget-field input {
		border: 0;
		padding: 0;
		background: transparent;
		font-size: 14px;
		font-weight: 500;
		outline: none;
		width: 100%;
	}

	.traits-filter-list {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.trait-filter-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding-top: 10px;
		border-top: 1px solid var(--border-hairline);
	}

	.trait-filter-group:first-child {
		padding-top: 0;
		border-top: 0;
	}

	.trait-filter-head {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 13px;
		font-weight: 600;
		color: var(--text-secondary);
	}

	.sheet-footer-row {
		display: flex;
		gap: 10px;
	}

	.apply-btn {
		flex: 1;
	}
</style>
