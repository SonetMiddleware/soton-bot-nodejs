import { InlineKeyboard } from "grammy";
import axios from "axios";
export default async function handleStart(ctx) {
  console.log("res: ", ctx.chat);
  const menu = new InlineKeyboard()
    .text("Buy dumplings🥟 xxxxx", "buy")
    .row()
    .url(
      "Article with a detailed explanation of the bot's work",
      "https://tonspace.co/develop/dapps/payment-processing/accept-payments-in-a-telegram-bot-js/"
    );

  await ctx.reply(
    `Hello stranger!
Welcome to the best Dumplings Shop in the world <tg-spoiler>and concurrently an example of accepting payments in TON</tg-spoiler>`,
    { reply_markup: menu, parse_mode: "HTML" }
  );
}
