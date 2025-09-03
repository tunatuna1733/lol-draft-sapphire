import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { ApplicationIntegrationType, Colors, EmbedBuilder, InteractionContextType } from 'discord.js';
import { getEmoji } from '../utils/emoji';

type Item = {
	id: number;
	name: string;
	description: string;
	stats: { [key: string]: number };
};

@ApplyOptions<Command.Options>({
	description: 'Random build',
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
				.addBooleanOption((option) => option.setName('no-ad').setDescription('No AD items.').setRequired(false))
				.addBooleanOption((option) => option.setName('no-ap').setDescription('No AP items.').setRequired(false))
				.addBooleanOption((option) => option.setName('no-as').setDescription('No AS items.').setRequired(false))
				.addBooleanOption((option) => option.setName('no-def').setDescription('No AR/MR items.').setRequired(false))
				.addBooleanOption((option) => option.setName('no-crit').setDescription('No Critical items.').setRequired(false))
				.addBooleanOption((option) =>
					option.setName('is-support').setDescription('Include support item.').setRequired(false),
				),
		);
	}

	// Chat Input (slash) command
	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		return this.sendBuild(interaction);
	}

	private async sendBuild(interaction: Command.ChatInputCommandInteraction) {
		if (!interaction.channel?.isSendable()) return;
		await interaction.deferReply({ withResponse: true });

		let url = `${process.env.WS_SERVER}/build`;
		url += `?noAD=${interaction.options.getBoolean('no-ad', false) || false}`;
		url += `&noAP=${interaction.options.getBoolean('no-ap', false) || false}`;
		url += `&noAS=${interaction.options.getBoolean('no-as', false) || false}`;
		url += `&noRes=${interaction.options.getBoolean('no-def', false) || false}`;
		url += `&noCrit=${interaction.options.getBoolean('no-crit', false) || false}`;
		url += `&isSupport=${interaction.options.getBoolean('is-support', false) || false}`;

		const res = await fetch(url);
		const data = (await res.json()) as Item[];

		const embed = new EmbedBuilder()
			.setColor(Colors.Purple)
			.setTitle('Random Build!!!')
			.addFields([
				{
					name: 'Boots',
					value: `${getEmoji(`Item_${data[0].id}`)} ${data[0].name}`,
					inline: false,
				},
				{
					name: 'Items',
					value: data
						.slice(1)
						.map((item) => `${getEmoji(`Item_${item.id}`)} ${item.name}`)
						.join('\n'),
					inline: false,
				},
			]);

		await interaction.editReply({ embeds: [embed] });
	}
}
