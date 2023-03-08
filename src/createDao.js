import {
  createDao,
  vote,
  getDaoWithGroupId,
  getBindResult,
  getBotFile,
  getGroupMemberNumber,
} from "./api/index.js";
import { Markup } from "telegraf";
import { TonBot, DEFAULT_DAO_LOGO } from "./utils/constant.js";
export async function createDaoConversation(conversation, ctx) {
  await ctx.answerCallbackQuery();
  await ctx.reply("waiting...");
  const chat = await ctx.getChat();
  console.log("1 chat: ", chat);

  let logo = DEFAULT_DAO_LOGO; // default logo;
  if (chat.photo) {
    const path = await getBotFile(chat.photo.small_file_id);
    console.log("path: ", path);
    logo = path;
  }
  const daos = await getDaoWithGroupId(ctx.chat.id);
  if (daos && daos.data && daos.data.dao) {
    return ctx.reply(
      'Sorry, the DAO has been created. Please feel free to review and join us with command "/start".'
    );
  }
  const author = await ctx.getAuthor();
  console.log("1 author: ", author);
  const admins = await ctx.getChatAdministrators();
  const isAdmin = admins.find((item) => item.user.id === author.user.id);
  if (!isAdmin) {
    return ctx.reply(
      "You've not been granted admin to this group, please ask group admin to create DAO for this group."
    );
  }

  const binds = await getBindResult({ tid: author.user.id });
  console.log("binds: ", binds);
  if (binds && binds.length === 0) {
    return ctx.reply("Please bind your address with Soton first.");
  }
  const tgBind = binds.find((item) => item.platform === "Telegram");
  const creator = tgBind.addr;
  if (!creator) {
    return ctx.reply("No binding address.");
  }
  await ctx.reply("Please enter the NFT contract address: ");
  const address = await conversation.wait();
  const res = address.message?.text;

  const memberNum = await getGroupMemberNumber(ctx.chat.id);
  const params = {
    contract: res,
    chat_name: ctx.chat.title,
    chat_id: ctx.chat.id,
    logo,
    creator,
    member: memberNum,
  };
  const resp = await createDao(params);
  if (resp) {
    return ctx.reply("Create DAO successfully.");
  } else {
    return ctx.reply("Create DAO failed.");
  }
}

export async function createDaoHandler(ctx, contract) {
  const chat = await ctx.getChat();
  console.log("1 chat: ", chat);
  let logo = DEFAULT_DAO_LOGO; // default logo;
  if (chat.photo) {
    const path = await getBotFile(chat.photo.small_file_id);
    console.log("path: ", path);
    logo = path;
  }
  const author = await ctx.getAuthor();
  const binds = await getBindResult({ tid: author.user.id });
  const tgBind = binds.find((item) => item.platform === "Telegram");
  const creator = tgBind.addr;
  if (!creator) {
    return ctx.reply("No binding address.");
  }

  const admins = await ctx.getChatAdministrators();
  const isAdmin = admins.find((item) => item.user.id === author.user.id);
  if (!isAdmin) {
    return ctx.reply(
      "You've not been granted admin to this group, please ask group admin to create DAO for this group."
    );
  }
  const memberNum = await getGroupMemberNumber(ctx.chat.id);
  const params = {
    contract: contract,
    chat_name: ctx.chat.title,
    chat_id: ctx.chat.id,
    logo,
    creator,
    member: memberNum,
  };
  const resp = await createDao(params);
  if (resp) {
    return ctx.reply(
      `The DAO has been created successfully, thanks for using Soton Bot. Please reply command "/start" to take a review.`
    );
  } else {
    return ctx.reply(`
    Create DAO failed. Please be sure that 
1. the collection address is correct,
2. you're admin of this group chat, 
3. you've got the collection NFT(s) in your TON wallet.
    `);
  }
}
