import { error, json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { db } from '#lib/server/db/index.js';
import { passes, users } from '#lib/server/db/schema.js';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		error(401, '로그인이 필요합니다.');
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, '올바른 요청 형식이 아닙니다.');
	}

	const toUserId =
		typeof body === 'object' &&
		body !== null &&
		'toUserId' in body &&
		typeof body.toUserId === 'string'
			? body.toUserId.trim()
			: '';

	if (!toUserId || toUserId === locals.user.id) {
		error(400, '유효하지 않은 대상입니다.');
	}

	const target = db
		.select({ id: users.id, school: users.school })
		.from(users)
		.where(eq(users.id, toUserId))
		.get();

	if (!target) {
		error(404, '대상 사용자를 찾을 수 없습니다.');
	}

	if (target.school !== locals.user.school) {
		error(403, '같은 학교 사용자만 패스할 수 있습니다.');
	}

	db.insert(passes)
		.values({
			fromUserId: locals.user.id,
			toUserId,
			createdAt: Date.now()
		})
		.onConflictDoNothing()
		.run();

	return json({ ok: true });
};

export const DELETE: RequestHandler = ({ locals }) => {
	if (!locals.user) {
		error(401, '로그인이 필요합니다.');
	}

	db.delete(passes).where(eq(passes.fromUserId, locals.user.id)).run();
	return json({ ok: true });
};
