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
