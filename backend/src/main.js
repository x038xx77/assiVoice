import { Telegraf, session } from "telegraf";
import { message } from 'telegraf/filters';
import { countAndTrackTokens, getTotalTokens } from './tokenCounter.js';
import { code } from 'telegraf/format';
import config from 'config';
import { ogg } from './ogg.js';
import { openai } from './openai.js';


const INITIAL_SSESION = {
    messages:[],
}
const bot = new Telegraf(config.get('TELEGRAM_TOKEN'))
bot.use(session())

// TEST
// const str = `Many words map to one token, but some don't: indivisible.
const str = `Приветствие и помощь`
// Unicode characters like emojis may be split into many tokens containing the underlying bytes: 🤚🏾
// Sequences of characters commonly found next to each other may be grouped together: 1234567890`
// const encodedAnswer = (encode(str)).length
// console.log('Encoded this string looks like: ', encodedAnswer)

const tokenCount = countAndTrackTokens(str, 'query');

console.log(`Ваш запрос: ${str}\n Использовано кол-во токенов в запросе: ${tokenCount}\n Использовано общее количество токенов всех запросов: ${getTotalTokens('query')}`);

// END TEST Count Tokens GPT


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
        
        const tokensGPT3Query = countAndTrackTokens(text, 'query');
        await ctx.reply(code(`Ваш голосовой запрос: ${text}\n Использовано кол-во токенов в запросе: ${tokensGPT3Query}\n Использовано общее количество токенов, учитывая все запросы: ${getTotalTokens('query')}`))
        

        ctx.session.messages.push({role: openai.roles.USER, content:text}) // system:promt GPT
        const response = await openai.chat(ctx.session.messages);
        ctx.session.messages.push({role: openai.roles.ASSISTANT, content:response.content}) // system:promt GPT

        const tokensGPT3Request = countAndTrackTokens(response.content, 'request');

        await ctx.reply(code(`Ваш голосовой ответ: ${response.content}\n Использовано кол-во токенов в запросе: ${tokensGPT3Request}\n Использовано общее количество токенов, учитывая все запросы: ${getTotalTokens('request')}`));


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
        
        const tokensGPT3Query = countAndTrackTokens(ctx.message.text, 'query');
        await ctx.reply(code(`Ваш текстовый запрос: ${ctx.message.text}\n Использовано кол-во токенов в запросе: ${tokensGPT3Query}\n Использовано общее количество токенов, учитывая все запросы: ${getTotalTokens('query')}`))



        const response = await openai.chat(ctx.session.messages);        
        ctx.session.messages.push({role: openai.roles.ASSISTANT, content:response.content}) // system:promt GPT

        const tokensGPT3Request = countAndTrackTokens(response.content, 'request');    

        await ctx.reply(code(`Ваш текстовый ответ: ${response.content}\n Использовано кол-во токенов в запросе: ${tokensGPT3Request}\n Использовано общее количество токенов, учитывая все запросы: ${getTotalTokens('request')}`));

    } catch (e) {
        console.log("Error while Voice message: ", e.message)      
    }    
});

bot.launch()
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
