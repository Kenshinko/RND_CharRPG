import {
	ActionRowBuilder,
	Client,
	EmbedBuilder,
	Events,
	GatewayIntentBits,
	MessageFlags,
	REST,
	Routes,
	SlashCommandBuilder,
	StringSelectMenuBuilder,
} from 'discord.js';
import 'dotenv/config';
import { GoogleSheetsService } from './googleSheets.js';

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const rest = new REST({ version: '10' }).setToken(TOKEN);

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
	'кучеряво',
	'как не в себя',
	'сказочно',
	'чудесно',
	'фантастически',
	'красиво',
	'магически',
	'завораживающе',
	'феерично',
	'блестяще',
	'изумительно',
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
	'предательски',
	'коварно',
	'подло',
	'бесчестно',
	'неистово',
	'впопыхах',
	'злодейски',
	'бессовестно',
	'пошурику',
	'яростно',
	'бешено',
	'исступленно',
	'безудержно',
	'свирепо',
	'отчаянно',
	'безудержно',
	'необузданно',
	'неудержимо',
	'страстно',
];

let LISTS = [];
// ==================================================================================== //
// Инициализация команд бота
const commands = [
	new SlashCommandBuilder().setName('rnd').setDescription('Нарандомить персонажа'),
];
// ==================================================================================== //
client.once(Events.ClientReady, async () => {
	try {
		// Регистрируем команды
		await rest.put(Routes.applicationCommands(CLIENT_ID), {
			body: commands,
		});

		// Получаем названия списков
		const data = await GoogleSheetsService.getLists();
		LISTS = data.map(({ properties }) => {
			return { id: properties.sheetId, label: properties.title, value: properties.title };
		});
		console.log('==> Ready to work...');
	} catch (error) {
		console.error(error);
	}
});

client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isChatInputCommand()) return;

	if (interaction.commandName === 'rnd') {
		try {
			await interaction.deferReply({
				flags: MessageFlags.Ephemeral,
				withResponse: false,
			});
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

			// Отправляем и сохраняем сообщение для удаления
			const sendMessage = await interaction.channel.send({
				embeds: [rndEmbed],
				components: [actionRow],
			});

			// Удаляем генератор через 5 минут
			setTimeout(async () => {
				try {
					await sendMessage.delete();
				} catch (error) {
					console.error('Не удалось удалить сообщение: ', error);
				}
			}, 300000);
		} catch (error) {
			if (error) await interaction.reply('❌ Произошла ошибка при создании меню выбора');
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
	}
});
// ==================================================================================== //
client.login(TOKEN);
