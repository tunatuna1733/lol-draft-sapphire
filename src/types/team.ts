import type { RankedDivision, RankedTier } from './riotapi';

export type PlayerData = {
	id: string;
	name: string;
	icon: string;
	lane: string;
  level: number;
  elo: number;
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
