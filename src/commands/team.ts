import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { ApplicationIntegrationType, ChannelType, Colors, EmbedBuilder, InteractionContextType } from 'discord.js';
import type { CreateResponse } from '../types/response';
import type { PlayerData } from '../types/team';

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
				.setContexts(contexts),
		);
	}

	// Chat Input (slash) command
	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		return this.sendTeam(interaction);
	}

	private async sendTeam(interaction: Command.ChatInputCommandInteraction) {
		if (!interaction.channel?.isSendable()) return;

		const voiceChannels = (await interaction.guild?.channels.fetch())?.filter(
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
			const players: PlayerData[] = vc.members.map((member) => ({
				name: member.displayName,
				icon: member.displayAvatarURL(),
				lane: '',
			}));
			const url = 'https://urgot.tunatuna.dev/createTeam';
			const res = await fetch(url, { method: 'POST', body: JSON.stringify({ players }) });
			const resJson = (await res.json()) as CreateResponse;
			const id = resJson.id;
			const embed = new EmbedBuilder()
				.setColor(Colors.Blue)
				.setTitle(`Team room created! (ID: ${id})`)
				.addFields({
					name: 'Click here↓',
					value: `[Team Room link](https://lol.tunatuna.dev/team/${id})`,
					inline: false,
				});

			await interaction.reply({ embeds: [embed] });
		}
	}
}
