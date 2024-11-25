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
