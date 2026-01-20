import 'dotenv/config';
import { google } from 'googleapis';

// Авторизация
const auth = new google.auth.GoogleAuth({
	keyFile: './credentials.json',
	scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Инициализация Sheets API
const sheets = google.sheets({ version: 'v4', auth });

// ID вашей таблицы
const SPREADSHEET_ID = process.env.GOOGLE_SHEET;

export class GoogleSheetsService {
	// Чтение данных
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
}
