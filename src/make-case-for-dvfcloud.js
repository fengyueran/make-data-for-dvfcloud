const path = require("path");
const axios = require("axios");
const { createDistDir, createDir } = require("./util");
const downloadFile = require("./download-file");
const config = require("./config/login-config.json");

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

const downloadVaildFilesOfACase = async (caseName, downloadList) => {
  try {
    console.log(`start downloadVaildFilesOfACase ${caseName}...`);
    const VALID_FILE_TYPES = ["MODEL_FFR", "REPORT_PDF"];
    const BUCKET = "curacloud-cases-beijing";
    const downloadTasks = [];
    const baseDir = path.join(__dirname, `../dist/${caseName}`);
    await createDir(baseDir);
    downloadList.forEach(({ id, name, type, uploadBucket }) => {
      const isValidFile =
        VALID_FILE_TYPES.indexOf(type) >= 0 && uploadBucket === BUCKET;

      if (isValidFile) {
        downloadTasks.push(downloadFile(id, `${baseDir}/${name}`));
      }
    });
    await Promise.all(downloadTasks);
  } catch (err) {
    throw err;
  }
};

const downloadCasesFiles = async (cases) => {
  try {
    let completedCount = 0;
    const downloadACaseFiles = async (name, downloadList) => {
      try {
        await downloadVaildFilesOfACase(name, downloadList);
        completedCount += 1;
        const progress = ((completedCount * 100) / cases.length).toFixed(0);
        console.log("download progress------:", `${progress}%`);
      } catch (err) {
        throw err;
      }
    };
    for (let i = 0; i < cases.length; i += 1) {
      const { downloadList, name } = cases[i];
      // eslint-disable-next-line
      await downloadACaseFiles(name, downloadList);
    }
  } catch (err) {
    throw err;
  }
};

const run = async () => {
  try {
    console.log("start login...");
    const token = await login();
    console.log("login success!");

    console.log("start getCaselist...");
    const caselist = await getCaselist(token);
    console.log("getCaselist success", caselist.length);

    const completedCases = getCompletedCases(caselist);
    console.log("completedCases count", completedCases.length);

    console.log("start createDistDir...");
    await createDistDir();
    console.log("createDistDir success!");

    console.log("start downloadCasesFiles...");
    // // await downloadCasesFiles([completedCases[1]]);
    await downloadCasesFiles(completedCases);
    console.log("downloadCasesFiles success!");
  } catch (err) {
    throw err;
  }
};

run();
