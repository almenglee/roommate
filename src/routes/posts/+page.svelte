<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import Avatar from '#lib/components/Avatar.svelte';
	import BottomSheet from '#lib/components/BottomSheet.svelte';
	import Header from '#lib/components/Header.svelte';
	import TraitIcon from '#lib/components/TraitIcon.svelte';
	import { HOUSING_TYPE_LABELS, REGION_PRESETS } from '#lib/domain/constants.js';
	import { formatRelativeTime } from '#lib/domain/format.js';
	import { formatAdmissionShort } from '#lib/domain/profile.js';
	import type { PageData } from './$types';
	import type { PostHousingFilter } from './+page.server.js';

	let { data }: { data: PageData } = $props();

	let filterSheetOpen = $state(false);

	type PostFilterSheetMode = 'all' | 'housing' | 'region';
	let filterMode = $state<PostFilterSheetMode>('all');

	let draftHousing = $state<PostHousingFilter>('all');
	let draftRegion = $state('');
	let draftMaxMonthly = $state('');
	let draftMine = $state(false);

	const FILTER_SHEET_TITLES: Record<PostFilterSheetMode, string> = {
		all: '모집글 필터',
		housing: '주거 유형',
		region: '지역'
	};

	const activeFilterCount = $derived.by(() => {
		let count = 0;
		if (data.filters.housing !== 'all') count += 1;
		if (data.filters.region) count += 1;
		if (data.filters.maxMonthly !== null) count += 1;
		if (data.filters.mine) count += 1;
		return count;
	});

	function openFilterSheet(mode: PostFilterSheetMode = 'all') {
		draftHousing = data.filters.housing;
		draftRegion = data.filters.region;
		draftMaxMonthly = data.filters.maxMonthly != null ? String(data.filters.maxMonthly) : '';
		draftMine = data.filters.mine;
		filterMode = mode;
		filterSheetOpen = true;
	}

	function selectHousingOption(value: PostHousingFilter) {
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

	function buildPostsUrl(next: {
		housing: PostHousingFilter;
		region: string;
		maxMonthly: string;
		mine: boolean;
	}): string {
		const params = new SvelteURLSearchParams();
		if (next.housing !== 'all') params.set('housing', next.housing);
		if (next.region.trim()) params.set('region', next.region.trim());
		if (next.maxMonthly.trim()) params.set('maxMonthly', next.maxMonthly.trim());
		if (next.mine) params.set('mine', '1');
		const qs = params.toString();
		return qs ? `${resolve('/posts')}?${qs}` : resolve('/posts');
	}

	async function applyFilters() {
		filterSheetOpen = false;
		const target = buildPostsUrl({
			housing: draftHousing,
			region: draftRegion,
			maxMonthly: draftMaxMonthly,
			mine: draftMine
		});
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		await goto(target);
	}

	async function toggleMine() {
		const target = buildPostsUrl({
			housing: data.filters.housing,
			region: data.filters.region,
			maxMonthly: data.filters.maxMonthly != null ? String(data.filters.maxMonthly) : '',
			mine: !data.filters.mine
		});
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		await goto(target);
	}

	function resetDraft() {
		draftHousing = 'all';
		draftRegion = '';
		draftMaxMonthly = '';
		draftMine = false;
	}
</script>

<Header title="모집글" />

<section class="posts-page">
	<div class="filter-bar" aria-label="모집글 필터">
		<button
			class="filter-icon-trigger"
			type="button"
			onclick={() => openFilterSheet('all')}
			aria-label="전체 필터 열기"
		>
			<TraitIcon name="sliders" size={19} strokeWidth={1.9} />
			{#if activeFilterCount > 0}
				<span class="filter-dot">{activeFilterCount}</span>
			{/if}
		</button>

		<button
			class="filter-pill"
			class:active={data.filters.housing !== 'all'}
			type="button"
			onclick={() => openFilterSheet('housing')}
		>
			<span>
				{data.filters.housing === 'all' ? '주거 유형' : HOUSING_TYPE_LABELS[data.filters.housing]}
			</span>
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

		<button class="filter-pill" class:active={data.filters.mine} type="button" onclick={toggleMine}>
			내 글
		</button>
	</div>

	{#if data.posts.length === 0}
		<div class="empty-state">
			<h2 class="serif-heading">조건에 맞는 모집글이 없어요</h2>
			<p>필터를 초기화하거나 직접 룸메이트 모집글을 작성해 보세요.</p>
			<div class="empty-actions">
				<a class="btn-pill full-width" href={resolve('/posts/new')}>모집글 작성하기</a>
				{#if activeFilterCount > 0}
					<a class="btn-pill-secondary full-width" href={resolve('/posts')}>필터 초기화</a>
				{/if}
			</div>
		</div>
	{:else}
		<div class="post-list">
			{#each data.posts as post (post.id)}
				<a class="post-row" href={resolve('/posts/[id]', { id: post.id })}>
					<div class="post-text">
						<h2 class="post-title">
							<span class="post-housing-prefix">{HOUSING_TYPE_LABELS[post.housingType]}</span>
							{post.title}
						</h2>
						<p class="post-excerpt">{post.content}</p>
					</div>

					<div class="author-row">
						<div class="author-left">
							<Avatar photoKey={post.author.firstPhotoKey} alt={post.author.nickname} size="xs" />
							<span class="author-name">{post.author.nickname}</span>
							<span class="author-sub">
								{formatAdmissionShort(post.author.admissionYear)} · {post.author.major}
							</span>
							{#if post.isAuthor}
								<span class="mine-tag">내 글</span>
							{/if}
						</div>

						<span class="post-meta-line">
							{post.recruitCount}명 모집 · {formatRelativeTime(post.createdAt)}
						</span>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</section>

<div class="compose-overlay">
	<a class="compose-fab" href={resolve('/posts/new')} aria-label="모집글 작성">
		<TraitIcon name="square-pen" size={22} strokeWidth={2} />
	</a>
</div>

{#snippet filterFooter()}
	<div class="sheet-footer-row">
		<button class="btn-pill-secondary" type="button" onclick={resetDraft}>초기화</button>
		<button class="btn-pill apply-btn" type="button" onclick={applyFilters}>필터 적용</button>
	</div>
{/snippet}

<BottomSheet
	bind:open={filterSheetOpen}
	title={FILTER_SHEET_TITLES[filterMode]}
	footer={filterMode === 'all' ? filterFooter : undefined}
>
	<div class="filter-sections">
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
							onclick={() => selectHousingOption(opt.value as PostHousingFilter)}
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
					<p class="filter-title">지역</p>
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
					{#each REGION_PRESETS as r (r)}
						<button
							type="button"
							class="opt-pill"
							class:selected={draftRegion === r}
							onclick={() => selectRegionOption(r)}
						>
							{r}
						</button>
					{/each}
				</div>
			</div>
		{/if}

		{#if filterMode === 'all'}
			<div class="filter-section">
				<p class="filter-title">월세 상한 (만원)</p>
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

			<div class="filter-section">
				<p class="filter-title">표시 옵션</p>
				<div class="pill-wrap">
					<button
						type="button"
						class="opt-pill"
						class:selected={draftMine}
						onclick={() => (draftMine = !draftMine)}
					>
						내가 쓴 글만 보기
					</button>
				</div>
			</div>
		{/if}
	</div>
</BottomSheet>

<style>
	.posts-page {
		display: flex;
		flex-direction: column;
		gap: var(--card-gap);
		padding: 4px var(--page-gutter) 96px;
	}

	.compose-overlay {
		position: fixed;
		z-index: 35;
		left: 50%;
		bottom: var(--nav-offset, 88px);
		transform: translateX(-50%);
		width: min(100%, var(--app-max-width));
		padding: 0 var(--page-gutter);
		display: flex;
		justify-content: flex-end;
		pointer-events: none;
		transition: bottom 180ms ease;
	}

	.compose-fab {
		pointer-events: auto;
		display: grid;
		place-items: center;
		width: 52px;
		height: 52px;
		border-radius: 50%;
		border: 1px solid rgba(255, 255, 255, 0.18);
		background: rgba(26, 26, 26, 0.92);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		color: #ffffff;
		box-shadow: var(--shadow-float);
		text-decoration: none;
		transition:
			transform 120ms ease,
			background-color 140ms ease;
	}

	.compose-fab:hover {
		background: var(--accent-plum);
	}

	.compose-fab:active {
		transform: scale(0.94);
	}

	.filter-bar {
		display: flex;
		align-items: center;
		gap: 8px;
		margin: 0 calc(var(--page-gutter) * -1);
		padding: 0 var(--page-gutter);
		overflow-x: auto;
		scrollbar-width: none;
	}

	.filter-bar::-webkit-scrollbar {
		display: none;
	}

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

	.post-list {
		display: flex;
		flex-direction: column;
		margin: 0 calc(var(--page-gutter) * -1);
	}

	.post-row {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 16px var(--page-gutter);
		text-decoration: none;
		border-bottom: 1px solid rgba(0, 0, 0, 0.08);
		transition: background-color 140ms ease;
	}

	.post-row:hover,
	.post-row:active {
		background: rgba(0, 0, 0, 0.035);
	}

	.post-text {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.post-title,
	.post-excerpt {
		margin: 0;
		font-size: 13.5px;
		line-height: 1.5;
		color: var(--text-primary);
	}

	.post-title {
		font-weight: 700;
	}

	.post-housing-prefix {
		color: var(--text-muted);
		margin-right: 4px;
	}

	.post-excerpt {
		font-weight: 400;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.author-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		padding-top: 2px;
	}

	.author-left {
		display: flex;
		align-items: center;
		gap: 6px;
		min-width: 0;
	}

	.author-name {
		flex: 0 0 auto;
		font-size: 13px;
		font-weight: 600;
		color: var(--text-primary);
		white-space: nowrap;
	}

	.author-sub,
	.post-meta-line {
		margin: 0;
		font-size: 12px;
		font-weight: 400;
		line-height: 1.35;
		color: var(--text-muted);
		white-space: nowrap;
	}

	.author-sub {
		overflow: hidden;
		text-overflow: ellipsis;
		min-width: 0;
	}

	.post-meta-line {
		flex: 0 0 auto;
	}

	.mine-tag {
		flex: 0 0 auto;
		padding: 2px 8px;
		border-radius: var(--radius-pill);
		background: var(--bg-chip);
		color: var(--text-secondary);
		font-size: 11px;
		font-weight: 600;
	}

	.empty-state {
		min-height: calc(100dvh - 280px);
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
		font-size: 20px;
	}

	.empty-state p {
		margin: 0;
		font-size: 14px;
		color: var(--text-secondary);
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

	/* Filter sheet */
	.filter-sections {
		display: flex;
		flex-direction: column;
		gap: 18px;
	}

	.filter-section {
		display: flex;
		flex-direction: column;
		gap: 9px;
	}

	.filter-title {
		margin: 0;
		font-size: 14px;
		font-weight: 700;
	}

	.pill-wrap {
		display: flex;
		flex-wrap: wrap;
		gap: 7px;
	}

	.opt-pill {
		height: 35px;
		padding: 0 14px;
		border-radius: var(--radius-pill);
		border: 1px solid var(--border-control);
		background: var(--bg-surface);
		color: var(--text-primary);
		font-size: 13.5px;
		font-weight: 500;
		cursor: pointer;
	}

	.opt-pill.selected {
		background: var(--bg-chip-active);
		border-color: var(--bg-chip-active);
		color: var(--text-inverse);
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

	.sheet-footer-row {
		display: flex;
		gap: 10px;
	}

	.apply-btn {
		flex: 1;
	}
</style>
