import type { Sex, UserHousingType } from '#lib/domain/constants.js';

export interface SessionUser {
	id: string;
	email: string;
	nickname: string;
	sex: Sex;
	birthYear: number;
	admissionYear: number;
	school: string;
	major: string;
	housingType: UserHousingType;
	preferredRegion: string | null;
	budgetDeposit: number | null;
	budgetMonthly: number | null;
}

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: SessionUser | null;
			sessionId: string | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
