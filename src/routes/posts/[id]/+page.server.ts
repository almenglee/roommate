import { error, redirect } from '@sveltejs/kit';
import { and, asc, eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import type { ProfileViewData } from '#lib/domain/profile.js';
import { calculateTraitCompatibility, createEmptyTraits } from '#lib/domain/traits.js';
import { db } from '#lib/server/db/index.js';
import {
	likes,
	matches,
	posts,
	profilePhotos,
	profileTraits,
	users
} from '#lib/server/db/schema.js';
import { sortUserPair } from '#lib/server/matching.js';

export const load: PageServerLoad = ({ locals, params }) => {
	if (!locals.user) redirect(302, '/login');

	const me = locals.user;

	const row = db
		.select({
			post: posts,
			author: users
		})
		.from(posts)
		.innerJoin(users, eq(posts.authorId, users.id))
		.where(eq(posts.id, params.id))
		.get();

	if (!row) {
		error(404, '모집글을 찾을 수 없습니다.');
	}

	const { post, author } = row;
	const isAuthor = author.id === me.id;

	if (post.school !== me.school || author.school !== me.school) {
		error(404, '모집글을 찾을 수 없습니다.');
	}

	if (!isAuthor && post.status !== 'open') {
		error(404, '모집글을 찾을 수 없습니다.');
	}

	const authorPhotos = db
		.select({
			id: profilePhotos.id,
			storageKey: profilePhotos.storageKey,
			displayOrder: profilePhotos.displayOrder
		})
		.from(profilePhotos)
		.where(eq(profilePhotos.userId, author.id))
		.orderBy(asc(profilePhotos.displayOrder))
		.all();

	const authorTraitsRow = db
		.select()
		.from(profileTraits)
		.where(eq(profileTraits.userId, author.id))
		.get();
	const authorTraits = authorTraitsRow
		? { ...createEmptyTraits(), ...authorTraitsRow }
		: createEmptyTraits();

	let compatibility = null;
	let alreadyLiked = false;
	let existingMatchId: string | null = null;

	if (!isAuthor) {
		const myTraitsRow = db
			.select()
			.from(profileTraits)
			.where(eq(profileTraits.userId, me.id))
			.get();
		const myTraits = myTraitsRow ? { ...createEmptyTraits(), ...myTraitsRow } : createEmptyTraits();
		compatibility = calculateTraitCompatibility(myTraits, authorTraits);

		const [userAId, userBId] = sortUserPair(me.id, author.id);
		const existingMatch = db
			.select({ id: matches.id })
			.from(matches)
			.where(and(eq(matches.userAId, userAId), eq(matches.userBId, userBId)))
			.get();
		existingMatchId = existingMatch?.id ?? null;

		if (!existingMatchId) {
			const sentLike = db
				.select({ id: likes.id })
				.from(likes)
				.where(and(eq(likes.fromUserId, me.id), eq(likes.toUserId, author.id)))
				.get();
			alreadyLiked = Boolean(sentLike);
		}
	}

	const authorProfile: ProfileViewData = {
		user: {
			id: author.id,
			nickname: author.nickname,
			sex: author.sex,
			birthYear: author.birthYear,
			admissionYear: author.admissionYear,
			school: author.school,
			major: author.major,
			housingType: author.housingType,
			preferredRegion: author.preferredRegion,
			budgetDeposit: author.budgetDeposit,
			budgetMonthly: author.budgetMonthly
		},
		photos: authorPhotos,
		traits: authorTraits,
		compatibility
	};

	return {
		title: post.title,
		post,
		isAuthor,
		authorProfile,
		alreadyLiked,
		existingMatchId
	};
};

export const actions: Actions = {
	delete: ({ locals, params }) => {
		if (!locals.user) redirect(302, '/login');

		const post = db.select().from(posts).where(eq(posts.id, params.id)).get();
		if (!post) error(404, '모집글을 찾을 수 없습니다.');
		if (post.authorId !== locals.user.id) error(403, '권한이 없습니다.');

		db.delete(posts).where(eq(posts.id, post.id)).run();
		redirect(303, '/posts');
	}
};
