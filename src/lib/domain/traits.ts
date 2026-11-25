export const SLEEP_SCHEDULE_VALUES = ['early', 'regular', 'late', 'varies'] as const;
export const WAKE_UP_SCHEDULE_VALUES = [
	'very_early',
	'early',
	'regular',
	'late',
	'varies'
] as const;
export const CLEANLINESS_VALUES = ['very_tidy', 'tidy', 'relaxed', 'messy'] as const;
export const NOISE_TOLERANCE_VALUES = ['sensitive', 'normal', 'tolerant'] as const;
export const LIGHTS_OUT_VALUES = ['early', 'regular', 'late', 'no_preference'] as const;
export const SMOKING_VALUES = ['no', 'occasionally', 'often'] as const;
export const DRINKING_VALUES = ['no', 'occasionally', 'often', 'prefer_not_to_say'] as const;
export const ROOM_FOOD_VALUES = ['rarely', 'sometimes', 'often'] as const;
export const WEEKEND_ROUTINE_VALUES = ['mostly_out', 'mostly_in', 'mixed'] as const;
export const SNORING_VALUES = ['never', 'occasionally', 'often', 'unsure'] as const;
export const ROOM_CALL_FREQUENCY_VALUES = ['rarely', 'sometimes', 'often'] as const;

export type SleepSchedule = (typeof SLEEP_SCHEDULE_VALUES)[number];
export type WakeUpSchedule = (typeof WAKE_UP_SCHEDULE_VALUES)[number];
export type Cleanliness = (typeof CLEANLINESS_VALUES)[number];
export type NoiseTolerance = (typeof NOISE_TOLERANCE_VALUES)[number];
export type LightsOut = (typeof LIGHTS_OUT_VALUES)[number];
export type Smoking = (typeof SMOKING_VALUES)[number];
export type Drinking = (typeof DRINKING_VALUES)[number];
export type RoomFood = (typeof ROOM_FOOD_VALUES)[number];
export type WeekendRoutine = (typeof WEEKEND_ROUTINE_VALUES)[number];
export type Snoring = (typeof SNORING_VALUES)[number];
export type RoomCallFrequency = (typeof ROOM_CALL_FREQUENCY_VALUES)[number];

export interface ProfileTraits {
	sleep_schedule: SleepSchedule | null;
	wake_up_schedule: WakeUpSchedule | null;
	cleanliness: Cleanliness | null;
	noise_tolerance: NoiseTolerance | null;
	lights_out: LightsOut | null;
	smoking: Smoking | null;
	drinking: Drinking | null;
	room_food: RoomFood | null;
	weekend_routine: WeekendRoutine | null;
	snoring: Snoring | null;
	room_call_frequency: RoomCallFrequency | null;
}

export type TraitKey = keyof ProfileTraits;

export interface TraitOption {
	value: string;
	label: string;
	shortLabel: string;
}

export interface TraitDefinition {
	key: TraitKey;
	label: string;
	question: string;
	icon: string;
	options: readonly TraitOption[];
	/** Ordered values for distance-based compatibility scoring. */
	scale?: readonly string[];
}

