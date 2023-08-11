import axios from 'axios';
import ffmpeg from 'fluent-ffmpeg';
import installer from '@ffmpeg-installer/ffmpeg';
import { createWriteStream } from 'fs';
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { removeFile } from './utils.js';



const __dirname = dirname(fileURLToPath(import.meta.url))

class OggConverter {
    constructor() {
        ffmpeg.setFfmpegPath(installer.path)
    }

    toMp3(input, outPut) {
        try{
            const outPutPath = resolve(dirname(input), `${outPut}.mp3`);
            return new Promise((resolve, reject)=>{
                ffmpeg(input)
                  .inputOption('-t 30')
                  .output(outPutPath)
                  .on('end', ()=>{
                    removeFile(input)
                    resolve(outPutPath)
                })
                  .on('error', (err)=> reject(err.message)).run()

            })

        }catch(error){
            console.log("Error While creating toMp3", error.message)
        }

    }

    
    async create(url, filename) {

        try {
            const oggPath = resolve(__dirname, '../voices', `${filename}.ogg`)
            const response = await axios({
                method:'get',
                url,
                responseType: 'stream'
            })
            return new Promise(resolve=>{
                const stream = createWriteStream(oggPath);
                response.data.pipe(stream)
                stream.on('finish', ()=>resolve(oggPath))
            })
            
        } catch (error) {
            console.log("Error While creating ogg", error.message)
        }
        
    }

}

export const ogg = new OggConverter()
