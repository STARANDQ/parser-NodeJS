const telegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const colors = require('colors');

if(!fs.existsSync('./telegramBot/TelegramBot.json')){
    console.log("\n[Telegram Bot] File TelegramBot.json not found\n");
    process.exit();
}

const token = (JSON.parse(fs.readFileSync('./telegramBot/TelegramBot.json', 'utf8'))).token;
let role = Object.entries((JSON.parse(fs.readFileSync('./telegramBot/TelegramBot.json', 'utf8'))).role);


const bot = new telegramBot(token, {polling: true});
class TelegramBot {

    constructor(projectName) {
        this.projectName = projectName;
    }

    async message(text, obj) {
        text = "[ " + this.projectName + " ] " + " => " + text;
        await this.#sendMessage(text, obj)
    }

    async warn(text, obj) {
        text = "⚠️ " + this.projectName + " ⚠️\n\n" + text;
        await this.#sendMessage(text, obj)
    }

    async error(text, obj) {
        text = "❗️️ " + this.projectName + "❗️️️\n\n" + text;
        await this.#sendMessage(text, obj)
    }

    async #sendMessage(text, obj){
        if(obj.account !== undefined) {
            if (typeof obj.account === "object") {
                for (let i = 0; i < obj.account.length; i++) {
                    await bot.sendMessage(obj.account[i], text);
                }
                await bot.stopPolling();
            }

            if (typeof obj.account === "number")
                await bot.sendMessage(obj.account, text).then(() => {
                    bot.stopPolling()
                });
        }
        if(obj.role !== undefined){
            obj.role = obj.role.toLowerCase();
            for (let i = 0; i < role.length; i++) {
                if(role[i][0] === obj.role){
                    for (let j = 0; j < role[i][1].length; j++) {
                        await bot.sendMessage(role[i][1][j], text)
                            .then(() => {bot.stopPolling()});
                    }
                }
            }
        }
    }

    async getId(){
        bot.on('message', (msg) => {
            console.log("ID: " + msg.chat.id);
            console.log("username: " + msg.chat.username);
            console.log("text: " + msg.text);
            console.log("");
        });

    }
    
}

exports.TelegramBot = TelegramBot;