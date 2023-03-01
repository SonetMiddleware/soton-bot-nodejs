//create proposal, vote api; v
import loadEnv from "../utils/loadEnv.js";
loadEnv();
import axios from "axios";
export const API_HOST = process.env.API_HOST; // "https://apiv2-test.platwin.io/api/v1";
export const API_HOST_V3 = process.env.API_HOST_V3; // "https://apiv2-test.platwin.io/api/v3";
export const SUCCESS_CODE = 0;
export const CHAIN_NAME = process.env.CHAIN_NAME;

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
        headers: { authorization: "TG Robot" },
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
    console.debug("[core-account] getBindResult: ", params, res);
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
  console.debug("[core-dao] vote: ", res);
  if (res.error || res.code !== SUCCESS_CODE) {
    return false;
  } else {
    return true;
  }
};

export const getProposalsV3 = async () => {
  const url = `${API_HOST_V3}/proposal`;
};
