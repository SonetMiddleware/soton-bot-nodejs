import loadEnv from "./utils/loadEnv.js";
loadEnv();
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
} from "./api/index.js";
const chain_name = process.env.CHAIN_NAME;
export const msgHandler = async (msg, ctx) => {
  try {
    console.log(msg);
    const msgData = JSON.parse(msg.data);
    const { type, data } = msgData;
    if (type && type === "bind_addr") {
      await ctx.reply("Binding address...");
      const author = await ctx.getAuthor();
      const { user } = author;
      const { address } = data;
      const res = await bind1WithWeb3Proof({
        addr: address,
        tid: user.id + "",
        sig: "",
        platform: "Telegram",
        chain_name,
      });
      console.log(res);
      if (res) {
        return ctx.reply(
          `TON address "${address}" has been bound to your Telegram account.`
        );
      } else {
        return ctx.reply("Bind failed.");
      }
    } else if (type && type === "unbind_addr") {
      await ctx.reply("Unbinding address...");
      const author = await ctx.getAuthor();
      const { user } = author;
      const { address } = data;
      const res = await unbind({
        addr: address,
        tid: user.id + "",
        sig: "",
        platform: "Telegram",
        chain_name,
      });
      console.log(res);
      if (res) {
        return ctx.reply("Your TON address is unbound.");
      } else {
        return ctx.reply("Unbind failed.");
      }
    } else if (type === "create_proposal") {
      await ctx.reply("Creating proposal");
      const res = await createProposal(data);
      console.log(JSON.stringify(res));
      if (res.code === 0) {
        return ctx.reply("Create proposal successfully.");
      } else {
        return ctx.reply("Create proposal failed");
      }
    } else if (type === "vote") {
      await ctx.reply("Submitting vote...");
      const res = await vote(data);
      if (res) {
        return ctx.reply("Vote successfully.");
      } else {
        return ctx.reply("Vote failed");
      }
    }
  } catch (e) {
    console.log(e);
  }
};
