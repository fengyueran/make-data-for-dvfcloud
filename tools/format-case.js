const fs = require("fs");
const path = require("path");
const { rm, walk, createDir, writeJson } = require("../src/util");
const updateMetaConfig = require("../src/config/update-meta-config.json");

const TARGET_FILES = [
  "_aorta+both.ply",
  "_Left_cl_1Dmesh.vtp",
  "_Right_cl_1Dmesh.vtp",
  "report.pdf",
  "thumbnail.png",
];

function getJsonFiles(targetPath) {
  const filesInfo = [];
  function walkSync(walkPath) {
    try {
      const files = fs.readdirSync(walkPath);
      for (let i = 0; i < files.length; i += 1) {
        const fileName = files[i];
        const filePath = path.join(walkPath, fileName);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          walkSync(filePath);
        } else if (stat.isFile()) {
          const fileInfo = {
            dir: walkPath,
            filePath,
            size: stat.size,
            name: fileName,
          };
          if (/meta.json/.test(fileName)) {
            filesInfo.push(fileInfo);
          }
        }
      }
    } catch (e) {
      throw e;
    }
  }
  walkSync(targetPath);
  return filesInfo;
}
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
    resultInfo.meta = { ...resultInfo.meta, ...updateMetaConfig };
    const resultFile = `${caseDir}/__KEYAYUN_OPS_RESULT__.json`;
    await writeJson(resultInfo, resultFile);
    return resultInfo;
  } catch (err) {
    throw err;
  }
};

const checkFile = (resultInfo) => {
  const lossFiles = [];
  const { files, meta } = resultInfo;
  const isQcFailed = meta.status === "Invalid Data";
  const targetFiles = isQcFailed ? ["report.pdf"] : TARGET_FILES;

  targetFiles.forEach((fileName) => {
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

const getSourceDir = () => {
  if (process.argv.length < 3) {
    throw new Error("you must pass the source dir");
  } else {
    return process.argv[2];
  }
};

const formatCases = async () => {
  try {
    const sourceDir = getSourceDir();
    console.log(`Start process the data from ${sourceDir}`);
    const jsonFiles = getJsonFiles(sourceDir);
    console.log("jsonFiles", jsonFiles);

    const targetDir = path.join(sourceDir, "../results");
    await rm(targetDir);
    await createDir(targetDir);

    const constructTasks = jsonFiles.map(({ filePath, dir }) => {
      const files = walk(dir);
      const parts = filePath.split("/");
      const caseDirName = parts[parts.length - 2];
      console.log("caseDirName", caseDirName);

      return constructFiles(caseDirName, targetDir, files);
    });

    const res = await Promise.all(constructTasks);
    printFormatResult(res);
    console.log("Congratulations to u, all cases are converted success!!!");
  } catch (e) {
    console.error(e);
  }
};

const dir = getSourceDir();

formatCases(dir);
