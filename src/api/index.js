//create proposal, vote api; v
import axios from "axios";
export const API_HOST = "https://apiv2-test.platwin.io/api/v1";

const SUCCESS_CODE = 0;

export async function httpRequest(req) {
  const response = {};
  const { url, params, type } = req;

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
    console.error(e);
    response.error = e.message || e;
  }
  return response;
}
export const bind1WithWeb3Proof = async (params) => {
  const url = `${API_HOST}/bind-addr`;
  const res = await httpRequest({ url, params, type: "POST" });
  console.debug("[core-account] bind1WithWeb3Proof: ", params, res);
  if (res.error) return false;
  return true;
};

export const createProposal = async (params) => {
  const url = `${API_HOST}/proposal/create`;
  const res = await httpRequest({ url, params, type: "POST" });
  console.debug("[core-dao] createProposal: ", res);
  return res;
};
export const vote = async (params) => {
  const url = `${API_HOST}/proposal/vote`;
  const res = await httpRequest({ url, params, type: "POST" });
  console.debug("[core-dao] vote: ", res);
  if (res.error || res.code !== SUCCESS_CODE) {
    return false;
  } else {
    return true;
  }
};
