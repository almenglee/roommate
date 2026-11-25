import { error, json } from '@sveltejs/kit';
import { and, eq, isNull, ne } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { db } from '#lib/server/db/index.js';
import { messages } from '#lib/server/db/schema.js';
import { getMatchForParticipant } from '#lib/server/matching.js';

export const POST: RequestHandler = ({ locals, params }) => {
	if (!locals.user) {
		error(401, '로그인이 필요합니다.');
	}

	const match = getMatchForParticipant(params.matchId, locals.user.id);
	if (!match) {
		error(403, '채팅방에 접근할 수 없습니다.');
	}

	const now = Date.now();
	db.update(messages)
		.set({ readAt: now })
		.where(
			and(
				eq(messages.matchId, match.id),
				ne(messages.senderId, locals.user.id),
				isNull(messages.readAt)
			)
		)
		.run();

	return json({ readAt: now });
};
