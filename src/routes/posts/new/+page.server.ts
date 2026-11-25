import crypto from 'node:crypto';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '#lib/server/db/index.js';
import { posts } from '#lib/server/db/schema.js';
import { parsePostForm } from '#lib/server/posts.js';

export const load: PageServerLoad = ({ locals }) => {
	if (!locals.user) redirect(302, '/login');

	const me = locals.user;
	return {
		title: '모집글 작성',
		initial: {
			housingType: me.housingType === 'off_campus' ? ('off_campus' as const) : ('dorm' as const),
			recruitCount: 1,
			region: me.preferredRegion ?? '',
			budgetDeposit: me.budgetDeposit != null ? String(me.budgetDeposit) : '',
			budgetMonthly: me.budgetMonthly != null ? String(me.budgetMonthly) : '',
			title: '',
			content: ''
		}
	};
};

export const actions: Actions = {
	default: async ({ locals, request }) => {
		if (!locals.user) redirect(302, '/login');

		const formData = await request.formData();
		const parsed = parsePostForm(formData);
		if (!parsed.ok) {
			return fail(400, { error: parsed.error });
		}

		const postId = crypto.randomUUID();
		const now = Date.now();

		db.insert(posts)
			.values({
				id: postId,
				authorId: locals.user.id,
				school: locals.user.school,
				...parsed.data,
				status: 'open',
				createdAt: now,
				updatedAt: now
			})
			.run();

		redirect(303, `/posts/${postId}`);
	}
};
