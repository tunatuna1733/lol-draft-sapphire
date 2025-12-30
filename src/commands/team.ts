import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import {
	ActionRowBuilder,
	ApplicationIntegrationType,
	ChannelType,
	Colors,
	EmbedBuilder,
	InteractionContextType,
	MessageFlags,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} from 'discord.js';
import { db } from '..';
import type { CreateResponse } from '../types/payload';
import type { PlayerData } from '../types/team';
import { calcElo, getIds, getPlayerStats } from '../utils/riotapi';

@ApplyOptions<Command.Options>({
	description: 'Create draft room',
})
export class UserCommand extends Command {
	// Register Chat Input and Context Menu command
	public override registerApplicationCommands(registry: Command.Registry) {
		// Create shared integration types and contexts
		// These allow the command to be used in guilds and DMs
		const integrationTypes: ApplicationIntegrationType[] = [
			ApplicationIntegrationType.GuildInstall,
			ApplicationIntegrationType.UserInstall,
		];
		const contexts: InteractionContextType[] = [
			InteractionContextType.BotDM,
			InteractionContextType.Guild,
			InteractionContextType.PrivateChannel,
		];

		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.setIntegrationTypes(integrationTypes)
				.setContexts(contexts)
				.addBooleanOption((option) => option.setName('ephemeral').setRequired(false)),
		);
	}

	// Chat Input (slash) command
	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		return this.sendTeam(interaction);
	}

	private async sendTeam(interaction: Command.ChatInputCommandInteraction) {
		if (!interaction.channel?.isSendable()) return;

		const ephemeral = interaction.options.getBoolean('ephemeral', false) || false;

		if (ephemeral) {
			await interaction.deferReply({ withResponse: true, flags: MessageFlags.Ephemeral });
		} else {
			await interaction.deferReply({ withResponse: true });
		}

		const voiceChannels = (await interaction.guild?.channels.fetch(undefined, { cache: false, force: true }))?.filter(
			(ch) => ch?.type === ChannelType.GuildVoice,
		);

		if (!voiceChannels) {
			await interaction.editReply('Something went wrong while fetchin vc.');
			return;
		}

		if (voiceChannels.size === 0) {
			await interaction.editReply('No VC found.');
			return;
		}

		const activeVC = voiceChannels.filter((vc) => vc && vc.members.size > 0);

		if (activeVC.size === 0) {
			await interaction.editReply('No active VC found.');
			return;
		}

		if (activeVC.size === 1) {
			const vc = activeVC.at(0);
			if (!vc) {
				await interaction.editReply('Failed to collect vc info.');
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
					elo: calcElo(
						stats?.SOLO?.points || 0,
						stats?.FLEX?.points || 0,
						ids?.summonerLevel || 0,
						stats?.SOLO?.winRate || 0,
					),
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

			await interaction.editReply({ embeds: [embed] });
		} else {
			const options: StringSelectMenuOptionBuilder[] = [];
			for (const vc of activeVC) {
				if (vc[1]) {
					options.push(new StringSelectMenuOptionBuilder().setLabel(vc[1].name).setValue(vc[1].id));
				}
			}
			const select = new StringSelectMenuBuilder()
				.setCustomId('team-vc-select')
				.setPlaceholder('Select VC')
				.addOptions(...options);

			const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents([select]);

			await interaction.editReply({ content: 'Choose VC to create team.', components: [row] });
		}
	}
}
