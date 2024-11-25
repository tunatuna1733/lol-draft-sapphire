import type { ChampsResponse } from './types/ddragon';
import type { EmojiResponse } from './types/emoji';

const registerChampionEmojis = async (appId: string, token: string) => {
	const verRes = (await (await fetch('https://ddragon.leagueoflegends.com/api/versions.json')).json()) as string[];
	const latestVer = verRes[0];
	const champRes = (await (
		await fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVer}/data/en_US/champion.json`)
	).json()) as ChampsResponse;
	const imageUrls = Object.values(champRes.data).map((c) => ({
		id: c.id,
		url: `https://ddragon.leagueoflegends.com/cdn/${latestVer}/img/champion/${c.image.full}`,
	}));

	for (const imageUrl of imageUrls) {
		const buf = await (await fetch(imageUrl.url)).arrayBuffer();
		const data = `data:image/jpeg;base64,${Buffer.from(buf).toString('base64')}`;
		const res = await fetch(`https://discord.com/api/v10/applications/${appId}/emojis`, {
			method: 'POST',
			body: JSON.stringify({ name: imageUrl.id, image: data }),
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bot ${token}`,
			},
		});
		console.dir(await res.json(), { depth: null });
	}
};

const removeAllRegisteredEmojis = async (appId: string, token: string) => {
	const emojiRes = (await (
		await fetch(`https://discord.com/api/v10/applications/${appId}/emojis`, {
			headers: {
				Authorization: `Bot ${token}`,
			},
		})
	).json()) as EmojiResponse;
	console.dir(emojiRes, { depth: null });
	for (const item of emojiRes.items) {
		const res = await fetch(`https://discord.com/api/v10/applications/${appId}/emojis/${item.id}`, {
			method: 'DELETE',
			headers: {
				Authorization: `Bot ${token}`,
			},
		});
		if (res.status === 204) console.log(`Successfully deleted emoji of id: ${item.id}`);
		else console.log(`Failed to delete emoji of id: ${item.id}`);
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
	await registerChampionEmojis(appId, token);
};

main();
