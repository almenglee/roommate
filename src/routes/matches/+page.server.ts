import { redirect } from '@sveltejs/kit';
import { asc, desc, eq, or } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '#lib/server/db/index.js';
import { matches, messages, profilePhotos, users } from '#lib/server/db/schema.js';

export interface MatchListItem {
	id: string;
	createdAt: number;
	partner: {
		id: string;
		nickname: string;
		major: string;
		firstPhotoKey: string | null;
	};
	lastMessage: {
		content: string;
		isMine: boolean;
		isRead: boolean;
		createdAt: number;
		readAt: number | null;
	} | null;
}

export const load: PageServerLoad = ({ locals }) => {
	if (!locals.user) redirect(302, '/login');
	const me = locals.user;

	const matchRows = db
		.select()
		.from(matches)
		.where(or(eq(matches.userAId, me.id), eq(matches.userBId, me.id)))
		.all();

	if (matchRows.length === 0) {
		return { title: '대화', items: [] as MatchListItem[] };
	}

	const allUsers = db.select().from(users).all();
	const userById = new Map(allUsers.map((u) => [u.id, u]));

	const allPhotos = db.select().from(profilePhotos).orderBy(asc(profilePhotos.displayOrder)).all();
	const firstPhotoByUser = new Map<string, string>();
	for (const p of allPhotos) {
		if (!firstPhotoByUser.has(p.userId)) {
			firstPhotoByUser.set(p.userId, p.storageKey);
		}
	}

	const items: MatchListItem[] = matchRows
		.map((m) => {
			const partnerId = m.userAId === me.id ? m.userBId : m.userAId;
			const partner = userById.get(partnerId);
			if (!partner || partner.school !== me.school) return null;

			const lastMsg = db
				.select({
					content: messages.content,
					senderId: messages.senderId,
					createdAt: messages.createdAt,
					readAt: messages.readAt
				})
				.from(messages)
				.where(eq(messages.matchId, m.id))
				.orderBy(desc(messages.createdAt))
				.limit(1)
				.get();

			return {
				id: m.id,
				createdAt: m.createdAt,
				partner: {
					id: partner.id,
					nickname: partner.nickname,
					major: partner.major,
					firstPhotoKey: firstPhotoByUser.get(partner.id) ?? null
				},
				lastMessage: lastMsg
					? {
							content: lastMsg.content,
							isMine: lastMsg.senderId === me.id,
							isRead: lastMsg.readAt !== null,
							createdAt: lastMsg.createdAt,
							readAt: lastMsg.readAt
						}
					: null
			};
		})
		.filter((item): item is MatchListItem => item !== null)
		.sort((a, b) => {
			const timeA = a.lastMessage?.createdAt ?? a.createdAt;
			const timeB = b.lastMessage?.createdAt ?? b.createdAt;
			return timeB - timeA;
		});

	return {
		title: '대화',
		items
	};
};
