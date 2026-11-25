import crypto from 'node:crypto';
import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import {
	DEFAULT_SCHOOL,
	REGION_PRESETS,
	SEX_VALUES,
	USER_HOUSING_TYPES,
	type Sex,
	type UserHousingType
} from '#lib/domain/constants.js';
import { createSession, hashPassword, setSessionCookie } from '#lib/server/auth.js';
import { db } from '#lib/server/db/index.js';
import { profileTraits, users } from '#lib/server/db/schema.js';
import { getFormInt, getFormString } from '#lib/server/form.js';

export const load: PageServerLoad = ({ locals }) => {
	if (locals.user) {
		redirect(302, '/discover');
	}
	return { title: '회원가입' };
};

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const formData = await request.formData();

		const email = getFormString(formData, 'email').trim().toLowerCase();
		const password = getFormString(formData, 'password');
		const nickname = getFormString(formData, 'nickname').trim();
		const sexRaw = getFormString(formData, 'sex');
		const birthYear = getFormInt(formData, 'birthYear');
		const admissionYear = getFormInt(formData, 'admissionYear');
		const school = DEFAULT_SCHOOL;
		const major = getFormString(formData, 'major').trim();
		const housingTypeRaw = getFormString(formData, 'housingType', 'both');
		const preferredRegionRaw = getFormString(formData, 'preferredRegion').trim();

		const values = {
			email,
			nickname,
			sex: sexRaw,
			birthYear: birthYear ?? 2004,
			admissionYear: admissionYear ?? 2023,
			major,
			housingType: housingTypeRaw,
			preferredRegion: preferredRegionRaw
		};

		if (!email || !password || !nickname || !major) {
			return fail(400, {
				...values,
				error: '필수 항목(이메일, 비밀번호, 닉네임, 전공)을 모두 입력해 주세요.'
			});
		}

		if (!SEX_VALUES.includes(sexRaw as Sex)) {
			return fail(400, { ...values, error: '성별을 선택해 주세요.' });
		}

		if (!USER_HOUSING_TYPES.includes(housingTypeRaw as UserHousingType)) {
			return fail(400, { ...values, error: '주거 유형을 선택해 주세요.' });
		}

		if (birthYear === null || birthYear < 1980 || birthYear > 2012) {
			return fail(400, { ...values, error: '출생연도를 올바르게 입력해 주세요.' });
		}

		if (admissionYear === null || admissionYear < 2000 || admissionYear > 2030) {
			return fail(400, { ...values, error: '입학연도를 올바르게 입력해 주세요.' });
		}

		const preferredRegion =
			preferredRegionRaw &&
			REGION_PRESETS.includes(preferredRegionRaw as (typeof REGION_PRESETS)[number])
				? preferredRegionRaw
				: null;

		const existing = db.select({ id: users.id }).from(users).where(eq(users.email, email)).get();
		if (existing) {
			return fail(400, {
				...values,
				error: '이미 가입된 이메일입니다. 로그인해 주세요.'
			});
		}

		const userId = crypto.randomUUID();
		const now = Date.now();

		db.transaction((tx) => {
			tx.insert(users)
				.values({
					id: userId,
					email,
					passwordHash: hashPassword(password),
					nickname,
					sex: sexRaw as Sex,
					birthYear,
					admissionYear,
					school,
					major,
					housingType: housingTypeRaw as UserHousingType,
					preferredRegion,
					budgetDeposit: null,
					budgetMonthly: null,
					createdAt: now
				})
				.run();

			tx.insert(profileTraits).values({ userId }).run();
		});

		const { sessionId, expiresAt } = createSession(userId);
		setSessionCookie(cookies, sessionId, expiresAt, url.protocol === 'https:');

		redirect(303, '/profile?onboarding=1');
	}
};
