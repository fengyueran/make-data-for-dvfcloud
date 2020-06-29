const fs = require("fs");
const rimraf = require("rimraf");
const path = require("path");

const TARGET_FILES = [
  "_aorta+both.ply",
  "_CPR_sphere_Im_MIP.nii.gz",
  "_Left_cl_1Dmesh.vtp",
  "_Right_cl_1Dmesh.vtp",
  ".pdf",
  "thumbnail.png",
];

const walk = (targetDir, option = { ignoreHiddenFile: true }) => {
  const files = [];
  const walkSync = (dir) => {
    try {
      const dirs = fs.readdirSync(dir);
      for (let i = 0; i < dirs.length; i += 1) {
        const fileName = dirs[i];
        const filePath = path.join(dir, fileName);
        const stat = fs.statSync(filePath);
        const fileInfo = { name: fileName, filePath };
        if (stat.isDirectory()) {
          walkSync(filePath);
        } else if (stat.isFile()) {
          const isHiddenFile = fileName.startsWith(".");
          if (isHiddenFile) {
            if (!option.ignoreHiddenFile) {
              files.push(fileInfo);
            }
          } else {
            files.push(fileInfo);
          }
        }
      }
    } catch (e) {
      throw e;
    }
  };
  walkSync(targetDir);
  return files;
};

const createDir = (dir, isDeleteOldDir = false) =>
  new Promise((resolve, reject) => {
    try {
      if (fs.existsSync(dir)) {
        if (isDeleteOldDir) {
          rimraf.sync(dir);
        } else {
          resolve(dir);
        }
      } else {
        fs.mkdir(dir, (error) => {
          if (error) {
            reject(error);
          }
          resolve(dir);
        });
      }
    } catch (e) {
      reject(e);
    }
  });

const copy = (src, target) =>
  new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(src);
    fileStream.on("end", resolve);
    fileStream.on("error", reject);
    fileStream.pipe(fs.createWriteStream(target));
  });

const readMeta = (file) => {
  try {
    const meta = JSON.parse(fs.readFileSync(file, "utf8"));
    return meta;
  } catch (e) {
    throw e;
  }
};

const createResultFile = (caseDir, metaFile, files) =>
  new Promise(async (resolve, reject) => {
    try {
      const resultInfo = { files, meta: {} };
      if (metaFile) {
        const meta = await readMeta(metaFile);
        const qcPassed =
          typeof meta.qcPassed !== "undefined" ? meta.qcPassed : true;
        if (meta) {
          resultInfo.meta = { ...meta, qcPassed };
        }
      }
      if (files.length === 0 && !resultInfo.meta.qcPassed) {
        resultInfo.files = [`report.pdf`];
      }
      const resultFile = `${caseDir}/__KEYAYUN_OPS_RESULT__.json`;
      fs.writeFileSync(resultFile, JSON.stringify(resultInfo, null, 2), "utf8");
      resolve(resultInfo);
    } catch (e) {
      reject(e);
    }
  });

const checkFile = (resultInfo) => {
  const lossFiles = [];
  const { meta, files } = resultInfo;
  let qcPassed = true;
  if (typeof meta.qcPassed !== "undefined") {
    qcPassed = meta.qcPassed; //eslint-disable-line
  }
  if (meta.caseStatus !== "SYNC_SUCCESS") {
    lossFiles.push("meta.json");
  }

  TARGET_FILES.forEach((fileName) => {
    const found = files.find((name) => name.endsWith(fileName));
    if (!found) {
      if (qcPassed) {
        lossFiles.push(fileName);
      } else if (fileName === ".pdf") {
        lossFiles.push(fileName);
      }
    }
  });
  let result;
  if (lossFiles.length > 0) {
    result = { lossFiles, code: 404 };
  } else {
    result = { code: 200 };
  }
  return result;
};

const constructFiles = async (caseDirName, targeDir, files) =>
  new Promise(async (resolve, reject) => {
    try {
      const caseDir = `${targeDir}/${caseDirName}`;
      await createDir(caseDir);
      const copyTasks = [];
      let metaFile;
      for (let i = 0; i < files.length; i += 1) {
        const { name, filePath } = files[i];
        const found = TARGET_FILES.find((suffix) => name.endsWith(suffix));
        if (name.endsWith("meta.json")) {
          metaFile = filePath;
        }
        if (found) {
          copyTasks.push(copy(filePath, `${caseDir}/${name}`).then(() => name));
        }
      }
      Promise.all(copyTasks)
        .then(async (res) => {
          const resultInfo = await createResultFile(caseDir, metaFile, res);

          const result = checkFile(resultInfo);
          resolve({ caseName: caseDirName, ...result });
        })
        .catch((e) => {
          reject(e);
        });
    } catch (e) {
      reject(e);
    }
  });

const formatCases = (targetDir) =>
  new Promise(async (resolve, reject) => {
    try {
      const formatedFilesDir = targetDir.replace(/(.*)\/(.*)/, `$1/__result__`);
      const isDeleteOldDir = true;
      await createDir(formatedFilesDir, isDeleteOldDir);
      const dirs = fs.readdirSync(targetDir);
      const constructTasks = [];
      for (let i = 0; i < dirs.length; i += 1) {
        const caseDirName = dirs[i];
        const casePath = path.join(targetDir, caseDirName);
        const stat = fs.statSync(casePath);
        if (stat.isDirectory()) {
          const files = walk(casePath);
          constructTasks.push(
            constructFiles(caseDirName, formatedFilesDir, files)
          );
        }
      }
      Promise.all(constructTasks)
        .then((res) => {
          res.forEach(({ caseName, code, lossFiles }) => {
            if (code === 200) {
              console.log(`Case ${caseName} is conversion success`);
            } else {
              console.log(`Case ${caseName} is missing files: ${lossFiles}`);
            }
          });
          resolve(res);
        })
        .catch((e) => {
          reject(e);
        });
    } catch (e) {
      console.error(e);
      reject(e);
    }
  });

const formatOneCase = (caseDir, saveDir) =>
  new Promise(async (resolve, reject) => {
    try {
      let formatedFilesDir = saveDir;
      if (!saveDir) {
        formatedFilesDir = caseDir.replace(
          /(.*)\/(.*)/,
          `$1/__DVFCLOUD_RESULT__`
        );
      }
      await createDir(formatedFilesDir);
      const stat = fs.statSync(caseDir);
      if (stat.isDirectory()) {
        const files = walk(caseDir);
        const match = caseDir.match(/.*\/(.*)/);
        let caseDirName;
        if (match && match.length > 1) {
          caseDirName = match[1]; //eslint-disable-line
        } else {
          throw new Error("Can not get case name");
        }
        constructFiles(caseDirName, formatedFilesDir, files)
          .then((res) => {
            const { caseName, code, lossFiles } = res;
            if (code === 200) {
              console.log(`Case ${caseName} is conversion success`);
            } else {
              console.warn(`Case ${caseName} is missing files: ${lossFiles}`);
            }
            resolve(res);
          })
          .catch((e) => {
            reject(e);
          });
      } else {
        throw new Error(`${caseDir} is not directory`);
      }
    } catch (e) {
      console.error(e);
      reject(e);
    }
  });

const formatOPSResult = { formatOneCase, formatCases };
module.exports = formatOPSResult;
