export type SpectatorResponse = {
	gameId: string;
	gameType: string;
	gameStartTime: number;
	gameLength: number;
	gameMode: string; // ARAM | CLASSIC
	gameQueueConfigId: number; // see https://static.developer.riotgames.com/docs/lol/queues.json
	bannedChampions: {
		pickTurn: number;
		championId: number;
		teamId: number;
	}[];
	participants: {
		championId: number;
		perks: {
			perkIds: number[];
			perkStyle: number;
			perkSubStyle: number;
		};
		summonerId: string;
		puuid: string;
		spell1Id: number;
		spell2Id: number;
		teamId: number;
		riotId: string;
	}[];
};

export type RankedTier =
	| 'CHALLENGER'
	| 'GRANDMASTER'
	| 'MASTER'
	| 'DIAMOND'
	| 'EMERALD'
	| 'PLATINUM'
	| 'GOLD'
	| 'SILVER'
	| 'BRONZE'
	| 'IRON';

export type RankedDivision = 'I' | 'II' | 'III' | 'IV';

export type StatsResponse = {
	queueType: 'RANKED_SOLO_5x5' | 'RANKED_FLEX_SR';
	tier: RankedTier;
	rank: RankedDivision;
	leaguePoints: number;
	wins: number;
	losses: number;
};

export type PlayerStats = {
	SOLO?: {
		tier: RankedTier;
		rank: RankedDivision;
		leaguePoints: number;
		points: number;
		winRate: number;
	};
	FLEX?: {
		tier: RankedTier;
		rank: RankedDivision;
		leaguePoints: number;
		points: number;
		winRate: number;
	};
};
