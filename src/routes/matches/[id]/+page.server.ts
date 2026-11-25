import { error, redirect } from '@sveltejs/kit';
import { and, asc, eq, isNull, ne } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import type { ProfileViewData } from '#lib/domain/profile.js';
import { calculateTraitCompatibility, createEmptyTraits } from '#lib/domain/traits.js';
import type { ChatMessageDTO } from '#lib/domain/chat.js';
import { db } from '#lib/server/db/index.js';
import { messages, profilePhotos, profileTraits, users } from '#lib/server/db/schema.js';
import { getMatchForParticipant } from '#lib/server/matching.js';

export const load: PageServerLoad = ({ locals, params }) => {
	if (!locals.user) redirect(302, '/login');
	const me = locals.user;

	const match = getMatchForParticipant(params.id, me.id);
	if (!match) {
		error(404, '채팅방을 찾을 수 없습니다.');
	}

	// Mark incoming messages from the partner as read upon opening the chat room
	db.update(messages)
		.set({ readAt: Date.now() })
		.where(
			and(eq(messages.matchId, match.id), ne(messages.senderId, me.id), isNull(messages.readAt))
		)
		.run();

	const partnerId = match.userAId === me.id ? match.userBId : match.userAId;
	const partner = db.select().from(users).where(eq(users.id, partnerId)).get();
	if (!partner) {
		error(404, '상대방 정보를 찾을 수 없습니다.');
	}

	const partnerPhotos = db
		.select({
			id: profilePhotos.id,
			storageKey: profilePhotos.storageKey,
			displayOrder: profilePhotos.displayOrder
		})
		.from(profilePhotos)
		.where(eq(profilePhotos.userId, partner.id))
		.orderBy(asc(profilePhotos.displayOrder))
		.all();

	const myTraitsRow = db.select().from(profileTraits).where(eq(profileTraits.userId, me.id)).get();
	const myTraits = myTraitsRow ? { ...createEmptyTraits(), ...myTraitsRow } : createEmptyTraits();

	const partnerTraitsRow = db
		.select()
		.from(profileTraits)
		.where(eq(profileTraits.userId, partner.id))
		.get();
	const partnerTraits = partnerTraitsRow
		? { ...createEmptyTraits(), ...partnerTraitsRow }
		: createEmptyTraits();

	const partnerProfile: ProfileViewData = {
		user: {
			id: partner.id,
			nickname: partner.nickname,
			sex: partner.sex,
			birthYear: partner.birthYear,
			admissionYear: partner.admissionYear,
			school: partner.school,
			major: partner.major,
			housingType: partner.housingType,
			preferredRegion: partner.preferredRegion,
			budgetDeposit: partner.budgetDeposit,
			budgetMonthly: partner.budgetMonthly
		},
		photos: partnerPhotos,
		traits: partnerTraits,
		compatibility: calculateTraitCompatibility(myTraits, partnerTraits)
	};

	const initialMessages: ChatMessageDTO[] = db
		.select({
			id: messages.id,
			matchId: messages.matchId,
			senderId: messages.senderId,
			content: messages.content,
			createdAt: messages.createdAt
		})
		.from(messages)
		.where(eq(messages.matchId, match.id))
		.orderBy(asc(messages.createdAt))
		.all();

	return {
		title: partner.nickname,
		matchId: match.id,
		currentUserId: me.id,
		partnerFirstPhotoKey: partnerPhotos[0]?.storageKey ?? null,
		partnerProfile,
		initialMessages
	};
};
