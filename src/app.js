import loadEnv from "./utils/loadEnv.js";
loadEnv();
import { Bot, session, InlineKeyboard } from "grammy";
import { Menu } from "@grammyjs/menu";
import { conversations, createConversation } from "@grammyjs/conversations";
// const { Telegraf, Markup } = require("telegraf");
import { Markup } from "telegraf";
import {
  startPaymentProcess,
  checkTransaction,
} from "./bot/handlers/payment.js";
import { createDaoConversation, createDaoHandler } from "./createDao.js";
import handleStart from "./bot/handlers/start.js";
import { collectionConversation } from "./collections.js";
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
  voteTelegramNFT,
  getTelegramNFTVoteStats,
  getProposalList,
  httpRequest,
  queue,
  getGroupInviteLink,
} from "./api/index.js";
import handleCommandStats from "./commands/stats.js";
import handleCommandProposals from "./commands/proposals.js";
import server from "./express.js";
import {
  isBound,
  getBounds,
  formatAddress,
  dataURLtoFile,
} from "./utils/index.js";
import { msgHandler } from "./twaMsgHandler.js";
import { CHAIN_NAME } from "./api/index.js";
import FormData from "form-data";
import * as fs from "fs";
import * as path from "path";

import axios from "axios";
import { Readable } from "stream";
const port = process.env.PORT || 3000;
const TonWebApp = process.env.TON_WEB_APP || "https://twa.soton.sonet.one";
const TonBot = process.env.TON_BOT;

