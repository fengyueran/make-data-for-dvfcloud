const fs = require("fs");
const path = require("path");
const { rm, createDir, writeJson } = require("./util");

const TARGET_FILES = [
  "_aorta+both.ply",
  "_Left_cl_1Dmesh.vtp",
  "_Right_cl_1Dmesh.vtp",
  "report.pdf",
  "thumbnail.jpeg",
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

const createResultFile = async (caseDir, metaFile, files) => {
  try {
    const resultInfo = { files, meta: {} };
    if (metaFile) {
      const meta = await readMeta(metaFile);
      if (meta) {
        resultInfo.meta = meta;
      }
    }
    const resultFile = `${caseDir}/__KEYAYUN_OPS_RESULT__.json`;
    await writeJson(resultInfo, resultFile);
    return resultInfo;
  } catch (err) {
    throw err;
  }
};

const checkFile = (resultInfo) => {
  const lossFiles = [];
  const { files } = resultInfo;

  TARGET_FILES.forEach((fileName) => {
    const found = files.find((name) => name.endsWith(fileName));
    if (!found) {
      lossFiles.push(fileName);
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

const constructFiles = async (caseDirName, targeDir, files) => {
  try {
    const caseDir = `${targeDir}/${caseDirName}`;
    await createDir(caseDir);
    const copyTasks = [];
    let metaFile;
    for (let i = 0; i < files.length; i += 1) {
      const { name, filePath } = files[i];
      const found = TARGET_FILES.find((keyword) => name.endsWith(keyword));
      if (name.endsWith("meta.json")) {
        metaFile = filePath;
      }
      if (found) {
        copyTasks.push(copy(filePath, `${caseDir}/${name}`).then(() => name));
      }
    }
    const res = await Promise.all(copyTasks);
    const resultInfo = await createResultFile(caseDir, metaFile, res);

    const result = checkFile(resultInfo);
    return { caseName: caseDirName, ...result };
  } catch (err) {
    throw err;
  }
};

const printFormatResult = (res) => {
  res.forEach(({ caseName, code, lossFiles }) => {
    if (code === 200) {
      console.log(`Case ${caseName} is conversion success`);
    } else {
      console.log(`Case ${caseName} is missing files: ${lossFiles}`);
    }
  });
};

const formatCases = async (sourceDir) => {
  try {
    const targetDir = path.join(sourceDir, "../results");
    await rm(targetDir);
    await createDir(targetDir);

    const dirs = fs.readdirSync(sourceDir);
    const constructTasks = [];
    for (let i = 0; i < dirs.length; i += 1) {
      const caseDirName = dirs[i];
      const casePath = path.join(sourceDir, caseDirName);
      const stat = fs.statSync(casePath);
      if (stat.isDirectory()) {
        const files = walk(casePath);
        constructTasks.push(constructFiles(caseDirName, targetDir, files));
      }
    }
    const res = await Promise.all(constructTasks);
    printFormatResult(res);
  } catch (e) {
    console.error(e);
  }
};

formatCases(
  "/Users/xinghunm/xinghun/MyHouse/make-data-for-dvfcloud/dist/qlyy/data"
);
module.exports = formatCases;
