const cheerio = require('cheerio');
const axios = require('axios');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const myTeleBot = require('./telegramBot/telegramBot');

let bot = new myTeleBot.TelegramBot("Parser NodeJS");

const parse = async () => {

    let fileNumberStart = 0;
    let fileNumberFinish = 1;

    let arrayLink = [];
    let arrayElemLink = [];
    let link = "";
    let arrayObj = [];

    let elementInfo = [];

    let mainTitle = "";
    let subname = "";
    let title = "";
    let silnik = "";
    let silnikCode = "";
    let pojemnosc = "";
    let moc = "";
    let rokProdukcji = "";
    let Turbosprezarka = "";
    let numerCzęści = "";
    let numerProducenta = "";
    let arrayImage = [];
    let image = "";

    let index = 1;
    let catalogNumber = 1;
    const getHTML = async (url) => {
        const { data } = await axios.get(url);
        return cheerio.load(data);
    };

    const $ = await getHTML("https://pl.turbolader.net/Turbosprezarki/Katalog-Turbosprezarka.aspx");
    $("#ctl00_BulletedList2 li").each((index, element) => {
        arrayLink.push("https://pl.turbolader.net" + $(element).find("a").attr("href"));
    });

    console.log("Number Catalog: " + arrayLink.length);

    for (let i = fileNumberStart; i < fileNumberFinish; i++) {
        console.log("Check catalog number: " + (fileNumberStart + catalogNumber));
        catalogNumber++;
        let page = await getHTML(arrayLink[i]);
        page("tr").each((index, element) => {
            if(page(element).find("td:nth-child(3)").html() !== null) {
                link = "https://pl.turbolader.net/" + page(element)
                    .find("td:nth-child(3) a").attr("href")
                    .replace("../", "");
                arrayElemLink.push(link);
            }


        });

    }

    console.log("All element: " + arrayElemLink.length)

    for(let i = 0; i < arrayElemLink.length; i++){
        let elementPage = await getHTML(arrayElemLink[i]);
        mainTitle = elementPage("h2.h2n").text().replace(/\s+/g, ' ').trim();
        subname = elementPage("h3.h3n").text();
        title = elementPage("#ctl00_ContentPlaceHolder1_detailContentRight div.boxSpacer")
            .text().replace(/\s+/g, ' ').trim();
        elementInfo = elementPage("#ctl00_ContentPlaceHolder1_Div2").html()
            .replace(/\s+/g, ' ').trim()
            .split("<br>");
        silnik = elementInfo[0];
        silnikCode = elementInfo[1];
        pojemnosc = elementInfo[2];
        moc = elementInfo[3];
        rokProdukcji = elementInfo[4];
        Turbosprezarka = elementPage("div#ctl00_ContentPlaceHolder1_Div2 div strong").html();
        numerCzęści = elementPage("#ctl00_ContentPlaceHolder1_Div2 div:nth-child(1)").html()
            .split("\n")[2];
        numerProducenta = elementPage("#ctl00_ContentPlaceHolder1_Div2 div:nth-child(2)").html()
            .split("\n")[2];


        elementPage("img").each((index, element) => {
            arrayImage.push(elementPage(element)
                .attr("src")
                .replace("../../..", "")
                .split("\n"))
        });

        arrayImage.forEach(elem => {
            if(elem.toString().indexOf("/pic/thumb/") >= 0)
                if(image === "") image += "https://pl.turbolader.net" + elem.toString().replace("thumb", "img");
                else image += "\nhttps://pl.turbolader.net" + elem.toString().replace("thumb", "img");
        });

        arrayObj.push({
            "arrayElemLink": arrayElemLink[i],
            "mainTitle": mainTitle,
            "subname": subname,
            "title": title,
            "silnik": silnik,
            "silnikCode": silnikCode,
            "pojemnosc": pojemnosc,
            "moc": moc,
            "rokProdukcji": rokProdukcji,
            "Turbosprezarka": Turbosprezarka,
            "numerCzęści": numerCzęści,
            "numerProducenta": numerProducenta,
            "image": image
        });
        image = "";
        console.log("Element number: " + index);
        index++;
        arrayImage = [];

    }

    let csvWriter = createCsvWriter({
        path: 'resultCatalog' + fileNumberStart + '_' + fileNumberFinish + '.csv',
        header: [
            {id: "arrayElemLink", title: 'Link'},
            {id: "mainTitle", title: 'Main Title'},
            {id: "subname", title: 'Subname'},
            {id: "title", title: 'Title'},
            {id: "silnik", title: 'Silnik'},
            {id: "silnikCode", title: 'Silnik Code'},
            {id: "pojemnosc", title: 'Pojemnosc'},
            {id: "moc", title: 'Moc'},
            {id: "rokProdukcji", title: 'Rok produkcji'},
            {id: "Turbosprezarka", title: 'Turbosprężarka Art.-Nr'},
            {id: "numerCzęści", title: 'Numer części'},
            {id: "numerProducenta", title: 'Numer producenta'},
            {id: "image", title: 'Image'},
        ]
    });

    csvWriter .writeRecords(arrayObj)
        .then(() => {
            console.log('File "resultCatalog' + fileNumberStart + '_' + fileNumberFinish + '.csv" was written successfully')
        });

    await bot.warn('File "resultCatalog' + fileNumberStart + '_' + fileNumberFinish + '.csv" was written successfully',
        {role: "Admin"}
    )

};

function start() {
    parse().catch((error) => {
        bot.error(error, {role: "admin"}).then();
        console.log(error);
        console.log("\n\n\nNEW\n\n\n");
        start();
    });
}

start();
