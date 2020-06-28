const fs = require("fs");
const rimraf = require("rimraf");

const rm = (filePath) =>
  new Promise((resolve, reject) => {
    rimraf(filePath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

const createDir = (dir) =>
  new Promise((resolve, reject) => {
    try {
      fs.mkdir(dir, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(dir);
        }
      });
    } catch (err) {
      reject(err);
    }
  });

const createDistDir = async () => {
  try {
    const isDirExist = fs.existsSync("dist");
    if (isDirExist) {
      await rm("dist");
    }
    await createDir("dist");
  } catch (err) {
    throw err;
  }
};

exports.rm = rm;
exports.createDir = createDir;
exports.createDistDir = createDistDir;
