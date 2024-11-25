import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { ApplicationIntegrationType, Colors, EmbedBuilder, InteractionContextType } from 'discord.js';
import { getChampion, getChampionKey, isChampionId } from '../utils/champion';
import { getEmoji } from '../utils/emoji';

type OpggResponse = {
	data: {
		id: number;
		average_stats: {
			play: number;
			win_rate: number;
			pick_rate: number;
			ban_rate: number;
		};
		positions: {
			name: string;
			stats: {
				play: number;
				win_rate: number;
				pick_rate: number;
				ban_rate: number;
			};
			counters: {
				champion_id: number;
				play: number;
				win: number;
			}[];
		}[];
	}[];
	meta: never;
};

type Lanes = 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT';
type Counters = {
	lane: Lanes;
	counters: {
		id: string;
		jpname: string;
		picks: number;
		wins: number;
	}[];
};

const getJpLaneName = (lane: Lanes) => {
	switch (lane) {
		case 'TOP':
			return 'トップ';
		case 'JUNGLE':
			return 'ジャングル';
		case 'MID':
			return 'ミッド';
		case 'ADC':
			return 'ボット';
		case 'SUPPORT':
			return 'サポート';
	}
};

@ApplyOptions<Command.Options>({
	description: 'Search for counter picks',
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
					option.setName('champion').setDescription('Champion name').setRequired(true).setAutocomplete(true),
				),
		);
	}

	// Chat Input (slash) command
	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		return this.sendCounter(interaction);
	}

	private async sendCounter(interaction: Command.ChatInputCommandInteraction) {
		if (!interaction.channel?.isSendable()) return;
		const deferedInteraction = await interaction.deferReply();
		const championId = interaction.options.getString('champion', true);

		if (!isChampionId(championId)) {
			await deferedInteraction.edit('Champion not found');
			return;
		}

		const champKey = getChampionKey(championId);
		const champ = getChampion(champKey);
		const rawOpggRes = await fetch('https://www.op.gg/api/v1.0/internal/bypass/champions/global/ranked');
		const opggRes = (await rawOpggRes.json()) as OpggResponse;

		const opggData = opggRes.data.find((c) => c.id === Number.parseInt(champKey));
		if (!opggData) {
			await deferedInteraction.edit('Failed to get counter data');
			return;
		}
		const counters: Counters[] = opggData.positions.map((pos) => ({
			lane: pos.name as Lanes,
			counters: pos.counters.map((counter) => {
				const champ = getChampion(counter.champion_id.toString());
				if (!champ)
					return {
						id: '',
						jpname: '',
						picks: 0,
						wins: 0,
					};
				return {
					id: champ.id,
					jpname: champ.jpname,
					picks: counter.play,
					wins: counter.win,
				};
			}),
		}));

		const fields = counters.flatMap((lane) => {
			const titleField = {
				name: '\u200b',
				value: `**${getJpLaneName(lane.lane)}**`,
				inline: false,
			};
			const counterFields = lane.counters.map((c) => ({
				name: `${getEmoji(c.id)} ${c.jpname}`,
				value: `勝率: ${Math.round((c.wins / c.picks) * 1000) / 10} (ピック数: ${c.picks})`,
				inline: true,
			}));
			return [titleField, ...counterFields];
		});

		const embed = new EmbedBuilder().setColor(Colors.Blurple).setTitle(`${champ?.jpname} カウンター`).addFields(fields);

		if (champ?.img) embed.setThumbnail(champ.img);

		await deferedInteraction.edit({ content: '', embeds: [embed] });
	}
}
