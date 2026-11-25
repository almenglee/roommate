import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { createSession, setSessionCookie, verifyPassword } from '#lib/server/auth.js';
import { db } from '#lib/server/db/index.js';
import { users } from '#lib/server/db/schema.js';
import { getFormString } from '#lib/server/form.js';

export const load: PageServerLoad = ({ locals }) => {
	if (locals.user) {
		redirect(302, '/discover');
	}
	return { title: '로그인' };
};

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const formData = await request.formData();
		const email = getFormString(formData, 'email').trim().toLowerCase();
		const password = getFormString(formData, 'password');

		if (!email || !password) {
			return fail(400, {
				email,
				error: '이메일과 비밀번호를 입력해 주세요.'
			});
		}

		const user = db.select().from(users).where(eq(users.email, email)).get();
		if (!user || !verifyPassword(password, user.passwordHash)) {
			return fail(400, {
				email,
				error: '이메일 또는 비밀번호가 올바르지 않습니다.'
			});
		}

		const { sessionId, expiresAt } = createSession(user.id);
		setSessionCookie(cookies, sessionId, expiresAt, url.protocol === 'https:');

		redirect(303, '/discover');
	}
};
