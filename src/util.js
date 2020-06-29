const fs = require("fs");
const path = require("path");
const rimraf = require("rimraf");
const unzipper = require("unzipper");

const rm = (filePath) =>
  new Promise((resolve, reject) => {
    if (fs.existsSync(filePath)) {
      rimraf(filePath, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    } else {
      resolve();
    }
  });

const createDir = async (dir, isDelete = true) => {
  try {
    if (isDelete) {
      const isDirExist = fs.existsSync(dir);
      if (isDirExist) {
        await rm(dir);
      }
    }
    fs.mkdirSync(dir, { recursive: true });
  } catch (err) {
    throw err;
  }
};

const unzip = async (origin, dist) => {
  try {
    fs.createReadStream(origin).pipe(unzipper.Extract({ path: dist }));
  } catch (err) {
    throw err;
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

exports.rm = rm;
exports.unzip = unzip;
exports.createDir = createDir;
exports.writeJson = writeJson;
