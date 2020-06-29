/* eslint-disable camelcase, no-await-in-loop */
const path = require("path");
const axios = require("axios");
const { createDir, writeJson, unzip } = require("./util");
const getZipFiles = require("./get-zip-files");
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

const sortByUpdatedAt = (file1, file2) => file2.updatedAt - file1.updatedAt;

const getVaildFileGroup = (downloadList) => {
  const reports = [];
  const models = [];
  downloadList.forEach((info) => {
    const { name } = info;
    if (name === "report.pdf") {
      reports.push(info);
    } else if (name.includes("_aorta+both")) {
      models.push(info);
    }
  });
  return { reports, models };
};

const getThumbnail = (latestModel) => {
  const { thumbnailUrl } = latestModel;
  const thumbnailId = thumbnailUrl.replace("/file/", "");
  const thumbnail = { id: thumbnailId, name: "thumbnail.jpeg" };
  return thumbnail;
};

const getLatestFiles = (fileGroup) => {
  const { reports, models } = fileGroup;
  reports.sort(sortByUpdatedAt);
  models.sort(sortByUpdatedAt);
  const latestReport = reports[0];
  const latestModel = models[0];
  const thumbnail = getThumbnail(latestModel);
  return [latestReport, latestModel, thumbnail];
};

const downloadVaildFilesOfACase = async (caseName, baseDir, downloadList) => {
  try {
    console.log(`start downloadVaildFilesOfACase ${caseName}...`);

    const downloadTasks = [];
    const fileGroup = getVaildFileGroup(downloadList);
    const latestFiles = getLatestFiles(fileGroup);

    latestFiles.forEach(({ id, copy_of, name }) => {
      const fileId = copy_of || id;
      downloadTasks.push(downloadFile(fileId, `${baseDir}/${name}`));
    });

    await Promise.all(downloadTasks);
  } catch (err) {
    throw err;
  }
};

const createMetaFile = (caseInfo, baseDir, downloadList) => {
  try {
    const { meta } = downloadList.find(({ type }) => type === "DICOM");
    const { name, age, patientId, gender } = caseInfo;
    const [{ studies }] = JSON.parse(meta);

    const metaInfo = {
      caseId: name,
      instanceId: config.instanceId,
      StudyInstanceUID: studies[0].studyInstanceUID,
      PatientAge: age,
      StudyDate: studies[0].studyDate,
      PatientID: patientId,
      PatientSex: gender,
    };
    const metaFilePath = `${baseDir}/meta.json`;
    writeJson(metaInfo, metaFilePath);
    console.log("metaInfo", metaInfo);
  } catch (err) {
    throw err;
  }
};

const downloadCasesFiles = async (targetDir, cases) => {
  try {
    let completedCount = 0;
    const downloadACaseFiles = async (name, baseDir, downloadList) => {
      try {
        await downloadVaildFilesOfACase(name, baseDir, downloadList);
        completedCount += 1;
        console.log(
          "download progress------:",
          `${completedCount}/${cases.length}`
        );
      } catch (err) {
        throw err;
      }
    };
    for (let i = 0; i < cases.length; i += 1) {
      const caseInfo = cases[i];
      const { downloadList, name } = cases[i];

      const baseDir = path.join(targetDir, name);
      await createDir(baseDir);
      await downloadACaseFiles(name, baseDir, downloadList);
      createMetaFile(caseInfo, baseDir, downloadList);
    }
  } catch (err) {
    throw err;
  }
};

const deleteAndCreateDistDir = async () => {
  try {
    const dist = path.join(__dirname, `../dist/${config.username}/data`);
    await createDir(dist);
    return dist;
  } catch (err) {
    throw err;
  }
};

const unZipDirs = async (dirsInfo) => {
  try {
    for (let i = 0; i < dirsInfo.length; i += 1) {
      const { dir, filePath } = dirsInfo[i];
      // eslint-disable-next-line
      await unzip(filePath, dir);
    }
  } catch (err) {
    throw err;
  }
};

const downloadFilesAndGroup = async () => {
  try {
    console.time("Download");
    console.log("start login...");
    const token = await login();
    console.log("login success!");

    console.log("start getCaselist...");
    const caselist = await getCaselist(token);
    console.log("getCaselist success", caselist.length);

    const completedCases = getCompletedCases(caselist);
    console.log("completedCases count", completedCases.length);

    console.log("start deleteAndCreateDistDir...");
    const dist = await deleteAndCreateDistDir();
    console.log("deleteAndCreateDistDir success!");

    console.log("start downloadCasesFiles...");

    await downloadCasesFiles(dist, completedCases);

    console.log("start unzip files...");
    const zipFiles = getZipFiles(dist);
    await unZipDirs(zipFiles);

    console.log(
      "**********************Congratulations, downloadCasesFiles success!!!**********************"
    );
    console.timeEnd("Download");
    return dist;
  } catch (err) {
    throw err;
  }
};

module.exports = downloadFilesAndGroup;
