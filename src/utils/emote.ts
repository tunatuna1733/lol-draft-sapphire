import { emotes } from '../data';
import type { EmoteResponse } from '../types/cdragon';
import type { ChampInfo } from '../types/ddragon';

export const getAllEmotes = async (champions: ChampInfo[]) => {
	const res = await fetch(
		'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/summoner-emotes.json',
	);
	const emoteResponse = (await res.json()) as EmoteResponse;
	const emotes = emoteResponse.map((emote) => {
		const url = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/${emote.inventoryIcon.replace('/lol-game-data/assets/', '')}`;
		const champs = emote.taggedChampionsIds.map((id) => {
			const champ = champions.find((c) => Number(c.key) === id);
			return champ ? champ.id : null;
		});
		return {
			id: emote.id,
			name: emote.name,
			url,
			taggedChampions: champs.filter((id) => id !== null) as string[],
			description: emote.description,
		};
	});
	return emotes;
};

export const getEmoteUrl = (name?: string) => {
	if (!name || name.trim() === '') return '';
	const emote = emotes.find((e) => e.name === name);
	if (!emote) return '';
	return emote.url;
};
