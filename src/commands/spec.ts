import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { ApplicationIntegrationType, Colors, EmbedBuilder, InteractionContextType } from 'discord.js';
import { getPuuidByNameAndTag, getSpecData } from '../utils/riotapi';
import { getChampion } from '../utils/champion';
import { getEmoji } from '../utils/emoji';
import { getRune } from '../utils/rune';

@ApplyOptions<Command.Options>({
	description: 'Get current match data.',
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

		const specData = await getSpecData(riotAccountData.puuid);
		if (!specData) {
			const embed = new EmbedBuilder().setColor(Colors.Grey).setTitle('This player is not in match.');
			await interaction.editReply({ content: '', embeds: [embed] });
			return;
		}

		const playerData = specData.participants.find((p) => p.puuid === riotAccountData.puuid);
		if (!playerData) {
			await interaction.editReply('Error');
			return;
		}

		const playerChamp = getChampion(playerData.championId.toString());
		if (!playerChamp) {
			await interaction.editReply('Failed to get champion data.');
			return;
		}

		const minutes = Math.floor(specData.gameLength / 60);
		const seconds = specData.gameLength - minutes * 60;

		const mainRunes = playerData.perks.perkIds
			.slice(0, 4)
			.map((r) => `- ${getEmoji(`Rune_${r}`)} ${getRune(r)?.name}`)
			.join('\n');
		const subRunes = playerData.perks.perkIds
			.slice(4, 6)
			.map((r) => `- ${getEmoji(`Rune_${r}`)} ${getRune(r)?.name}`)
			.join('\n');
		const statsRunes = playerData.perks.perkIds
			.slice(6)
			.map((r) => `- ${getEmoji(`Rune_${r}`)} ${getRune(r)?.name}`)
			.join('\n');

		const embed = new EmbedBuilder()
			.setColor(Colors.Blue)
			.setTitle(`${playerData.riotId} is playing ${specData.gameMode} for ${minutes}m${seconds}s`)
			.setDescription(`Champion:  **${playerChamp.jpname}**`)
			.setThumbnail(playerChamp.img)
			.addFields(
				{
					name: `Summoner Spells: ${getEmoji(`SummonerSpell_${playerData.spell1Id}`)} ${getEmoji(`SummonerSpell_${playerData.spell2Id}`)}`,
					value: ' ',
					inline: false,
				},
				{
					name: `Main Runes: ${getEmoji(`Rune_${playerData.perks.perkStyle}`)} ${getRune(playerData.perks.perkStyle)?.name}`,
					value: mainRunes,
					inline: true,
				},
				{
					name: '\u200b',
					value: '\u200b',
					inline: true,
				},
				{
					name: `Sub Runes: ${getEmoji(`Rune_${playerData.perks.perkSubStyle}`)} ${getRune(playerData.perks.perkSubStyle)?.name}`,
					value: subRunes,
					inline: true,
				},
				{
					name: 'Stats Runes',
					value: statsRunes,
					inline: false,
				},
			);

		await interaction.editReply({ content: '', embeds: [embed] });
	}
}
