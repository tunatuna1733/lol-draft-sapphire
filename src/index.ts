import './lib/setup';

import { LogLevel, SapphireClient } from '@sapphire/framework';
import { AttachmentBuilder, EmbedBuilder, GatewayIntentBits, type TextChannel } from 'discord.js';
import Fastify from 'fastify';
import type { DraftImagePayload } from './types/payload';
import { initChampions, initEmojis, rooms } from './data';

const client = new SapphireClient({
	defaultPrefix: '!',
	caseInsensitiveCommands: true,
	logger: {
		level: LogLevel.Debug,
	},
	intents: [
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.MessageContent,
	],
	loadMessageCommandListeners: true,
});

const app = Fastify({ bodyLimit: 12485760 });

app.post('/draftImage', async (req) => {
	const body = req.body as DraftImagePayload;
	const channelId = body.channelId || rooms[body.id];
	if (!channelId) {
		return {
			success: false,
		};
	}
	const channel = await client.channels.fetch(channelId);
	if (!channel) {
		return {
			success: false,
		};
	}
	const buf = Buffer.from(body.image.split(',')[1], 'base64');
	const file = new AttachmentBuilder(buf, { name: 'output.png' });
	const embed = new EmbedBuilder().setTitle('Pick Result').setImage('attachment://output.png');
	(channel as TextChannel).send({ files: [file], embeds: [embed] });
	if (!body.channelId) delete rooms[body.id];
	return {
		success: true,
	};
});

const main = async () => {
	try {
		await initChampions();
		await initEmojis();
		client.logger.info('Logging in');
		await client.login();
		client.logger.info('logged in');
		await app.listen({ port: 8080, host: '0.0.0.0' });
	} catch (error) {
		client.logger.fatal(error);
		await client.destroy();
		process.exit(1);
	}
};

void main();
