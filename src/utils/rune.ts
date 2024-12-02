import { runes } from '../data';
import type { CRuneResponse, RuneInfo, RuneResponse } from '../types/ddragon';
import { getLatestDDragonVersion } from './riotapi';

export const getRunes = async () => {
	const latestVer = await getLatestDDragonVersion();
	const runeRes = (await (
		await fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVer}/data/ja_JP/runesReforged.json`)
	).json()) as RuneResponse;
	const runes: RuneInfo[] = [];
	for (const mainRune of runeRes) {
		runes.push({
			id: mainRune.id,
			name: mainRune.name,
			img: `https://ddragon.leagueoflegends.com/cdn/img/${mainRune.icon}`,
		});
		for (const slot of mainRune.slots) {
			for (const subRune of slot.runes) {
				runes.push({
					id: subRune.id,
					name: subRune.name,
					img: `https://ddragon.leagueoflegends.com/cdn/img/${subRune.icon}`,
				});
			}
		}
	}
	const cdragonRes = (await (
		await fetch('https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/ja_jp/v1/perks.json')
	).json()) as CRuneResponse;
	for (const rune of cdragonRes) {
		if (!runes.find((r) => r.id === rune.id)) {
			runes.push({
				id: rune.id,
				name: rune.name,
				img: `https://ddragon.leagueoflegends.com/cdn/img/${rune.iconPath.replace('/lol-game-data/assets/v1/', '')}`,
			});
		}
	}
	return runes;
};

export const getRune = (id: number) => {
	const res = runes.find((r) => r.id === id);
	return res;
};
