import dotenv from "dotenv";
import { Bot, session, InlineKeyboard } from "grammy";
import { conversations, createConversation } from "@grammyjs/conversations";
// const { Telegraf, Markup } = require("telegraf");
import { Markup } from "telegraf";
import {
  startPaymentProcess,
  checkTransaction,
} from "./bot/handlers/payment.js";
import { createDaoConversation } from "./createDao.js";
import handleStart from "./bot/handlers/start.js";
import { bind1WithWeb3Proof, createProposal, vote } from "./api/index.js";
import server from "./express.js";
const port = 3000;
server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
dotenv.config();
const delay = async (time) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, time * 1000);
  });
};

async function runApp() {
  console.log("Starting app...");

  // Handler of all errors, in order to prevent the bot from stopping
  process.on("uncaughtException", function (exception) {
    console.log(exception);
  });

  // Initialize the bot
  const bot = new Bot(process.env.BOT_TOKEN);

  // Set the initial data of our session
  bot.use(session({ initial: () => ({ amount: 0, comment: "" }) }));
  // Install the conversation plugin
  bot.use(conversations());

  // Always exit any conversation upon /cancel

  bot.use(createConversation(startPaymentProcess));
  bot.use(createConversation(createDaoConversation));
  bot.command("cancel", async (ctx) => {
    await ctx.conversation.exit();
    await ctx.reply("Leaving.");
  });
  // Register all handelrs
  // bot.command("start", handleStart);
  bot.command("create", async (ctx) => {
    // return ctx.reply("Create Dao for your group. Enter nft contract:  ");
    const menu = new InlineKeyboard().text("create dao", "createDao");
    return ctx.reply("Create dao", { reply_markup: menu });
  });
  bot.command("start", async (ctx) => {
    console.log(ctx.chat);
    const author = await ctx.getAuthor();
    console.log("1 author: ", author);
    const daoId = ctx.chat.id;
    return ctx.reply(
      "open webapp",
      // Markup.inlineKeyboard([
      //   Markup.button.webApp("Login", "https://192.168.31.7:8001/"),
      //   Markup.button.url("❤️", "http://telegraf.js.org"),
      //   Markup.button.callback("Delete", "delete"),
      // ])
      Markup.inlineKeyboard([
        Markup.button.url(
          "View proposals",
          `https://twa.soton.sonet.one/web/proposals?dao=${daoId}`
        ),
        Markup.button.url(
          "Vote with soton bot",
          "https://t.me/my_ton_twa_0101_bot"
        ),
      ])
      // Markup.keyboard([
      //   Markup.button.webApp("Soton", "https://twa.soton.sonet.one/"),
      // ])
    );
  });

  bot.on("message", async (ctx) => {
    // console.log(ctx.message.web_app_data);
    const author = await ctx.getAuthor();
    console.log("2 author: ", author);

    // console.log("2 chat: ", ctx.chat);

    if (ctx.message.web_app_data) {
      // return await msgHandler(ctx.message.web_app_data, ctx);
      // await ctx.reply(ctx.message.web_app_data.data);
      // await delay(3);
      // return ctx.reply("Vote successfully");
    }
  });

  bot.callbackQuery("buy", async (ctx) => {
    await ctx.conversation.enter("startPaymentProcess");
  });
  bot.callbackQuery("createDao", async (ctx) => {
    await ctx.conversation.enter("createDaoConversation");
  });
  bot.callbackQuery("check_transaction", checkTransaction);

  // bot.on("message", (ctx) => {
  //   console.log("ctx: ", ctx.chat);
  // });
  // Start bot
  await bot.init();
  // bot.start();
  bot.start();
  console.info(`Bot @${bot.botInfo.username} is up and running`);
  bot.catch = (e) => {
    console.log("catch: ", e);
  };
}

void runApp();
