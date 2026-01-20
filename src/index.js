import {
	ActionRowBuilder,
	Client,
	EmbedBuilder,
	Events,
	GatewayIntentBits,
	StringSelectMenuBuilder,
} from 'discord.js';
import 'dotenv/config';
import { GoogleSheetsService } from './googleSheets.js';

const TOKEN = process.env.DISCORD_TOKEN;

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent, // Для чтения содержимого сообщений
	],
});

let LISTS = [];
// ==================================================================================== //
client.once(Events.ClientReady, async (readyClient) => {
	console.log('Привет');
	try {
		const data = await GoogleSheetsService.getLists();
		LISTS = data.map(({ properties }) => {
			return { id: properties.sheetId, label: properties.title, value: properties.title };
		});

		console.log(LISTS);
	} catch (error) {
		console.log(error);
	}
});

client.on(Events.MessageCreate, async (message) => {
	if (message.author.bot) return;

	if (message.content === '/rnd') {
		try {
			// Текстовое окно
			const rndEmbed = new EmbedBuilder()
				.setColor(0x0099ff)
				.setTitle('🎲 Выбор списка')
				.setDescription('Выберите список, из которого случайно будет выбран персонаж.');

			// Выпадающий список элеметов
			const selectMenu = new StringSelectMenuBuilder()
				.setCustomId('selectLists')
				.setPlaceholder('Выберите список...')
				.addOptions(LISTS);

			// Рендер компонентов
			const actionRow = new ActionRowBuilder().addComponents(selectMenu);

			// Слушатель события
			await message.channel.send({
				embeds: [rndEmbed],
				components: [actionRow],
			});
		} catch (error) {
			if (error) await message.reply('❌ Произошла ошибка при создании меню выбора');
		}
	}
});

client.on(Events.InteractionCreate, async (interaction) => {
	if (interaction.isStringSelectMenu() && interaction.customId === 'selectLists') {
		const selectedList = interaction.values[0];
		console.log(selectedList);

		// if (!client.userSelections) client.userSelections = new Map();
		// client.userSelections.set(interaction.user.id, selectedList);

		// Сохраняем выбор пользователя
		// userSelections.set(interaction.user.id, {
		// 	list: selectedList,
		// 	timestamp: Date.now(),
		// });

		console.log(`Пользователь ${interaction.user.tag} выбрал список: ${selectedList}`);

		await interaction.reply({
			content: `✅ Пользователь ${interaction.user.tag} выбрал список: **${selectedList}**`,
		});

		client.userSelections?.delete(interaction.user.id);
	}
});
// ==================================================================================== //
client.login(TOKEN);
