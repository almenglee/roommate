import fs from 'node:fs';
import path from 'node:path';
import { and, eq, like, notInArray, sql } from 'drizzle-orm';
import {
	DEFAULT_SCHOOL,
	REGION_PRESETS,
	type PostHousingType,
	type PostStatus,
	type Sex,
	type UserHousingType
} from '#lib/domain/constants.js';
import type { ProfileTraits } from '#lib/domain/traits.js';
import { db, UPLOADS_DIR } from '#lib/server/db/index.js';
import {
	likes,
	matches,
	messages,
	posts,
	profilePhotos,
	profileTraits,
	users
} from '#lib/server/db/schema.js';
import { hashPassword } from '#lib/server/password.js';

const SEED_PHOTOS_DIR = path.resolve(process.cwd(), 'src/lib/server/db/seed-photos');

interface SeedUserSpec {
	id: string;
	email: string;
	nickname: string;
	sex: Sex;
	birthYear: number;
	admissionYear: number;
	school: string;
	major: string;
	housingType: UserHousingType;
	preferredRegion: string | null;
	budgetDeposit: number | null;
	budgetMonthly: number | null;
	traits: ProfileTraits;
	photos: string[];
}

interface SeedPostSpec {
	id: string;
	authorId: string;
	housingType: PostHousingType;
	school: string | null;
	region: string | null;
	budgetDeposit: number | null;
	budgetMonthly: number | null;
	title: string;
	content: string;
	status: PostStatus;
	hoursAgo: number;
}

function copySeedPhotoToUploads(fileName: string): void {
	const srcPath = path.join(SEED_PHOTOS_DIR, fileName);
	const destPath = path.join(UPLOADS_DIR, fileName);
	if (fs.existsSync(srcPath)) {
		fs.copyFileSync(srcPath, destPath);
	}
}

