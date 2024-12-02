import type { ChampInfo, RuneInfo } from './types/ddragon';
import type { EmojiData } from './types/emoji';
import { getChampions } from './utils/champion';
import { getAllEmojis } from './utils/emoji';
import { getRunes } from './utils/rune';

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

export let runes: RuneInfo[] = [];
export const initRunes = async () => {
	runes = await getRunes();
};
