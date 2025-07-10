const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');

const token = '7807455574:AAHd0hfHtP9smCnuoYK2zAGRRCEGEviVByw';
const webAppUrl = 'https://tg-web-bot-app-react.vercel.app';

const bot = new TelegramBot(token, { polling: true }); // Можно оставить polling на Render

const app = express();
app.use(express.json());
app.use(cors());

// === Телеграм логика ===
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '/start') {
        await bot.sendMessage(chatId, 'Ниже появится кнопка, заполни форму', {
            reply_markup: {
                keyboard: [
                    [{ text: 'Заполнить форму', web_app: { url: webAppUrl + '/form' } }]
                ]
            }
        });

        await bot.sendMessage(chatId, 'Заходи в наш интернет магазин по кнопке ниже', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Сделать заказ', web_app: { url: webAppUrl } }]
                ]
            }
        });
    }

    if (msg?.web_app_data?.data) {
        try {
            const data = JSON.parse(msg.web_app_data.data);
            console.log(data);

            await bot.sendMessage(chatId, 'Спасибо за обратную связь!');
            await bot.sendMessage(chatId, 'Ваша страна: ' + data?.country);
            await bot.sendMessage(chatId, 'Ваша улица: ' + data?.street);

            setTimeout(async () => {
                await bot.sendMessage(chatId, 'Всю информацию вы получите в этом чате');
            }, 3000);
        } catch (e) {
            console.error('Ошибка парсинга данных из web_app_data:', e);
        }
    }
});

// === Обработка POST-запросов от WebApp ===
app.post('/web-data', async (req, res) => {
    const { queryId, products = [], totalPrice } = req.body;

    try {
        await bot.answerWebAppQuery(queryId, {
            type: 'article',
            id: queryId,
            title: 'Успешная покупка',
            input_message_content: {
                message_text: `Поздравляю с покупкой! Вы приобрели товары на сумму ${totalPrice}₽: ${products.map(p => p.title).join(', ')}`
            }
        });
        return res.status(200).json({});
    } catch (e) {
        console.error('Ошибка при отправке ответа через WebAppQuery:', e);
        return res.status(500).json({});
    }
});

// === Настройка порта для Render ===
const PORT = process.env.PORT || 8000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 Server started on PORT ' + PORT);
});
