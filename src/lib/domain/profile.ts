import type { Sex, UserHousingType } from '#lib/domain/constants.js';
import type { ProfileTraits, TraitCompatibilityResult } from '#lib/domain/traits.js';

export interface ProfilePhotoItem {
	id: string;
	storageKey: string;
	displayOrder: number;
}

export interface ProfileUserSummary {
	id: string;
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

export interface ProfileViewData {
	user: ProfileUserSummary;
	photos: ProfilePhotoItem[];
	traits: ProfileTraits;
	compatibility?: TraitCompatibilityResult | null;
}

export function formatKoreanAge(birthYear: number): string {
	const currentYear = new Date().getFullYear();
	const age = currentYear - birthYear;
	return `${age}세`;
}

export function formatAdmissionShort(admissionYear: number): string {
	return `${String(admissionYear).slice(-2)}학번`;
}

export function formatBudget(
	deposit: number | null | undefined,
	monthly: number | null | undefined
): string | null {
	if (deposit != null && monthly != null) {
		return `보증금 ${deposit}만 / 월 ${monthly}만`;
	}
	if (deposit != null) {
		return `보증금 ${deposit}만 이하`;
	}
	if (monthly != null) {
		return `월세 ${monthly}만 이하`;
	}
	return null;
}
