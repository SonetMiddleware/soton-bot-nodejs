import { getBindResult } from "../api/index.js";
import TonWeb from "tonweb";
export const isBound = async (userId) => {
  const binds = await getBindResult({ tid: userId });
  //   console.log("binds: ", binds);
  const index = binds.find((item) => item.platform === "Telegram");
  return index >= 0;
};
//binds
// "addr": "kQCkeUfuGycIp6EJN3LdqhdlOd7aNdLEqxk5LnQYij1Q6EHZ",
// "platform": "Telegram",
// "tid": "1842871751",
// "content_id": "",
// "status": 1,
// "bind_time": 1678153433897,
// "self_referral_code": null,
// "accept_referral_code": null,
// "accept_referral_time": null
export const getBounds = async (userId) => {
  const binds = await getBindResult({ tid: userId });
  //   console.log("binds: ", binds);
  return binds.filter((item) => item.platform === "Telegram");
};

export const formatAddress = (addr) => {
  return new TonWeb.Address(addr).toString(true, true, true);
};
