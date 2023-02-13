import { createDao, vote } from "./api/index.js";

export async function createDaoConversation(conversation, ctx) {
  await ctx.answerCallbackQuery();

  await ctx.reply("Please enter the NFT contract address: ");
  const address = await conversation.wait();
  const res = address.message?.text;
  console.log("res", res);
  console.log("3 ", ctx.chat);
  // chat: {
  //   id: -1001786769240,
  //   title: 'Mickey & My Ton TWA',
  //   type: 'supergroup'
  // }
  // console.log("3", ctx.chatMember); //undefined

  const author = await ctx.getAuthor();
  console.log("1 author: ", author);
  const params = {
    contract: res,
    chat_name: ctx.chat.title,
    chat_id: ctx.chat.id,
  };
  const resp = await createDao(params);
  if (resp) {
    return ctx.reply("Create dao successfully.");
  } else {
    return ctx.reply("Create dao failed.");
  }
}