server.listen(port, () => {
  console.log(`Soton bot api listening on port ${port}`);
});

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
  bot.use(createConversation(collectionConversation));
  bot.command("cancel", async (ctx) => {
    await ctx.conversation.exit();
    await ctx.reply("Leaving.");
  });

  // const main = new Menu("root-menu")
  //   .text("Collections", async (ctx) => {
  //     await ctx.conversation.enter("collectionConversation");
  //   })
  //   .row()
  //   .submenu("Credits", "credits-menu");

  // const settings = new Menu("credits-menu")
  //   .text("Show Credits", (ctx) => ctx.reply("Powered by grammY"))
  //   .back("Go Back");
  // main.register(settings);
  // bot.use(main);
  // Register all handelrs
  // bot.command("start", handleStart);

  const CREATE_DAO_TEXT =
    "To create a DAO based on a live NFT collection for this chat. Please reply the NFT collection address.";

  const IMAGINE_TEXT = "Please enter your prompt to generate image with AI";
  bot.command("start", async (ctx) => {
    // console.log(ctx.update.message);
    const author = await ctx.getAuthor();
    // console.log("1 author: ", author);
    if (ctx.chat.type === "private") {
      // 判断用户是否绑定
      const binds = await getBounds(author.user.id);

      const text = `
      Thanks for initiating Soton and integrating DAO & NFT functionalities to this chat. You can take part in all enabling DAOs based on your TON NFTs via Soton Webapp. Or, you can add me to your chat group(s), with admin role, to enable NFT DAO for them. 
      `;
      const buttons = [
        Markup.button.url(
          "Add to group",
          `https://telegram.me/${TonBot}?startgroup=true`
        ),
      ];
      if (binds[0]) {
        buttons.push(
          Markup.button.url(
            "Go to market",
            `${process.env.MARKET_USER}/${binds[0].addr}`
          )
        );
      }

      ctx.reply(text, Markup.inlineKeyboard(buttons));
      const twaUrl = `${TonWebApp}?tid=${author.user.id}`;
      return ctx.reply(
        'Click "Soton" to Open Soton webapp',
        Markup.keyboard([Markup.button.webApp("Soton", twaUrl)])
      );
    }
    const chat = await ctx.getChat();
    let logo;
    if (chat.photo) {
      const path = await getBotFile(chat.photo.small_file_id);
      // console.log("path: ", path);
      logo = path;
    }

    //群聊
    const daoId = ctx.chat.id;
    const daos = await getDaoWithGroupId(daoId);
    // console.log("daos: ", daos);
    if (daos && daos.data && daos.data.dao) {
      const text = `Thanks for using Soton Bot. I'm enabling NFT DAO to this group. Please review the proposals for this group DAO, and feel free to join the DAO and provide your opinion.`;
      return ctx.reply(
        text,
        Markup.inlineKeyboard([
          Markup.button.url(
            "View proposals",
            `${TonWebApp}/web/proposals?dao=${daoId}`
          ),
          Markup.button.url(
            "Vote with soton bot",
            // "https://telegram.me/SotonTestBot?start=open"
            `https://telegram.me/${TonBot}`
          ),
          Markup.button.url(
            "Go to market",
            `${process.env.MARKET_COLLECTION}/${daos.data.contract}`
          ),
          // Markup.button.url("Soton", `${process.env.TWA_URL}`),
        ])
      );
    } else {
      const text = `Thanks for initiating Soton and integrating DAO & NFT functionalities to this chat. I'm going to add NFT DAO support to this group. Please create DAO for this group and NFT collection, with /create_dao command in chat.`;
      return ctx.reply(text);
    }
  });

  bot.command("chat_info", async (ctx) => {
    // console.log(ctx.chat);
    if (ctx.chat.type === "private") return;
    const daoId = ctx.chat.id;
    const daos = await getDaoWithGroupId(daoId);
    const response = {
      chatId: ctx.chat.id,
      chatName: ctx.chat.title,
      daoId: "",
      collectionId: "",
      adminId: "",
    };
    // console.log(daos);
    if (daos && daos.data && daos.data) {
      const data = daos.data;
      response.daoId = data.id;
      response.collectionId = data.contract;
    }
    const admins = await ctx.getChatAdministrators();
    if (admins[0]) {
      response.adminId = admins[0].user.id;
    }
    return ctx.reply(`
      Chat Id: ${response.chatId}
ChatName: ${response.chatName}
DAO Id: ${response.daoId}
Collection Id: ${response.collectionId}
Admin Id: ${response.adminId}
      `);
  });

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
    // The group type should be supergroup or needs set to public
    const chat = await ctx.getChat();
    if (chat.type === "group") {
      return ctx.reply(`Please set your group to public first. 
Press the group's name and click the pencil icon or "edit" button. Tap the "Group Type" and select "Public Group."`);
    }
    //群聊
    // 判断admin
    const author = await ctx.getAuthor();
    const admins = await ctx.getChatAdministrators();
    const isAdmin = admins.find((item) => item.user.id === author.user.id);
    if (!isAdmin) {
      return ctx.reply(
        "You've not been granted admin to this group, please ask group admin to create DAO for this group. " +
          `@${author.user.username}`
      );
    }

    const hasBound = await isBound(author.user.id);
    if (hasBound) {
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
    }
  });

  bot.command("imagine", async (ctx) => {
    const chat = ctx.chat;
    if (chat.type !== "private") {
      const text = `
      Sorry, command "/imagine" is enabled in Soton Bot.`;
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
    await ctx.reply("Processing...");
    const author = await ctx.getAuthor();
    const text = IMAGINE_TEXT;
    const daoId = process.env.SD_MINT_DAO;
    const daos = await getDaoWithGroupId(daoId);
    const inviteLink = await getGroupInviteLink(daoId);
    let dao;
    if (daos && daos.data) {
      dao = daos.data;
    }
    const respText = `${text}.\nYou can mint the image to NFT and join ${dao.name} afterwards.`;
    return ctx.reply(respText + ` @${author.user.username}`, {
      reply_markup: {
        force_reply: true,
        selective: true,
      },
    });
  });

  const handleNFTCallbackQuery = async (ctx, callbackQuery, action) => {
    try {
      const message = callbackQuery.message;
      const caption = message.caption;
      const daoId = ctx.chat.id;
      const daos = await getDaoWithGroupId(daoId);
      let collection = "",
        nftId = "";
      if (daos && daos.data && daos.data.contract) {
        collection = daos.data.contract;
      }
      const nftIdPattern = /#(\d+)/;
      const match2 = caption.match(nftIdPattern);
      if (match2) {
        nftId = match2[1].trim();
      }

      const voteParams = {
        action: action,
        undo: false,
        group_id: message.chat.id,
        message_id: message.message_id,
        sender: callbackQuery.from.id,
        nft_contract: collection,
        nft_token_id: nftId,
      };
      await voteTelegramNFT(voteParams);
      const stats = await getTelegramNFTVoteStats(
        message.chat.id,
        message.message_id
      );
      if (stats) {
        const reply_markup = {
          inline_keyboard: [
            [
              {
                text: `Like(${stats.like})`,
                callback_data: "like",
              },
              {
                text: `Dislike(${stats.unlike})`,
                callback_data: "dislike",
              },
              {
                text: `Follow(${stats.follow})`,
                callback_data: "follow",
              },
            ],
          ],
        };
        await ctx.editMessageReplyMarkup({
          chat_id: message.chat.id,
          message_id: message.message_id,
          reply_markup: reply_markup,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleProposalVoteCallbackQuery = async (
    ctx,
    callbackQuery,
    proposal_id,
    vote_index
  ) => {
    const daoId = ctx.chat.id;
    const userId = callbackQuery.from.id;
    const binds = await getBounds(userId);
    if (!binds || binds.length === 0) {
      await ctx.answerCallbackQuery({
        text: "You need to bind your address with Telegram account before vote.",
      });
      return;
    }
    const address = binds[0].addr;
    const proposals = await getProposalList({
      dao: daoId,
    });
    const proposal = proposals.find((item) => item.id === proposal_id);
    if (!proposal) {
      return;
    }
    try {
      const option = proposal.items[vote_index];
      const params = {
        voter: address,
        collectionId: daoId,
        proposalId: proposal_id,
        item: option,
        sig: "",
        chain_name: CHAIN_NAME,
      };
      const result = await vote(params);
      // console.log("[vote]:", result);
    } catch (e) {
      console.log(e);
    } finally {
      await ctx.answerCallbackQuery({
        text: "Voted",
      });
    }
  };

  bot.command("stats", handleCommandStats);
  bot.command("proposals", handleCommandProposals);

  bot.on("callback_query", async (ctx) => {
    console.log("callback_query", ctx.update.callback_query);
    const query = ctx.update.callback_query;
    const callbackData = query.data;
    if (callbackData.startsWith("soton_vote")) {
      const proposal_id = callbackData.split(":")[1];
      const vote_index = callbackData.split(":")[2];
      await handleProposalVoteCallbackQuery(
        ctx,
        query,
        proposal_id,
        vote_index
      );
    } else if (callbackData === "like") {
      await ctx.answerCallbackQuery({
        text: "You clicked Like",
      });
      const callbackQuery = ctx.update.callback_query;
      await handleNFTCallbackQuery(ctx, callbackQuery, "like");
    } else if (callbackData === "dislike") {
      await ctx.answerCallbackQuery({
        text: "You clicked dislike",
      });
      const callbackQuery = ctx.update.callback_query;
      await handleNFTCallbackQuery(ctx, callbackQuery, "unlike");
    } else if (callbackData === "follow") {
      await ctx.answerCallbackQuery({
        text: "You clicked follow",
      });
      const callbackQuery = ctx.update.callback_query;
      await handleNFTCallbackQuery(ctx, callbackQuery, "follow");
    } else if (callbackData === "mint_prompt") {
      //TODO save info to server
      const chat = query.message.chat;
      const user = query.from;
      const photo = query.message.photo;
      const message_id = query.message.message_id;
      if (photo.length === 0) {
        return ctx.reply("No photos");
      }
      const fileId = photo[photo.length - 1].file_id;
      const image = await getBotFile(fileId);
      const collection_contract = process.env.SD_MINT_COLLECTION_CONTRACT;
      const nft_prefix = process.env.SD_MINT_NFT_PREFIX;
      const daoId = process.env.SD_MINT_DAO;
      const params = {
        gid: chat.id,
        uid: user.id,
        info: JSON.stringify({
          gid: chat.id,
          uid: user.id,
          image,
          fileId,
          prompt: query.message.caption,
          collection_contract,
          nft_prefix,
          message_id,
          daoId,
        }),
      };
      await queue(params);
      await ctx.answerCallbackQuery({
        text: "Please open TWA to mint",
      });
      const author = await ctx.getAuthor();
      const twaUrl = `${TonWebApp}?tid=${author.user.id}&gid=${chat.id}`;
      const markup = {
        inline_keyboard: [
          [Markup.button.webApp("Open Soton to complete mint", twaUrl)],
        ],
      };
      return await ctx.editMessageReplyMarkup({
        chat_id: chat.id,
        message_id: message_id,
        reply_markup: markup,
      });
      return ctx.reply(
        'Click "Soton" to complete mint process',
        Markup.keyboard([Markup.button.webApp("Soton", twaUrl)])
      );
    }
  });

  bot.on("message", async (ctx) => {
    // console.log("updated message: ", ctx.update.message);

    console.log("msg: ", ctx.message);
    // await ctx.answerCallbackQuery();
    if (ctx.message.reply_to_message) {
      const msg = ctx.message.reply_to_message.text;
      const text = ctx.message.text;
      if (msg.includes(CREATE_DAO_TEXT) && text) {
        // handle create dao reply
        // 判断from 是admin
        const admin = msg.substring(msg.indexOf("@") + 1);
        // console.log("admin@: ", admin);
        const from = ctx.message.from.username;
        if (from !== admin) {
          return;
        }
        //TODO verify contract address
        try {
          const contract = formatAddress(text);
        } catch (e) {
          return ctx.reply(
            "Create DAO failed. Invalid collection contract address."
          );
        }
        return createDaoHandler(ctx, text);
      } else if (msg.includes(IMAGINE_TEXT) && text) {
        // handle imagine reply
        // call sd server
        await ctx.reply("Processing...");
        const chat = ctx.message.chat;
        const user = ctx.message.from;
        const params = {
          prompt: text,
          extra: JSON.stringify({
            chat_id: chat.id,
            message_id: ctx.message.message_id,
            user_id: user.id,
            user_name: user.username,
          }),
          callbackUrl: process.env.SD_CALLBACK,
        };
        const url = process.env.SD_SERVER;
        const res = await axios.request({
          url,
          method: "POST",
          data: params,
          headers: {
            "Content-Type": "application/Json",
            Token: process.env.SD_SERVER_TOKEN,
          },
        });
        // console.log(res);
        // console.log(params);
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
  bot.callbackQuery("collections", async (ctx) => {
    await ctx.conversation.enter("collectionConversation");
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
