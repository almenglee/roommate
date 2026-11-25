<script lang="ts">
	export type IconName =
		| 'moon'
		| 'sun'
		| 'broom'
		| 'ear'
		| 'lamp-off'
		| 'sparkles'
		| 'volume'
		| 'lamp'
		| 'cigarette'
		| 'wine'
		| 'utensils'
		| 'calendar'
		| 'bed'
		| 'sleep-zzz'
		| 'phone'
		| 'cake'
		| 'user'
		| 'school'
		| 'book'
		| 'home'
		| 'map-pin'
		| 'wallet'
		| 'clock'
		| 'heart'
		| 'sliders'
		| 'x'
		| 'check'
		| 'chevron-left'
		| 'chevron-down'
		| 'more'
		| 'plus'
		| 'square-pen'
		| 'send'
		| 'chat'
		| 'spark-match';

	let {
		name,
		size = 20,
		strokeWidth = 1.85,
		filled = false
	}: {
		name: string;
		size?: number;
		strokeWidth?: number;
		filled?: boolean;
	} = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill={filled ? 'currentColor' : 'none'}
	stroke="currentColor"
	stroke-width={strokeWidth}
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	{#if name === 'moon'}
		<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
	{:else if name === 'sun'}
		<circle cx="12" cy="12" r="4" />
		<path
			d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
		/>
	{:else if name === 'broom'}
		<path d="M12 3v6" />
		<path d="M7 9h10a1 1 0 0 1 1 1v2H6v-2a1 1 0 0 1 1-1Z" />
		<path d="M6 12 3.5 21h17L18 12" />
		<path d="M8.5 21 9 17M12 21v-4.5M15.5 21l-.5-4" />
	{:else if name === 'ear'}
		<path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 1 1-7 0" />
		<path d="M15 8.5a2.5 2.5 0 0 0-5 0v1a2 2 0 1 1 0 4" />
	{:else if name === 'lamp-off'}
		<path d="M16.8 11.2c.8-.9 1.2-2 1.2-3.2a6 6 0 0 0-9.3-5" />
		<path d="m2 2 20 20" />
		<path d="M6.3 6.3a4.67 4.67 0 0 0 1.2 5.2c.7.7 1.3 1.5 1.5 2.5" />
		<path d="M9 18h6M10 22h4" />
	{:else if name === 'sparkles' || name === 'spark-match'}
		<path
			d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3ZM19 16l.9 2.1L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9L19 16Z"
		/>
	{:else if name === 'volume'}
		<path d="M11 5 6 9H2v6h4l5 4V5Z" />
		<path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9.5 9.5 0 0 1 0 14" />
	{:else if name === 'lamp'}
		<path
			d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V16a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-1.3A7 7 0 0 0 12 2Z"
		/>
	{:else if name === 'cigarette'}
		<path d="M2 16h16v4H2zM22 16v4M18 12c0-2-2-2-2-4s2-2 2-4M22 12c0-2-2-2-2-4" />
	{:else if name === 'wine'}
		<path d="M8 22h8M12 15v7M7 2h10l-1 7a4 4 0 0 1-8 0L7 2Z" />
	{:else if name === 'utensils'}
		<path d="M4 3v7a3 3 0 0 0 6 0V3M7 3v18M17 3v18M17 3c2.5 0 4 2 4 5s-1.5 5-4 5" />
	{:else if name === 'calendar'}
		<rect x="3" y="4" width="18" height="18" rx="2" />
		<path d="M16 2v4M8 2v4M3 10h18" />
	{:else if name === 'sleep-zzz'}
		<path d="M13.3 4.3A9 9 0 1 0 19.9 11.4" />
		<path d="M7.2 12c.7.9 2.1.9 2.8 0M12 12c.7.9 2.1.9 2.8 0" />
		<circle cx="11" cy="16.8" r="1.4" />
		<path d="M16.5 2.5h5L16.5 8.5h5" />
	{:else if name === 'bed'}
		<path d="M2 8v10M2 14h20v4M22 18v-5a3 3 0 0 0-3-3h-7v4M7 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
	{:else if name === 'phone'}
		<path
			d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.8a16 16 0 0 0 6.1 6.1l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"
		/>
	{:else if name === 'cake'}
		<path
			d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1M2 21h20M7 8v3M12 8v3M17 8v3M7 4h.01M12 4h.01M17 4h.01"
		/>
	{:else if name === 'user'}
		<circle cx="12" cy="8" r="4" />
		<path d="M4 21v-2a7 7 0 0 1 14 0v2" />
	{:else if name === 'school'}
		<path d="m2 10 10-5 10 5-10 5-10-5Z" />
		<path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5M22 10v6" />
	{:else if name === 'book'}
		<path
			d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15Z"
		/>
	{:else if name === 'home'}
		<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z" />
	{:else if name === 'map-pin'}
		<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
		<circle cx="12" cy="10" r="3" />
	{:else if name === 'wallet'}
		<path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
		<path d="M16 12h5" />
	{:else if name === 'clock'}
		<circle cx="12" cy="12" r="9" />
		<path d="M12 7v5l3 2" />
	{:else if name === 'heart'}
		<path
			d="M20.8 8.8c0 5.2-8.8 11-8.8 11s-8.8-5.8-8.8-11a4.6 4.6 0 0 1 8.8-1.9 4.6 4.6 0 0 1 8.8 1.9Z"
		/>
	{:else if name === 'sliders'}
		<path d="M4 6h16M4 12h16M4 18h16" />
		<circle cx="8" cy="6" r="2" fill="var(--bg-app, #fffdfe)" />
		<circle cx="16" cy="12" r="2" fill="var(--bg-app, #fffdfe)" />
		<circle cx="10" cy="18" r="2" fill="var(--bg-app, #fffdfe)" />
	{:else if name === 'x'}
		<path d="M18 6 6 18M6 6l12 12" />
	{:else if name === 'check'}
		<path d="m5 12 5 5L20 7" />
	{:else if name === 'chevron-left'}
		<path d="m15 18-6-6 6-6" />
	{:else if name === 'chevron-down'}
		<path d="m6 9 6 6 6-6" />
	{:else if name === 'more'}
		<circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" />
		<circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
		<circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none" />
	{:else if name === 'plus'}
		<path d="M12 5v14M5 12h14" />
	{:else if name === 'square-pen'}
		<path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
		<path
			d="M18.375 2.625a2.121 2.121 0 1 1 3 3L12.362 14.64a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852l9.013-9.015Z"
		/>
	{:else if name === 'send'}
		<path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />
	{:else if name === 'chat'}
		<path
			d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"
		/>
	{:else}
		<circle cx="12" cy="12" r="4" />
	{/if}
</svg>
