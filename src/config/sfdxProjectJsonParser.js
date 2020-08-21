const fs = require('fs');
const path = require('path');

class SFDXProjectJsonParser {
    constructor(sourceDirectory) {
        this.sourceDirectory = path.resolve(sourceDirectory);
        this.sfdxProjectJsonFilePath = path.resolve(sourceDirectory,'sfdx-project.json');
    }

    readSFDXProjectJson() {
        const file = fs.readFileSync(this.sfdxProjectJsonFilePath, {encoding:'utf8',flag:'r'});
        return file;
    }

    getSFDXProjectJson() {
        if(!this.sfdxProjectJson) {
            this.sfdxProjectJson = JSON.parse(this.readSFDXProjectJson());
        }

        return this.sfdxProjectJson;
    }

    getPackageDirectories() {
        let packageSourceDirectories = [];
        const jsonPackageDirectories = this.getSFDXProjectJson().packageDirectories;
        jsonPackageDirectories.forEach((directoryName) => {
            packageSourceDirectories.push(path.resolve(this.sourceDirectory,directoryName.path));
        });

        return packageSourceDirectories;
    }
}

module.exports = SFDXProjectJsonParser;