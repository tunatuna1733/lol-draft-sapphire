import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { ApplicationIntegrationType, Colors, EmbedBuilder, InteractionContextType } from 'discord.js';
import type { CreateResponse } from '../types/response';

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
				.addStringOption((option) => option.setName('draft-name').setDescription('Draft name').setRequired(false))
				.addStringOption((option) => option.setName('team1-name').setDescription('Team1 name').setRequired(false))
				.addStringOption((option) => option.setName('team2-name').setDescription('Team2 name').setRequired(false)),
		);
	}

	// Chat Input (slash) command
	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		return this.sendCustom(interaction);
	}

	private async sendCustom(interaction: Command.ChatInputCommandInteraction) {
		if (!interaction.channel?.isSendable()) return;
		const draftName = interaction.options.getString('draft-name', false) || '';
		const team1Name = interaction.options.getString('team1-name', false) || 'Team1';
		const team2Name = interaction.options.getString('team2-name', false) || 'Team2';

		const url = `https://urgot.tunatuna.dev/createRoom?matchName=${draftName}&team1Name=${team1Name}&team2Name=${team2Name}`;
		const res = await fetch(url);
		const resJson = (await res.json()) as CreateResponse;
		const id = resJson.id;
		const embed = new EmbedBuilder()
			.setColor(Colors.Blurple)
			.setTitle(`Draft room created! (ID: ${id})`)
			.addFields(
				{
					name: `:blue_circle: ${team1Name}`,
					value: `[${team1Name} link](https://lol.tunatuna.dev/draft/${id}?team=Blue)`,
					inline: false,
				},
				{
					name: `:red_circle: ${team2Name}`,
					value: `[${team2Name} link](https://lol.tunatuna.dev/draft/${id}?team=Red)`,
					inline: false,
				},
				{
					name: ':black_circle: Spectator',
					value: `[Spectator link](https://lol.tunatuna.dev/draft/${id})`,
					inline: false,
				},
			);

		await interaction.reply({ embeds: [embed] });
	}
}