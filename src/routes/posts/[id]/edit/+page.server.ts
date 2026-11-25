import { error, fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '#lib/server/db/index.js';
import { posts } from '#lib/server/db/schema.js';
import { parsePostForm } from '#lib/server/posts.js';

export const load: PageServerLoad = ({ locals, params }) => {
	if (!locals.user) redirect(302, '/login');

	const post = db.select().from(posts).where(eq(posts.id, params.id)).get();
	if (!post) error(404, '모집글을 찾을 수 없습니다.');
	if (post.authorId !== locals.user.id) error(403, '수정 권한이 없습니다.');

	return {
		title: '모집글 수정',
		postId: post.id,
		initial: {
			housingType: post.housingType,
			recruitCount: post.recruitCount,
			region: post.region ?? '',
			budgetDeposit: post.budgetDeposit != null ? String(post.budgetDeposit) : '',
			budgetMonthly: post.budgetMonthly != null ? String(post.budgetMonthly) : '',
			title: post.title,
			content: post.content
		}
	};
};

export const actions: Actions = {
	default: async ({ locals, params, request }) => {
		if (!locals.user) redirect(302, '/login');

		const post = db.select().from(posts).where(eq(posts.id, params.id)).get();
		if (!post) error(404, '모집글을 찾을 수 없습니다.');
		if (post.authorId !== locals.user.id) error(403, '수정 권한이 없습니다.');

		const formData = await request.formData();
		const parsed = parsePostForm(formData);
		if (!parsed.ok) {
			return fail(400, { error: parsed.error });
		}

		db.update(posts)
			.set({
				...parsed.data,
				updatedAt: Date.now()
			})
			.where(eq(posts.id, post.id))
			.run();

		redirect(303, `/posts/${post.id}`);
	}
};
