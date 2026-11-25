export const SEX_VALUES = ['male', 'female'] as const;
export type Sex = (typeof SEX_VALUES)[number];

export const SEX_LABELS: Record<Sex, string> = {
	male: '남성',
	female: '여성'
};

export const USER_HOUSING_TYPES = ['dorm', 'off_campus', 'both'] as const;
export type UserHousingType = (typeof USER_HOUSING_TYPES)[number];

export const POST_HOUSING_TYPES = ['dorm', 'off_campus'] as const;
export type PostHousingType = (typeof POST_HOUSING_TYPES)[number];

export const HOUSING_TYPE_LABELS: Record<UserHousingType, string> = {
	dorm: '기숙사',
	off_campus: '자취·쉐어',
	both: '기숙사·자취 모두'
};

export const POST_STATUS_VALUES = ['open', 'closed'] as const;
export type PostStatus = (typeof POST_STATUS_VALUES)[number];

export const POST_STATUS_LABELS: Record<PostStatus, string> = {
	open: '모집중',
	closed: '모집완료'
};

export const LIKE_STATUS_VALUES = ['pending', 'accepted', 'rejected'] as const;
export type LikeStatus = (typeof LIKE_STATUS_VALUES)[number];

export const DEFAULT_SCHOOL = '건국대 글로컬캠퍼스' as const;

export const SCHOOL_PRESETS = [
	DEFAULT_SCHOOL,
	'서울대학교',
	'연세대학교',
	'고려대학교',
	'성균관대학교',
	'한양대학교',
	'서강대학교',
	'중앙대학교',
	'경희대학교',
	'한국외국어대학교',
	'서울시립대학교',
	'이화여자대학교',
	'숙명여자대학교',
	'건국대학교',
	'동국대학교',
	'홍익대학교',
	'KAIST',
	'POSTECH',
	'부산대학교',
	'경북대학교',
	'전남대학교'
] as const;

export const REGION_PRESETS = [
	'단월동·학교 앞',
	'건국대 정문·후문',
	'연수동',
	'호암동·직동',
	'충주역·봉방동',
	'칠금동·금릉동',
	'교현동·성서동',
	'기타 지역'
] as const;

export const MAX_PROFILE_PHOTOS = 6;
