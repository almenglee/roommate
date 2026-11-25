import type { Handle } from '@sveltejs/kit/hooks';
import { deleteSessionCookie, SESSION_COOKIE_NAME, validateSession } from '#lib/server/auth.js';
import { ensureSeeded } from '#lib/server/db/seed.js';

export const handle: Handle = async ({ event, resolve }) => {
	ensureSeeded();

	const sessionId = event.cookies.get(SESSION_COOKIE_NAME) ?? null;

	if (!sessionId) {
		event.locals.user = null;
		event.locals.sessionId = null;
		return resolve(event);
	}

	const user = validateSession(sessionId);
	if (!user) {
		deleteSessionCookie(event.cookies);
		event.locals.user = null;
		event.locals.sessionId = null;
		return resolve(event);
	}

	event.locals.user = user;
	event.locals.sessionId = sessionId;
	return resolve(event);
};
