const fs = require("fs");
const path = require("path");

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
          if (/\d+\.json/.test(fileName)) {
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

const readJson = (file) => {
  try {
    const meta = JSON.parse(fs.readFileSync(file, "utf8"));
    return meta;
  } catch (e) {
    throw e;
  }
};

const writeJson = (json, filePath) =>
  new Promise((resolve, reject) => {
    const jsonStr = JSON.stringify(json, null, 2);
    fs.writeFile(filePath, jsonStr, "utf8", (err) => {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });

const BASE_ATTIBUTES = [
  { key: "00101010", name: "patientAge" },
  { key: "00100020", name: "patientID" },
  { key: "00080020", name: "ptudyDate" },
  { key: "00100040", name: "patientSex" },
];

const createResultFile = async (metaFile) => {
  try {
    const workItem = await readJson(metaFile);
    const meta = {
      instanceID: "instanceIDPlaceholder",
      hospitalKey: "hospitalKeyPlaceholder",
    };
    BASE_ATTIBUTES.forEach(({ key, name }) => {
      meta[name] = workItem[key].Value[0];
    });
    meta.studyInstanceUID = workItem["00404021"].Value[0]["0020000D"].Value[0];
    const customAttributes = workItem["00741210"].Value[0]["0040A043"].Value;
    customAttributes.forEach((attr) => {
      const key = attr["00080104"].Value[0];
      const value = attr["00080100"].Value[0];
      if (key === "InstitutionName") {
        meta.institutionName = value;
      } else if (key === "caseId") {
        meta.caseID = value;
      }
    });
    const canceledValue = workItem["00741002"];
    const cancelReason =
      canceledValue && canceledValue.Value[0]["00741238"].Value[0];

    if (cancelReason) {
      meta.status = cancelReason;
      if (cancelReason === "REPEATED") {
        meta.status = "Repeat";
      }
    }

    const caseDir = metaFile.replace(".json", "");
    const resultFile = `${caseDir}/meta.json`;
    console.log("meta", meta);
    await writeJson(meta, resultFile);
    return meta;
  } catch (err) {
    console.error(`convert error, filePath:${metaFile}`, err);
    throw err;
  }
};

const getSourceDir = () => {
  if (process.argv.length < 3) {
    throw new Error("you must pass the source dir");
  } else {
    return process.argv[2];
  }
};

const startConvert = async () => {
  try {
    const sourceDir = getSourceDir();
    console.log(`Start process the data from ${sourceDir}`);
    const jsonFiles = getJsonFiles(sourceDir);
    console.log("jsonFiles", jsonFiles);

    let convertedCount = 0;
    const tasks = jsonFiles.map(({ filePath }) =>
      createResultFile(filePath).then(() => {
        convertedCount += 1;
        console.log("processed", `${convertedCount}/${jsonFiles.length}`);
      })
    );
    await Promise.all(tasks);
    console.log("Congratulations to u, all cases are converted success!!!");
  } catch (err) {
    throw err;
  }
};

// Convert old version data
startConvert();
