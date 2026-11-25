import fs from 'node:fs';
import path from 'node:path';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { UPLOADS_DIR } from '#lib/server/db/index.js';

const MIME_BY_EXT: Record<string, string> = {
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.webp': 'image/webp',
	'.gif': 'image/gif'
};

export const GET: RequestHandler = ({ params }) => {
	const key = params.key;
	if (!key || !/^[a-zA-Z0-9._-]+$/.test(key) || key.includes('..')) {
		error(400, 'Invalid file key');
	}

	const filePath = path.resolve(UPLOADS_DIR, key);
	if (!filePath.startsWith(UPLOADS_DIR + path.sep) || !fs.existsSync(filePath)) {
		error(404, 'File not found');
	}

	const ext = path.extname(key).toLowerCase();
	const contentType = MIME_BY_EXT[ext] ?? 'application/octet-stream';
	const bytes = fs.readFileSync(filePath);

	return new Response(bytes, {
		headers: {
			'Content-Type': contentType,
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