const SEED_USERS: SeedUserSpec[] = [
	// --- Female users (7) ---
	{
		id: 'seed-user-f1',
		email: 'minji@demo.kr',
		nickname: '민지',
		sex: 'female',
		birthYear: 2004,
		admissionYear: 2023,
		school: DEFAULT_SCHOOL,
		major: '컴퓨터과학과',
		housingType: 'both',
		preferredRegion: '단월동·학교 앞',
		budgetDeposit: 300,
		budgetMonthly: 32,
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
		photos: ['seed-user-f1-1.jpg', 'seed-user-f1-2.jpg']
	},
	{
		id: 'seed-user-f2',
		email: 'seoyeon@demo.kr',
		nickname: '서연',
		sex: 'female',
		birthYear: 2003,
		admissionYear: 2022,
		school: DEFAULT_SCHOOL,
		major: '심리학과',
		housingType: 'dorm',
		preferredRegion: '단월동·학교 앞',
		budgetDeposit: null,
		budgetMonthly: null,
		traits: {
			sleep_schedule: 'regular',
			wake_up_schedule: 'early',
			cleanliness: 'tidy',
			noise_tolerance: 'normal',
			lights_out: 'regular',
			smoking: 'no',
			drinking: 'occasionally',
			room_food: 'sometimes',
			weekend_routine: 'mostly_out',
			snoring: 'never',
			room_call_frequency: 'rarely'
		},
		photos: ['seed-user-f2-1.jpg', 'seed-user-f2-2.jpg', 'seed-user-f2-3.jpg']
	},
	{
		id: 'seed-user-f3',
		email: 'jiwoo@demo.kr',
		nickname: '지우',
		sex: 'female',
		birthYear: 2005,
		admissionYear: 2024,
		school: DEFAULT_SCHOOL,
		major: '경영학과',
		housingType: 'off_campus',
		preferredRegion: '연수동',
		budgetDeposit: 500,
		budgetMonthly: 35,
		traits: {
			sleep_schedule: 'late',
			wake_up_schedule: 'regular',
			cleanliness: 'tidy',
			noise_tolerance: 'tolerant',
			lights_out: 'late',
			smoking: 'no',
			drinking: 'often',
			room_food: 'sometimes',
			weekend_routine: 'mostly_out',
			snoring: 'unsure',
			room_call_frequency: 'sometimes'
		},
		photos: ['seed-user-f3-1.jpg', 'seed-user-f3-2.jpg', 'seed-user-f3-3.jpg']
	},
	{
		id: 'seed-user-f4',
		email: 'yujin@demo.kr',
		nickname: '유진',
		sex: 'female',
		birthYear: 2004,
		admissionYear: 2023,
		school: DEFAULT_SCHOOL,
		major: '시각디자인학과',
		housingType: 'off_campus',
		preferredRegion: '건국대 정문·후문',
		budgetDeposit: 300,
		budgetMonthly: 28,
		traits: {
			sleep_schedule: 'late',
			wake_up_schedule: 'late',
			cleanliness: 'relaxed',
			noise_tolerance: 'tolerant',
			lights_out: 'no_preference',
			smoking: 'no',
			drinking: 'occasionally',
			room_food: 'often',
			weekend_routine: 'mostly_in',
			snoring: 'never',
			room_call_frequency: 'sometimes'
		},
		photos: ['seed-user-f4-1.jpg', 'seed-user-f4-2.jpg', 'seed-user-f4-3.jpg']
	},
	{
		id: 'seed-user-f5',
		email: 'haeun@demo.kr',
		nickname: '하은',
		sex: 'female',
		birthYear: 2002,
		admissionYear: 2021,
		school: DEFAULT_SCHOOL,
		major: '생명과학부',
		housingType: 'dorm',
		preferredRegion: '단월동·학교 앞',
		budgetDeposit: null,
		budgetMonthly: null,
		traits: {
			sleep_schedule: 'early',
			wake_up_schedule: 'very_early',
			cleanliness: 'very_tidy',
			noise_tolerance: 'sensitive',
			lights_out: 'early',
			smoking: 'no',
			drinking: 'no',
			room_food: 'rarely',
			weekend_routine: 'mostly_in',
			snoring: 'never',
			room_call_frequency: 'rarely'
		},
		photos: ['seed-user-f5-1.jpg', 'seed-user-f5-2.jpg']
	},
	{
		id: 'seed-user-f6',
		email: 'sua@demo.kr',
		nickname: '수아',
		sex: 'female',
		birthYear: 2005,
		admissionYear: 2024,
		school: DEFAULT_SCHOOL,
		major: '미디어커뮤니케이션학과',
		housingType: 'both',
		preferredRegion: '호암동·직동',
		budgetDeposit: 400,
		budgetMonthly: 32,
		traits: {
			sleep_schedule: 'varies',
			wake_up_schedule: 'regular',
			cleanliness: 'tidy',
			noise_tolerance: 'normal',
			lights_out: 'no_preference',
			smoking: 'no',
			drinking: 'occasionally',
			room_food: 'sometimes',
			weekend_routine: 'mixed',
			snoring: 'occasionally',
			room_call_frequency: 'sometimes'
		},
		photos: ['seed-user-f6-1.jpg', 'seed-user-f6-2.jpg', 'seed-user-f6-3.jpg']
	},
	{
		id: 'seed-user-f7',
		email: 'dahyun@demo.kr',
		nickname: '다현',
		sex: 'female',
		birthYear: 2003,
		admissionYear: 2022,
		school: DEFAULT_SCHOOL,
		major: '간호학과',
		housingType: 'off_campus',
		preferredRegion: '호암동·직동',
		budgetDeposit: 500,
		budgetMonthly: 36,
		traits: {
			sleep_schedule: 'regular',
			wake_up_schedule: 'early',
			cleanliness: 'very_tidy',
			noise_tolerance: 'sensitive',
			lights_out: 'early',
			smoking: 'no',
			drinking: 'no',
			room_food: 'rarely',
			weekend_routine: 'mixed',
			snoring: 'never',
			room_call_frequency: 'rarely'
		},
		photos: ['seed-user-f7-1.jpg', 'seed-user-f7-2.jpg']
	},

	// --- Male users (7) ---
	{
		id: 'seed-user-m1',
		email: 'minsu@demo.kr',
		nickname: '민수',
		sex: 'male',
		birthYear: 2003,
		admissionYear: 2022,
		school: DEFAULT_SCHOOL,
		major: '메카트로닉스공학과',
		housingType: 'both',
		preferredRegion: '단월동·학교 앞',
		budgetDeposit: 300,
		budgetMonthly: 30,
		traits: {
			sleep_schedule: 'regular',
			wake_up_schedule: 'early',
			cleanliness: 'tidy',
			noise_tolerance: 'normal',
			lights_out: 'regular',
			smoking: 'no',
			drinking: 'occasionally',
			room_food: 'sometimes',
			weekend_routine: 'mixed',
			snoring: 'never',
			room_call_frequency: 'rarely'
		},
		photos: ['seed-user-m1-1.jpg', 'seed-user-m1-2.jpg', 'seed-user-m1-3.jpg']
	},
	{
		id: 'seed-user-m2',
		email: 'junho@demo.kr',
		nickname: '준호',
		sex: 'male',
		birthYear: 2004,
		admissionYear: 2023,
		school: DEFAULT_SCHOOL,
		major: '경제통상학과',
		housingType: 'dorm',
		preferredRegion: '단월동·학교 앞',
		budgetDeposit: null,
		budgetMonthly: null,
		traits: {
			sleep_schedule: 'regular',
			wake_up_schedule: 'early',
			cleanliness: 'very_tidy',
			noise_tolerance: 'sensitive',
			lights_out: 'regular',
			smoking: 'no',
			drinking: 'occasionally',
			room_food: 'rarely',
			weekend_routine: 'mostly_out',
			snoring: 'never',
			room_call_frequency: 'rarely'
		},
		photos: ['seed-user-m2-1.jpg', 'seed-user-m2-2.jpg']
	},
	{
		id: 'seed-user-m3',
		email: 'doyun@demo.kr',
		nickname: '도윤',
		sex: 'male',
		birthYear: 2002,
		admissionYear: 2021,
		school: DEFAULT_SCHOOL,
		major: '기계전자공학과',
		housingType: 'off_campus',
		preferredRegion: '건국대 정문·후문',
		budgetDeposit: 300,
		budgetMonthly: 27,
		traits: {
			sleep_schedule: 'late',
			wake_up_schedule: 'late',
			cleanliness: 'relaxed',
			noise_tolerance: 'tolerant',
			lights_out: 'late',
			smoking: 'occasionally',
			drinking: 'often',
			room_food: 'often',
			weekend_routine: 'mostly_in',
			snoring: 'occasionally',
			room_call_frequency: 'sometimes'
		},
		photos: ['seed-user-m3-1.jpg', 'seed-user-m3-2.jpg', 'seed-user-m3-3.jpg']
	},
	{
		id: 'seed-user-m4',
		email: 'hyunwoo@demo.kr',
		nickname: '현우',
		sex: 'male',
		birthYear: 2004,
		admissionYear: 2023,
		school: DEFAULT_SCHOOL,
		major: '컴퓨터공학과',
		housingType: 'off_campus',
		preferredRegion: '단월동·학교 앞',
		budgetDeposit: 400,
		budgetMonthly: 33,
		traits: {
			sleep_schedule: 'late',
			wake_up_schedule: 'regular',
			cleanliness: 'tidy',
			noise_tolerance: 'normal',
			lights_out: 'no_preference',
			smoking: 'no',
			drinking: 'occasionally',
			room_food: 'sometimes',
			weekend_routine: 'mostly_in',
			snoring: 'never',
			room_call_frequency: 'rarely'
		},
		photos: ['seed-user-m4-1.jpg', 'seed-user-m4-2.jpg']
	},
	{
		id: 'seed-user-m5',
		email: 'taehyun@demo.kr',
		nickname: '태현',
		sex: 'male',
		birthYear: 2001,
		admissionYear: 2020,
		school: DEFAULT_SCHOOL,
		major: '실내디자인학과',
		housingType: 'off_campus',
		preferredRegion: '충주역·봉방동',
		budgetDeposit: 500,
		budgetMonthly: 35,
		traits: {
			sleep_schedule: 'varies',
			wake_up_schedule: 'varies',
			cleanliness: 'tidy',
			noise_tolerance: 'tolerant',
			lights_out: 'no_preference',
			smoking: 'no',
			drinking: 'occasionally',
			room_food: 'sometimes',
			weekend_routine: 'mostly_out',
			snoring: 'unsure',
			room_call_frequency: 'rarely'
		},
		photos: ['seed-user-m5-1.jpg', 'seed-user-m5-2.jpg', 'seed-user-m5-3.jpg']
	},
	{
		id: 'seed-user-m6',
		email: 'jihoon@demo.kr',
		nickname: '지훈',
		sex: 'male',
		birthYear: 2005,
		admissionYear: 2024,
		school: DEFAULT_SCHOOL,
		major: '소프트웨어전공',
		housingType: 'dorm',
		preferredRegion: '단월동·학교 앞',
		budgetDeposit: null,
		budgetMonthly: null,
		traits: {
			sleep_schedule: 'early',
			wake_up_schedule: 'early',
			cleanliness: 'very_tidy',
			noise_tolerance: 'normal',
			lights_out: 'early',
			smoking: 'no',
			drinking: 'no',
			room_food: 'rarely',
			weekend_routine: 'mixed',
			snoring: 'never',
			room_call_frequency: 'rarely'
		},
		photos: ['seed-user-m6-1.jpg', 'seed-user-m6-2.jpg']
	},
	{
		id: 'seed-user-m7',
		email: 'seungmin@demo.kr',
		nickname: '승민',
		sex: 'male',
		birthYear: 2003,
		admissionYear: 2022,
		school: DEFAULT_SCHOOL,
		major: '경영학과',
		housingType: 'both',
		preferredRegion: '칠금동·금릉동',
		budgetDeposit: 400,
		budgetMonthly: 30,
		traits: {
			sleep_schedule: 'regular',
			wake_up_schedule: 'regular',
			cleanliness: 'tidy',
			noise_tolerance: 'normal',
			lights_out: 'regular',
			smoking: 'no',
			drinking: 'prefer_not_to_say',
			room_food: 'sometimes',
			weekend_routine: 'mixed',
			snoring: 'unsure',
			room_call_frequency: 'sometimes'
		},
		photos: ['seed-user-m7-1.jpg', 'seed-user-m7-2.jpg']
	}
];

