const dotenv = require("dotenv");
dotenv.config();

const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs").promises;
const path = require("path");

const { BOT_TOKEN } = process.env;
const stateFilePath = path.join(
  __dirname,
  "../../storage/state/sendState.json"
);

class Bot {
  __token = BOT_TOKEN;

  constructor() {
    this.bot = new TelegramBot(this.__token, { polling: true });
    this.setupListeners();
    this.isSendingOffers = false;
    this.currentOfferIndex = 0;
    this.state = {};
    this.loadState();
  }

  async loadState() {
    try {
      const data = await fs.readFile(stateFilePath, "utf8");
      this.state = JSON.parse(data);
    } catch (error) {
      console.error("Erro ao carregar o estado de envio:", error);
      this.state = {};
    }
  }

  async saveState() {
    try {
      await fs.writeFile(
        stateFilePath,
        JSON.stringify(this.state, null, 2),
        "utf8"
      );
    } catch (error) {
      console.error("Erro ao salvar o estado de envio:", error);
    }
  }

  setupListeners() {
    this.bot.onText(/\/start/, (message) => {
      const chatId = message.chat.id;
      this.bot.sendMessage(
        chatId,
        "Olá! Estou monitorando as melhores ofertas para você."
      );
    });

    this.bot.onText(/ofertas-magazine/, async (message) => {
      const chatId = message.chat.id;
      const date = new Date().toISOString().split("T")[0];

      if (this.state[chatId] === date) {
        this.bot.sendMessage(
          chatId,
          "Você já recebeu todas as ofertas de hoje. Aguarde até amanhã para novas ofertas."
        );
        return;
      }

      if (this.isSendingOffers) {
        this.bot.sendMessage(
          chatId,
          "Já estou enviando as ofertas. Aguarde um momento."
        );
        return;
      }

      this.isSendingOffers = true;
      this.currentOfferIndex = 0;

      try {
        const filePath = path.join(
          __dirname,
          `../../storage/ofertas-magazine-${date}.json`
        );

        const data = await fs.readFile(filePath, "utf8");
        this.offers = JSON.parse(data);

        if (this.offers.length === 0) {
          this.bot.sendMessage(
            chatId,
            "Não há ofertas disponíveis no momento."
          );
          this.isSendingOffers = false;
          return;
        }

        await this.sendOffersInBatches(chatId);
        this.state[chatId] = date;
        await this.saveState();
      } catch (error) {
        console.error("Erro ao ler o arquivo de ofertas:", error);
        this.bot.sendMessage(chatId, "Houve um erro ao ler as ofertas.");
      }

      this.isSendingOffers = false;
    });
  }

  async sendOffersInBatches(chatId) {
    const batchSize = 5;
    const delay = 30 * 60 * 1000; // 30 minutos em milissegundos

    while (this.currentOfferIndex < this.offers.length) {
      const offersToSend = this.offers.slice(
        this.currentOfferIndex,
        this.currentOfferIndex + batchSize
      );
      for (let offer of offersToSend) {
        const message = `
          *${offer.titulo}*\n\n
          Preço Original: ${offer.precoOriginal}\n\n
          Preço com Desconto: ${offer.precoComDesconto}\n\n
          [Link para a oferta](${offer.url})
        `;
        await this.bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
      }
      this.currentOfferIndex += batchSize;

      if (this.currentOfferIndex < this.offers.length) {
        await this.sleep(delay);
      }
    }
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = Bot;
