import { redirect } from '@sveltejs/kit';
import { and, asc, desc, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { REGION_PRESETS, type PostHousingType, type Sex } from '#lib/domain/constants.js';
import { db } from '#lib/server/db/index.js';
import { posts, profilePhotos, users } from '#lib/server/db/schema.js';

export type PostHousingFilter = 'all' | PostHousingType;

export interface PostFilters {
	housing: PostHousingFilter;
	region: string;
	maxMonthly: number | null;
	mine: boolean;
}

export interface PostListItem {
	id: string;
	housingType: PostHousingType;
	recruitCount: number;
	region: string | null;
	budgetDeposit: number | null;
	budgetMonthly: number | null;
	title: string;
	content: string;
	createdAt: number;
	isAuthor: boolean;
	author: {
		id: string;
		nickname: string;
		sex: Sex;
		admissionYear: number;
		major: string;
		firstPhotoKey: string | null;
	};
}

function parsePositiveInt(raw: string | null): number | null {
	if (!raw) return null;
	const trimmed = raw.trim();
	if (!trimmed) return null;
	const num = Number(trimmed);
	return Number.isInteger(num) && num >= 0 ? num : null;
}

export const load: PageServerLoad = ({ locals, url }) => {
	if (!locals.user) {
		redirect(302, '/login');
	}

	const me = locals.user;

	const housingParam = url.searchParams.get('housing');
	const housing: PostHousingFilter =
		housingParam === 'dorm' || housingParam === 'off_campus' ? housingParam : 'all';
	const regionParam = (url.searchParams.get('region') ?? '').trim();
	const region = REGION_PRESETS.includes(regionParam as (typeof REGION_PRESETS)[number])
		? regionParam
		: '';
	const maxMonthly = parsePositiveInt(url.searchParams.get('maxMonthly'));
	const mine = url.searchParams.get('mine') === '1';

	const filters: PostFilters = {
		housing,
		region,
		maxMonthly,
		mine
	};

	const rows = db
		.select({
			post: posts,
			author: {
				id: users.id,
				nickname: users.nickname,
				sex: users.sex,
				admissionYear: users.admissionYear,
				major: users.major
			}
		})
		.from(posts)
		.innerJoin(users, eq(posts.authorId, users.id))
		.where(and(eq(posts.status, 'open'), eq(posts.school, me.school), eq(users.school, me.school)))
		.orderBy(desc(posts.createdAt))
		.all();

	const allPhotos = db
		.select({
			userId: profilePhotos.userId,
			storageKey: profilePhotos.storageKey,
			displayOrder: profilePhotos.displayOrder
		})
		.from(profilePhotos)
		.orderBy(asc(profilePhotos.displayOrder))
		.all();

	const firstPhotoByUser = new Map<string, string>();
	for (const p of allPhotos) {
		if (!firstPhotoByUser.has(p.userId)) {
			firstPhotoByUser.set(p.userId, p.storageKey);
		}
	}

	const filtered: PostListItem[] = rows
		.filter(({ post }) => {
			if (post.status !== 'open') return false;
			if (housing !== 'all' && post.housingType !== housing) return false;
			if (region && post.region !== region) return false;
			if (maxMonthly !== null && post.budgetMonthly !== null && post.budgetMonthly > maxMonthly) {
				return false;
			}
			if (mine && post.authorId !== me.id) return false;
			return true;
		})
		.map(({ post, author }) => {
			const isAuthor = author.id === me.id;

			return {
				id: post.id,
				housingType: post.housingType,
				recruitCount: post.recruitCount,
				region: post.region,
				budgetDeposit: post.budgetDeposit,
				budgetMonthly: post.budgetMonthly,
				title: post.title,
				content: post.content,
				createdAt: post.createdAt,
				isAuthor,
				author: {
					...author,
					firstPhotoKey: firstPhotoByUser.get(author.id) ?? null
				}
			};
		});

	return {
		title: '모집글',
		user: me,
		posts: filtered,
		filters
	};
};
