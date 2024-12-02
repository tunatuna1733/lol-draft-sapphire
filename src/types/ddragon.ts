export type RawChampInfo = {
	id: string;
	name: string;
	key: string;
	image: {
		full: string;
	};
};

export type ChampsResponse = {
	data: { [index in string]: RawChampInfo };
};

export type ChampInfo = {
	id: string;
	jpname: string;
	enname: string;
	key: string;
	img: string;
};

export type SummonerSpellResponse = {
	data: {
		[index in string]: {
			id: string;
			name: string;
			key: string;
		};
	};
};

export type RuneResponse = {
	id: number;
	// key: string;
	icon: string;
	name: string;
	slots: {
		runes: {
			id: number;
			icon: string;
			name: string;
		}[];
	}[];
}[];

export type CRuneResponse = {
	id: number;
	name: string;
	iconPath: string;
}[];

export type RuneInfo = {
	id: number;
	name: string;
	img: string;
};
