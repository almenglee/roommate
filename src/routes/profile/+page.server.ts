import { fail, redirect } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { REGION_PRESETS, USER_HOUSING_TYPES, type UserHousingType } from '#lib/domain/constants.js';
import {
	createEmptyTraits,
	isValidTraitValue,
	TRAIT_KEYS,
	type ProfileTraits
} from '#lib/domain/traits.js';
import { db } from '#lib/server/db/index.js';
import { profilePhotos, profileTraits, users } from '#lib/server/db/schema.js';
import { getFormInt, getFormString } from '#lib/server/form.js';

function parseTraitsFromForm(formData: FormData): ProfileTraits {
	const parsed = createEmptyTraits();
	const mutable = parsed as unknown as Record<string, string | null>;

	for (const key of TRAIT_KEYS) {
		const raw = getFormString(formData, `trait_${key}`).trim();
		if (raw && isValidTraitValue(key, raw)) {
			mutable[key] = raw;
		} else {
			mutable[key] = null;
		}
	}

	return parsed;
}

export const load: PageServerLoad = ({ locals, url }) => {
	if (!locals.user) {
		redirect(302, '/login');
	}

	const photos = db
		.select({
			id: profilePhotos.id,
			storageKey: profilePhotos.storageKey,
			displayOrder: profilePhotos.displayOrder
		})
		.from(profilePhotos)
		.where(eq(profilePhotos.userId, locals.user.id))
		.orderBy(asc(profilePhotos.displayOrder))
		.all();

	const traitsRow = db
		.select()
		.from(profileTraits)
		.where(eq(profileTraits.userId, locals.user.id))
		.get();

	const traits: ProfileTraits = traitsRow
		? { ...createEmptyTraits(), ...traitsRow }
		: createEmptyTraits();

	const onboarding = url.searchParams.get('onboarding') === '1';

	return {
		title: onboarding ? '프로필 구성' : '내 프로필',
		onboarding,
		user: locals.user,
		photos,
		traits
	};
};

export const actions: Actions = {
	saveOnboarding: async ({ locals, request }) => {
		if (!locals.user) {
			redirect(302, '/login');
		}

		const formData = await request.formData();
		const traits = parseTraitsFromForm(formData);
		const missingCount = TRAIT_KEYS.filter((key) => !traits[key]).length;
		if (missingCount > 0) {
			return fail(400, { error: '모든 라이프스타일 항목을 선택해 주세요.' });
		}

		const nickname = getFormString(formData, 'nickname').trim() || locals.user.nickname;
		const major = getFormString(formData, 'major').trim() || locals.user.major;
		const housingTypeRaw = getFormString(formData, 'housingType', locals.user.housingType);
		const housingType = USER_HOUSING_TYPES.includes(housingTypeRaw as UserHousingType)
			? (housingTypeRaw as UserHousingType)
			: locals.user.housingType;
		const preferredRegionRaw = getFormString(formData, 'preferredRegion').trim();
		const preferredRegion =
			housingType === 'dorm'
				? null
				: preferredRegionRaw &&
					  REGION_PRESETS.includes(preferredRegionRaw as (typeof REGION_PRESETS)[number])
					? preferredRegionRaw
					: locals.user.preferredRegion;

		const budgetDeposit = getFormInt(formData, 'budgetDeposit');
		const budgetMonthly = getFormInt(formData, 'budgetMonthly');

		const userId = locals.user.id;

		db.transaction((tx) => {
			tx.update(users)
				.set({
					nickname,
					major,
					housingType,
					preferredRegion,
					budgetDeposit:
						housingType === 'dorm'
							? null
							: budgetDeposit !== null && budgetDeposit >= 0
								? budgetDeposit
								: null,
					budgetMonthly:
						housingType === 'dorm'
							? null
							: budgetMonthly !== null && budgetMonthly >= 0
								? budgetMonthly
								: null
				})
				.where(eq(users.id, userId))
				.run();

			tx.insert(profileTraits)
				.values({ userId, ...traits })
				.onConflictDoUpdate({
					target: profileTraits.userId,
					set: { ...traits }
				})
				.run();
		});

		redirect(303, '/discover');
	},

	saveProfile: async ({ locals, request }) => {
		if (!locals.user) {
			redirect(302, '/login');
		}

		const formData = await request.formData();
		const nickname = getFormString(formData, 'nickname').trim();
		const major = getFormString(formData, 'major').trim();
		const housingTypeRaw = getFormString(formData, 'housingType');
		const preferredRegionRaw = getFormString(formData, 'preferredRegion').trim();
		const budgetDeposit = getFormInt(formData, 'budgetDeposit');
		const budgetMonthly = getFormInt(formData, 'budgetMonthly');

		if (!nickname || !major) {
			return fail(400, { error: '닉네임과 전공은 비워둘 수 없습니다.' });
		}

		if (!USER_HOUSING_TYPES.includes(housingTypeRaw as UserHousingType)) {
			return fail(400, { error: '주거 유형을 선택해 주세요.' });
		}

		const preferredRegion =
			preferredRegionRaw &&
			REGION_PRESETS.includes(preferredRegionRaw as (typeof REGION_PRESETS)[number])
				? preferredRegionRaw
				: null;

		const traits = parseTraitsFromForm(formData);
		const userId = locals.user.id;

		db.transaction((tx) => {
			tx.update(users)
				.set({
					nickname,
					major,
					housingType: housingTypeRaw as UserHousingType,
					preferredRegion: housingTypeRaw === 'dorm' ? null : preferredRegion,
					budgetDeposit:
						housingTypeRaw === 'dorm'
							? null
							: budgetDeposit !== null && budgetDeposit >= 0
								? budgetDeposit
								: null,
					budgetMonthly:
						housingTypeRaw === 'dorm'
							? null
							: budgetMonthly !== null && budgetMonthly >= 0
								? budgetMonthly
								: null
				})
				.where(eq(users.id, userId))
				.run();

			tx.insert(profileTraits)
				.values({ userId, ...traits })
				.onConflictDoUpdate({
					target: profileTraits.userId,
					set: { ...traits }
				})
				.run();
		});

		return { saved: true };
	}
};
