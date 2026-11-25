export function formatRelativeTime(timestamp: number): string {
	const diffMs = Date.now() - timestamp;
	const diffMin = Math.floor(diffMs / 60_000);
	if (diffMin < 1) return '방금 전';
	if (diffMin < 60) return `${diffMin}분 전`;

	const diffHour = Math.floor(diffMin / 60);
	if (diffHour < 24) return `${diffHour}시간 전`;

	const diffDay = Math.floor(diffHour / 24);
	if (diffDay < 7) return `${diffDay}일 전`;

	const date = new Date(timestamp);
	return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

export function formatRelativeTimeCompact(timestamp: number): string {
	const diffMs = Math.max(0, Date.now() - timestamp);
	const diffMin = Math.floor(diffMs / 60_000);
	if (diffMin < 1) return '방금';
	if (diffMin < 60) return `${diffMin}분`;

	const diffHour = Math.floor(diffMin / 60);
	if (diffHour < 24) return `${diffHour}시간`;

	const diffDay = Math.floor(diffHour / 24);
	if (diffDay < 7) return `${diffDay}일`;

	const diffWeek = Math.floor(diffDay / 7);
	if (diffWeek < 4) return `${diffWeek}주`;

	const date = new Date(timestamp);
	return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

export function formatTimeShort(timestamp: number): string {
	const date = new Date(timestamp);
	const hours = date.getHours();
	const minutes = String(date.getMinutes()).padStart(2, '0');
	const period = hours < 12 ? '오전' : '오후';
	const hour12 = hours % 12 || 12;
	return `${period} ${hour12}:${minutes}`;
}
