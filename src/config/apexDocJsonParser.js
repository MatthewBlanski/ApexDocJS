const fs = require('fs');
const path = require('path');

class ApexDocJSONParser {
    constructor(sourceDirectory) {
        this.sourceDirectory = path.resolve(sourceDirectory);
        this.apexDocJSONFilePath = path.resolve(sourceDirectory,'apexdoc.json');
        this.apexDocsJSONFilePath = path.resolve(sourceDirectory,'apexdocs.json');
    }

    readApexDocJSON() {
        if(!this.apexDocJSONExists()) {
            this.handleDocsToDoc();
            return null;
        }
        const file = fs.readFileSync(this.apexDocJSONFilePath, {encoding:'utf8',flag:'r'});
        return file;
    }

    getApexDocJSON() {
        if(!this.apexDocJSON) {
            const rawJSON = this.readApexDocJSON();
            if(rawJSON) {
                this.apexDocJSON = JSON.parse();
            } else {
                this.apexDocJSON = {};
            }
        }

        return this.apexDocJSON;
    }

    apexDocJSONExists() {
        return fs.existsSync(this.apexDocJSONFilePath);
    }

    handleDocsToDoc() {
        if(fs.existsSync(this.apexDocsJSONFilePath)) {
            console.log('ApexDocJS no longer uses the plural form of ApexDoc in any of it\'s code. The files that have moved are apexdocs.json to apexdoc.json, apexdocsresources to apexdocresources, and ApexDocsContent to ApexDocContent.');
        }
    }

    getAccessModifiers() {
        if(!this.getApexDocJSON().accessModifiers) {
            return ['global','public','webService'];
        }
        return this.getApexDocJSON().accessModifiers;
    }

    getBannerFilePath() {
        if(!this.getApexDocJSON().bannerFilePath) {
            return '';
        }
        return this.getApexDocJSON().bannerFilePath;
    }

    getHomeFilePath() {
        if(!this.getApexDocJSON().homeFilePath) {
            return '';
        }
        return this.getApexDocJSON().homeFilePath;
    }

    getMainBranch() {
        if(!this.getApexDocJSON().mainBranch) {
            return 'main';
        }
        return this.getApexDocJSON().mainBranch;
    }

    getResourcesFolderPath() {
        if(!this.getApexDocJSON().resourcesFolderPath) {
            return path.resolve(this.getSourceDirectory(),'apexdocresources');
        }
        return path.resolve(this.getSourceDirectory(),this.getApexDocJSON().resourcesFolderPath);
    }

    getSourceDirectory() {
        return this.sourceDirectory
    }

    getTargetDirectory() {
        if(!this.getApexDocJSON().targetDirectory) {
            return path.resolve(this.getSourceDirectory(),'ApexDocContent');
        }

        return path.resolve(this.getSourceDirectory(),this.getApexDocJSON().targetDirectory);
    }
}

module.exports = ApexDocJSONParser;