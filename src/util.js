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

exports.rm = rm;
exports.walk = walk;
exports.unzip = unzip;
exports.createDir = createDir;
exports.writeJson = writeJson;