const SEED_POSTS: SeedPostSpec[] = [
	{
		id: 'seed-post-1',
		authorId: 'seed-user-f2',
		housingType: 'dorm',
		school: DEFAULT_SCHOOL,
		region: '단월동·학교 앞',
		budgetDeposit: null,
		budgetMonthly: null,
		title: '모시래학사 2인실 비흡연·아침형 룸메 구합니다',
		content:
			'다음 학기 모시래학사 2인실 신청 예정입니다! 자정 전에 자고 오전 7~8시에 일어나는 편이고, 통화는 복도나 라운지에서 합니다. 깔끔하게 같이 지낼 분 편하게 관심 보내주세요.',
		status: 'open',
		hoursAgo: 2
	},
	{
		id: 'seed-post-2',
		authorId: 'seed-user-f4',
		housingType: 'off_campus',
		school: DEFAULT_SCHOOL,
		region: '건국대 정문·후문',
		budgetDeposit: 300,
		budgetMonthly: 28,
		title: '정문 도보 5분 투룸 쉐어하실 여성 룸메 찾아요',
		content:
			'각방 있는 신축 투룸 알아보고 있습니다. 보증금 300/월 28씩 반반 생각 중이고, 과제 때문에 늦게까지 작업할 때가 있어 야행성이시거나 조명 크게 신경 안 쓰시는 분이면 좋겠어요.',
		status: 'open',
		hoursAgo: 5
	},
	{
		id: 'seed-post-3',
		authorId: 'seed-user-f3',
		housingType: 'off_campus',
		school: DEFAULT_SCHOOL,
		region: '연수동',
		budgetDeposit: 500,
		budgetMonthly: 35,
		title: '연수동 깔끔한 분리형 투룸 바로 입주 가능하신 분!',
		content:
			'기존 룸메가 휴학하게 되어 남은 기간 함께 지낼 분을 찾습니다. 통학 버스 정류장 가깝고 채광 좋아요. 세탁기·건조기 옵션 있습니다. 편하게 연락 주세요!',
		status: 'open',
		hoursAgo: 9
	},
	{
		id: 'seed-post-4',
		authorId: 'seed-user-f5',
		housingType: 'dorm',
		school: DEFAULT_SCHOOL,
		region: '단월동·학교 앞',
		budgetDeposit: null,
		budgetMonthly: null,
		title: '해오름학사 2인실 조용하고 일찍 주무시는 분 구합니다',
		content:
			'밤 10시 반쯤 소등하고 아침 일찍 움직이는 편입니다. 비흡연·방 안 취식 최소화로 쾌적하게 지낼 룸메이트 찾고 있어요.',
		status: 'open',
		hoursAgo: 14
	},
	{
		id: 'seed-post-5',
		authorId: 'seed-user-f7',
		housingType: 'off_campus',
		school: DEFAULT_SCHOOL,
		region: '호암동·직동',
		budgetDeposit: 500,
		budgetMonthly: 36,
		title: '호암동 신축 깔끔한 투룸 룸메이트 구해요',
		content:
			'실습·시험 기간이 잦아 조용한 분위기 선호합니다. 공용 공간 청소 규칙만 서로 잘 지키면 좋겠습니다.',
		status: 'closed',
		hoursAgo: 40
	},
	{
		id: 'seed-post-6',
		authorId: 'seed-user-m2',
		housingType: 'dorm',
		school: DEFAULT_SCHOOL,
		region: '단월동·학교 앞',
		budgetDeposit: null,
		budgetMonthly: null,
		title: '모시래학사 2인실 비흡연·깔끔파 룸메 구합니다',
		content:
			'자정 전후 취침, 아침 7시 반 기상 패턴입니다. 이어폰 사용 철저하고 코골이 없습니다. 비슷한 생활 패턴이신 분 환영해요!',
		status: 'open',
		hoursAgo: 3
	},
	{
		id: 'seed-post-7',
		authorId: 'seed-user-m4',
		housingType: 'off_campus',
		school: DEFAULT_SCHOOL,
		region: '단월동·학교 앞',
		budgetDeposit: 400,
		budgetMonthly: 33,
		title: '단월동 학교 앞 투룸 룸메 구해요 (각방)',
		content:
			'컴공 3학년입니다. 밤에 코딩할 일이 많지만 저소음 키보드 + 헤드셋만 사용합니다. 서로 배려하면서 편하게 지낼 분 찾아요.',
		status: 'open',
		hoursAgo: 8
	},
	{
		id: 'seed-post-8',
		authorId: 'seed-user-m3',
		housingType: 'off_campus',
		school: DEFAULT_SCHOOL,
		region: '건국대 정문·후문',
		budgetDeposit: 300,
		budgetMonthly: 27,
		title: '후문 원룸촌 인근 가성비 투룸 룸메이트 급구',
		content:
			'월세 부담 줄이려고 룸메 구합니다. 야행성이시고 크게 예민하지 않으신 분이면 잘 맞을 것 같아요!',
		status: 'open',
		hoursAgo: 18
	},
	{
		id: 'seed-post-9',
		authorId: 'seed-user-m6',
		housingType: 'dorm',
		school: DEFAULT_SCHOOL,
		region: '단월동·학교 앞',
		budgetDeposit: null,
		budgetMonthly: null,
		title: '해오름학사 아침형 룸메이트 찾습니다',
		content:
			'1교시가 많아서 일찍 자고 일찍 일어납니다. 비흡연·비음주이고 정리정돈 자주 하는 편입니다.',
		status: 'open',
		hoursAgo: 26
	},
	{
		id: 'seed-post-10',
		authorId: 'seed-user-m7',
		housingType: 'off_campus',
		school: DEFAULT_SCHOOL,
		region: '칠금동·금릉동',
		budgetDeposit: 400,
		budgetMonthly: 30,
		title: '칠금동 도보 5분 투룸 룸메이트 구했습니다',
		content: '많은 관심 감사했습니다! 좋은 분과 매칭되어 모집 마감합니다.',
		status: 'closed',
		hoursAgo: 52
	}
];

