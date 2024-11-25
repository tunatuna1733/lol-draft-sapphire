import type { ChampInfo } from './types/ddragon';
import type { EmojiData } from './types/emoji';
import { getChampions } from './utils/champion';
import { getAllEmojis } from './utils/emoji';

type RoomID = string;
type ChannelID = string;
export const rooms: Record<RoomID, ChannelID> = {};

export let champions: ChampInfo[] = [];
export const initChampions = async () => {
	champions = await getChampions();
};

export let emojis: EmojiData[] = [];
export const initEmojis = async () => {
	const res = await getAllEmojis();
	if (res) emojis = res;
};
