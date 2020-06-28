const fs = require("fs");
const path = require("path");
const rimraf = require("rimraf");
const unzipper = require("unzipper");

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
    const dist = path.join(__dirname, "../dist");
    const isDirExist = fs.existsSync(dist);
    if (isDirExist) {
      await rm(dist);
    }
    await createDir(dist);
    return dist;
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

exports.rm = rm;
exports.unzip = unzip;
exports.createDir = createDir;
exports.createDistDir = createDistDir;