let seededChecked = false;

export function ensureSeeded(): void {
	if (seededChecked) return;
	seedDatabase();
	syncCampusDemoData();
	syncSeedPhotos();
	seededChecked = true;
}

export function syncCampusDemoData(): void {
	const validRegions = new Set<string>(REGION_PRESETS);

	db.transaction((tx) => {
		for (const u of SEED_USERS) {
			tx.update(users)
				.set({
					school: u.school,
					major: u.major,
					preferredRegion: u.preferredRegion,
					budgetDeposit: u.budgetDeposit,
					budgetMonthly: u.budgetMonthly
				})
				.where(eq(users.id, u.id))
				.run();
		}

		for (const post of SEED_POSTS) {
			tx.update(posts)
				.set({
					school: post.school,
					region: post.region,
					budgetDeposit: post.budgetDeposit,
					budgetMonthly: post.budgetMonthly,
					title: post.title,
					content: post.content
				})
				.where(eq(posts.id, post.id))
				.run();
		}

		// Align any existing local test accounts & posts with the active campus
		const allUsers = tx
			.select({
				id: users.id,
				school: users.school,
				housingType: users.housingType,
				preferredRegion: users.preferredRegion
			})
			.from(users)
			.all();

		for (const u of allUsers) {
			const needsSchoolFix = u.school !== DEFAULT_SCHOOL;
			const needsRegionFix = u.preferredRegion !== null && !validRegions.has(u.preferredRegion);
			if (needsSchoolFix || needsRegionFix) {
				tx.update(users)
					.set({
						school: DEFAULT_SCHOOL,
						preferredRegion: needsRegionFix
							? u.housingType === 'dorm'
								? null
								: REGION_PRESETS[0]
							: u.preferredRegion
					})
					.where(eq(users.id, u.id))
					.run();
			}
		}

		const allPosts = tx
			.select({
				id: posts.id,
				school: posts.school,
				housingType: posts.housingType,
				region: posts.region
			})
			.from(posts)
			.all();

		for (const p of allPosts) {
			const needsSchoolFix = p.school !== DEFAULT_SCHOOL;
			const needsRegionFix = p.region !== null && !validRegions.has(p.region);
			if (needsSchoolFix || needsRegionFix) {
				tx.update(posts)
					.set({
						school: DEFAULT_SCHOOL,
						region: needsRegionFix
							? p.housingType === 'dorm'
								? null
								: REGION_PRESETS[0]
							: p.region
					})
					.where(eq(posts.id, p.id))
					.run();
			}
		}
	});
}