export const TRAIT_DEFINITIONS: readonly TraitDefinition[] = [
	{
		key: 'sleep_schedule',
		label: '취침 시간',
		question: '보통 몇 시쯤 잠자리에 드나요?',
		icon: 'moon',
		options: [
			{ value: 'early', label: '밤 10시 전', shortLabel: '10시 전 취침' },
			{ value: 'regular', label: '자정 이전', shortLabel: '자정 전 취침' },
			{ value: 'late', label: '자정 이후', shortLabel: '자정 후 취침' },
			{ value: 'varies', label: '불규칙해요', shortLabel: '취침 불규칙' }
		],
		scale: ['early', 'regular', 'late']
	},
	{
		key: 'wake_up_schedule',
		label: '기상 시간',
		question: '보통 몇 시쯤 일어나나요?',
		icon: 'sun',
		options: [
			{ value: 'very_early', label: '오전 6시 전', shortLabel: '6시 전 기상' },
			{ value: 'early', label: '오전 6~8시', shortLabel: '6~8시 기상' },
			{ value: 'regular', label: '오전 8~10시', shortLabel: '8~10시 기상' },
			{ value: 'late', label: '오전 10시 이후', shortLabel: '10시 후 기상' },
			{ value: 'varies', label: '불규칙해요', shortLabel: '기상 불규칙' }
		],
		scale: ['very_early', 'early', 'regular', 'late']
	},
	{
		key: 'cleanliness',
		label: '정리·청결',
		question: '평소 방을 얼마나 자주 정리하나요?',
		icon: 'broom',
		options: [
			{ value: 'very_tidy', label: '거의 매일 정리해요', shortLabel: '매일 정리' },
			{ value: 'tidy', label: '일주일에 몇 번 정리해요', shortLabel: '주 몇 회 정리' },
			{ value: 'relaxed', label: '많이 어질러지면 정리해요', shortLabel: '필요할 때 정리' },
			{ value: 'messy', label: '정리를 자주 하지는 않아요', shortLabel: '자유로운 편' }
		],
		scale: ['very_tidy', 'tidy', 'relaxed', 'messy']
	},
	{
		key: 'noise_tolerance',
		label: '소음 민감도',
		question: '소음에 얼마나 민감한 편인가요?',
		icon: 'ear',
		options: [
			{ value: 'sensitive', label: '작은 소리에도 신경 쓰여요', shortLabel: '소음 민감' },
			{ value: 'normal', label: '보통이에요', shortLabel: '소음 보통' },
			{ value: 'tolerant', label: '어느 정도 소음은 괜찮아요', shortLabel: '소음 둔감' }
		],
		scale: ['sensitive', 'normal', 'tolerant']
	},
	{
		key: 'lights_out',
		label: '소등 시간',
		question: '잘 때 방 조명은 어떻게 하는 게 편한가요?',
		icon: 'lamp-off',
		options: [
			{ value: 'early', label: '일찍 불을 꺼요', shortLabel: '일찍 소등' },
			{ value: 'regular', label: '보통 시간에 꺼요', shortLabel: '보통 소등' },
			{ value: 'late', label: '늦게까지 켜도 괜찮아요', shortLabel: '늦게 소등' },
			{ value: 'no_preference', label: '상관없어요', shortLabel: '조명 무관' }
		],
		scale: ['early', 'regular', 'late']
	},
	{
		key: 'smoking',
		label: '흡연',
		question: '흡연 빈도는 어느 정도인가요?',
		icon: 'cigarette',
		options: [
			{ value: 'no', label: '비흡연', shortLabel: '비흡연' },
			{ value: 'occasionally', label: '가끔씩만 피워요', shortLabel: '가끔 흡연' },
			{ value: 'often', label: '자주 피워요', shortLabel: '흡연' }
		],
		scale: ['no', 'occasionally', 'often']
	},
	{
		key: 'drinking',
		label: '음주',
		question: '음주 빈도는 어느 정도인가요?',
		icon: 'wine',
		options: [
			{ value: 'no', label: '마시지 않아요', shortLabel: '비음주' },
			{ value: 'occasionally', label: '가끔 마셔요', shortLabel: '가끔 음주' },
			{ value: 'often', label: '자주 마셔요', shortLabel: '자주 음주' },
			{ value: 'prefer_not_to_say', label: '답변하고 싶지 않아요', shortLabel: '비공개' }
		],
		scale: ['no', 'occasionally', 'often']
	},
	{
		key: 'room_food',
		label: '방 안 취식',
		question: '방에서 음식을 먹는 편인가요?',
		icon: 'utensils',
		options: [
			{ value: 'rarely', label: '거의 먹지 않아요', shortLabel: '방 취식 안 함' },
			{ value: 'sometimes', label: '가끔 먹어요', shortLabel: '가끔 방 취식' },
			{ value: 'often', label: '자주 먹어요', shortLabel: '자주 방 취식' }
		],
		scale: ['rarely', 'sometimes', 'often']
	},
	{
		key: 'weekend_routine',
		label: '주말 루틴',
		question: '주말에는 주로 어떻게 보내나요?',
		icon: 'calendar',
		options: [
			{ value: 'mostly_out', label: '주로 외출해요', shortLabel: '주말 주로 외출' },
			{ value: 'mixed', label: '반반이에요', shortLabel: '주말 반반' },
			{ value: 'mostly_in', label: '주로 방에서 보내요', shortLabel: '주말 주로 방콕' }
		],
		scale: ['mostly_out', 'mixed', 'mostly_in']
	},
	{
		key: 'snoring',
		label: '코골이',
		question: '잠잘 때 코를 고는 편인가요?',
		icon: 'sleep-zzz',
		options: [
			{ value: 'never', label: '안 골아요', shortLabel: '코골이 없음' },
			{ value: 'occasionally', label: '가끔 골아요', shortLabel: '가끔 코골이' },
			{ value: 'often', label: '자주 골아요', shortLabel: '코골이 있음' },
			{ value: 'unsure', label: '잘 모르겠어요', shortLabel: '코골이 모름' }
		],
		scale: ['never', 'occasionally', 'often']
	},
	{
		key: 'room_call_frequency',
		label: '방 안 통화',
		question: '방에서 통화를 자주 하는 편인가요?',
		icon: 'phone',
		options: [
			{ value: 'rarely', label: '거의 안 해요', shortLabel: '통화 거의 안 함' },
			{ value: 'sometimes', label: '가끔 해요', shortLabel: '가끔 통화' },
			{ value: 'often', label: '자주 해요', shortLabel: '자주 통화' }
		],
		scale: ['rarely', 'sometimes', 'often']
	}
] as const;

