const OSS = require("ali-oss");
const config = require("./config/oss-config.json");

const client = new OSS(config);

const downloadFile = async (id, savePath) => {
  try {
    await client.get(id, savePath);
  } catch (err) {
    console.log("id", id);
    console.log("savePath", savePath);
    console.log("err---------", err.message);
    throw err;
  }
};
// downloadFile(
//   "091a9765-12b6-49bb-93ce-b6ebdd2a8933",
//   "/Users/xinghunm/xinghun/MyHouse/make-data-for-dvfcloud/dist/HT-19LHYJ/LG-194YJ7_aorta+both.ply.zip"
// );

module.exports = downloadFile;
