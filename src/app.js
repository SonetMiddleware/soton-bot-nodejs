import loadEnv from "./utils/loadEnv.js";
import { Bot, session, InlineKeyboard } from "grammy";
import { conversations, createConversation } from "@grammyjs/conversations";
// const { Telegraf, Markup } = require("telegraf");
import { Markup } from "telegraf";
import {
  startPaymentProcess,
  checkTransaction,
} from "./bot/handlers/payment.js";
import { createDaoConversation, createDaoHandler } from "./createDao.js";
import handleStart from "./bot/handlers/start.js";
import {
  bind1WithWeb3Proof,
  createProposal,
  vote,
  unbind,
  createDao,
  getDaoWithGroupId,
  getBindResult,
  getBotFile,
  getGroupMemberNumber,
} from "./api/index.js";
import server from "./express.js";

loadEnv();

const port = process.env.PORT || 3000;
const TonWebApp = process.env.TON_WEB_APP || "https://twa.soton.sonet.one";
const TonBot = process.env.TON_BOT;

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

const chain_name = process.env.CHAIN_NAME; // "TONtest";
const msgHandler = async (msg, ctx) => {
  try {
    console.log(msg);
    const msgData = JSON.parse(msg.data);
    const { type, data } = msgData;
    if (type && type === "bind_addr") {
      await ctx.reply("Binding address...");
      const author = await ctx.getAuthor();
      const { user } = author;
      const { address } = data;
      const res = await bind1WithWeb3Proof({
        addr: address,
        tid: user.id,
        sig: "",
        platform: "Telegram",
        chain_name,
      });
      console.log(res);
      if (res) {
        return ctx.reply(
          `TON address "${address}" has been bound to your Telegram account.`
        );
      } else {
        return ctx.reply("Bind failed.");
      }
    } else if (type && type === "unbind_addr") {
      await ctx.reply("Unbinding address...");
      const author = await ctx.getAuthor();
      const { user } = author;
      const { address } = data;
      const res = await unbind({
        addr: address,
        tid: user.id,
        sig: "",
        platform: "Telegram",
        chain_name,
      });
      console.log(res);
      if (res) {
        return ctx.reply("Your TON address is unbound.");
      } else {
        return ctx.reply("Unbind failed.");
      }
    } else if (type === "create_proposal") {
      await ctx.reply("Creating proposal");
      const res = await createProposal(data);
      console.log(JSON.stringify(res));
      if (res.code === 0) {
        return ctx.reply("Create proposal successfully.");
      } else {
        return ctx.reply("Create proposal failed");
      }
    } else if (type === "vote") {
      await ctx.reply("Submitting vote...");
      const res = await vote(data);
      if (res) {
        return ctx.reply("Vote successfully.");
      } else {
        return ctx.reply("Vote failed");
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

  // Always exit any conversation upon /cancel

  bot.use(createConversation(startPaymentProcess));
  bot.use(createConversation(createDaoConversation));
  bot.command("cancel", async (ctx) => {
    await ctx.conversation.exit();
    await ctx.reply("Leaving.");
  });
  // Register all handelrs
  // bot.command("start", handleStart);

  const CREATE_DAO_TEXT =
    "To create a DAO based on a live NFT collection for this chat. Please reply the NFT collection address.";

  bot.command("create_dao", async (ctx) => {
    if (ctx.chat.type === "private") {
      const text = `
      Sorry, command "/create_dao" is enabled in chat group/channel.\n
Please add me to your chat groups, with group admin role,  and use "create_dao" command in the chat group, I can then create DAO for the group.
      `;
      return ctx.reply(
        text,
        Markup.inlineKeyboard([
          Markup.button.url(
            "Add to group",
            `https://telegram.me/${TonBot}?startgroup=true`
          ),
        ])
      );
    }

    //群聊
    // 判断admin
    const author = await ctx.getAuthor();
    console.log("1 author: ", author);
    const admins = await ctx.getChatAdministrators();
    const isAdmin = admins.find((item) => item.user.id === author.user.id);
    if (!isAdmin) {
      return ctx.reply(
        "You've not been granted admin to this group, please ask group admin to create DAO for this group. " +
          `@${author.user.username}`
      );
    }

    const binds = await getBindResult({ tid: author.user.id });
    console.log("binds: ", binds);
    if (binds && binds.length === 0) {
      const text = `Please bind your TON wallet with your Telegram account first, 
via, Open Soton Bot > use "start" command > Click 'Soton' Button. 
And try again after bound.
  @${author.user.username}`;
      return ctx.reply(
        text,
        Markup.inlineKeyboard([
          Markup.button.url(
            "Open Soton Bot",
            // "https://telegram.me/SotonTestBot?start=open"
            `https://telegram.me/${TonBot}`
          ),
        ])
      );
    }

    const daoId = ctx.chat.id;
    const daos = await getDaoWithGroupId(daoId);
    if (daos && daos.data && daos.data.dao) {
      const text =
        `Sorry, the DAO has been created. Please feel free to review and join us with command "/start". ` +
        `@${author.user.username}`;
      return ctx.reply(text);
    } else {
      return (
        // .keyboard([["Option1", "Option2"]])

        ctx.reply(CREATE_DAO_TEXT + `@${author.user.username}`, {
          // Make Telegram clients automatically show a reply interface to the user.
          reply_markup: {
            force_reply: true,
            selective: true,
          },
        })
      );

      // console.log(ctx.update.message);
      // console.log("start: ");
      // const text = ctx.update.message.text;
      // if (/^\/create_dao ([\w-]+)$/.test(text)) {
      //   const contract = text.substring(12);
      //   return createDaoHandler(ctx, contract);
      // } else {
      //   const text = `Please add NFT collection address to the command, that I can create DAO upon the collection and the NFT hodlers will be DAO members, syntax /create_dao <collection_address>`;
      //   return ctx.reply(text);
      // }
    }
    // return ctx.reply("Create Dao for your group. Enter nft contract:  ");
    const menu = new InlineKeyboard().text("Click to start", "createDao");
    return ctx.reply("Create dao for your group", { reply_markup: menu });
  });
  bot.command("start", async (ctx) => {
    console.log(ctx.update.message);
    console.log("start: ");
    const text = ctx.update.message.text;
    if (/^\/start ([\w-]+)$/.test(text)) {
      console.log("open dao: ", text.substring(7)); //TODO: open dao detail. soton app needs upgrade for auth.
    }
    // const author = await ctx.getAuthor();
    // console.log("1 author: ", author);
    if (ctx.chat.type === "private") {
      const text = `
      Thanks for initiating Soton and integrating DAO & NFT functionalities to this chat. You can take part in all enabling DAOs based on your TON NFTs via Soton Webapp. Or, you can add me to your chat group(s), with admin role, to enable NFT DAO for them. 
      `;

      ctx.reply(
        text,
        Markup.inlineKeyboard([
          Markup.button.url(
            "Add to group",
            `https://telegram.me/${TonBot}?startgroup=true`
          ),
        ])
      );
      return ctx.reply(
        "Open Soton webapp",
        Markup.keyboard([Markup.button.webApp("Soton", TonWebApp)])
      );
    }
    const chat = await ctx.getChat();
    console.log("1 chat: ", chat);
    let logo;
    if (chat.photo) {
      const path = await getBotFile(chat.photo.small_file_id);
      console.log("path: ", path);
      logo = path;
    }

    //群聊
    const daoId = ctx.chat.id;
    const daos = await getDaoWithGroupId(daoId);
    if (daos && daos.data && daos.data.dao) {
      const text = `Thanks for using Soton Bot. I'm enabling NFT DAO to this group. Please review the proposals for this group DAO, and feel free to join the DAO and provide your opinion.`;
      return ctx.reply(
        text,
        Markup.inlineKeyboard([
          Markup.button.url(
            "View proposals",
            `${TonWebApp}/web/proposals?dao=${daoId}`
          ),
          // Markup.button.url(
          //   "Add bot to group",
          //   `https://telegram.me/${TonBot}?startgroup=true`
          // ),
          // Markup.button.url(
          //   "Add bot to channel",
          //   `https://t.me/SotonTestBot?startchannel&admin=${adminRights}` //not working. Depends on client
          // ),
          Markup.button.url(
            "Vote with soton bot",
            // "https://telegram.me/SotonTestBot?start=open"
            `https://telegram.me/${TonBot}`
          ),
        ])
      );
    } else {
      const text = `Thanks for initiating Soton and integrating DAO & NFT functionalities to this chat. I'm going to add NFT DAO support to this group. Please create DAO for this group and NFT collection, with /create_dao command in chat.`;
      return ctx.reply(text);
    }
  });

  bot.on("message", async (ctx) => {
    // console.log("msg: ", ctx.message);
    if (ctx.message.reply_to_message) {
      const msg = ctx.message.reply_to_message.text;
      const text = ctx.message.text;
      if (msg.includes(CREATE_DAO_TEXT) && text) {
        // 判断from 是admin
        const admin = msg.substring(msg.indexOf("@") + 1);
        console.log("admin@: ", admin);
        const from = ctx.message.from.username;
        if (from !== admin) {
          return;
        }
        return createDaoHandler(ctx, text);
      }
    }
    if (ctx.message.web_app_data) {
      return await msgHandler(ctx.message.web_app_data, ctx);
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

  bot.catch((e) => {
    console.log("catch: ", e);
    bot.start();
  });
}

void runApp();
