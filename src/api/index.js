//create proposal, vote api; v
import loadEnv from "../utils/loadEnv.js";
loadEnv();
import axios from "axios";
export const API_HOST = process.env.API_HOST; // "https://apiv2-test.platwin.io/api/v1";
export const API_HOST_V3 = process.env.API_HOST_V3; // "https://apiv2-test.platwin.io/api/v3";
export const SUCCESS_CODE = 0;
export const CHAIN_NAME = process.env.CHAIN_NAME;
export const API_ORIGIN = process.env.API_ORIGIN;
export async function httpRequest(req) {
  const response = {};
  const { url, params, type } = req;
  console.log("params: ", url, params);
  try {
    let res;
    if (type && type === "POST") {
      res = await axios.request({
        url,
        method: "POST",
        data: params,
        headers: { authorization: "TG Robot Platwin Soda" },
      });
    } else {
      res = await axios.request(url, {
        method: "GET",
        params,
      });
    }
    return res.data;
  } catch (e) {
    console.error(JSON.stringify(e));
    response.error = e.message || e;
  }
  return response;
}

const botToken = process.env.BOT_TOKEN;
export const getBotFile = async (file_id) => {
  const url = `https://api.telegram.org/bot${botToken}/getFile?file_id=${file_id}`;
  const res = await httpRequest({ url });
  if (res && res.result) {
    const { file_path } = res.result;
    const url2 = `https://api.telegram.org/file/bot${botToken}/${file_path}`;
    return url2;
  }
};

export const getGroupMemberNumber = async (chatId) => {
  const url = `https://api.telegram.org/bot${botToken}/getChatMembersCount?chat_id=${chatId}`;
  const res = await httpRequest({ url });
  return res.result;
};

