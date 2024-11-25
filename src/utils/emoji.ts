import { emojis } from '../data';
import type { EmojiResponse } from '../types/emoji';

export const getAllEmojis = async () => {
	const appId = process.env.DISCORD_APPID;
	const token = process.env.DISCORD_TOKEN;
	if (!appId || !token) {
		console.log('Failed to get env vars');
		console.log(`App ID: ${appId}`);
		console.log(`Token: ${token}`);
		return;
	}
	const emojiRes = (await (
		await fetch(`https://discord.com/api/v10/applications/${appId}/emojis`, {
			headers: {
				Authorization: `Bot ${token}`,
			},
		})
	).json()) as EmojiResponse;
	console.log(`Initialized ${emojiRes.items.length} emojis`);
	return emojiRes.items;
};

export const getEmoji = (id: string) => {
	const emoji = emojis.find((e) => e.name === id);
	if (!emoji) return '';
	return `<:${emoji.name}:${emoji.id}>`;
};
