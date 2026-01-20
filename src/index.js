import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
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
		const result = data.map(({ properties }) => {
			return { id: properties.sheetId, label: properties.title, value: properties.title };
		});

		LISTS = [...result];
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
				.setTitle('🌟 Выбор списка')
				.setDescription('Выберите список, из которого случайно будет выбран персонаж.');

			// Выпадающий список элеметов
			const selectMenu = new StringSelectMenuBuilder()
				.setCustomId('selectLists')
				.setPlaceholder('Выберите список...')
				.addOptions(LISTS);

			// Кнопка подтверждения
			const button = new ButtonBuilder()
				.setCustomId('selectConfirm')
				.setLabel('ОК')
				.setStyle(ButtonStyle.Primary)
				.setEmoji('🎲');

			// Рендер компонентов
			const actionRow = new ActionRowBuilder().addComponents(selectMenu, button);

			// Слушатель события
			await message.channel.send({
				embeds: [rndEmbed],
				components: [actionRow],
			});
		} catch (error) {
			console.error('Ошибка отправки сообщения: ', error);
			if (error) await message.reply('❌ Произошла ошибка при создании меню выбора');
		}
	}
});

client.on(Events.InteractionCreate, async (interaction) => {
	if (interaction.isStringSelectMenu() && interaction.customId === 'selectLists') {
		const selectedList = interaction.values[0];

		if (!client.userSelections) {
			client.userSelections = new Map();
		}
		client.userSelections.set(interaction.user.id, selectedList);

		await interaction.reply({
			content: `✅ Вы выбрали список: **${selectedList}**`,
			flags: MessageFlags.Ephemeral, // Только для отправителя
		});
	}

	if (interaction.isButton() && interaction.customId === 'selectConfirm') {
		const selectedList = client.userSelections?.get(interaction.user.id);

		if (!selectedList) {
			await interaction.reply({
				content: '❌ Сначала выберите список из меню!',
				flags: MessageFlags.Ephemeral, // Только для отправителя
			});

			return;
		}

		// Здесь добавить логику выбора случайного персонажа

		await interaction.reply({
			content: `✅ Фейковый запрос для таблицы: **${selectedList}**`,
			flags: MessageFlags.Ephemeral, // Только для отправителя
		});

		client.userSelections?.delete(interaction.user.id);
	}
});
// ==================================================================================== //
client.login(TOKEN);
