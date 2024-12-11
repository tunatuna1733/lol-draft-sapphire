import type { SpectatorResponse } from '../types/riotapi';

const API_KEY = process.env.RIOT_API_KEY;
if (!API_KEY) {
	console.error('Failed to get Riot API Key');
	process.exit(1);
}
const headers = {
	'X-Riot-Token': API_KEY,
};

type AccountResponse = {
	puuid: string;
	gameName: string;
	tagLine: string;
};
export const getPuuidByNameAndTag = async (name: string, tag: string) => {
	const res = await fetch(`https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${name}/${tag}`, {
		headers,
	});
	if (!res.ok) return;
	const json = (await res.json()) as AccountResponse;
	return json;
};

type IdResponse = {
	accountId: string; // encrypted account id
	profileIconId: number;
	revisionDate: number;
	id: string; // encrypted summoner id
	puuid: string; // encrypted puuid
	summonerLevel: number;
};
export const getIds = async (puuid: string) => {
	const res = await fetch(`https://jp1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`, { headers });
	if (!res.ok) return;
	const json = (await res.json()) as IdResponse;
	return json;
};

export const getLatestDDragonVersion = async (short = false) => {
	const res = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
	if (!res.ok) return short ? '14.24' : '14.24.1'; // placeholder
	const json = (await res.json()) as string[];
	if (short) {
		const s = json[0].split('.');
		return `${s[0]}.${s[1]}`;
	}
	return json[0];
};

export const getTwoLatestVersions = async (short = false) => {
	const res = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
	if (!res.ok) return short ? ['14.23', '14.24'] : ['14.23.1', '14.24.1']; // placeholder
	const json = (await res.json()) as string[];
	if (short) {
		const s = json[0].split('.');
		const s2 = json[1].split('.');
		return [`${s[0]}.${s[1]}`, `${s2[0]}.${s2[1]}`];
	}
	return [json[0], json[1]];
};

export const getSpecData = async (puuid: string) => {
	const res = await fetch(`https://jp1.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${puuid}`, {
		headers,
	});
	if (!res.ok || res.status === 404) return;
	const json = (await res.json()) as SpectatorResponse;
	return json;
};
