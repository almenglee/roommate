import crypto from 'node:crypto';
import { and, eq, or } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { likes, matches, messages, passes, posts, users } from '#lib/server/db/schema.js';

export function sortUserPair(id1: string, id2: string): [string, string] {
	return id1 < id2 ? [id1, id2] : [id2, id1];
}

export interface SendLikeResult {
	matched: boolean;
	alreadyMatched: boolean;
	matchId: string | null;
	likeId: string | null;
	targetNickname: string;
}

export function sendLike(params: {
	fromUserId: string;
	toUserId: string;
	postId?: string | null;
	message?: string | null;
}): SendLikeResult {
	const { fromUserId, toUserId } = params;
	const postId = params.postId ?? null;
	const cleanMessage = params.message?.trim().slice(0, 300) || null;

	const sender = db
		.select({ id: users.id, school: users.school })
		.from(users)
		.where(eq(users.id, fromUserId))
		.get();

	const target = db
		.select({ id: users.id, nickname: users.nickname, school: users.school })
		.from(users)
		.where(eq(users.id, toUserId))
		.get();

	if (!sender || !target) {
		throw new Error('TARGET_NOT_FOUND');
	}

	if (sender.school !== target.school) {
		throw new Error('CROSS_SCHOOL_FORBIDDEN');
	}

	if (postId) {
		const post = db
			.select({ id: posts.id, school: posts.school, status: posts.status })
			.from(posts)
			.where(eq(posts.id, postId))
			.get();
		if (!post || post.status !== 'open' || post.school !== sender.school) {
			throw new Error('CROSS_SCHOOL_FORBIDDEN');
		}
	}

	const [userAId, userBId] = sortUserPair(fromUserId, toUserId);
	const now = Date.now();

	return db.transaction((tx) => {
		const existingMatch = tx
			.select({ id: matches.id })
			.from(matches)
			.where(and(eq(matches.userAId, userAId), eq(matches.userBId, userBId)))
			.get();

		if (existingMatch) {
			return {
				matched: true,
				alreadyMatched: true,
				matchId: existingMatch.id,
				likeId: null,
				targetNickname: target.nickname
			};
		}

		// Clear pass record if user previously passed this candidate
		tx.delete(passes)
			.where(
				or(
					and(eq(passes.fromUserId, fromUserId), eq(passes.toUserId, toUserId)),
					and(eq(passes.fromUserId, toUserId), eq(passes.toUserId, fromUserId))
				)
			)
			.run();

		// Check for reverse pending like -> Mutual Like Auto-Match!
		const reverseLike = tx
			.select()
			.from(likes)
			.where(
				and(
					eq(likes.fromUserId, toUserId),
					eq(likes.toUserId, fromUserId),
					eq(likes.status, 'pending')
				)
			)
			.get();

		if (reverseLike) {
			tx.update(likes).set({ status: 'accepted' }).where(eq(likes.id, reverseLike.id)).run();

			const myLikeId = crypto.randomUUID();
			tx.insert(likes)
				.values({
					id: myLikeId,
					fromUserId,
					toUserId,
					postId,
					message: cleanMessage,
					status: 'accepted',
					createdAt: now
				})
				.onConflictDoUpdate({
					target: [likes.fromUserId, likes.toUserId],
					set: {
						status: 'accepted',
						postId,
						message: cleanMessage,
						createdAt: now
					}
				})
				.run();

			const matchId = crypto.randomUUID();
			tx.insert(matches)
				.values({
					id: matchId,
					userAId,
					userBId,
					createdAt: now
				})
				.run();

			// Carry over greeting messages into chat history
			if (reverseLike.message) {
				tx.insert(messages)
					.values({
						id: crypto.randomUUID(),
						matchId,
						senderId: toUserId,
						content: reverseLike.message,
						createdAt: reverseLike.createdAt
					})
					.run();
			}

			if (cleanMessage) {
				tx.insert(messages)
					.values({
						id: crypto.randomUUID(),
						matchId,
						senderId: fromUserId,
						content: cleanMessage,
						createdAt: now
					})
					.run();
			}

			return {
				matched: true,
				alreadyMatched: false,
				matchId,
				likeId: myLikeId,
				targetNickname: target.nickname
			};
		}

		// Standard one-way like
		const likeId = crypto.randomUUID();
		tx.insert(likes)
			.values({
				id: likeId,
				fromUserId,
				toUserId,
				postId,
				message: cleanMessage,
				status: 'pending',
				createdAt: now
			})
			.onConflictDoUpdate({
				target: [likes.fromUserId, likes.toUserId],
				set: {
					postId,
					message: cleanMessage,
					status: 'pending',
					createdAt: now
				}
			})
			.run();

		return {
			matched: false,
			alreadyMatched: false,
			matchId: null,
			likeId,
			targetNickname: target.nickname
		};
	});
}

export function getMatchForParticipant(matchId: string, userId: string) {
	const row = db.select().from(matches).where(eq(matches.id, matchId)).get();
	if (!row) return null;
	if (row.userAId !== userId && row.userBId !== userId) return null;
	return row;
}

export function respondToLike(params: {
	likeId: string;
	currentUserId: string;
	decision: 'accept' | 'reject';
}): { accepted: boolean; matchId: string | null } {
	const { likeId, currentUserId, decision } = params;
	const now = Date.now();

	return db.transaction((tx) => {
		const targetLike = tx
			.select()
			.from(likes)
			.where(and(eq(likes.id, likeId), eq(likes.toUserId, currentUserId)))
			.get();

		if (!targetLike) {
			throw new Error('LIKE_NOT_FOUND');
		}

		if (decision === 'reject') {
			tx.update(likes).set({ status: 'rejected' }).where(eq(likes.id, likeId)).run();
			return { accepted: false, matchId: null };
		}

		const senderUser = tx
			.select({ school: users.school })
			.from(users)
			.where(eq(users.id, targetLike.fromUserId))
			.get();
		const receiverUser = tx
			.select({ school: users.school })
			.from(users)
			.where(eq(users.id, currentUserId))
			.get();

		if (!senderUser || !receiverUser || senderUser.school !== receiverUser.school) {
			throw new Error('CROSS_SCHOOL_FORBIDDEN');
		}

		tx.update(likes).set({ status: 'accepted' }).where(eq(likes.id, likeId)).run();

		const [userAId, userBId] = sortUserPair(targetLike.fromUserId, currentUserId);
		const existingMatch = tx
			.select({ id: matches.id })
			.from(matches)
			.where(and(eq(matches.userAId, userAId), eq(matches.userBId, userBId)))
			.get();

		if (existingMatch) {
			return { accepted: true, matchId: existingMatch.id };
		}

		const matchId = crypto.randomUUID();
		tx.insert(matches)
			.values({
				id: matchId,
				userAId,
				userBId,
				createdAt: now
			})
			.run();

		// Clear any prior pass records between them
		tx.delete(passes)
			.where(
				or(
					and(eq(passes.fromUserId, currentUserId), eq(passes.toUserId, targetLike.fromUserId)),
					and(eq(passes.fromUserId, targetLike.fromUserId), eq(passes.toUserId, currentUserId))
				)
			)
			.run();

		if (targetLike.message) {
			tx.insert(messages)
				.values({
					id: crypto.randomUUID(),
					matchId,
					senderId: targetLike.fromUserId,
					content: targetLike.message,
					createdAt: targetLike.createdAt
				})
				.run();
		}

		return { accepted: true, matchId };
	});
}
