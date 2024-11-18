import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { Colors, EmbedBuilder, VoiceChannel, type StringSelectMenuInteraction } from 'discord.js';
import type { PlayerData } from '../types/team';
import type { CreateResponse } from '../types/payload';

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
			.setTitle(`Team room created for ${vc.name}! (ID: ${id})`)
			.addFields({
				name: 'Click here↓',
				value: `[Team Room link](https://lol.tunatuna.dev/team/${id})`,
				inline: false,
			});

		await interaction.reply({ embeds: [embed] });
	}
}
