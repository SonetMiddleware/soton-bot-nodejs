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
        item.message_id,
        `https://t.me/c/${privateGroup}/${item.message_id}`
      )
    );
    return ctx.reply("Stats", Markup.inlineKeyboard(buttons));
  }
};

export default handleCommandStats;
