<script lang="ts">
	import { resolve } from '$app/paths';
	import Header from '#lib/components/Header.svelte';
	import ProfileCard from '#lib/components/ProfileCard.svelte';
	import { HOUSING_TYPE_LABELS } from '#lib/domain/constants.js';
	import { formatAdmissionShort } from '#lib/domain/profile.js';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const featured = $derived(data.received[0] ?? null);
	const upNext = $derived(data.received.slice(1));
</script>

<Header title="관심" />

<section class="likes-page">
	{#if !featured}
		<div class="empty-state">
			<h2 class="serif-heading">아직 받은 관심이 없어요</h2>
			<p>탐색이나 모집글에서 먼저 관심을 보내보세요.</p>
			<a class="btn-pill empty-cta" href={resolve('/discover')}>룸메이트 탐색하기</a>
		</div>
	{:else}
		<a
			class="surface-card featured-card"
			href={resolve('/likes/[id]', { id: featured.id })}
			aria-label={`${featured.profile.user.nickname}님의 관심 상세 보기`}
		>
			<div class="speech-wrap">
				<span class="speech-bubble" class:italic={!featured.message}>
					{#if featured.message}
						{featured.message}
					{:else if featured.post}
						모집글에 관심을 보냈어요
					{:else}
						프로필에 관심을 보냈어요
					{/if}
				</span>
			</div>

			<div class="featured-head">
				<h2 class="featured-name">{featured.profile.user.nickname}</h2>
				<p class="featured-sub">
					{formatAdmissionShort(featured.profile.user.admissionYear)} · {featured.profile.user
						.major}
				</p>
			</div>

			{#if featured.firstPhotoKey}
				<div class="hero-photo">
					<img
						src={`/api/uploads/${encodeURIComponent(featured.firstPhotoKey)}`}
						alt={`${featured.profile.user.nickname}님의 프로필 사진`}
					/>
				</div>
			{:else}
				<div class="no-photo-preview">
					<ProfileCard
						profile={featured.profile}
						compact
						showHeader={false}
						prioritizeMatched={true}
					/>
				</div>
			{/if}
		</a>

		{#if upNext.length > 0}
			<div class="up-next-section">
				<h3 class="up-next-title">다음 관심</h3>
				<div class="up-next-grid">
					{#each upNext as item (item.id)}
						<a
							class="surface-card mini-card"
							href={resolve('/likes/[id]', { id: item.id })}
							aria-label={`${item.profile.user.nickname}님의 관심 상세 보기`}
						>
							<div class="mini-head">
								<span class="mini-name">{item.profile.user.nickname}</span>
								<span class="mini-sub">
									{formatAdmissionShort(item.profile.user.admissionYear)} · {item.profile.user
										.major}
								</span>
							</div>
							{#if item.firstPhotoKey}
								<div class="mini-photo">
									<img
										src={`/api/uploads/${encodeURIComponent(item.firstPhotoKey)}`}
										alt={`${item.profile.user.nickname}님의 프로필 사진`}
									/>
								</div>
							{:else}
								<div class="mini-fallback">
									<span>{item.profile.user.major}</span>
									<span>{HOUSING_TYPE_LABELS[item.profile.user.housingType]}</span>
								</div>
							{/if}
						</a>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</section>

<style>
	.likes-page {
		display: flex;
		flex-direction: column;
		gap: 22px;
		padding: 6px var(--page-gutter) 24px;
	}

	.featured-card {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		width: 100%;
		padding: 16px;
		border-radius: 16px;
		text-align: left;
		text-decoration: none;
		color: inherit;
		cursor: pointer;
		transition: transform 120ms ease;
	}

	.featured-card:active {
		transform: scale(0.99);
	}

	.speech-wrap {
		display: flex;
		align-items: flex-start;
		margin-bottom: 10px;
	}

	.speech-bubble {
		position: relative;
		display: inline-block;
		max-width: 100%;
		margin: 0;
		padding: 9px 14px;
		border-radius: 12px 12px 12px 3px;
		background: var(--bg-chip);
		color: var(--text-primary);
		font-size: 14px;
		font-weight: 500;
		line-height: 1.45;
		word-break: keep-all;
	}

	.speech-bubble::after {
		content: '';
		position: absolute;
		left: 0;
		bottom: -5px;
		width: 10px;
		height: 7px;
		background: var(--bg-chip);
		clip-path: polygon(0 0, 100% 0, 0 100%);
	}

	.speech-bubble.italic {
		font-style: italic;
		font-weight: 400;
		color: var(--text-secondary);
	}

	.featured-head {
		display: flex;
		flex-direction: column;
		gap: 2px;
		margin: 4px 0 12px;
	}

	.featured-name {
		margin: 0;
		font-size: 22px;
		font-weight: 700;
		line-height: 1.25;
		letter-spacing: -0.025em;
		color: var(--text-primary);
	}

	.featured-sub {
		margin: 0;
		font-size: 13px;
		font-weight: 500;
		line-height: 1.35;
		color: var(--text-secondary);
	}

	.hero-photo {
		width: 100%;
		aspect-ratio: 1 / 1;
		border-radius: 12px;
		overflow: hidden;
		background: var(--bg-surface-soft);
	}

	.hero-photo img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.no-photo-preview {
		pointer-events: none;
	}

	.up-next-section {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.up-next-title {
		margin: 0;
		padding: 0 2px;
		font-size: 17px;
		font-weight: 700;
		letter-spacing: -0.02em;
		color: var(--text-primary);
	}

	.up-next-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}

	.mini-card {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 12px;
		border-radius: 14px;
		text-align: left;
		text-decoration: none;
		color: inherit;
		cursor: pointer;
		transition: transform 120ms ease;
	}

	.mini-card:active {
		transform: scale(0.98);
	}

	.mini-head {
		display: flex;
		flex-direction: column;
		gap: 1px;
		min-width: 0;
	}

	.mini-name {
		font-size: 16px;
		font-weight: 700;
		letter-spacing: -0.02em;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.mini-sub {
		font-size: 12px;
		font-weight: 500;
		line-height: 1.3;
		color: var(--text-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.mini-photo {
		width: 100%;
		aspect-ratio: 1 / 1;
		border-radius: 10px;
		overflow: hidden;
		background: var(--bg-surface-soft);
	}

	.mini-photo img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.mini-fallback {
		width: 100%;
		aspect-ratio: 1 / 1;
		border-radius: 10px;
		padding: 12px;
		background: var(--bg-surface-soft);
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 4px;
		text-align: center;
		font-size: 12.5px;
		font-weight: 500;
		color: var(--text-secondary);
	}

	.empty-state {
		min-height: calc(100dvh - 240px);
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

	.empty-cta {
		margin-top: 10px;
		padding: 0 28px;
	}
</style>