export const getBindResult = async (params) => {
  const url = `${API_HOST}/bind-attr`;
  try {
    const res = await httpRequest({ url, params });
    // console.debug("[core-account] getBindResult: ", params, res);
    if (res.error) return [];
    return res.data;
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const getDaoWithGroupId = async (id) => {
  const url = `${API_HOST}/collection/${id}`;
  const params = {};
  const res = await httpRequest({ url, params, type: "GET" });
  console.debug("getDaoWithGroupId: ", id, res);
  if (res.error) return false;
  return res;
};

export const bind1WithWeb3Proof = async (params) => {
  const url = `${API_HOST}/bind-addr`;
  const res = await httpRequest({ url, params, type: "POST" });
  console.debug("[core-account] bind1WithWeb3Proof: ", params, res);
  if (res.error) return false;
  return true;
};

export const unbind = async (params) => {
  const url = `${API_HOST}/unbind-addr`;
  const res = await httpRequest({ url, params, type: "POST" });
  console.debug("[core-account] unbindAddr: ", params, res);
  if (res.error) return false;
  return true;
};

export const createProposal = async (params) => {
  const url = `${API_HOST}/proposal/create`;
  const {
    creator,
    snapshotBlock,
    daoId,
    title,
    description,
    startTime,
    endTime,
    ballotThreshold,
    items,
    voterType,
    sig,
    chain_name,
  } = params;
  const data = {
    creator,
    snapshot_block: snapshotBlock,
    collection_id: daoId,
    title,
    description,
    start_time: startTime,
    end_time: endTime,
    ballot_threshold: ballotThreshold,
    items,
    voter_type: voterType,
    sig,
    chain_name,
  };
  const res = await httpRequest({ url, params: data, type: "POST" });
  console.debug("[core-dao] createProposal: ", res);
  return res;
};
export const vote = async (params) => {
  const url = `${API_HOST}/proposal/vote`;
  const { voter, collectionId, proposalId, item, sig, chain_name } = params;
  const data = {
    voter,
    collection_id: collectionId,
    proposal_id: proposalId,
    item,
    sig,
    chain_name,
  };
  const res = await httpRequest({ url, params: data, type: "POST" });
  console.debug("[core-dao] vote: ", res);
  if (res.error || res.code !== SUCCESS_CODE) {
    return false;
  } else {
    return true;
  }
};

export const createDao = async (params) => {
  const url = `${API_HOST}/dao/tg/create`;
  const data = {
    chain_name: CHAIN_NAME,
    contract: params.contract,
    collection_name: params.chat_name,
    collection_id: params.chat_id,
    collection_image: params.logo,
    dao_name: params.chat_name,
    creator: params.creator,
    start_date: Date.now(),
    total_member: params.member,
    facebook: "",
    twitter: "",
  };
  const res = await httpRequest({ url, params: data, type: "POST" });
  console.log("[core-dao] vote: ", res);
  return res;
  // if (res.error || res.code !== SUCCESS_CODE) {
  //   return false;
  // } else {
  //   return true;
  // }
};

export const getProposalsV3 = async () => {
  const url = `${API_HOST_V3}/proposal`;
};

// params: {
//   owner: string;
//   image: string;
//   name: string;
//   description: string
// }
export const genCollectionDeployTx = async (params) => {
  const url = `${API_HOST}/nft/collection/gen`;
  const data = {
    chain_name: CHAIN_NAME,
    owner: params.owner,
    royalty: 0.1,
    royalty_address: params.owner,
    metadata: {
      name: params.name,
      image: params.image,
      cover_image: params.image,
      description: params.description,
      social_links: [""],
    },
  };
  const res = await httpRequest({ url, params: data, type: "POST" });
  console.log("[gen-collection-tx]: ", res);
  return res.data;
};

// params
//   {
//
//     "owner": "ownerAddr",
//     "collection": {
//       "name": "collection name",
//       "address": "collection address"
//     },
//
//       "name": "name",
//       "image": "image url",
//       "description": "description",
//       "attributes": [
//         {
//           "trait_type": "Material",
//           "value": "Wool fabric"
//         },
//         {
//           "trait_type": "Hat",
//           "value": "Top hat"
//         }
//       ]
//
//   }

export const genNFMintTx = async (params) => {
  const url = `${API_HOST}/nft/item/gen`;
  const data = {
    chain_name: CHAIN_NAME,
    owner: params.owner,
    collection: {
      name: params.collection.name,
      addr: params.collection.address,
    },
    metadata: {
      name: params.name,
      image: params.image,
      description: params.description,
      attributes: params.attributes,
    },
  };
  const res = await httpRequest({ url, params: data, type: "POST" });
  console.log("[gen-collection-tx]: ", res);
  return res.data;
};

export const getCollectionMetadata = async (collectionName) => {
  const chain_name = CHAIN_NAME;
  const url = `${API_ORIGIN}/assets/ton-collection/${chain_name}/${collectionName}`;
  const res = await httpRequest({ url, params: null, type: "GET" });
  return res;
};
export const getNFTMetadata = async (collectionName, tokenId) => {
  const chain_name = CHAIN_NAME;
  const url = `${API_ORIGIN}/assets/ton-collection/${chain_name}/${collectionName}/${tokenId}`;
  const res = await httpRequest({ url, params: null, type: "GET" });
  return res;
};

// {
//   "action": "like | unlike | follow",
//   "undo": false,
//   "group_id": "",
//   "message_id": "",
//   "sender": "",
//   "nft_contract": "",
//   "nft_token_id": ""
// }
export const voteTelegramNFT = async (params) => {
  const url = `${API_HOST}/tg/message`;
  const res = await httpRequest({ url, params: params, type: "POST" });
  console.log("[voteTelegramNFT]: ", params, res);
  return res.data;
};

/// /api/v1/tg/message/:group_id/:message_id
// "data": [
//   {
//     "nft_contract": "",
//     "nft_token_id": "",
//     "like": 10,
//     "unlike": 19,
//     "follow": 1
//   }
// ]
// ]
export const getTelegramNFTVoteStats = async (groupId, messageId) => {
  const url = `${API_HOST}/tg/message/${groupId}/${messageId}`;
  const res = await httpRequest({
    url,
    params: {},
    type: "GET",
  });
  console.log("[getTelegramNFTVoteStats]: ", res);
  if (res.data && res.data[0]) {
    return res.data[0];
  }
};
