import { error } from '@sveltejs/kit';
import { and, asc, eq, gt } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { subscribeToMatch, type ChatMessageDTO } from '#lib/server/chat-hub.js';
import { db } from '#lib/server/db/index.js';
import { messages } from '#lib/server/db/schema.js';
import { getMatchForParticipant } from '#lib/server/matching.js';

export const GET: RequestHandler = ({ locals, params, url, request }) => {
	if (!locals.user) {
		error(401, '로그인이 필요합니다.');
	}

	const match = getMatchForParticipant(params.matchId, locals.user.id);
	if (!match) {
		error(403, '채팅방에 접근할 수 없습니다.');
	}

	const afterRaw = Number(url.searchParams.get('after'));
	const afterTimestamp = Number.isFinite(afterRaw) && afterRaw > 0 ? afterRaw : null;

	const encoder = new TextEncoder();
	let cleanup: (() => void) | null = null;

	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			let closed = false;

			const safeEnqueue = (chunk: string) => {
				if (closed) return;
				try {
					controller.enqueue(encoder.encode(chunk));
				} catch {
					closed = true;
					cleanup?.();
				}
			};

			const sendMessage = (msg: ChatMessageDTO) => {
				safeEnqueue(`event: message\ndata: ${JSON.stringify(msg)}\n\n`);
			};

			// Initial retry hint & connected comment
			safeEnqueue('retry: 3000\n: connected\n\n');

			// Reconnect catch-up: flush any missed messages strictly after `after`
			if (afterTimestamp !== null) {
				const missed = db
					.select({
						id: messages.id,
						matchId: messages.matchId,
						senderId: messages.senderId,
						content: messages.content,
						createdAt: messages.createdAt
					})
					.from(messages)
					.where(and(eq(messages.matchId, match.id), gt(messages.createdAt, afterTimestamp)))
					.orderBy(asc(messages.createdAt))
					.all();

				for (const msg of missed) {
					sendMessage(msg);
				}
			}

			const unsubscribe = subscribeToMatch(match.id, sendMessage);
			const heartbeat = setInterval(() => {
				safeEnqueue(': ping\n\n');
			}, 25_000);

			cleanup = () => {
				if (closed) return;
				closed = true;
				clearInterval(heartbeat);
				unsubscribe();
			};

			request.signal.addEventListener('abort', () => {
				cleanup?.();
				try {
					controller.close();
				} catch {
					// Already closed
				}
			});
		},
		cancel() {
			cleanup?.();
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache, no-transform',
			Connection: 'keep-alive',
			'X-Accel-Buffering': 'no'
		}
	});
};
