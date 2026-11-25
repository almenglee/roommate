import { redirect } from '@sveltejs/kit';
import { and, asc, desc, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import type { ProfilePhotoItem, ProfileViewData } from '#lib/domain/profile.js';
import {
	calculateTraitCompatibility,
	createEmptyTraits,
	type ProfileTraits
} from '#lib/domain/traits.js';
import { db } from '#lib/server/db/index.js';
import { likes, posts, profilePhotos, profileTraits, users } from '#lib/server/db/schema.js';

export interface ReceivedLikeItem {
	id: string;
	message: string | null;
	createdAt: number;
	post: { id: string; title: string } | null;
	profile: ProfileViewData;
	firstPhotoKey: string | null;
}

export const load: PageServerLoad = ({ locals }) => {
	if (!locals.user) redirect(302, '/login');
	const me = locals.user;

	const myTraitsRow = db.select().from(profileTraits).where(eq(profileTraits.userId, me.id)).get();
	const myTraits: ProfileTraits = myTraitsRow
		? { ...createEmptyTraits(), ...myTraitsRow }
		: createEmptyTraits();

	const allPhotos = db.select().from(profilePhotos).orderBy(asc(profilePhotos.displayOrder)).all();
	const photosByUser = new Map<string, ProfilePhotoItem[]>();
	for (const p of allPhotos) {
		const list = photosByUser.get(p.userId) ?? [];
		list.push({ id: p.id, storageKey: p.storageKey, displayOrder: p.displayOrder });
		photosByUser.set(p.userId, list);
	}

	const allTraits = db.select().from(profileTraits).all();
	const traitsByUser = new Map<string, ProfileTraits>();
	for (const t of allTraits) {
		traitsByUser.set(t.userId, { ...createEmptyTraits(), ...t });
	}

	const allPosts = db.select({ id: posts.id, title: posts.title }).from(posts).all();
	const postById = new Map(allPosts.map((p) => [p.id, p]));

	// Received pending likes (same university only)
	const receivedRows = db
		.select({
			like: likes,
			sender: users
		})
		.from(likes)
		.innerJoin(users, eq(likes.fromUserId, users.id))
		.where(and(eq(likes.toUserId, me.id), eq(likes.status, 'pending'), eq(users.school, me.school)))
		.orderBy(desc(likes.createdAt))
		.all();

	const received: ReceivedLikeItem[] = receivedRows.map(({ like, sender }) => {
		const senderPhotos = photosByUser.get(sender.id) ?? [];
		const senderTraits = traitsByUser.get(sender.id) ?? createEmptyTraits();
		const compatibility = calculateTraitCompatibility(myTraits, senderTraits);

		return {
			id: like.id,
			message: like.message,
			createdAt: like.createdAt,
			post: like.postId ? (postById.get(like.postId) ?? null) : null,
			firstPhotoKey: senderPhotos[0]?.storageKey ?? null,
			profile: {
				user: {
					id: sender.id,
					nickname: sender.nickname,
					sex: sender.sex,
					birthYear: sender.birthYear,
					admissionYear: sender.admissionYear,
					school: sender.school,
					major: sender.major,
					housingType: sender.housingType,
					preferredRegion: sender.preferredRegion,
					budgetDeposit: sender.budgetDeposit,
					budgetMonthly: sender.budgetMonthly
				},
				photos: senderPhotos,
				traits: senderTraits,
				compatibility
			}
		};
	});

	return {
		title: '관심',
		received
	};
};
