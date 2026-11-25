import type { ChatMessageDTO } from '#lib/domain/chat.js';

export type { ChatMessageDTO };

type Listener = (message: ChatMessageDTO) => void;

const GLOBAL_KEY = '__roommate_chat_hub__';

function getChannelMap(): Map<string, Set<Listener>> {
	const g = globalThis as Record<string, unknown>;
	if (!(g[GLOBAL_KEY] instanceof Map)) {
		g[GLOBAL_KEY] = new Map<string, Set<Listener>>();
	}
	return g[GLOBAL_KEY] as Map<string, Set<Listener>>;
}

export function subscribeToMatch(matchId: string, listener: Listener): () => void {
	const channels = getChannelMap();
	let set = channels.get(matchId);
	if (!set) {
		set = new Set<Listener>();
		channels.set(matchId, set);
	}
	set.add(listener);

	return () => {
		const current = channels.get(matchId);
		if (!current) return;
		current.delete(listener);
		if (current.size === 0) {
			channels.delete(matchId);
		}
	};
}

export function publishChatMessage(message: ChatMessageDTO): void {
	const channels = getChannelMap();
	const listeners = channels.get(message.matchId);
	if (!listeners) return;
	for (const listener of listeners) {
		try {
			listener(message);
		} catch {
			// Ignore broken stream listener errors
		}
	}
}
