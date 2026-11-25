<script lang="ts">
	import Header from '#lib/components/Header.svelte';
	import ProfileCard from '#lib/components/ProfileCard.svelte';
	import type { ProfileViewData } from '#lib/domain/profile.js';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const demoProfile: ProfileViewData = {
		user: {
			id: 'preview',
			nickname: '테스트 유저',
			sex: 'female',
			birthYear: 2004,
			admissionYear: 2023,
			school: '건국대 글로컬캠퍼스',
			major: '컴퓨터과학과',
			housingType: 'both',
			preferredRegion: '단월동·학교 앞',
			budgetDeposit: 1000,
			budgetMonthly: 55
		},
		photos: [],
		traits: {
			sleep_schedule: 'regular',
			wake_up_schedule: 'early',
			cleanliness: 'very_tidy',
			noise_tolerance: 'sensitive',
			lights_out: 'regular',
			smoking: 'no',
			drinking: 'occasionally',
			room_food: 'rarely',
			weekend_routine: 'mixed',
			snoring: 'never',
			room_call_frequency: 'rarely'
		},
		compatibility: {
			score: 88,
			comparedCount: 11,
			matchedKeys: ['sleep_schedule', 'smoking', 'cleanliness']
		}
	};
</script>

<Header
	title={data.title}
	compactTitle={demoProfile.user.nickname}
	hideLargeTitle
	revealOffset={48}
/>

<div class="preview-wrap">
	<ProfileCard profile={demoProfile} />
</div>

<style>
	.preview-wrap {
		padding: 16px var(--page-gutter);
	}
</style>
