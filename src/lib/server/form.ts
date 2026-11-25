export function getFormString(formData: FormData, key: string, fallback = ''): string {
	const value = formData.get(key);
	return typeof value === 'string' ? value : fallback;
}

export function getFormInt(formData: FormData, key: string): number | null {
	const raw = getFormString(formData, key).trim();
	if (!raw) return null;
	const parsed = Number(raw);
	return Number.isInteger(parsed) ? parsed : null;
}
