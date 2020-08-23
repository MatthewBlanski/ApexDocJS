const fs = require('fs');
const path = require('path');

const SFDXProjectJsonParser = require('./config/sfdxProjectJsonParser.js');

const GitService = require('./gitservices/gitService.js')

const ApexParser = require('./apexParsing/ApexParser.js');
const ClassGroup = require('./classGroup.js');
const FileManager = require('./fileManager.js');

class ApexDoc {
    constructor(apexDocsJsonParser) {
        this.accessModifiers = apexDocsJsonParser.getAccessModifiers();
        this.bannerFilePath = apexDocsJsonParser.getBannerFilePath();
        this.homefilepath = apexDocsJsonParser.getHomeFilePath();
        this.mainBranch = apexDocsJsonParser.getMainBranch();
        this.sourceDirectory = apexDocsJsonParser.getSourceDirectory();
        this.targetDirectory = apexDocsJsonParser.getTargetDirectory();

        const sfdxProjectJsonParser = new SFDXProjectJsonParser(this.sourceDirectory);
        this.packageDirectories = sfdxProjectJsonParser.getPackageDirectories();

        this.apexParser = new ApexParser(apexDocsJsonParser);
        this.fm = new FileManager(apexDocsJsonParser);
    }

    runApexDocs() {
        const gitService = new GitService(
            this.sourceDirectory,
            this.mainBranch
        );

        //TODO: Handle rejection elegantly
        gitService.checkIsRepoRoot()
        .then((response) => gitService.getRemotes())
        .then((response) => {
            this.hostedSourceUrl = gitService.getSourceUrlFromRemotes();
            this.mainLogic();
        });
    }

    //TODO: Name this better
    mainLogic() {
        const filesArray = this.getClassFilesFromPackageDirectories();

        //Create a new array of ClassModels
        const classModels = this.getClassModelsFromFiles(filesArray);
        const mapGroupNameToClassGroup = this.createMapGroupNameToClassGroup(classModels, this.sourceDirectory);

        const projectDetail = this.fm.parseHTMLFile(this.bannerFilePath);
        const homeContents = this.fm.parseHTMLFile(this.homefilepath);
        this.fm.createDoc(mapGroupNameToClassGroup, classModels, projectDetail, homeContents, this.hostedSourceUrl);
        console.log('ApexDoc has completed!');
    }

    getClassFilesFromPackageDirectories() {
        let filesArray = [];
        
        this.packageDirectories.forEach((directoryName) => {
            filesArray = filesArray.concat(this.getFilesFromDirectory(directoryName));
        });

        return filesArray;
    }

    getFilesFromDirectory(directoryName) {
        let filesArray = [];

        const directory = fs.readdirSync(directoryName,{encoding:'utf8',withFileTypes:true});

        directory.forEach((directoryEntry) => {
            if(directoryEntry.isFile()) {
                if(directoryEntry.name.endsWith('.cls')) {
                    filesArray.push(path.resolve(directoryName, directoryEntry.name));
                }
            } else if (directoryEntry.isDirectory()) {
                let subArray = this.getFilesFromDirectory( path.resolve(directoryName, directoryEntry.name) );
                filesArray = filesArray.concat(subArray);
            }
        });

        return filesArray;
    }

    /*printHelp() {
        console.log("ApexDoc - a tool for generating documentation from Salesforce Apex code class files.\n");
        console.log("    Invalid Arguments detected.  The correct syntax is:\n");
        console.log("apexdoc -s <source_directory> [-t <target_directory>] [-g <source_url>] [-h <homefile>] [-a <authorfile>] [-p <scope>]\n");
        console.log("<source_directory> - The folder location which contains your apex .cls classes");
        console.log("<target_directory> - Optional. Specifies your target folder where documentation will be generated.");
        console.log("<source_url> - Optional. Specifies a URL where the source is hosted (so ApexDoc can provide links to your source).");
        console.log("<homefile> - Optional. Specifies the html file that contains the contents for the home page\'s content area.");
        console.log("<authorfile> - Optional. Specifies the text file that contains project information for the documentation header.");
        console.log("<scope> - Optional. Semicolon seperated list of scopes to document.  Defaults to 'global;public'. ");
    }*/

    createMapGroupNameToClassGroup(cModels,sourceDirectory) {
        let map = new Map();
        cModels.forEach((cmodel) => {
            let strGroup = cmodel.getClassGroup();
            let strGroupContent = cmodel.getClassGroupContent();
            if (strGroupContent) {
                //TODO: use Path for this instead
                strGroupContent = sourceDirectory + "/" + strGroupContent;
            }
            let cg;
            if (strGroup) {
                cg = map.get(strGroup);
                if (!cg) {
                    cg = new ClassGroup(strGroup, strGroupContent);
                } else if (!cg.getContentSource()) {
                    cg.setContentSource(strGroupContent);
                }
                // put the new or potentially modified ClassGroup back in the map
                map.set(strGroup, cg);
            }
        });

        return map;
    }

    getClassModelsFromFiles(filesArray) {
        let classModels = [];

        filesArray.forEach((filePath) => {
            //get absolute path of file
            const classModel = this.apexParser.parseFileContents(filePath);

            if(classModel) {
                classModels.push(classModel);
            }
        });

        return classModels;
    }
}

module.exports = ApexDoc;