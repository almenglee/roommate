import fs from 'node:fs';
import path from 'node:path';
import { error, json } from '@sveltejs/kit';
import { and, asc, eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { db, UPLOADS_DIR } from '#lib/server/db/index.js';
import { profilePhotos } from '#lib/server/db/schema.js';

export const DELETE: RequestHandler = ({ locals, params }) => {
	if (!locals.user) {
		error(401, '로그인이 필요합니다.');
	}

	const userId = locals.user.id;
	const photoId = params.photoId;

	const target = db
		.select()
		.from(profilePhotos)
		.where(and(eq(profilePhotos.id, photoId), eq(profilePhotos.userId, userId)))
		.get();

	if (!target) {
		error(404, '사진을 찾을 수 없습니다.');
	}

	const remaining = db.transaction((tx) => {
		tx.delete(profilePhotos)
			.where(and(eq(profilePhotos.id, photoId), eq(profilePhotos.userId, userId)))
			.run();

		const rest = tx
			.select({
				id: profilePhotos.id,
				storageKey: profilePhotos.storageKey,
				displayOrder: profilePhotos.displayOrder
			})
			.from(profilePhotos)
			.where(eq(profilePhotos.userId, userId))
			.orderBy(asc(profilePhotos.displayOrder))
			.all();

		rest.forEach((row, index) => {
			if (row.displayOrder !== index) {
				tx.update(profilePhotos)
					.set({ displayOrder: index })
					.where(and(eq(profilePhotos.id, row.id), eq(profilePhotos.userId, userId)))
					.run();
				row.displayOrder = index;
			}
		});

		return rest;
	});

	const filePath = path.resolve(UPLOADS_DIR, target.storageKey);
	if (filePath.startsWith(UPLOADS_DIR + path.sep) && fs.existsSync(filePath)) {
		try {
			fs.unlinkSync(filePath);
		} catch {
			// Ignore unlink errors if file already removed
		}
	}

	return json({ photos: remaining });
};
