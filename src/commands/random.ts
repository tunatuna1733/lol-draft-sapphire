import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import {
	ActionRowBuilder,
	ApplicationIntegrationType,
	ChannelType,
	InteractionContextType,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} from 'discord.js';
import { getEmoji } from '../utils/emoji';

const positions = ['Top', 'Jungle', 'Middle', 'Bottom', 'Support'] as const;

@ApplyOptions<Command.Options>({
	description: 'Shuffle lane',
	enabled: false,
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
				.setContexts(contexts),
		);
	}

	// Chat Input (slash) command
	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		return this.sendRandom(interaction);
	}

	private async sendRandom(interaction: Command.ChatInputCommandInteraction) {
		if (!interaction.channel?.isSendable()) return;

		const voiceChannels = (await interaction.guild?.channels.fetch(undefined, { cache: false, force: true }))?.filter(
			(ch) => ch?.type === ChannelType.GuildVoice,
		);

		if (!voiceChannels) {
			await interaction.reply('Something went wrong while fetchin vc.');
			return;
		}

		if (voiceChannels.size === 0) {
			await interaction.reply('No VC found.');
			return;
		}

		const activeVC = voiceChannels.filter((vc) => vc && vc.members.size > 0);

		if (activeVC.size === 0) {
			await interaction.reply('No active VC found.');
			return;
		}

		if (activeVC.size === 1) {
			const vc = activeVC.at(0);
			if (!vc) {
				await interaction.reply('Failed to collect vc info.');
				return;
			}
			const members = vc.members.map((mem) => mem.displayName).sort(() => Math.random() - Math.random());
			let result = '';
			if (members.length <= 5) {
				members.forEach((member, index) => {
					result += `${getEmoji(positions[index])} ${member}`;
				});
				await interaction.reply(result);
			} else {
			}
		} else {
			const options: StringSelectMenuOptionBuilder[] = [];
			for (const vc of activeVC) {
				if (vc[1]) {
					options.push(new StringSelectMenuOptionBuilder().setLabel(vc[1].name).setValue(vc[1].id));
				}
			}
			const select = new StringSelectMenuBuilder()
				.setCustomId('team-vc-select-random')
				.setPlaceholder('Select VC')
				.addOptions(...options);

			const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents([select]);

			await interaction.reply({ content: 'Choose VC to create team.', components: [row] });
		}
	}
}
