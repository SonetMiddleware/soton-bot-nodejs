import {
  createDao,
  vote,
  getDaoWithGroupId,
  getBindResult,
  getBotFile,
} from "./api/index.js";

export async function createDaoConversation(conversation, ctx) {
  await ctx.answerCallbackQuery();

  const chat = await ctx.getChat();
  console.log("1 chat: ", chat);

  let logo;
  if (chat.photo) {
    const path = await getBotFile(chat.photo.small_file_id);
    console.log("path: ", path);
    logo = path;
  }
  const daos = await getDaoWithGroupId(ctx.chat.id);
  if (daos && daos.data && daos.data.dao) {
    return ctx.reply("The DAO of this group already exists.");
  }
  const author = await ctx.getAuthor();
  console.log("1 author: ", author);
  const binds = await getBindResult({ tid: author.user.id });
  console.log("binds: ", binds);
  if (binds && binds.length === 0) {
    return ctx.reply("Please bind your address with Soton first.");
  }
  await ctx.reply("Please enter the NFT contract address: ");
  const address = await conversation.wait();
  const res = address.message?.text;

  const admins = await ctx.getChatAdministrators();
  const isAdmin = admins.find((item) => item.user.id === author.user.id);
  if (!isAdmin) {
    return ctx.reply("Only group admin can create DAO.");
  }
  const params = {
    contract: res,
    chat_name: ctx.chat.title,
    chat_id: ctx.chat.id,
    logo,
  };
  const resp = await createDao(params);
  if (resp) {
    return ctx.reply("Create DAO successfully.");
  } else {
    return ctx.reply("Create DAO failed.");
  }
}
