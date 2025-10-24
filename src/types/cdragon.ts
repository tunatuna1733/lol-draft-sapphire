export type EmoteResponse = {
	id: number;
	contentId: string;
	name: string;
	inventoryIcon: string;
	taggedChampionsIds: number[];
	description: string;
}[];

export interface EmoteData {
	id: number;
	name: string;
	url: string;
	taggedChampions: string[];
	description: string;
}
