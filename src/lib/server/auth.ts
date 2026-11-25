import crypto from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { sessions, users } from '#lib/server/db/schema.js';
export { hashPassword, verifyPassword } from '#lib/server/password.js';
import type { SessionUser } from '../../app.d.ts';

export const SESSION_COOKIE_NAME = 'roommate_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export function createSession(userId: string): { sessionId: string; expiresAt: number } {
	const sessionId = crypto.randomBytes(32).toString('hex');
	const expiresAt = Date.now() + SESSION_TTL_MS;
	db.insert(sessions).values({ id: sessionId, userId, expiresAt }).run();
	return { sessionId, expiresAt };
}

export function validateSession(sessionId: string): SessionUser | null {
	const row = db
		.select({
			sessionId: sessions.id,
			expiresAt: sessions.expiresAt,
			user: {
				id: users.id,
				email: users.email,
				nickname: users.nickname,
				sex: users.sex,
				birthYear: users.birthYear,
				admissionYear: users.admissionYear,
				school: users.school,
				major: users.major,
				housingType: users.housingType,
				preferredRegion: users.preferredRegion,
				budgetDeposit: users.budgetDeposit,
				budgetMonthly: users.budgetMonthly
			}
		})
		.from(sessions)
		.innerJoin(users, eq(sessions.userId, users.id))
		.where(eq(sessions.id, sessionId))
		.get();

	if (!row) return null;

	if (row.expiresAt <= Date.now()) {
		db.delete(sessions).where(eq(sessions.id, sessionId)).run();
		return null;
	}

	return row.user;
}

export function invalidateSession(sessionId: string): void {
	db.delete(sessions).where(eq(sessions.id, sessionId)).run();
}

export function setSessionCookie(
	cookies: Cookies,
	sessionId: string,
	expiresAt: number,
	secure = false
): void {
	cookies.set(SESSION_COOKIE_NAME, sessionId, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure,
		expires: new Date(expiresAt)
	});
}

export function deleteSessionCookie(cookies: Cookies): void {
	cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
}
