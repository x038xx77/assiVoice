import { Telegraf } from "telegraf";
import { message } from 'telegraf/filters'
import { code } from 'telegraf/format'
import config from 'config';
import { ogg } from './ogg.js';
import { openai } from './openai.js'


const bot = new Telegraf(config.get('TELEGRAM_TOKEN'))

bot.on(message('voice'), async ctx => {
    try {
        await ctx.reply(code('Соообщение принял жду ответ от сервера...'))
        const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id)
        const userId = String(ctx.message.from.id)
        const oggPath = await ogg.create(link.href, userId);
        const mp3Path = await ogg.toMp3(oggPath, userId);

        const text = await openai.transcription(mp3Path);
        
        await ctx.reply(code(`Ваш запрос ${text}`))

        const messages = [{role: openai.roles.USER, content:text}] // system:promt GPT
        const response = await openai.chat(messages);

        await ctx.reply(response.content);
    } catch (e) {
        console.log("Error while Voice message: ", e.message)      
    }
    
})

bot.launch()
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))