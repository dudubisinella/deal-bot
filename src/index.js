const dotenv = require("dotenv");
dotenv.config();

const cors = require("cors");

const express = require("express");
const Bot = require("./telegram/bot.js");
new Bot();

const MagazineLuizaStore = require("./stores/magazine-luiza.store.js");

const app = express();

app.use(express.json());
app.use(cors());

app.get("/ofertas", async (req, res) => {
  try {
    console.log("cai aqui");
    const magazineLuizaStore = new MagazineLuizaStore();
    await magazineLuizaStore.scrape();
    res.status(200).send({ status: "success" });
  } catch (error) {
    console.log(error);
  }
});

const { PORT } = process.env;

app.listen(PORT, () => {
  console.log(`Server started in port: ${PORT} 🚀`);
});
