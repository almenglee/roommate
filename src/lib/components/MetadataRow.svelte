<script lang="ts">
	import TraitIcon from '#lib/components/TraitIcon.svelte';

	export interface MetadataItem {
		icon: string;
		label: string;
		highlight?: boolean;
	}

	let {
		items = []
	}: {
		items: MetadataItem[];
	} = $props();
</script>

<div class="metadata-row" aria-label="기본 프로필 요약">
	{#each items as item, index (index)}
		{#if index > 0}
			<span class="divider" aria-hidden="true"></span>
		{/if}

		<div class="item" class:highlight={item.highlight}>
			<span class="icon">
				<TraitIcon name={item.icon} size={18} strokeWidth={1.8} />
			</span>
			<span class="label">{item.label}</span>
		</div>
	{/each}
</div>

<style>
	.metadata-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		width: 100%;
		min-width: 0;
		height: 52px;
		padding: 0 2px;
		overflow-x: auto;
		scrollbar-width: none;
	}

	.metadata-row::-webkit-scrollbar {
		display: none;
	}

	.item {
		display: flex;
		flex: 0 0 auto;
		flex-direction: row;
		align-items: center;
		gap: 8px;
		height: 100%;
		color: var(--text-primary);
	}

	.item.highlight {
		color: var(--accent-plum);
	}

	.icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: 0 0 auto;
	}

	.label {
		font-size: 15px;
		font-weight: 500;
		line-height: 20px;
		letter-spacing: -0.01em;
		white-space: nowrap;
	}

	.divider {
		flex: 0 0 1px;
		width: 1px;
		height: 24px;
		margin: 0 14px;
		background: var(--border-hairline);
	}
</style>
