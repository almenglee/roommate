import { error, redirect } from '@sveltejs/kit';
import { and, asc, eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import type { ProfilePhotoItem, ProfileViewData } from '#lib/domain/profile.js';
import {
	calculateTraitCompatibility,
	createEmptyTraits,
	type ProfileTraits
} from '#lib/domain/traits.js';
import { db } from '#lib/server/db/index.js';
import { likes, posts, profilePhotos, profileTraits, users } from '#lib/server/db/schema.js';
import { respondToLike } from '#lib/server/matching.js';

export interface LikeDetailData {
	id: string;
	message: string | null;
	createdAt: number;
	post: { id: string; title: string } | null;
	profile: ProfileViewData;
}

export const load: PageServerLoad = ({ locals, params }) => {
	if (!locals.user) redirect(302, '/login');
	const me = locals.user;

	const row = db
		.select({
			like: likes,
			sender: users
		})
		.from(likes)
		.innerJoin(users, eq(likes.fromUserId, users.id))
		.where(
			and(
				eq(likes.id, params.id),
				eq(likes.toUserId, me.id),
				eq(likes.status, 'pending'),
				eq(users.school, me.school)
			)
		)
		.get();

	if (!row) {
		error(404, '관심 내역을 찾을 수 없습니다.');
	}

	const { like, sender } = row;

	const myTraitsRow = db.select().from(profileTraits).where(eq(profileTraits.userId, me.id)).get();
	const myTraits: ProfileTraits = myTraitsRow
		? { ...createEmptyTraits(), ...myTraitsRow }
		: createEmptyTraits();

	const senderTraitsRow = db
		.select()
		.from(profileTraits)
		.where(eq(profileTraits.userId, sender.id))
		.get();
	const senderTraits: ProfileTraits = senderTraitsRow
		? { ...createEmptyTraits(), ...senderTraitsRow }
		: createEmptyTraits();

	const senderPhotos: ProfilePhotoItem[] = db
		.select()
		.from(profilePhotos)
		.where(eq(profilePhotos.userId, sender.id))
		.orderBy(asc(profilePhotos.displayOrder))
		.all()
		.map((p) => ({ id: p.id, storageKey: p.storageKey, displayOrder: p.displayOrder }));

	const postRow = like.postId
		? db
				.select({ id: posts.id, title: posts.title })
				.from(posts)
				.where(and(eq(posts.id, like.postId), eq(posts.school, me.school)))
				.get()
		: null;

	const compatibility = calculateTraitCompatibility(myTraits, senderTraits);

	const detail: LikeDetailData = {
		id: like.id,
		message: like.message,
		createdAt: like.createdAt,
		post: postRow ?? null,
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

	return {
		title: sender.nickname,
		like: detail
	};
};

export const actions: Actions = {
	accept: ({ locals, params }) => {
		if (!locals.user) redirect(302, '/login');

		try {
			const res = respondToLike({
				likeId: params.id,
				currentUserId: locals.user.id,
				decision: 'accept'
			});
			if (res.matchId) {
				redirect(303, `/matches/${res.matchId}`);
			}
			redirect(303, '/likes');
		} catch (err) {
			if (err instanceof Error && err.message === 'LIKE_NOT_FOUND') {
				error(404, '관심 내역을 찾을 수 없습니다.');
			}
			if (err instanceof Error && err.message === 'CROSS_SCHOOL_FORBIDDEN') {
				error(403, '같은 학교 사용자만 수락할 수 있습니다.');
			}
			throw err;
		}
	},

	reject: ({ locals, params }) => {
		if (!locals.user) redirect(302, '/login');

		try {
			respondToLike({
				likeId: params.id,
				currentUserId: locals.user.id,
				decision: 'reject'
			});
			redirect(303, '/likes');
		} catch (err) {
			if (err instanceof Error && err.message === 'LIKE_NOT_FOUND') {
				error(404, '관심 내역을 찾을 수 없습니다.');
			}
			if (err instanceof Error && err.message === 'CROSS_SCHOOL_FORBIDDEN') {
				error(403, '같은 학교 사용자만 거절할 수 있습니다.');
			}
			throw err;
		}
	}
};
