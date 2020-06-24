const axios = require("axios");
const config = require("./login-config.json");

const login = async () => {
  try {
    const { data } = await axios.post(
      "https://api-data.curacloudplatform.com/user/authenticate",
      config
    );
    return data.data.token;
  } catch (err) {
    throw err;
  }
};

const getCaselist = async (token) => {
  try {
    const { data } = await axios.get(
      `https://api-data.curacloudplatform.com/case/list?limit=999999&offset=0&orderkey=updatedAt&token=${token}&version=0.2.0`
    );
    const { caseList } = data.data;
    console.log("Case count", data.data.caseList.length);
    return caseList;
  } catch (err) {
    throw err;
  }
};

const getCompletedCases = (cases) =>
  cases.filter(({ dvStatus }) => dvStatus === "PROCESS_SUCCESS");

const run = async () => {
  try {
    const token = await login();
    const caselist = await getCaselist(token);
    const completedCases = getCompletedCases(caselist);
    console.log("completedCases", completedCases.length);
  } catch (err) {
    throw err;
  }
};

run();
