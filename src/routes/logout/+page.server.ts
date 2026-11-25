import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { deleteSessionCookie, invalidateSession } from '#lib/server/auth.js';

export const actions: Actions = {
	default: ({ locals, cookies }) => {
		if (locals.sessionId) {
			invalidateSession(locals.sessionId);
		}
		deleteSessionCookie(cookies);
		redirect(303, '/login');
	}
};
