import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import loadEnv from "./utils/loadEnv.js";
loadEnv();

const apiId = 21024948; // YOU_API_ID;
const apiHash = "1eb777cc0419ceea403a7507d80b93ee"; // YOU_API_HASH;

// 26125940

// 95b2ce1b7e4e63db50ca798c3c04cac6

const stringSession = ""; // leave this empty for now

const BOT_TOKEN = process.env.BOT_TOKEN; // put your bot token here
(async () => {
  const client = new TelegramClient(
    new StringSession(stringSession),
    apiId,
    apiHash,
    { connectionRetries: 5 }
  );
  await client.start({
    botAuthToken: BOT_TOKEN,
  });

  console.log(client.session.save());
  const result = await client.invoke(
    new Api.messages.GetHistory({
      peer: new Api.InputPeerChat({ chatId: -1001823313086 }),
    })
  );
  console.log(result); // prints the resu
})();
