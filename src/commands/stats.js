import { getTelegramGroupVoteStats } from "../api/index.js";
import { Markup } from "telegraf";

const handleCommandStats = async (ctx) => {
  if (ctx.chat.type === "private") {
    const text = `Sorry, command "/stats" is enabled in chat group/channel.`;
    return ctx.reply(text);
  } else {
    const group_id = String(ctx.chat.id);
    let privateGroup = group_id;
    if (ctx.chat.type === "supergroup" && group_id.startsWith("-100")) {
      privateGroup = group_id.substring(4);
    }
    const res = await getTelegramGroupVoteStats(group_id);
    const buttons = res.map((item) =>
      Markup.button.url(
        `#${item.message_id} Like(${item.like})`,
        `https://t.me/c/${privateGroup}/${item.message_id}`
      )
    );
    // for (const item of res) {
    //   await ctx.replyWithPhoto(
    //     "AgACAgQAAx0EbZdiEwADLGQrjnR4HyhmdtEUG4D9hgGZZEv8AAIusDEbNwNVUc5Reai0cdvvAQADAgADcwADLwQ",
    //     {
    //       reply_markup: {
    //         inline_keyboard: [
    //           [
    //             {
    //               text: `Like(${item.like})`,
    //               url: `https://t.me/c/${privateGroup}/${item.message_id}`,
    //             },
    //           ],
    //         ],
    //       },
    //     }
    //   );
    // }
    const list = res.filter((item) => item.data);
    const photos = list.map((item) => {
      let media;
      if (item.data) {
        try {
          const msgContent = JSON.parse(item.data);
          if (msgContent.photo && msgContent.photo[0]) {
            media = msgContent.photo[0]["file_id"];
          }
        } catch (e) {}
      }
      return {
        type: "photo",
        media: media,
        //   "AgACAgUAAx0EbZdiEwADMGQsFMuQXaNtUZhMATSL16Bji8srAAJSuDEbKw5hVahi6qZYaQG7AQADAgADcwADLwQ",
        //   caption: `${item.nft_token_id} Likes(${item.like})`,
        //   caption_entities: [
        //     {
        //       type: "text_link",
        //       url: `https://t.me/c/${privateGroup}/${item.message_id}`,
        //       offset: 0,
        //       length: item.nft_token_id.length,
        //     },
        //   ],
        parse_mode: "HTML",
        //   caption: `[\\#${item.nft_token_id}](https://t.me/c/${privateGroup}/${item.message_id}), ${item.like} like\\(s\\)`,
        caption: `<a href="https://t.me/c/${privateGroup}/${item.message_id}">#${item.nft_token_id} ${item.like} like(s)</a>`,
      };
    });
    if (photos.length > 0) {
      await ctx.replyWithMediaGroup(photos);
    }
    return;
    // return ctx.reply("Stats: ", Markup.inlineKeyboard(buttons));
  }
};

export default handleCommandStats;
