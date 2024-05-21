const axios = require("axios");
const cheerio = require("cheerio");
const cron = require("node-cron");
const fs = require("fs");
const path = require("path");
const CreateFile = require("../utils/create-file.js");

class MagazineLuizaStore {
  __filename = "ofertas-magazine";

  constructor() {
    this.runDaily();
  }

  async scrape() {
    const { data } = await axios.get(
      "https://www.magazineluiza.com.br/selecao/ofertasdodia/?header=ofertasdodia.png&statute=ofertasdodia.html&partner_id=974&gclid=Cj0KCQjwxqayBhDFARIsAANWRnS2JngVXb6wNFN_L_943ccaPRs3nxT1CJOA0S4tVjkjXVYIcibr8-oaAqQvEALw_wcB&gclsrc=aw.ds"
    );

    const $ = cheerio.load(data);
    let ofertas = [];

    $('li[class="sc-kTbCBX ciMFyT"]').each((index, element) => {
      const url = $(element).find("a").attr("href");
      const titulo = $(element)
        .find('h2[data-testid="product-title"]')
        .text()
        .trim();
      const precoOriginal = $(element)
        .find('p[data-testid="price-original"]')
        .text()
        .trim();
      const precoComDesconto = $(element)
        .find('p[data-testid="price-value"]')
        .text()
        .trim();
      const urlAbsoluta = new URL(url, "https://www.magazineluiza.com.br").href;

      ofertas.push({
        titulo,
        url: urlAbsoluta,
        precoOriginal,
        precoComDesconto,
      });
    });

    const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const fileName = `${this.__filename}-${date}.json`;

    const createFile = new CreateFile();
    createFile.execute(fileName, ofertas);

    this.cleanOldFiles();

    return;
  }

  runDaily() {
    cron.schedule("0 5 * * *", () => {
      console.log("Executando a tarefa diária às 5 horas da manhã");
      this.scrape();
    });
  }

  cleanOldFiles() {
    const files = fs.readdirSync(__dirname, "../../storage");
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    files.forEach((file) => {
      const filePath = path.join(__dirname, "../../storage", file);
      const fileDate = file.split("ofertas-magazine-")[1]?.split(".json")[0];
      if (fileDate && fileDate < today) {
        fs.unlinkSync(filePath);
        console.log(`Arquivo ${file} excluído.`);
      }
    });
  }
}

module.exports = MagazineLuizaStore;
