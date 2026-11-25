import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendLike } from '#lib/server/matching.js';

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

	if (typeof body !== 'object' || body === null) {
		error(400, '요청 본문이 필요합니다.');
	}

	const payload = body as Record<string, unknown>;
	const toUserId = typeof payload.toUserId === 'string' ? payload.toUserId.trim() : '';
	const postId =
		typeof payload.postId === 'string' && payload.postId.trim() ? payload.postId.trim() : null;
	const message = typeof payload.message === 'string' ? payload.message : null;

	if (!toUserId) {
		error(400, '대상 사용자를 지정해 주세요.');
	}

	if (toUserId === locals.user.id) {
		error(400, '본인에게는 관심을 보낼 수 없습니다.');
	}

	try {
		const result = sendLike({
			fromUserId: locals.user.id,
			toUserId,
			postId,
			message
		});

		return json(result, { status: 201 });
	} catch (err) {
		if (err instanceof Error && err.message === 'TARGET_NOT_FOUND') {
			error(404, '대상 사용자를 찾을 수 없습니다.');
		}
		if (err instanceof Error && err.message === 'CROSS_SCHOOL_FORBIDDEN') {
			error(403, '같은 학교 사용자에게만 관심을 보낼 수 있습니다.');
		}
		throw err;
	}
};
