import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import type { AutocompleteInteraction } from 'discord.js';
import Fuse from 'fuse.js';
import { champions, emotes } from '../data';

export class AutocompleteHandler extends InteractionHandler {
	public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
		super(ctx, {
			...options,
			interactionHandlerType: InteractionHandlerTypes.Autocomplete,
		});
	}

	public override async run(interaction: AutocompleteInteraction, result: InteractionHandler.ParseResult<this>) {
		return interaction.respond(result);
	}

	public override async parse(interaction: AutocompleteInteraction) {
		if (interaction.commandName !== 'emoji' && interaction.commandName !== 'emote') return this.none();

		// Get the focussed (current) option
		const focusedOption = interaction.options.getFocused(true);

		// Ensure that the option name is one that can be autocompleted, or return none if not.
		switch (focusedOption.name) {
			case 'champion': {
				// Search your API or similar. This is example code!
				const searchResult = champions
					.filter(
						(c) =>
							c.jpname.includes(focusedOption.value) ||
							c.enname.toLowerCase().includes(focusedOption.value.toLowerCase()),
					)
					.slice(0, 20);

				// Map the search results to the structure required for Autocomplete
				return this.some(searchResult.map((match) => ({ name: match.jpname, value: match.id })));
			}
			case 'emote': {
				const options = {
					keys: ['taggedChampions', 'name', 'description'],
					threshold: 0.3,
				};

				const fuse = new Fuse(emotes, options);

				const result = fuse.search(focusedOption.value).slice(0, 20);

				return this.some(result.map((match) => ({ name: match.item.name, value: match.item.name })));
			}
			default:
				return this.none();
		}
	}
}
