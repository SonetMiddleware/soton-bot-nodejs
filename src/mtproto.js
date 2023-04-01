// const path = require("path");
// const MTProto = require("@mtproto/core");
import path from "path";
import MTProto from "@mtproto/core";
const api_id = "21024948"; // YOU_API_ID;
const api_hash = "1eb777cc0419ceea403a7507d80b93ee"; // YOU_API_HASH;
import { fileURLToPath } from "url";
import { sleep } from "@mtproto/core/src/utils/common/index.js";
import prompt from "prompt";
const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);
console.log("__dirname: ", __dirname);
// 1. Create instance
// const mtproto = new MTProto({
//   api_id,
//   api_hash,

//   storageOptions: {
//     path: __dirname + "/data/1.json",
//   },
// });
// // console.log(mtproto);
// // 2. Print the user country code
// mtproto
//   .call("help.getNearestDc")
//   .then((result) => {
//     console.log("country:", result.country);
//   })
//   .catch((e) => {
//     console.error(e);
//   });

class API {
  constructor() {
    this.mtproto = new MTProto({
      test: true,
      // 26125940

// 95b2ce1b7e4e63db50ca798c3c04cac6

      api_id: 26125940, //"21024948",
      api_hash:'95b2ce1b7e4e63db50ca798c3c04cac6',// "1eb777cc0419ceea403a7507d80b93ee",

      storageOptions: {
        path: __dirname + "/data/1.json",
      },
    });
    this.mtproto.updates.on("updatesTooLong", (updateInfo) => {
      console.log("updatesTooLong:", updateInfo);
    });

    this.mtproto.updates.on("updateShortMessage", (updateInfo) => {
      console.log("updateShortMessage:", updateInfo);
    });

    this.mtproto.updates.on("updateShortChatMessage", (updateInfo) => {
      console.log("updateShortChatMessage:", updateInfo);
    });

    this.mtproto.updates.on("updateShort", (updateInfo) => {
      console.log("updateShort:", updateInfo);
    });

    this.mtproto.updates.on("updatesCombined", (updateInfo) => {
      console.log("updatesCombined:", updateInfo);
    });

    this.mtproto.updates.on("updates", (updateInfo) => {
      console.log("updates:", updateInfo);
    });

    this.mtproto.updates.on("updateShortSentMessage", (updateInfo) => {
      console.log("updateShortSentMessage:", updateInfo);
    });
  }

  async call(method, params, options = {}) {
    try {
      console.log("Calling: ", method);
      const result = await this.mtproto.call(method, params, options);

      return result;
    } catch (error) {
      console.log(`${method} error:`, error);

      const { error_code, error_message } = error;

      if (error_code === 420) {
        const seconds = Number(error_message.split("FLOOD_WAIT_")[1]);
        const ms = seconds * 1000;

        await sleep(ms);

        return this.call(method, params, options);
      }

      if (error_code === 303) {
        const [type, dcIdAsString] = error_message.split("_MIGRATE_");

        const dcId = Number(dcIdAsString);

        // If auth.sendCode call on incorrect DC need change default DC, because
        // call auth.signIn on incorrect DC return PHONE_CODE_EXPIRED error
        if (type === "PHONE") {
          await this.mtproto.setDefaultDc(dcId);
        } else {
          Object.assign(options, { dcId });
        }

        return this.call(method, params, options);
      }

      return Promise.reject(error);
    }
  }
}

const api = new API();

async function getUser() {
  try {
    const user = await api.call("users.getFullUser", {
      id: {
        _: "inputUserSelf",
      },
    });
    return user;
  } catch (error) {
    return null;
  }
}

function sendCode(phone) {
  return api.call("auth.sendCode", {
    phone_number: phone,
    settings: {
      _: "codeSettings",
    },
  });
}

function signIn({ code, phone, phone_code_hash }) {
  return api.call("auth.signIn", {
    phone_code: code,
    phone_number: phone,
    phone_code_hash: phone_code_hash,
  });
}

function signUp({ phone, phone_code_hash }) {
  return api.call("auth.signUp", {
    phone_number: phone,
    phone_code_hash: phone_code_hash,
    first_name: "MTProto",
    last_name: "Core",
  });
}

function getPassword() {
  return api.call("account.getPassword");
}

function checkPassword({ srp_id, A, M1 }) {
  return api.call("auth.checkPassword", {
    password: {
      _: "inputCheckPasswordSRP",
      srp_id,
      A,
      M1,
    },
  });
}
async function auth() {
  const user = await getUser();
  if (!user) {
    // const { phone } = await prompt.get("phone");
    const phone = "+17472311677";
    const { phone_code_hash } = await sendCode(phone);

    const { code } = await prompt.get("code");
    try {
      const signInResult = await signIn({
        code,
        phone,
        phone_code_hash,
      });

      if (signInResult._ === "auth.authorizationSignUpRequired") {
        await signUp({
          phone,
          phone_code_hash,
        });
      }
    } catch (error) {
      if (error.error_message !== "SESSION_PASSWORD_NEEDED") {
        console.log(`error:`, error);

        return;
      }
      // 2FA
      const password = "";

      const { srp_id, current_algo, srp_B } = await getPassword();
      const { g, p, salt1, salt2 } = current_algo;

      const { A, M1 } = await api.mtproto.crypto.getSRPParams({
        g,
        p,
        salt1,
        salt2,
        gB: srp_B,
        password,
      });

      const checkPasswordResult = await checkPassword({ srp_id, A, M1 });
      console.log("checkPasswordResult: ", checkPasswordResult);
      const user2 = await getUser();
      console.log("user: ", user2);
    }
  }
}

// module.exports = api;
// export default api;
async function main() {
  try {
    await auth();
    const res = await api.call("messages.getHistory", {
      peer: {
        _: "inputPeerSelf",
      },
    });
    console.log("res", res);
  } catch (e) {
    console.error(e);
  }
}

main()
  .then(() => {
    process.exit();
  })
  .catch((e) => {
    console.log(e);
    process.exit(1);
  });
