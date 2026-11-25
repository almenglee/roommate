<script lang="ts">
	import { HOUSING_TYPE_LABELS, SEX_LABELS } from '#lib/domain/constants.js';
	import {
		formatAdmissionShort,
		formatKoreanAge,
		type ProfileViewData
	} from '#lib/domain/profile.js';
	import { getTraitOption, TRAIT_DEFINITIONS, type TraitKey } from '#lib/domain/traits.js';
	import MetadataRow, { type MetadataItem } from '#lib/components/MetadataRow.svelte';
	import TraitIcon from '#lib/components/TraitIcon.svelte';

	let {
		profile,
		compact = false,
		showHeader = true,
		priorityTraitKeys = [],
		prioritizeMatched = false,
		onLike = undefined,
		likeDisabled = false
	}: {
		profile: ProfileViewData;
		compact?: boolean;
		showHeader?: boolean;
		priorityTraitKeys?: TraitKey[];
		prioritizeMatched?: boolean;
		onLike?: () => void;
		likeDisabled?: boolean;
	} = $props();

	const matchedSet = $derived(new Set(profile.compatibility?.matchedKeys ?? []));
	const prioritySet = $derived(new Set(priorityTraitKeys));

	const metadataItems = $derived.by((): MetadataItem[] => [
		{ icon: 'cake', label: formatKoreanAge(profile.user.birthYear) },
		{ icon: 'user', label: SEX_LABELS[profile.user.sex] },
		{ icon: 'book', label: profile.user.major },
		{ icon: 'school', label: formatAdmissionShort(profile.user.admissionYear) },
		{ icon: 'home', label: HOUSING_TYPE_LABELS[profile.user.housingType] }
	]);

	const traitRows = $derived.by(() => {
		const rows = TRAIT_DEFINITIONS.map((def, order) => {
			const val = profile.traits[def.key];
			const option = getTraitOption(def.key, val);
			if (!option) return null;
			const filtered = prioritySet.has(def.key);
			const matched = matchedSet.has(def.key);
			return {
				key: def.key,
				order,
				icon: def.icon,
				label: def.label,
				answer: option.label,
				shortLabel: option.shortLabel,
				filtered,
				matched,
				highlighted: filtered || matched
			};
		}).filter((row): row is NonNullable<typeof row> => row !== null);

		if (prioritySet.size > 0 || prioritizeMatched) {
			rows.sort((a, b) => {
				const rankA = a.filtered ? 0 : a.matched ? 1 : 2;
				const rankB = b.filtered ? 0 : b.matched ? 1 : 2;
				if (rankA !== rankB) return rankA - rankB;
				return a.order - b.order;
			});
		}

		return rows;
	});

	const sortedPhotos = $derived(
		[...profile.photos].sort((a, b) => a.displayOrder - b.displayOrder)
	);
	const firstPhoto = $derived(sortedPhotos[0] ?? null);
	const remainingPhotos = $derived(sortedPhotos.slice(1));
</script>

<article class="profile-stack" class:compact>
	{#if showHeader}
		<div class="profile-heading">
			<div class="name-row">
				<h2 class="profile-heading__name">{profile.user.nickname}</h2>
			</div>
			<p class="profile-heading__sub">
				{formatAdmissionShort(profile.user.admissionYear)} · {profile.user.major}
			</p>
		</div>
	{/if}

	{#if !compact && firstPhoto}
		<div class="photo-card surface-card">
			<img
				src={`/api/uploads/${encodeURIComponent(firstPhoto.storageKey)}`}
				alt={`${profile.user.nickname} 프로필 사진 1`}
			/>
			{#if onLike}
				<button
					class="heart-fab"
					type="button"
					onclick={onLike}
					disabled={likeDisabled}
					aria-label={`${profile.user.nickname}님에게 관심 보내기`}
				>
					<TraitIcon name="heart" size={22} strokeWidth={2} />
				</button>
			{/if}
		</div>
	{/if}

	<!-- Unified Vitals & Lifestyle Traits Card -->
	<section class="info-card surface-card" aria-label="프로필 정보">
		<div class="meta-wrap" class:has-rows={traitRows.length > 0}>
			<MetadataRow items={metadataItems} />
		</div>

		{#if traitRows.length > 0}
			<div class="trait-chips">
				{#each traitRows as trait (trait.key)}
					<span
						class="trait-chip"
						class:matched={trait.highlighted}
						title={`${trait.label}: ${trait.answer}`}
					>
						<TraitIcon name={trait.icon} size={14} strokeWidth={1.9} />
						<span>{trait.shortLabel}</span>
					</span>
				{/each}
			</div>
		{/if}
	</section>

	{#if !compact && remainingPhotos.length > 0}
		{#each remainingPhotos as photo, idx (photo.id)}
			<div class="photo-card surface-card">
				<img
					src={`/api/uploads/${encodeURIComponent(photo.storageKey)}`}
					alt={`${profile.user.nickname} 프로필 사진 ${idx + 2}`}
				/>
				{#if onLike}
					<button
						class="heart-fab"
						type="button"
						onclick={onLike}
						disabled={likeDisabled}
						aria-label={`${profile.user.nickname}님에게 관심 보내기`}
					>
						<TraitIcon name="heart" size={22} strokeWidth={2} />
					</button>
				{/if}
			</div>
		{/each}
	{/if}
</article>

<style>
	.profile-stack {
		display: flex;
		flex-direction: column;
		gap: var(--card-gap);
		width: 100%;
	}

	.profile-heading {
		display: flex;
		flex-direction: column;
		gap: 3px;
		padding: 4px 2px 0;
	}

	.name-row {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.profile-heading__name {
		margin: 0;
		font-size: 26px;
		font-weight: 700;
		line-height: 1.2;
		letter-spacing: -0.025em;
		color: var(--text-primary);
	}

	.profile-heading__sub {
		margin: 0;
		font-size: 13.5px;
		font-weight: 500;
		line-height: 1.35;
		color: var(--text-secondary);
	}

	.photo-card {
		position: relative;
		width: 100%;
		aspect-ratio: 1 / 1;
		overflow: hidden;
	}

	.photo-card img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.info-card {
		display: flex;
		flex-direction: column;
		width: 100%;
		padding: 0 16px;
		overflow: hidden;
	}

	.meta-wrap.has-rows {
		border-bottom: 1px solid var(--border-hairline);
	}

	.trait-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		padding: 14px 0 16px;
	}

	.trait-chip {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		min-height: 36px;
		padding: 6px 13px;
		border-radius: var(--radius-pill);
		border: 1px solid var(--border-card);
		background: var(--bg-surface);
		color: var(--text-primary);
		font-size: 13.5px;
		font-weight: 500;
		line-height: 1.3;
	}

	.trait-chip.matched {
		background: var(--bg-chip-active);
		border-color: var(--bg-chip-active);
		color: var(--text-inverse);
	}

	.heart-fab {
		position: absolute;
		right: 14px;
		bottom: 14px;
		display: grid;
		place-items: center;
		width: 46px;
		height: 46px;
		padding: 0;
		border: 1px solid rgba(255, 255, 255, 0.25);
		border-radius: 50%;
		background: rgba(24, 24, 24, 0.88);
		color: #ffffff;
		box-shadow: var(--shadow-float);
		cursor: pointer;
		transition:
			transform 130ms ease,
			background-color 150ms ease;
	}

	.heart-fab:hover {
		background: var(--accent-plum);
	}

	.heart-fab:active {
		transform: scale(0.93);
	}

	.heart-fab:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
</style>
