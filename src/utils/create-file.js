const fs = require("node:fs");
const path = require("node:path");

class CreateFile {
  async execute(filename, content) {
    const pathStorage = path.join(__dirname, "../../storage");

    if (!fs.existsSync(pathStorage)) {
      fs.mkdirSync(pathStorage, { recursive: true });
    }

    const filePath = `${pathStorage}/${filename}`;

    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), "utf8");
  }
}

module.exports = CreateFile;
