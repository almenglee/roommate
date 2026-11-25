import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

export const DATA_DIR = path.resolve(process.cwd(), 'data');
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
export const DB_PATH = path.join(DATA_DIR, 'roommate.db');

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

export const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

sqlite.exec(`
CREATE TABLE IF NOT EXISTS users (
	id TEXT PRIMARY KEY,
	email TEXT NOT NULL UNIQUE,
	password_hash TEXT NOT NULL,
	nickname TEXT NOT NULL,
	sex TEXT NOT NULL CHECK (sex IN ('male', 'female')),
	birth_year INTEGER NOT NULL,
	admission_year INTEGER NOT NULL,
	school TEXT NOT NULL,
	major TEXT NOT NULL,
	housing_type TEXT NOT NULL DEFAULT 'both' CHECK (housing_type IN ('dorm', 'off_campus', 'both')),
	preferred_region TEXT,
	budget_deposit INTEGER,
	budget_monthly INTEGER,
	created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS users_school_idx ON users(school);

CREATE TABLE IF NOT EXISTS sessions (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);

CREATE TABLE IF NOT EXISTS profile_photos (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	storage_key TEXT NOT NULL,
	display_order INTEGER NOT NULL,
	created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS profile_photos_user_order_idx ON profile_photos(user_id, display_order);

CREATE TABLE IF NOT EXISTS profile_traits (
	user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
	sleep_schedule TEXT CHECK (sleep_schedule IN ('early', 'regular', 'late', 'varies')),
	wake_up_schedule TEXT CHECK (wake_up_schedule IN ('very_early', 'early', 'regular', 'late', 'varies')),
	cleanliness TEXT CHECK (cleanliness IN ('very_tidy', 'tidy', 'relaxed', 'messy')),
	noise_tolerance TEXT CHECK (noise_tolerance IN ('sensitive', 'normal', 'tolerant')),
	lights_out TEXT CHECK (lights_out IN ('early', 'regular', 'late', 'no_preference')),
	smoking TEXT CHECK (smoking IN ('no', 'occasionally', 'often')),
	drinking TEXT CHECK (drinking IN ('no', 'occasionally', 'often', 'prefer_not_to_say')),
	room_food TEXT CHECK (room_food IN ('rarely', 'sometimes', 'often')),
	weekend_routine TEXT CHECK (weekend_routine IN ('mostly_out', 'mostly_in', 'mixed')),
	snoring TEXT CHECK (snoring IN ('never', 'occasionally', 'often', 'unsure')),
	room_call_frequency TEXT CHECK (room_call_frequency IN ('rarely', 'sometimes', 'often'))
);

CREATE TABLE IF NOT EXISTS posts (
	id TEXT PRIMARY KEY,
	author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	housing_type TEXT NOT NULL CHECK (housing_type IN ('dorm', 'off_campus')),
	recruit_count INTEGER NOT NULL DEFAULT 1,
	school TEXT,
	region TEXT,
	budget_deposit INTEGER,
	budget_monthly INTEGER,
	title TEXT NOT NULL,
	content TEXT NOT NULL,
	status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
	created_at INTEGER NOT NULL,
	updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS posts_status_created_idx ON posts(status, created_at);
CREATE INDEX IF NOT EXISTS posts_school_status_created_idx ON posts(school, status, created_at);

CREATE TABLE IF NOT EXISTS likes (
	id TEXT PRIMARY KEY,
	from_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	to_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	post_id TEXT REFERENCES posts(id) ON DELETE SET NULL,
	message TEXT,
	status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
	created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS likes_from_to_unique ON likes(from_user_id, to_user_id);
CREATE INDEX IF NOT EXISTS likes_to_status_idx ON likes(to_user_id, status);

CREATE TABLE IF NOT EXISTS passes (
	from_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	to_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	created_at INTEGER NOT NULL,
	PRIMARY KEY (from_user_id, to_user_id)
);

CREATE TABLE IF NOT EXISTS matches (
	id TEXT PRIMARY KEY,
	user_a_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	user_b_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS matches_pair_unique ON matches(user_a_id, user_b_id);

CREATE TABLE IF NOT EXISTS messages (
	id TEXT PRIMARY KEY,
	match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
	sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	content TEXT NOT NULL,
	created_at INTEGER NOT NULL,
	read_at INTEGER
);
CREATE INDEX IF NOT EXISTS messages_match_created_idx ON messages(match_id, created_at);
`);

// Safe incremental column migrations for existing local SQLite databases
const postColumns = sqlite.prepare('PRAGMA table_info(posts)').all() as { name: string }[];
if (!postColumns.some((col) => col.name === 'recruit_count')) {
	sqlite.exec('ALTER TABLE posts ADD COLUMN recruit_count INTEGER NOT NULL DEFAULT 1');
}

const messageColumns = sqlite.prepare('PRAGMA table_info(messages)').all() as { name: string }[];
if (!messageColumns.some((col) => col.name === 'read_at')) {
	sqlite.exec('ALTER TABLE messages ADD COLUMN read_at INTEGER');
}

// Migrate legacy 'prefer_not_to_say' snoring values to 'unsure'
sqlite.exec("UPDATE profile_traits SET snoring = 'unsure' WHERE snoring = 'prefer_not_to_say'");

export const db = drizzle(sqlite, { schema });