export function syncSeedPhotos(): void {
	const now = Date.now();
	db.transaction((tx) => {
		for (const u of SEED_USERS) {
			const exists = tx.select({ id: users.id }).from(users).where(eq(users.id, u.id)).get();
			if (!exists) continue;

			const validPhotoIds: string[] = [];

			u.photos.forEach((fileName, order) => {
				copySeedPhotoToUploads(fileName);
				const photoId = `seed-photo-${u.id}-${order + 1}`;
				validPhotoIds.push(photoId);

				tx.insert(profilePhotos)
					.values({
						id: photoId,
						userId: u.id,
						storageKey: fileName,
						displayOrder: order,
						createdAt: now - (10 - order) * 60_000
					})
					.onConflictDoUpdate({
						target: profilePhotos.id,
						set: {
							storageKey: fileName,
							displayOrder: order
						}
					})
					.run();
			});

			// Remove obsolete old seed photo rows (e.g. previous SVG slots)
			if (validPhotoIds.length > 0) {
				tx.delete(profilePhotos)
					.where(
						and(
							eq(profilePhotos.userId, u.id),
							like(profilePhotos.id, `seed-photo-${u.id}-%`),
							notInArray(profilePhotos.id, validPhotoIds)
						)
					)
					.run();
			}
		}
	});

	// Clean up legacy seed-user-*.svg files from local uploads directory
	try {
		for (const entry of fs.readdirSync(UPLOADS_DIR)) {
			if (entry.startsWith('seed-user-') && entry.endsWith('.svg')) {
				fs.unlinkSync(path.join(UPLOADS_DIR, entry));
			}
		}
	} catch {
		// Ignore cleanup errors
	}
}

