import 'dotenv/config';
import { google } from 'googleapis';

// Авторизация
const auth = new google.auth.GoogleAuth({
	keyFile: './credentials.json',
	scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Инициализация Sheets API
const sheets = google.sheets({ version: 'v4', auth });

// ID таблицы
const SPREADSHEET_ID = process.env.GOOGLE_SHEET;

export class GoogleSheetsService {
	// Чтение данных
	static async getRndChar(sheetName, columnChar, skipHeader = true) {
		try {
			// Получаем все данные столбца
			const range = `${sheetName}!${columnChar}:${columnChar}`;
			const values = await this.readRange(range);

			if (values.length === 0) {
				console.warn(`Столбец ${columnChar} в листе ${sheetName} пуст`);
				return null;
			}

			// Пропускаем заголовок если нужно
			const startIndex = skipHeader ? 1 : 0;
			if (startIndex >= values.length) {
				console.warn(`Столбец ${columnChar} не содержит данных после заголовка`);
				return null;
			}

			// Фильтруем пустые значения
			const data = values
				.slice(startIndex)
				.map((row) => row[0])
				.filter((value) => value && value.toString().trim() !== '');

			if (data.length === 0) {
				console.warn(`В столбце ${columnChar} нет заполненных значений`);
				return null;
			}

			// Выбираем случайное значение
			const randomIndex = Math.floor(Math.random() * data.length);
			return data[randomIndex];
		} catch (error) {
			console.error('Ошибка при получении случайного значения из столбца:', error);
			return null;
		}
	}

	static async getLists() {
		try {
			const response = await sheets.spreadsheets.get({
				spreadsheetId: SPREADSHEET_ID,
				fields: 'sheets.properties',
			});

			return response.data.sheets || [];
		} catch (error) {
			console.error('Ошибка чтения из таблицы: ', error);
			return [];
		}
	}

	static async readRange(range) {
		try {
			const response = await sheets.spreadsheets.values.get({
				spreadsheetId: SPREADSHEET_ID,
				range,
			});

			return response.data.values || [];
		} catch (error) {
			console.error('Ошибка чтения из таблицы: ', error);
			return [];
		}
	}
}
