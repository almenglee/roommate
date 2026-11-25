import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { error, json } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { MAX_PROFILE_PHOTOS } from '#lib/domain/constants.js';
import { db, UPLOADS_DIR } from '#lib/server/db/index.js';
import { profilePhotos } from '#lib/server/db/schema.js';

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB

const EXT_BY_MIME: Record<string, string> = {
	'image/jpeg': '.jpg',
	'image/png': '.png',
	'image/webp': '.webp',
	'image/gif': '.gif',
	'image/svg+xml': '.svg'
};

function listUserPhotos(userId: string) {
	return db
		.select({
			id: profilePhotos.id,
			storageKey: profilePhotos.storageKey,
			displayOrder: profilePhotos.displayOrder
		})
		.from(profilePhotos)
		.where(eq(profilePhotos.userId, userId))
		.orderBy(asc(profilePhotos.displayOrder))
		.all();
}

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		error(401, '로그인이 필요합니다.');
	}

	const existing = listUserPhotos(locals.user.id);
	if (existing.length >= MAX_PROFILE_PHOTOS) {
		error(400, `사진은 최대 ${MAX_PROFILE_PHOTOS}장까지 등록할 수 있습니다.`);
	}

	const formData = await request.formData();
	const file = formData.get('file');
	if (!(file instanceof File) || file.size === 0) {
		error(400, '이미지 파일을 선택해 주세요.');
	}

	if (file.size > MAX_FILE_BYTES) {
		error(400, '이미지 파일 크기는 5MB 이하만 업로드할 수 있습니다.');
	}

	const ext = EXT_BY_MIME[file.type];
	if (!ext) {
		error(400, 'JPG, PNG, WEBP, GIF, SVG 이미지만 업로드할 수 있습니다.');
	}

	const photoId = crypto.randomUUID();
	const storageKey = `${locals.user.id}-${photoId}${ext}`;
	const targetPath = path.join(UPLOADS_DIR, storageKey);

	const buffer = Buffer.from(await file.arrayBuffer());
	fs.writeFileSync(targetPath, buffer);

	db.insert(profilePhotos)
		.values({
			id: photoId,
			userId: locals.user.id,
			storageKey,
			displayOrder: existing.length,
			createdAt: Date.now()
		})
		.run();

	return json({ photos: listUserPhotos(locals.user.id) }, { status: 201 });
};
