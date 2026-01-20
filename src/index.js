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

const ADVERBS = [
	'волшебно',
	'как крыса',
	'люто',
	'идеально',
	'величественно',
	'потужно',
	'как не в себя',
	'сказочно',
	'чудесно',
	'фантастически',
	'магически',
	'завораживающе',
	'феерично',
	'блестяще',
	'потрясно',
	'по кайфу',
	'чудно',
	'роскошно',
	'дивно',
	'словно лев',
	'лоботрясно',
	'ебано',
	'смешно',
	'бессмысленно',
	'абсурдно',
	'несуразно',
	'дико',
	'нелепо и неуклюже',
	'пошурику',
];

let LISTS = [];
// ==================================================================================== //
client.once(Events.ClientReady, async (readyClient) => {
	try {
		const data = await GoogleSheetsService.getLists();
		LISTS = data.map(({ properties }) => {
			return { id: properties.sheetId, label: properties.title, value: properties.title };
		});
		console.log('Ready to work.');
	} catch (error) {
		console.error(error);
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
			// await message.channel.send({
			// 	embeds: [rndEmbed],
			// 	components: [actionRow],
			// });

			// Отправляем и сохраняем сообщение для удаления
			const sentMessage = await message.channel.send({
				embeds: [rndEmbed],
				components: [actionRow],
			});

			// Удаляем генератор через 5 минут
			setTimeout(async () => {
				try {
					await sentMessage.delete();
				} catch (error) {
					console.error('Не удалось удалить сообщение: ', error);
				}
			}, 300000);
		} catch (error) {
			if (error) await message.reply('❌ Произошла ошибка при создании меню выбора');
		}
	}
});

client.on(Events.InteractionCreate, async (interaction) => {
	if (interaction.isStringSelectMenu() && interaction.customId === 'selectLists') {
		const selectedList = interaction.values[0];

		const rndChar = await GoogleSheetsService.getRndChar(selectedList, 'B');
		const rndIndx = Math.floor(Math.random() * (ADVERBS.length - 1));

		await interaction.reply({
			content: `Пользователь ${interaction.user.globalName} ${ADVERBS[rndIndx]} нарандомил:\n**${rndChar}** из списка ${selectedList}`,
		});

		setTimeout(async () => {
			if (selectedList) interaction.values.pop();
		}, 5000);
	}
});
// ==================================================================================== //
client.login(TOKEN);
