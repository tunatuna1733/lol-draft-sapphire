import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { ApplicationIntegrationType, Colors, EmbedBuilder, InteractionContextType } from 'discord.js';
import { getIds, getLatestDDragonVersion, getPuuidByNameAndTag } from '../utils/riotapi';
import type { UserData } from '../types/db';
import { db } from '..';
import { DBNotInitialized, DBWriteError } from '../utils/error';

@ApplyOptions<Command.Options>({
	description: 'Register your riot account to this bot.',
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
				.addStringOption((option) =>
					option.setName('riot-id').setDescription('Riot ID (ex. Username#tag)').setRequired(true),
				),
		);
	}

	// Chat Input (slash) command
	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		return this.sendCustom(interaction);
	}

	private async sendCustom(interaction: Command.ChatInputCommandInteraction) {
		if (!interaction.channel?.isSendable()) return;
		await interaction.deferReply({ fetchReply: true });
		const riotAccount = interaction.options.getString('riot-id', true);
		if (!riotAccount.includes('#')) {
			await interaction.editReply('Invalid Riot ID.');
			return;
		}

		const [riotId, riotTag] = riotAccount.split('#');
		const riotAccountData = await getPuuidByNameAndTag(riotId, riotTag);
		if (!riotAccountData) {
			await interaction.editReply('Riot account not found.');
			return;
		}

		const idData = await getIds(riotAccountData.puuid);
		if (!idData) {
			await interaction.editReply('Failed to get riot account data.');
			return;
		}

		const data: UserData = {
			discordId: interaction.user.id,
			riotId,
			riotTag,
			puuid: riotAccountData.puuid,
			accountId: idData.accountId,
			summonerId: idData.id,
		};

		const profileIconUrl = `https://ddragon.leagueoflegends.com/cdn/${await getLatestDDragonVersion()}/img/profileicon/${idData.profileIconId}.png`;

		try {
			await db.upsertUser(data);
		} catch (e) {
			if (e instanceof DBNotInitialized) {
				await interaction.editReply('Database is starting...');
				return;
			}
			if (e instanceof DBWriteError) {
				await interaction.editReply('Failed to update database.');
				return;
			}
		}

		const embed = new EmbedBuilder()
			.setColor(Colors.Green)
			.setTitle('Riot account registered')
			.setDescription(`**${riotId}#${riotTag}** (Summoner Level: ${idData.summonerLevel})`)
			.setThumbnail(profileIconUrl);

		await interaction.editReply({ content: '', embeds: [embed] });
	}
}
