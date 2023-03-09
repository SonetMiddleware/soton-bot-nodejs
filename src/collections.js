import { genCollectionDeployTx, getBotFile } from "./api/index.js";
import { getBounds } from "./utils/index.js";

export async function collectionConversation(conversation, ctx) {
  await ctx.answerCallbackQuery();
  const author = await ctx.getAuthor();
  const binds = await getBounds(author.user.id);
  const owner = binds[0].addr;

  await ctx.reply("Please enter the name of the collection: ");
  const nameRes = await conversation.wait();
  const name = nameRes.message.text;

  await ctx.reply("Please enter the description of the collection: ");
  const despRes = await conversation.wait();
  const description = despRes.message.text;

  await ctx.reply("Send me the photo for the collection");
  let res = await conversation.wait();
  console.log("photo: ", res.message.photo);
  let photos = res.message.photo;
  while (!photos) {
    await ctx.reply("Please send a photo");
    const res = await conversation.wait();
    photos = res.message.photo;
  }
  if (photos[0]) {
    // use first small img
    const file = photos[0];
    const imgUrl = await getBotFile(file.file_id);
    console.log("imgUrl: ", imgUrl);
    const params = {
      owner,
      image: imgUrl,
      name: name,
      description: description,
    };
    const res = await genCollectionDeployTx(params);
  }
}
