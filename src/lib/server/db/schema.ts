import {
	index,
	integer,
	primaryKey,
	sqliteTable,
	text,
	uniqueIndex
} from 'drizzle-orm/sqlite-core';
import {
	LIKE_STATUS_VALUES,
	POST_HOUSING_TYPES,
	POST_STATUS_VALUES,
	SEX_VALUES,
	USER_HOUSING_TYPES
} from '#lib/domain/constants.js';
import {
	CLEANLINESS_VALUES,
	DRINKING_VALUES,
	LIGHTS_OUT_VALUES,
	NOISE_TOLERANCE_VALUES,
	ROOM_CALL_FREQUENCY_VALUES,
	ROOM_FOOD_VALUES,
	SLEEP_SCHEDULE_VALUES,
	SMOKING_VALUES,
	SNORING_VALUES,
	WAKE_UP_SCHEDULE_VALUES,
	WEEKEND_ROUTINE_VALUES
} from '#lib/domain/traits.js';

export const users = sqliteTable(
	'users',
	{
		id: text('id').primaryKey(),
		email: text('email').notNull().unique(),
		passwordHash: text('password_hash').notNull(),
		nickname: text('nickname').notNull(),
		sex: text('sex', { enum: SEX_VALUES }).notNull(),
		birthYear: integer('birth_year').notNull(),
		admissionYear: integer('admission_year').notNull(),
		school: text('school').notNull(),
		major: text('major').notNull(),
		housingType: text('housing_type', { enum: USER_HOUSING_TYPES }).notNull().default('both'),
		preferredRegion: text('preferred_region'),
		budgetDeposit: integer('budget_deposit'),
		budgetMonthly: integer('budget_monthly'),
		createdAt: integer('created_at').notNull()
	},
	(table) => [index('users_school_idx').on(table.school)]
);

export const sessions = sqliteTable(
	'sessions',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		expiresAt: integer('expires_at').notNull()
	},
	(table) => [index('sessions_user_id_idx').on(table.userId)]
);

export const profilePhotos = sqliteTable(
	'profile_photos',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		storageKey: text('storage_key').notNull(),
		displayOrder: integer('display_order').notNull(),
		createdAt: integer('created_at').notNull()
	},
	(table) => [index('profile_photos_user_order_idx').on(table.userId, table.displayOrder)]
);

export const profileTraits = sqliteTable('profile_traits', {
	userId: text('user_id')
		.primaryKey()
		.references(() => users.id, { onDelete: 'cascade' }),
	sleep_schedule: text('sleep_schedule', { enum: SLEEP_SCHEDULE_VALUES }),
	wake_up_schedule: text('wake_up_schedule', { enum: WAKE_UP_SCHEDULE_VALUES }),
	cleanliness: text('cleanliness', { enum: CLEANLINESS_VALUES }),
	noise_tolerance: text('noise_tolerance', { enum: NOISE_TOLERANCE_VALUES }),
	lights_out: text('lights_out', { enum: LIGHTS_OUT_VALUES }),
	smoking: text('smoking', { enum: SMOKING_VALUES }),
	drinking: text('drinking', { enum: DRINKING_VALUES }),
	room_food: text('room_food', { enum: ROOM_FOOD_VALUES }),
	weekend_routine: text('weekend_routine', { enum: WEEKEND_ROUTINE_VALUES }),
	snoring: text('snoring', { enum: SNORING_VALUES }),
	room_call_frequency: text('room_call_frequency', { enum: ROOM_CALL_FREQUENCY_VALUES })
});

export const posts = sqliteTable(
	'posts',
	{
		id: text('id').primaryKey(),
		authorId: text('author_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		housingType: text('housing_type', { enum: POST_HOUSING_TYPES }).notNull(),
		recruitCount: integer('recruit_count').notNull().default(1),
		school: text('school'),
		region: text('region'),
		budgetDeposit: integer('budget_deposit'),
		budgetMonthly: integer('budget_monthly'),
		title: text('title').notNull(),
		content: text('content').notNull(),
		status: text('status', { enum: POST_STATUS_VALUES }).notNull().default('open'),
		createdAt: integer('created_at').notNull(),
		updatedAt: integer('updated_at').notNull()
	},
	(table) => [
		index('posts_status_created_idx').on(table.status, table.createdAt),
		index('posts_school_status_created_idx').on(table.school, table.status, table.createdAt)
	]
);

export const likes = sqliteTable(
	'likes',
	{
		id: text('id').primaryKey(),
		fromUserId: text('from_user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		toUserId: text('to_user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		postId: text('post_id').references(() => posts.id, { onDelete: 'set null' }),
		message: text('message'),
		status: text('status', { enum: LIKE_STATUS_VALUES }).notNull().default('pending'),
		createdAt: integer('created_at').notNull()
	},
	(table) => [
		uniqueIndex('likes_from_to_unique').on(table.fromUserId, table.toUserId),
		index('likes_to_status_idx').on(table.toUserId, table.status)
	]
);

export const passes = sqliteTable(
	'passes',
	{
		fromUserId: text('from_user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		toUserId: text('to_user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		createdAt: integer('created_at').notNull()
	},
	(table) => [primaryKey({ columns: [table.fromUserId, table.toUserId] })]
);

export const matches = sqliteTable(
	'matches',
	{
		id: text('id').primaryKey(),
		userAId: text('user_a_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		userBId: text('user_b_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		createdAt: integer('created_at').notNull()
	},
	(table) => [uniqueIndex('matches_pair_unique').on(table.userAId, table.userBId)]
);

export const messages = sqliteTable(
	'messages',
	{
		id: text('id').primaryKey(),
		matchId: text('match_id')
			.notNull()
			.references(() => matches.id, { onDelete: 'cascade' }),
		senderId: text('sender_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		content: text('content').notNull(),
		createdAt: integer('created_at').notNull(),
		readAt: integer('read_at')
	},
	(table) => [index('messages_match_created_idx').on(table.matchId, table.createdAt)]
);
