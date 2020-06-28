const fs = require("fs");
const path = require("path");

function getZipFiles(targetPath) {
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
          if (fileName.includes("zip")) {
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

module.exports = getZipFiles;
