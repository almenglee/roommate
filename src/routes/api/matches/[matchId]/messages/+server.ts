import crypto from 'node:crypto';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { publishChatMessage, type ChatMessageDTO } from '#lib/server/chat-hub.js';
import { db } from '#lib/server/db/index.js';
import { messages } from '#lib/server/db/schema.js';
import { getMatchForParticipant } from '#lib/server/matching.js';

export const POST: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.user) {
		error(401, '로그인이 필요합니다.');
	}

	const match = getMatchForParticipant(params.matchId, locals.user.id);
	if (!match) {
		error(403, '채팅방에 접근할 수 없습니다.');
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, '올바른 요청 형식이 아닙니다.');
	}

	const content =
		typeof body === 'object' &&
		body !== null &&
		'content' in body &&
		typeof body.content === 'string'
			? body.content.trim()
			: '';

	if (!content || content.length > 1000) {
		error(400, '메시지는 1~1000자 이내로 입력해 주세요.');
	}

	const msg: ChatMessageDTO = {
		id: crypto.randomUUID(),
		matchId: match.id,
		senderId: locals.user.id,
		content,
		createdAt: Date.now()
	};

	db.insert(messages).values(msg).run();
	publishChatMessage(msg);

	return json({ message: msg }, { status: 201 });
};
