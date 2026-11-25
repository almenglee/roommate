import { redirect } from '@sveltejs/kit';
import { and, asc, eq, ne, or } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { REGION_PRESETS, type Sex } from '#lib/domain/constants.js';
import type { ProfilePhotoItem, ProfileViewData } from '#lib/domain/profile.js';
import {
	calculateTraitCompatibility,
	createEmptyTraits,
	isValidTraitValue,
	TRAIT_KEYS,
	type ProfileTraits,
	type TraitKey
} from '#lib/domain/traits.js';
import { db } from '#lib/server/db/index.js';
import {
	likes,
	matches,
	passes,
	profilePhotos,
	profileTraits,
	users
} from '#lib/server/db/schema.js';

export type SexFilter = 'all' | 'male' | 'female';
export type HousingFilter = 'all' | 'dorm' | 'off_campus';

export interface DiscoverFilters {
	sex: SexFilter;
	housing: HousingFilter;
	region: string;
	maxDeposit: number | null;
	maxMonthly: number | null;
	traits: Partial<Record<TraitKey, string[]>>;
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

	// Parse URL filter query parameters (defaults to user's own sex)
	const sexParam = url.searchParams.get('sex');
	const sexFilter: SexFilter =
		sexParam === 'all' || sexParam === 'male' || sexParam === 'female' ? sexParam : me.sex;

	const housingParam = url.searchParams.get('housing');
	const housingFilter: HousingFilter =
		housingParam === 'dorm' || housingParam === 'off_campus' ? housingParam : 'all';

	const regionParam = (url.searchParams.get('region') ?? '').trim();
	const regionFilter = REGION_PRESETS.includes(regionParam as (typeof REGION_PRESETS)[number])
		? regionParam
		: '';

	const maxDeposit = parsePositiveInt(url.searchParams.get('maxDeposit'));
	const maxMonthly = parsePositiveInt(url.searchParams.get('maxMonthly'));

	const traitFilters: Partial<Record<TraitKey, string[]>> = {};
	for (const key of TRAIT_KEYS) {
		const raw = url.searchParams.get(`trait_${key}`);
		if (!raw) continue;
		const validValues = raw
			.split(',')
			.map((v) => v.trim())
			.filter((v) => v && isValidTraitValue(key, v));
		if (validValues.length > 0) {
			traitFilters[key] = Array.from(new Set(validValues));
		}
	}

	const filters: DiscoverFilters = {
		sex: sexFilter,
		housing: housingFilter,
		region: regionFilter,
		maxDeposit,
		maxMonthly,
		traits: traitFilters
	};

	// Load current user's traits
	const myTraitsRow = db.select().from(profileTraits).where(eq(profileTraits.userId, me.id)).get();
	const myTraits: ProfileTraits = myTraitsRow
		? { ...createEmptyTraits(), ...myTraitsRow }
		: createEmptyTraits();

	// Collect exclusion IDs: already sent likes, already matched, already passed
	const sentLikes = db
		.select({ toUserId: likes.toUserId })
		.from(likes)
		.where(eq(likes.fromUserId, me.id))
		.all();
	const myMatches = db
		.select({ userAId: matches.userAId, userBId: matches.userBId })
		.from(matches)
		.where(or(eq(matches.userAId, me.id), eq(matches.userBId, me.id)))
		.all();
	const myPasses = db
		.select({ toUserId: passes.toUserId })
		.from(passes)
		.innerJoin(users, eq(passes.toUserId, users.id))
		.where(and(eq(passes.fromUserId, me.id), eq(users.school, me.school)))
		.all();

	const excludedIds = new Set<string>([me.id]);
	for (const row of sentLikes) excludedIds.add(row.toUserId);
	for (const row of myMatches) {
		excludedIds.add(row.userAId);
		excludedIds.add(row.userBId);
	}
	for (const row of myPasses) excludedIds.add(row.toUserId);

	// Load only same-university candidates, traits, and photos
	const allOtherUsers = db
		.select()
		.from(users)
		.where(and(ne(users.id, me.id), eq(users.school, me.school)))
		.all();
	const allTraitsRows = db.select().from(profileTraits).all();
	const allPhotosRows = db
		.select()
		.from(profilePhotos)
		.orderBy(asc(profilePhotos.displayOrder))
		.all();

	const traitsByUser = new Map<string, ProfileTraits>();
	for (const row of allTraitsRows) {
		traitsByUser.set(row.userId, { ...createEmptyTraits(), ...row });
	}

	const photosByUser = new Map<string, ProfilePhotoItem[]>();
	for (const row of allPhotosRows) {
		const list = photosByUser.get(row.userId) ?? [];
		list.push({
			id: row.id,
			storageKey: row.storageKey,
			displayOrder: row.displayOrder
		});
		photosByUser.set(row.userId, list);
	}

	// Effective sex condition
	const targetSex: Sex | null = sexFilter === 'all' ? null : sexFilter;

	const filtered = allOtherUsers
		.filter((u) => {
			if (excludedIds.has(u.id)) return false;

			if (targetSex && u.sex !== targetSex) return false;

			if (housingFilter === 'dorm' && u.housingType === 'off_campus') return false;
			if (housingFilter === 'off_campus' && u.housingType === 'dorm') return false;

			if (regionFilter && u.preferredRegion !== regionFilter) return false;

			if (maxDeposit !== null && u.budgetDeposit !== null && u.budgetDeposit > maxDeposit) {
				return false;
			}

			if (maxMonthly !== null && u.budgetMonthly !== null && u.budgetMonthly > maxMonthly) {
				return false;
			}

			const userTraits = traitsByUser.get(u.id) ?? createEmptyTraits();
			for (const [key, allowed] of Object.entries(traitFilters) as [TraitKey, string[]][]) {
				const value = userTraits[key];
				if (!value || !allowed.includes(value)) {
					return false;
				}
			}

			return true;
		})
		.map((u) => {
			const userTraits = traitsByUser.get(u.id) ?? createEmptyTraits();
			const compatibility = calculateTraitCompatibility(myTraits, userTraits);
			const view: ProfileViewData = {
				user: {
					id: u.id,
					nickname: u.nickname,
					sex: u.sex,
					birthYear: u.birthYear,
					admissionYear: u.admissionYear,
					school: u.school,
					major: u.major,
					housingType: u.housingType,
					preferredRegion: u.preferredRegion,
					budgetDeposit: u.budgetDeposit,
					budgetMonthly: u.budgetMonthly
				},
				photos: photosByUser.get(u.id) ?? [],
				traits: userTraits,
				compatibility
			};
			return { view, createdAt: u.createdAt };
		})
		.sort((a, b) => {
			const scoreA = a.view.compatibility?.score ?? -1;
			const scoreB = b.view.compatibility?.score ?? -1;
			if (scoreB !== scoreA) return scoreB - scoreA;

			return b.createdAt - a.createdAt;
		})
		.map((item) => item.view);

	return {
		title: '탐색',
		user: me,
		candidates: filtered,
		filters,
		passedCount: myPasses.length
	};
};
