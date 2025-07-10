const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');

const token = '7807455574:AAHd0hfHtP9smCnuoYK2zAGRRCEGEviVByw';
const webAppUrl = 'https://tg-web-bot-app-react.vercel.app';

const bot = new TelegramBot(token, { polling: true });
const app = express()

app.use(express.json())
app.use(cors())

// Обработчик ошибок для избежания падений
bot.on('polling_error', (error) => {
    console.log(`Polling error: ${error.message}`);
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text || '';

    try {
        if (text === '/start') {
            // Отправляем основное сообщение с кнопкой
            await bot.sendMessage(chatId, 'Ниже появится кнопка, заполни форму', {
                reply_markup: {
                    keyboard: [
                        [{
                            text: '📝 Заполнить форму',
                            web_app: { url: `${webAppUrl}/form` }
                        }]
                    ],
                    resize_keyboard: true // Оптимизация для мобильных устройств
                }
            });

            // Отправляем второе сообщение с инлайн-кнопкой
            await bot.sendMessage(chatId, 'Заходи в магазин по кнопке ниже:', {
                reply_markup: {
                    inline_keyboard: [
                        [{
                            text: '🛍️ Сделать заказ',
                            web_app: { url: `${webAppUrl}` } // Исправленный URL
                        }]
                    ]
                }
            });
        }
        // Обрабатываем данные из веб-приложения
        else if (msg.web_app_data && msg.web_app_data.data) {
            const data = JSON.parse(msg.web_app_data.data);
            console.log('Received form data:', data);

            await bot.sendMessage(chatId, '✅ Спасибо за заполнение формы!');

            // Отправка данных с задержкой
            await new Promise(resolve => setTimeout(resolve, 500));
            await bot.sendMessage(chatId, `🏳️ Страна: ${data.country || 'не указана'}`);

            await new Promise(resolve => setTimeout(resolve, 1000));
            await bot.sendMessage(chatId, `🏠 Улица: ${data.street || 'не указана'}`);

            await new Promise(resolve => setTimeout(resolve, 1500));
            await bot.sendMessage(chatId, `ℹ️ Все данные получены и обработаны`);
        }
    } catch (error) {
        console.error('Error processing message:', error);
        bot.sendMessage(chatId, '⚠️ Произошла ошибка при обработке запроса');
    }
});

console.log('Бот успешно запущен!');

app.post('/web-data', async (req, res) => {
    const { queryId, products, totalPrice } = req.body
    console.log("ok")
    console.log(totalPrice)
    try {
        await bot.answerWebAppQuery(queryId, {
            type: 'article',
            id: queryId,
            title: 'Успешная покупка',
            input_message_content: {message_text: 'Поздровляем с покупкой, вы преобрели товар на сумму ' + totalPrice + ',Вот список продуктов которые вы купили: ' + products}
        })
        return res.status(200).json({})
        
        
    } catch (error) {
        await bot.answerWebAppQuery(queryId, {
            type: 'article',
            id: queryId,
            title: 'Не удалось совершить покупку',
            input_message_content: {message_text: 'Не удалось совершить покупку'}
        })
        return res.status(500).json({})
    }
})


const PORT = 8000
app.listen(PORT, console.log('server started on PORT ' + PORT))