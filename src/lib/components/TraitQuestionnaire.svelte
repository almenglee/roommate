<script lang="ts">
	import { TRAIT_DEFINITIONS, type ProfileTraits, type TraitKey } from '#lib/domain/traits.js';
	import TraitIcon from '#lib/components/TraitIcon.svelte';

	let {
		traits = $bindable<ProfileTraits>(),
		variant = 'default'
	}: {
		traits: ProfileTraits;
		variant?: 'default' | 'onboarding' | 'flat';
	} = $props();

	function toggleTrait(key: TraitKey, value: string) {
		const current = traits[key];
		traits = {
			...traits,
			[key]: current === value ? null : value
		};
	}
</script>

<div
	class="traits-list"
	class:onboarding={variant === 'onboarding'}
	class:flat={variant === 'flat'}
>
	{#each TRAIT_DEFINITIONS as def (def.key)}
		<div class="trait-card">
			<input type="hidden" name={`trait_${def.key}`} value={traits[def.key] ?? ''} />

			<div class="trait-card__head">
				<span class="trait-card__icon">
					<TraitIcon name={def.icon} size={variant === 'flat' ? 16 : 18} strokeWidth={1.85} />
				</span>
				<p class="trait-card__question">{def.question}</p>
			</div>

			<div class="pill-wrap">
				{#each def.options as opt (opt.value)}
					<button
						type="button"
						class="trait-pill"
						class:selected={traits[def.key] === opt.value}
						onclick={() => toggleTrait(def.key, opt.value)}
					>
						{opt.label}
					</button>
				{/each}
			</div>
		</div>
	{/each}
</div>

<style>
	.traits-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.trait-card {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 18px 16px;
		border-radius: var(--radius-card);
		background: var(--bg-surface);
		border: 1px solid var(--border-card);
	}

	.onboarding .trait-card {
		border-radius: var(--radius-lg);
		background: var(--bg-surface);
		border: 1px solid var(--border-card);
	}

	.traits-list.flat {
		gap: 14px;
	}

	.flat .trait-card {
		gap: 8px;
		padding: 12px 0 0;
		border: 0;
		border-radius: 0;
		background: transparent;
		border-top: 1px solid var(--border-hairline);
	}

	.flat .trait-card:first-child {
		padding-top: 0;
		border-top: 0;
	}

	.flat .trait-card__head {
		gap: 6px;
	}

	.flat .trait-card__icon {
		color: var(--text-secondary);
	}

	.flat .trait-card__question {
		font-size: 13px;
		font-weight: 600;
		color: var(--text-secondary);
	}

	.flat .pill-wrap {
		flex-wrap: nowrap;
		gap: 7px;
		margin: 0 calc(var(--page-gutter) * -1);
		padding: 0 var(--page-gutter);
		overflow-x: auto;
		scrollbar-width: none;
		-webkit-overflow-scrolling: touch;
	}

	.flat .pill-wrap::-webkit-scrollbar {
		display: none;
	}

	.flat .trait-pill {
		flex: 0 0 auto;
		min-height: 32px;
		padding: 5px 12px;
		border-color: var(--border-control);
		background: var(--bg-surface);
		font-size: 12.5px;
		white-space: nowrap;
	}

	.flat .trait-pill.selected {
		background: var(--bg-chip-active);
		border-color: var(--bg-chip-active);
		color: var(--text-inverse);
	}

	.trait-card__head {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.trait-card__icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: var(--text-primary);
		flex: 0 0 auto;
	}

	.trait-card__question {
		margin: 0;
		font-size: 14.5px;
		font-weight: 600;
		line-height: 1.35;
		color: var(--text-primary);
	}

	.pill-wrap {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.trait-pill {
		min-height: 36px;
		padding: 6px 14px;
		border-radius: var(--radius-pill);
		border: 1px solid var(--border-card);
		background: rgba(255, 255, 255, 0.65);
		color: var(--text-primary);
		font-size: 13.5px;
		font-weight: 500;
		line-height: 1.3;
		cursor: pointer;
		text-align: left;
		transition:
			background-color 140ms ease,
			border-color 140ms ease,
			color 140ms ease;
	}

	.trait-pill:hover {
		border-color: var(--text-primary);
	}

	.trait-pill.selected {
		background: var(--bg-chip-active);
		border-color: var(--bg-chip-active);
		color: var(--text-inverse);
	}
</style>
