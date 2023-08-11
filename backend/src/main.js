import { Telegraf, session } from "telegraf";
import { message } from 'telegraf/filters'
import { code } from 'telegraf/format'
import config from 'config';
import { ogg } from './ogg.js';
import { openai } from './openai.js'


const INITIAL_SSESION = {
    messages:[],
}
const bot = new Telegraf(config.get('TELEGRAM_TOKEN'))
bot.use(session())

bot.command('new', async (ctx)=>{
    ctx.session = INITIAL_SSESION
    await ctx.reply('жду вашего голосового или текстового сообщения')
})

bot.command('start', async (ctx)=>{
    ctx.session = INITIAL_SSESION
    await ctx.reply('жду вашего голосового или текстового сообщения')
})

// VOICE
bot.on(message('voice'), async ctx => {
    ctx.session ??= INITIAL_SSESION
    try {
        await ctx.reply(code('Соообщение принял, жду ответ от сервера...'))
        const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id)
        const userId = String(ctx.message.from.id)
        const oggPath = await ogg.create(link.href, userId);
        const mp3Path = await ogg.toMp3(oggPath, userId);
        const text = await openai.transcription(mp3Path);        
        await ctx.reply(code(`Ваш запрос ${text}`))
        ctx.session.messages.push({role: openai.roles.USER, content:text}) // system:promt GPT
        const response = await openai.chat(ctx.session.messages);
        ctx.session.messages.push({role: openai.roles.ASSISTANT, content:response.content}) // system:promt GPT
        await ctx.reply(response.content);
    } catch (e) {
        console.log("Error while Voice message: ", e.message)      
    }    
});

// TEXT
bot.on(message('text'), async ctx => {
    ctx.session ??= INITIAL_SSESION
    try {
        await ctx.reply(code('Соообщение принял, жду ответ от сервера...'))      
        ctx.session.messages.push({role: openai.roles.USER, content:ctx.message.text}) // system:promt GPT        
        const response = await openai.chat(ctx.session.messages);        
        ctx.session.messages.push({role: openai.roles.ASSISTANT, content:response.content}) // system:promt GPT
        await ctx.reply(response.content);
    } catch (e) {
        console.log("Error while Voice message: ", e.message)      
    }    
});

bot.launch()
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
