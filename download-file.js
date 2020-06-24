const OSS = require("ali-oss");
const config = require("./oss-config.json");

const client = new OSS(config);

const downloadFile = async (id) => {
  try {
    const result = await client.get(id, "./a.pdf");
  } catch (err) {
    throw err;
  }
};
downloadFile("aa3c7ff7-9d08-4910-a090-91383e66ef3b");
module.exports = downloadFile;