export const TRAIT_KEYS: readonly TraitKey[] = TRAIT_DEFINITIONS.map((t) => t.key);

export const TRAIT_MAP: Record<TraitKey, TraitDefinition> = Object.fromEntries(
	TRAIT_DEFINITIONS.map((def) => [def.key, def])
) as Record<TraitKey, TraitDefinition>;

export function getTraitOption(
	key: TraitKey,
	value: string | null | undefined
): TraitOption | null {
	if (!value) return null;
	return TRAIT_MAP[key].options.find((opt) => opt.value === value) ?? null;
}

export function isValidTraitValue(key: TraitKey, value: string): boolean {
	return TRAIT_MAP[key].options.some((opt) => opt.value === value);
}

export function createEmptyTraits(): ProfileTraits {
	return {
		sleep_schedule: null,
		wake_up_schedule: null,
		cleanliness: null,
		noise_tolerance: null,
		lights_out: null,
		smoking: null,
		drinking: null,
		room_food: null,
		weekend_routine: null,
		snoring: null,
		room_call_frequency: null
	};
}

export interface TraitCompatibilityResult {
	score: number | null;
	comparedCount: number;
	matchedKeys: TraitKey[];
}

const EXCLUDED_VALUES = new Set(['prefer_not_to_say', 'unsure']);

export function calculateTraitCompatibility(
	a: Partial<ProfileTraits> | null | undefined,
	b: Partial<ProfileTraits> | null | undefined
): TraitCompatibilityResult {
	if (!a || !b) {
		return { score: null, comparedCount: 0, matchedKeys: [] };
	}

	let total = 0;
	let comparedCount = 0;
	const matchedKeys: TraitKey[] = [];

	for (const def of TRAIT_DEFINITIONS) {
		const va = a[def.key];
		const vb = b[def.key];

		if (!va || !vb || EXCLUDED_VALUES.has(va) || EXCLUDED_VALUES.has(vb)) {
			continue;
		}

		comparedCount += 1;

		if (va === vb) {
			total += 1;
			matchedKeys.push(def.key);
			continue;
		}

		if (va === 'no_preference' || vb === 'no_preference') {
			total += 0.9;
			matchedKeys.push(def.key);
			continue;
		}

		if (va === 'varies' || vb === 'varies') {
			total += 0.5;
			continue;
		}

		if (def.scale) {
			const idxA = def.scale.indexOf(va);
			const idxB = def.scale.indexOf(vb);
			if (idxA !== -1 && idxB !== -1) {
				const diff = Math.abs(idxA - idxB);
				if (diff === 1) {
					total += 0.5;
				}
			}
		}
	}

	if (comparedCount === 0) {
		return { score: null, comparedCount: 0, matchedKeys: [] };
	}

	return {
		score: Math.round((total / comparedCount) * 100),
		comparedCount,
		matchedKeys
	};
}
