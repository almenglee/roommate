import { and, eq, sql } from 'drizzle-orm';
import type { LayoutServerLoad } from './$types';
import { db } from '#lib/server/db/index.js';
import { likes, users } from '#lib/server/db/schema.js';

export const load: LayoutServerLoad = ({ locals }) => {
	let pendingLikesCount = 0;

	if (locals.user) {
		pendingLikesCount =
			db
				.select({ count: sql<number>`count(*)` })
				.from(likes)
				.innerJoin(users, eq(likes.fromUserId, users.id))
				.where(
					and(
						eq(likes.toUserId, locals.user.id),
						eq(likes.status, 'pending'),
						eq(users.school, locals.user.school)
					)
				)
				.get()?.count ?? 0;
	}

	return {
		user: locals.user,
		pendingLikesCount
	};
};
