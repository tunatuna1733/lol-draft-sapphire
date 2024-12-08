import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { ApplicationIntegrationType, Colors, EmbedBuilder, InteractionContextType } from 'discord.js';
import { getChampion, getChampionKey, isChampionId } from '../utils/champion';
import { getEmoji } from '../utils/emoji';
import { getLatestDDragonVersion } from '../utils/riotapi';

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

type LolalyticsLane = 'top' | 'jungle' | 'middle' | 'bottom' | 'support';
type LolalyticsResponse = {
	counters: {
		cid: number;
		vsWr: number;
		n: number;
	}[];
};

type OpggLane = 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT';

const getJpLaneName = (lane: OpggLane | LolalyticsLane) => {
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
		case 'top':
			return 'トップ';
		case 'jungle':
			return 'ジャングル';
		case 'middle':
			return 'ミッド';
		case 'bottom':
			return 'ボット';
		case 'support':
			return 'サポート';
	}
};

const convertLane = (opggLane: OpggLane): LolalyticsLane => {
	switch (opggLane) {
		case 'TOP':
			return 'top';
		case 'JUNGLE':
			return 'jungle';
		case 'MID':
			return 'middle';
		case 'ADC':
			return 'bottom';
		case 'SUPPORT':
			return 'support';
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
		const lanes = opggData.positions.map((p) => convertLane(p.name as OpggLane));

		const lolalyticsChampId = championId === 'MonkeyKing' ? 'wukong' : championId.toLowerCase();
		const version = await getLatestDDragonVersion(true);
		const lolalyticsResult = await Promise.all(
			lanes.map((lane) =>
				fetch(
					`https://a1.lolalytics.com/mega/?ep=counter&v=1&patch=${version}&c=${lolalyticsChampId}&lane=${lane}&tier=emerald_plus&queue=ranked&region=all`,
				).then((r) =>
					r.json().then((j) => ({
						lane,
						res: j as LolalyticsResponse,
						total: (j as LolalyticsResponse).counters.reduce((prev, c) => prev + c.n, 0),
					})),
				),
			),
		);

		const counterFields = lolalyticsResult.flatMap((data) => {
			const titleField = {
				name: '\u200b',
				value: `**${getJpLaneName(data.lane)}**`,
				inline: false,
			};
			const champFields = data.res.counters
				.toSorted((a, b) => {
					if (a.vsWr > b.vsWr) return -1;
					if (a.vsWr < b.vsWr) return 1;
					return 0;
				})
				.filter((c) => (c.n / data.total) * 100 > 0.5)
				.slice(0, 6)
				.map((c) => {
					const champ = getChampion(c.cid.toString());
					return {
						name: `${getEmoji(champ?.id)} ${champ?.jpname}`,
						value: `勝率: ${c.vsWr} (マッチ数: ${c.n})`,
						inline: true,
					};
				});
			return [titleField, ...champFields];
		});

		const advantageFields = lolalyticsResult.flatMap((data) => {
			const titleField = {
				name: '\u200b',
				value: `**${getJpLaneName(data.lane)}**`,
				inline: false,
			};
			const champFields = data.res.counters
				.toSorted((a, b) => {
					if (a.vsWr < b.vsWr) return -1;
					if (a.vsWr > b.vsWr) return 1;
					return 0;
				})
				.filter((c) => (c.n / data.total) * 100 > 0.5)
				.slice(0, 6)
				.map((c) => {
					const champ = getChampion(c.cid.toString());
					return {
						name: `${getEmoji(champ?.id)} ${champ?.jpname}`,
						value: `勝率: ${c.vsWr} (マッチ数: ${c.n})`,
						inline: true,
					};
				});
			return [titleField, ...champFields];
		});

		const counterEmbed = new EmbedBuilder()
			.setColor(Colors.Red)
			.setTitle(`${champ?.jpname} Strong against...`)
			.addFields(counterFields);
		if (champ?.img) counterEmbed.setThumbnail(champ.img);

		const advantageEmbed = new EmbedBuilder()
			.setColor(Colors.Blurple)
			.setTitle(`${champ?.jpname} Weak against...`)
			.addFields(advantageFields);

		await deferedInteraction.edit({ content: '', embeds: [counterEmbed, advantageEmbed] });
	}
}
