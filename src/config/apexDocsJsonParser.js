const fs = require('fs');
const path = require('path');

class ApexDocsJsonParser {
    constructor(sourceDirectory) {
        this.sourceDirectory = path.resolve(sourceDirectory);
        this.apexDocsJsonFilePath = path.resolve(sourceDirectory,'apexdocs.json');
    }

    apexDocsJsonExists() {
        return fs.existsSync(this.apexDocsJsonFilePath);
    }

    readApexDocsJson() {
        if(!this.apexDocsJsonExists()) {
            return;
        }
        const file = fs.readFileSync(this.apexDocsJsonFilePath, {encoding:'utf8',flag:'r'});
        return file;
    }

    getApexDocsJson() {
        if(!this.apexDocsJson) {
            this.apexDocsJson = JSON.parse(this.readApexDocsJson());
        }

        return this.apexDocsJson;
    }

    getAccessModifiers() {
        if(!this.getApexDocsJson().accessModifiers) {
            return ['global','public','webService'];
        }
        return this.getApexDocsJson().accessModifiers;
    }

    getBannerFilePath() {
        if(!this.getApexDocsJson().bannerFilePath) {
            return '';
        }
        return this.getApexDocsJson().bannerFilePath;
    }

    getHomeFilePath() {
        if(!this.getApexDocsJson().homeFilePath) {
            return '';
        }
        return this.getApexDocsJson().homeFilePath;
    }

    getMainBranch() {
        if(!this.getApexDocsJson().mainBranch) {
            return 'main';
        }
        return this.getApexDocsJson().mainBranch;
    }

    getResourcesPath() {
        if(!this.getApexDocsJson().resourcesPath) {
            return path.resolve(this.getSourceDirectory(),'apexdocsresources');
        }
        return path.resolve(this.getSourceDirectory(),this.getApexDocsJson().resourcesPath);
    }

    getSourceDirectory() {
        return this.sourceDirectory
    }

    getTargetDirectory() {
        if(!this.getApexDocsJson().targetDirectory) {
            return path.resolve(this.getSourceDirectory(),'ApexDocsContent');
        }

        return path.resolve(this.getSourceDirectory(),this.getApexDocsJson().targetDirectory);
    }
}

module.exports = ApexDocsJsonParser;