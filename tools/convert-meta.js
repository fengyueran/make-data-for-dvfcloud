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
          if (fileName.includes("__KEYAYUN_OPS_RESULT__")) {
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

const createResultFile = async (caseDir, metaFile) => {
  try {
    const { meta, files } = await readJson(metaFile);
    const {
      InstitutionName,
      StudyInstanceUID,
      PatientAge,
      PatientID,
      PatientSex,
      StudyDate,
      caseId,
      qcPassed,
      forceDelete,
      seriesCount,
      sliceCount,
    } = meta;
    const resultFile = `${caseDir}/__KEYAYUN_OPS_RESULT__.json`;
    const resultInfo = {
      files,
      meta: {
        institutionName: InstitutionName,
        studyInstanceUID: StudyInstanceUID,
        patientAge: PatientAge,
        patientID: PatientID,
        patientSex: PatientSex,
        studyDate: StudyDate,
        caseID: caseId,
        seriesCount,
        sliceCount,
      },
    };
    if (forceDelete) {
      resultInfo.meta.status = "Discard";
    } else if (!qcPassed) {
      resultInfo.meta.status = "Invalid Data";
    }
    await writeJson(resultInfo, resultFile);
    return resultInfo;
  } catch (err) {
    console.error(`convert error, filePath:${metaFile}`);
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
    let convertedCount = 0;
    const tasks = jsonFiles.map(({ dir, filePath }) =>
      createResultFile(dir, filePath).then(() => {
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

startConvert();
