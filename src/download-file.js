const OSS = require("ali-oss");
const config = require("./config/oss-config.json");

const client = new OSS(config);

const downloadFile = async (id, savePath) => {
  try {
    await client.get(id, savePath);
    console.log(`downloadFile ${savePath} success`);
  } catch (err) {
    console.log("id", id);
    console.log("savePath", savePath);
    console.log("err---------", err.message);
    throw err;
  }
};
// downloadFile(
//   "3880ae4e-8fdc-449a-8ee5-ad54fd181aac",
//   "/Users/xinghunm/xinghun/MyHouse/make-data-for-dvfcloud/dist/HT-19H9CS/LG-194LCX_aorta+both.ply.zip"
// );

module.exports = downloadFile;
