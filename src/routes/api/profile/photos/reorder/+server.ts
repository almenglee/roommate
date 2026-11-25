import { error, json } from '@sveltejs/kit';
import { and, asc, eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { db } from '#lib/server/db/index.js';
import { profilePhotos } from '#lib/server/db/schema.js';

export const PATCH: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		error(401, '로그인이 필요합니다.');
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, '올바른 요청 형식이 아닙니다.');
	}

	const photoIds =
		typeof body === 'object' && body !== null && 'photoIds' in body && Array.isArray(body.photoIds)
			? body.photoIds.filter((id): id is string => typeof id === 'string')
			: null;

	if (!photoIds) {
		error(400, 'photoIds 배열이 필요합니다.');
	}

	const current = db
		.select({ id: profilePhotos.id })
		.from(profilePhotos)
		.where(eq(profilePhotos.userId, locals.user.id))
		.all();

	const currentSet = new Set(current.map((p) => p.id));
	const uniqueIds = new Set(photoIds);

	if (
		photoIds.length !== current.length ||
		uniqueIds.size !== current.length ||
		!photoIds.every((id) => currentSet.has(id))
	) {
		error(400, '사진 목록이 일치하지 않습니다.');
	}

	const userId = locals.user.id;
	db.transaction((tx) => {
		photoIds.forEach((id, index) => {
			tx.update(profilePhotos)
				.set({ displayOrder: index })
				.where(and(eq(profilePhotos.id, id), eq(profilePhotos.userId, userId)))
				.run();
		});
	});

	const updated = db
		.select({
			id: profilePhotos.id,
			storageKey: profilePhotos.storageKey,
			displayOrder: profilePhotos.displayOrder
		})
		.from(profilePhotos)
		.where(eq(profilePhotos.userId, userId))
		.orderBy(asc(profilePhotos.displayOrder))
		.all();

	return json({ photos: updated });
};
