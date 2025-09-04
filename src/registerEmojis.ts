import type { SummonerSpellResponse } from './types/ddragon';
import type { EmojiResponse } from './types/emoji';
import { getChampions } from './utils/champion';
import { getLatestDDragonVersion } from './utils/riotapi';
import { getRunes } from './utils/rune';

const registerChampionEmojis = async (appId: string, token: string) => {
	const champions = await getChampions();

	for (const champion of champions) {
		const buf = await (await fetch(champion.img)).arrayBuffer();
		const data = `data:image/jpeg;base64,${Buffer.from(buf).toString('base64')}`;
		await fetch(`https://discord.com/api/v10/applications/${appId}/emojis`, {
			method: 'POST',
			body: JSON.stringify({ name: champion.id, image: data }),
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bot ${token}`,
			},
		});
	}
	console.log('Successfully registered champion emojis.');
};

const registerSummonerSpellEmojis = async (appId: string, token: string) => {
	const latestVer = await getLatestDDragonVersion();
	const spellRes = (await (
		await fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVer}/data/en_US/summoner.json`)
	).json()) as SummonerSpellResponse;
	const spells = Object.values(spellRes.data).map((s) => ({
		img: `https://ddragon.leagueoflegends.com/cdn/${latestVer}/img/spell/${s.id}.png`,
		name: `SummonerSpell_${s.key}`,
	}));
	for (const spell of spells) {
		const buf = await (await fetch(spell.img)).arrayBuffer();
		const data = `data:image/jpeg;base64,${Buffer.from(buf).toString('base64')}`;
		await fetch(`https://discord.com/api/v10/applications/${appId}/emojis`, {
			method: 'POST',
			body: JSON.stringify({ name: spell.name, image: data }),
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bot ${token}`,
			},
		});
	}
	console.log('Successfully registered summoner spell emojis.');
};

const registerRuneEmojis = async (appId: string, token: string) => {
	const runes = await getRunes();
	for (const rune of runes) {
		const buf = await (await fetch(rune.img)).arrayBuffer();
		const data = `data:image/jpeg;base64,${Buffer.from(buf).toString('base64')}`;
		await fetch(`https://discord.com/api/v10/applications/${appId}/emojis`, {
			method: 'POST',
			body: JSON.stringify({ name: `Rune_${rune.id}`, image: data }),
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bot ${token}`,
			},
		});
	}
	console.log('Successfully registered rune emojis.');
};

const registerLaneEmojis = async (appId: string, token: string) => {
	const positions = ['Top', 'Jungle', 'Middle', 'Bottom', 'Support'] as const;
	for (const position of positions) {
		const positionName = position === 'Support' ? 'utility' : position.toLowerCase();
		const url = `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-${positionName}.png`;
		const buf = await (await fetch(url)).arrayBuffer();
		const data = `data:image/png;base64,${Buffer.from(buf).toString('base64')}`;
		await fetch(`https://discord.com/api/v10/applications/${appId}/emojis`, {
			method: 'POST',
			body: JSON.stringify({ name: position, image: data }),
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bot ${token}`,
			},
		});
	}
	console.log('Successfully registered lane emojis.');
};

const registerItemEmojis = async (appId: string, token: string) => {
	const latestVer = await getLatestDDragonVersion();
	const itemIDsResponse = await fetch(`${process.env.WS_SERVER}/itemIDs`);
	const itemIDs = (await itemIDsResponse.json()) as string[];
	for (const itemID of itemIDs) {
		const url = `https://ddragon.leagueoflegends.com/cdn/${latestVer}/img/item/${itemID}.png`;
		const buf = await (await fetch(url)).arrayBuffer();
		const data = `data:image/png;base64,${Buffer.from(buf).toString('base64')}`;
		await fetch(`https://discord.com/api/v10/applications/${appId}/emojis`, {
			method: 'POST',
			body: JSON.stringify({ name: `Item_${itemID}`, image: data }),
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bot ${token}`,
			},
		});
	}
	console.log('Successfully registered item emojis.');
};

const removeAllRegisteredEmojis = async (appId: string, token: string) => {
	const emojiRes = (await (
		await fetch(`https://discord.com/api/v10/applications/${appId}/emojis`, {
			headers: {
				Authorization: `Bot ${token}`,
			},
		})
	).json()) as EmojiResponse;
	// console.dir(emojiRes, { depth: null });
	for (const item of emojiRes.items) {
		const res = await fetch(`https://discord.com/api/v10/applications/${appId}/emojis/${item.id}`, {
			method: 'DELETE',
			headers: {
				Authorization: `Bot ${token}`,
			},
		});
		if (res.status === 204) {
			/* console.log(`Successfully deleted emoji of id: ${item.id}`);*/
		} else console.log(`Failed to delete emoji of id: ${item.id}`);
	}
};

const main = async () => {
	const appId = process.env.DISCORD_APPID;
	const token = process.env.DISCORD_TOKEN;
	if (!appId || !token) {
		console.log('Failed to get env vars');
		console.log(`App ID: ${appId}`);
		console.log(`Token: ${token}`);
		return;
	}
	await removeAllRegisteredEmojis(appId, token);
	await registerSummonerSpellEmojis(appId, token);
	await registerRuneEmojis(appId, token);
	await registerChampionEmojis(appId, token);
	await registerLaneEmojis(appId, token);
	// await registerItemEmojis(appId, token);
};

main();
