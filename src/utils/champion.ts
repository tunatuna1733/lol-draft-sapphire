import { champions } from '../data';
import type { ChampInfo, ChampsResponse } from '../types/ddragon';

export const getChampions = async () => {
	const verRes = (await (await fetch('https://ddragon.leagueoflegends.com/api/versions.json')).json()) as string[];
	const latestVer = verRes[0];
	const enChampRes = (await (
		await fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVer}/data/en_US/champion.json`)
	).json()) as ChampsResponse;
	const jpChampRes = (await (
		await fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVer}/data/ja_JP/champion.json`)
	).json()) as ChampsResponse;
	const jpChamps = Object.values(jpChampRes.data);
	const champInfo: ChampInfo[] = Object.values(enChampRes.data).map((champ, index) => ({
		id: champ.id,
		enname: champ.name,
		jpname: jpChamps[index].name,
		key: champ.key,
		img: `https://ddragon.leagueoflegends.com/cdn/${latestVer}/img/champion/${champ.image.full}`,
	}));
	return champInfo;
};

export const isChampionId = (id: string) => {
	const res = champions.find((c) => c.id === id);
	return res !== undefined;
};

export const getChampionKey = (id: string) => {
	const res = champions.find((c) => c.id === id)?.key;
	return res || '0';
};

export const getChampion = (key: string) => {
	const res = champions.find((c) => c.key === key);
	return res;
};
