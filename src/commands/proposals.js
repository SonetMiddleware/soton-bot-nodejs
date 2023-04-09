import { getProposalList, getTgRawMessages } from "../api/index.js";
import { Markup } from "telegraf";
const TonWebApp = process.env.TON_WEB_APP || "https://twa.soton.sonet.one";
const TonBot = process.env.TON_BOT;

const handleCommandProposals = async (ctx) => {
  if (ctx.chat.type === "private") {
    const text = `Sorry, command "/stats" is enabled in chat group/channel.`;
    return ctx.reply(text);
  } else {
    const group_id = String(ctx.chat.id);
    let privateGroup = group_id;
    if (ctx.chat.type === "supergroup" && group_id.startsWith("-100")) {
      privateGroup = group_id.substring(4);
    }
    const list = await getProposalList({
      dao: group_id,
    });
    const tgMsgs = await getTgRawMessages(group_id);
    console.log("list: ", JSON.stringify(list));
    console.log("tgMsgs: ", JSON.stringify(tgMsgs));

    const proposals = [];
    for (const item of list) {
      const rawMsg = tgMsgs.find((tg) => tg.data === item.id);
      if (rawMsg) {
        item.message_id = rawMsg.message_id;
        proposals.push(item);
      }
      if (proposals.length >= 5) {
        break;
      }
    }
    console.log("proposals: ", proposals);

    const buttons = proposals.map((item) => [
      Markup.button.url(
        `${item.title}`,
        `https://t.me/c/${privateGroup}/${item.message_id}`
      ),
    ]);
    buttons.push([
      Markup.button.url(
        "View proposals",
        `${TonWebApp}/web/proposals?dao=${group_id}`
      ),
      Markup.button.url(
        "Vote with soton bot",
        // "https://telegram.me/SotonTestBot?start=open"
        `https://telegram.me/${TonBot}`
      ),
    ]);
    return ctx.reply("Top5 Proposals: ", Markup.inlineKeyboard(buttons));
  }
};

export default handleCommandProposals;
