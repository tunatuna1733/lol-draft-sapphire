import type { PlayerStats, RankedDivision, RankedTier, SpectatorResponse, StatsResponse } from '../types/riotapi';

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

export const getPlayerStats = async (puuid: string) => {
	const res = await fetch(`https://jp1.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`, {
		headers,
	});
	if (!res.ok || res.status === 404) return;
	const json = (await res.json()) as StatsResponse[];
	const data: PlayerStats = {};
	for (const entry of json) {
		if (entry.queueType === 'RANKED_SOLO_5x5') {
			data.SOLO = {
				tier: entry.tier,
				rank: entry.rank,
				leaguePoints: entry.leaguePoints,
				points: calcRankedPoints(entry.tier, entry.rank, entry.leaguePoints),
				winRate: entry.wins / (entry.wins + entry.losses),
			};
		} else if (entry.queueType === 'RANKED_FLEX_SR') {
			data.FLEX = {
				tier: entry.tier,
				rank: entry.rank,
				leaguePoints: entry.leaguePoints,
				points: calcRankedPoints(entry.tier, entry.rank, entry.leaguePoints),
				winRate: entry.wins / (entry.wins + entry.losses),
			};
		}
	}
	return data;
};

const calcRankedPoints = (tier: RankedTier, div: RankedDivision, points: number) => {
	let elo = 0;
	switch (tier) {
		case 'BRONZE':
			elo += 400;
			break;
		case 'SILVER':
			elo += 800;
			break;
		case 'GOLD':
			elo += 1200;
			break;
		case 'PLATINUM':
			elo += 1600;
			break;
		case 'EMERALD':
			elo += 2000;
			break;
		case 'DIAMOND':
			elo += 2400;
			break;
		case 'MASTER':
			elo += 2800;
			break;
		case 'GRANDMASTER':
			elo += 3200;
			break;
		case 'CHALLENGER':
			elo += 3600;
			break;
		default:
			break;
	}
	switch (div) {
		case 'I':
			elo += 300;
			break;
		case 'II':
			elo += 200;
			break;
		case 'III':
			elo += 100;
			break;
		case 'IV':
			elo += 0;
			break;
		default:
			break;
	}
	elo += points;
	return elo;
};

export const getAllPlayersStats = async (puuids: string[]) => {
	const results = [];
	for (const puuid of puuids) {
		const res = await getPlayerStats(puuid);
		if (!res) continue;
		results.push(res);
	}
	return results;
};

export const calcElo = (soloPoints: number, flexPoints: number, level: number, soloWinrate: number) => {
	const elo =
		level * 2 + soloPoints * (soloWinrate > 0.5 ? 1.2 : 1.1) + (flexPoints === 0 ? soloPoints * 0.5 : flexPoints * 0.8);
	return elo;
};
