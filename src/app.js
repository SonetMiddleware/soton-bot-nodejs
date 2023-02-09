import dotenv from "dotenv";
import { Bot, session } from "grammy";
import { conversations, createConversation } from "@grammyjs/conversations";
// const { Telegraf, Markup } = require("telegraf");
import { Markup } from "telegraf";
import {
  startPaymentProcess,
  checkTransaction,
} from "./bot/handlers/payment.js";
import handleStart from "./bot/handlers/start.js";
import { bind1WithWeb3Proof, createProposal, vote } from "./api/index.js";
dotenv.config();
const delay = async (time) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, time * 1000);
  });
};
const chain_name = "TONtest";
const msgHandler = async (msg, ctx) => {
  try {
    console.log(msg);
    const msgData = JSON.parse(msg.data);
    const { type, data } = msgData;
    if (type && type === "bind_addr") {
      ctx.relay("Binding address...");
      const author = await ctx.getAuthor();
      const { user } = author;
      const { address } = data;
      const res = await bind1WithWeb3Proof({
        addr: address,
        tid: user.username,
        sig: "",
        platform: "Telegram",
        chain_name,
      });
      console.log(res);
      if (res) {
        ctx.reply("Bind success");
      } else {
        ctx.reply("Bind failed.");
      }
    } else if (type === "create_proposal") {
      ctx.reply("Creating proposal");
      const params = {};
      const res = await createProposal(params);
      if (res.code === 0) {
        ctx.reply("Create proposal successfully.");
      } else {
        ctx.reply("Create proposal failed");
      }
    } else if (type === "vote") {
      ctx.reply("Submitting vote...");
      const params = {};
      const res = await vote(params);
      if (res.code === 0) {
        ctx.reply("Vote successfully.");
      } else {
        ctx.reply("Vote failed");
      }
    }
  } catch (e) {
    console.log(e);
  }
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

  bot.use(createConversation(startPaymentProcess));
  /**
   * 1. login.Open twa to login with mobile wallet;
   * 2. send address to bot
   * 3. bind address with user id
   * 4. if bind. Vote from bot with address.
   */
  bot.command("register", async (ctx) => {
    console.log("register");
    console.log(ctx.chat);
    const author = await ctx.getAuthor();
    console.log("1 author: ", author);
    return ctx.reply(
      "open webapp",
      // Markup.inlineKeyboard([
      //   Markup.button.webApp("Login", "https://192.168.31.7:8001/"),
      //   Markup.button.url("❤️", "http://telegraf.js.org"),
      //   Markup.button.callback("Delete", "delete"),
      // ])
      // Markup.inlineKeyboard([
      //   Markup.button.webApp("Login", "https://twa.soton.sonet.one/"),
      // ]),
      Markup.keyboard([
        Markup.button.webApp("Login", "https://twa.soton.sonet.one/"),
      ])
    );
  });

  bot.on("message", async (ctx) => {
    // console.log(ctx.message.web_app_data);
    // const author = await ctx.getAuthor();
    // console.log("2 author: ", author);

    // console.log("2 chat: ", ctx.chat);

    if (ctx.message.web_app_data) {
      return await msgHandler(ctx.message.web_app_data, ctx);
      // await ctx.reply(ctx.message.web_app_data.data);
      // await delay(3);
      // return ctx.reply("Vote successfully");
    }
  });
  // Register all handelrs
  bot.command("start", handleStart);
  // bot.on("message", (ctx) => {
  //   console.log("ctx: ", ctx.chat);
  // });

  bot.callbackQuery("buy", async (ctx) => {
    await ctx.conversation.enter("startPaymentProcess");
  });
  bot.callbackQuery("check_transaction", checkTransaction);

  // Start bot
  await bot.init();
  // bot.start();
  bot.start();
  console.info(`Bot @${bot.botInfo.username} is up and running`);
}

void runApp();