export function seedDatabase(): void {
	const countRow = db
		.select({ count: sql<number>`count(*)` })
		.from(users)
		.get();

	if (countRow && countRow.count > 0) {
		return;
	}

	const now = Date.now();
	const demoPasswordHash = hashPassword('password1234');

	db.transaction((tx) => {
		for (let i = 0; i < SEED_USERS.length; i++) {
			const u = SEED_USERS[i];
			tx.insert(users)
				.values({
					id: u.id,
					email: u.email,
					passwordHash: demoPasswordHash,
					nickname: u.nickname,
					sex: u.sex,
					birthYear: u.birthYear,
					admissionYear: u.admissionYear,
					school: u.school,
					major: u.major,
					housingType: u.housingType,
					preferredRegion: u.preferredRegion,
					budgetDeposit: u.budgetDeposit,
					budgetMonthly: u.budgetMonthly,
					createdAt: now - (SEED_USERS.length - i) * 3600_000
				})
				.run();

			tx.insert(profileTraits)
				.values({
					userId: u.id,
					...u.traits
				})
				.run();

			u.photos.forEach((fileName, order) => {
				copySeedPhotoToUploads(fileName);

				tx.insert(profilePhotos)
					.values({
						id: `seed-photo-${u.id}-${order + 1}`,
						userId: u.id,
						storageKey: fileName,
						displayOrder: order,
						createdAt: now - (10 - order) * 60_000
					})
					.run();
			});
		}

		for (const post of SEED_POSTS) {
			const createdAt = now - post.hoursAgo * 3600_000;
			tx.insert(posts)
				.values({
					id: post.id,
					authorId: post.authorId,
					housingType: post.housingType,
					school: post.school,
					region: post.region,
					budgetDeposit: post.budgetDeposit,
					budgetMonthly: post.budgetMonthly,
					title: post.title,
					content: post.content,
					status: post.status,
					createdAt,
					updatedAt: createdAt
				})
				.run();
		}

		// Demo incoming likes for minji@demo.kr and minsu@demo.kr
		tx.insert(likes)
			.values([
				{
					id: 'seed-like-1',
					fromUserId: 'seed-user-f2',
					toUserId: 'seed-user-f1',
					postId: 'seed-post-1',
					message: '생활 패턴이 정말 비슷하네요! 다음 학기 기숙사 같이 지원해보실래요?',
					status: 'pending',
					createdAt: now - 45 * 60_000
				},
				{
					id: 'seed-like-2',
					fromUserId: 'seed-user-f4',
					toUserId: 'seed-user-f1',
					postId: 'seed-post-2',
					message: '정문 앞 투룸 알아보고 있는데 혹시 자취도 관심 있으신가요?',
					status: 'pending',
					createdAt: now - 20 * 60_000
				},
				{
					id: 'seed-like-3',
					fromUserId: 'seed-user-m2',
					toUserId: 'seed-user-m1',
					postId: 'seed-post-6',
					message: '같은 학교에 취침 시간도 비슷해서 연락드려요!',
					status: 'pending',
					createdAt: now - 35 * 60_000
				},
				{
					id: 'seed-like-4',
					fromUserId: 'seed-user-f7',
					toUserId: 'seed-user-f1',
					postId: null,
					message: '안녕하세요! 라이프스타일이 잘 맞을 것 같아 관심 보냅니다.',
					status: 'accepted',
					createdAt: now - 3 * 3600_000
				},
				{
					id: 'seed-like-5',
					fromUserId: 'seed-user-m4',
					toUserId: 'seed-user-m1',
					postId: 'seed-post-7',
					message: '단월동 투룸 조건 이야기 나눠보고 싶어요!',
					status: 'accepted',
					createdAt: now - 2 * 3600_000
				}
			])
			.run();

		// Starter matches & messages for immediate demo exploration
		tx.insert(matches)
			.values([
				{
					id: 'seed-match-1',
					userAId: 'seed-user-f1',
					userBId: 'seed-user-f7',
					createdAt: now - 2 * 3600_000
				},
				{
					id: 'seed-match-2',
					userAId: 'seed-user-m1',
					userBId: 'seed-user-m4',
					createdAt: now - 90 * 60_000
				}
			])
			.run();

		tx.insert(messages)
			.values([
				{
					id: 'seed-msg-1',
					matchId: 'seed-match-1',
					senderId: 'seed-user-f7',
					content: '안녕하세요! 라이프스타일이 잘 맞을 것 같아 관심 보냈어요 :)',
					createdAt: now - 110 * 60_000
				},
				{
					id: 'seed-msg-2',
					matchId: 'seed-match-1',
					senderId: 'seed-user-f1',
					content: '안녕하세요 다현님! 반갑습니다. 희망하시는 입주 시기가 언제쯤이세요?',
					createdAt: now - 95 * 60_000
				},
				{
					id: 'seed-msg-3',
					matchId: 'seed-match-2',
					senderId: 'seed-user-m4',
					content: '안녕하세요 민수님! 단월동 쪽 투룸 알아보시는 중인가요?',
					createdAt: now - 80 * 60_000
				}
			])
			.run();
	});
}
