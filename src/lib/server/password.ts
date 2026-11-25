import crypto from 'node:crypto';

export function hashPassword(password: string): string {
	const salt = crypto.randomBytes(16).toString('hex');
	const derived = crypto.scryptSync(password, salt, 64).toString('hex');
	return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
	const [salt, keyHex] = storedHash.split(':');
	if (!salt || !keyHex) return false;
	const keyBuf = Buffer.from(keyHex, 'hex');
	const derivedBuf = crypto.scryptSync(password, salt, 64);
	if (keyBuf.length !== derivedBuf.length) return false;
	return crypto.timingSafeEqual(keyBuf, derivedBuf);
}
