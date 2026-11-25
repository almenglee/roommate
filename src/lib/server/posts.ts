import { POST_HOUSING_TYPES, REGION_PRESETS, type PostHousingType } from '#lib/domain/constants.js';
import { getFormInt, getFormString } from '#lib/server/form.js';

export interface ParsedPostInput {
	housingType: PostHousingType;
	recruitCount: number;
	region: string | null;
	budgetDeposit: number | null;
	budgetMonthly: number | null;
	title: string;
	content: string;
}

export function parsePostForm(
	formData: FormData
): { ok: true; data: ParsedPostInput } | { ok: false; error: string } {
	const housingRaw = getFormString(formData, 'housingType');
	if (!POST_HOUSING_TYPES.includes(housingRaw as PostHousingType)) {
		return { ok: false, error: '주거 유형을 선택해 주세요.' };
	}
	const housingType = housingRaw as PostHousingType;

	const recruitCountRaw = getFormInt(formData, 'recruitCount') ?? 1;
	if (recruitCountRaw < 1 || recruitCountRaw > 10) {
		return { ok: false, error: '모집 인원은 1~10명 사이로 선택해 주세요.' };
	}
	const recruitCount = recruitCountRaw;

	const regionRaw = getFormString(formData, 'region').trim();
	const region =
		regionRaw && REGION_PRESETS.includes(regionRaw as (typeof REGION_PRESETS)[number])
			? regionRaw
			: null;

	const budgetDepositRaw = getFormInt(formData, 'budgetDeposit');
	const budgetMonthlyRaw = getFormInt(formData, 'budgetMonthly');
	const budgetDeposit =
		housingType === 'dorm'
			? null
			: budgetDepositRaw !== null && budgetDepositRaw >= 0
				? budgetDepositRaw
				: null;
	const budgetMonthly =
		housingType === 'dorm'
			? null
			: budgetMonthlyRaw !== null && budgetMonthlyRaw >= 0
				? budgetMonthlyRaw
				: null;

	const title = getFormString(formData, 'title').trim();
	const content = getFormString(formData, 'content').trim();

	if (housingType === 'off_campus' && !region) {
		return { ok: false, error: '자취·쉐어 모집글은 희망 지역을 선택해 주세요.' };
	}

	if (!title || title.length > 80) {
		return { ok: false, error: '제목을 1~80자 이내로 입력해 주세요.' };
	}

	if (!content || content.length > 1500) {
		return { ok: false, error: '상세 내용을 1~1500자 이내로 입력해 주세요.' };
	}

	return {
		ok: true,
		data: {
			housingType,
			recruitCount,
			region,
			budgetDeposit,
			budgetMonthly,
			title,
			content
		}
	};
}
