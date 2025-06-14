import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { Colors, EmbedBuilder, type StringSelectMenuInteraction, VoiceChannel } from 'discord.js';
import { db } from '..';
import type { CreateResponse } from '../types/payload';
import type { PlayerData } from '../types/team';
import { calcElo, getIds, getPlayerStats } from '../utils/riotapi';

export class MenuHandler extends InteractionHandler {
	public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
		super(ctx, {
			...options,
			interactionHandlerType: InteractionHandlerTypes.SelectMenu,
		});
	}

	public override parse(interaction: StringSelectMenuInteraction) {
		if (interaction.customId !== 'team-vc-select') return this.none();

		return this.some();
	}

	public async run(interaction: StringSelectMenuInteraction) {
		const value = interaction.values[0];
		const vc = await interaction.guild?.channels.fetch(value);
		if (!vc || !(vc instanceof VoiceChannel)) {
			interaction.reply('Failed to get vc');
			return;
		}

		const players: PlayerData[] = [];
		for (const member of vc.members) {
			const puuid = (await db.findUserByDiscordId(member[1].id))?.puuid;
			if (!puuid) continue;
			const stats = await getPlayerStats(puuid);
			const ids = await getIds(puuid);
			players.push({
				id: member[1].id,
				name: member[1].displayName,
				icon: member[1].displayAvatarURL(),
				lane: '',
        level: ids?.summonerLevel || 0,
        elo: calcElo(stats?.SOLO?.points || 0, stats?.FLEX?.points || 0, ids?.summonerLevel || 0, stats?.SOLO?.winRate || 0),
				SOLO: stats?.SOLO,
				FLEX: stats?.FLEX,
			});
		}
		const url = `${process.env.WS_SERVER}/createTeam`;
		const res = await fetch(url, {
			method: 'POST',
			body: JSON.stringify({ players, channelId: interaction.channelId }),
		});
		const resJson = (await res.json()) as CreateResponse;
		const id = resJson.id;
		const embed = new EmbedBuilder()
			.setColor(Colors.Blue)
			.setTitle(`Team room created for ${vc.name}! (ID: ${id})`)
			.addFields({
				name: 'Click here↓',
				value: `[Team Room link](${process.env.WEB_SERVER}/team/${id})`,
				inline: false,
			});

		await interaction.reply({ embeds: [embed] });
	}
}
