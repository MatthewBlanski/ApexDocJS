const ApexModel = require('./apexModel.js');
const ClassModel = require('./classModel.js');
const fs = require('fs');

class ApexDoc {
    constructor(sourceDirectory) {
        this.sourceDirectory = sourceDirectory;
    }

    runApexDocs() {
        const registeredScope = ["global","public","webService"];

        //get all files recursively!
        const filesArray = this.getFilesFromDirectory();
        //sourceDirectory.readSync();
        //Create a new array of ClassModels
        const classModels = this.getClassModelsFromFiles(filesArray);
        const mapGroupNameToClassGroup = this.createMapGroupNameToClassGroup(classModels, this.sourceDirectory);

        const projectDetail;//fm.parseHTMLFile(authorfilepath);
        const homeContents;//fm.parseHTMLFile(homefilepath);
        //fm.createDoc(mapGroupNameToClassGroup, classModels, projectDetail, homeContents, hostedSourceURL);
        console.log("ApexDoc has completed!");
    }

    getFilesFromDirectory(sourceDirectory) {
        let filesArray = [];
        //TODO: test access with fs.accessSync(sourceDirectory,fs.constants.R_OK)
        const directory = fs.readdirSync(sourceDirectory,{'utf8',true});

        directory.forEach((directoryEntry) => {
            if(directoryEntry.isFile()) {
                if(directoryEntry.name.endsWith(".cls")) {
                    filesArray.push(directoryEntry);
                }
            } else if (directoryEntry.isDirectory()) {
                //TODO: Include code to recurse directories for this for support for dx format
            }
        });

        return filesArray;
    }

    getClassModelsFromFiles(filesArray) {
        let classModels = [];

        filesArray.forEach((file,classModels) => {
            //get absolute path of file
            const classModel = this.parseFileContents(file);

            if(classModel) {
                classModels.push(classModel);
            }
        });

        return classModels;
    }

    createMapGroupNameToClassGroup(classModels, sourceDirectory) {
        //Get all files from the source directory
        raw = fs.readFileSync(filePath, 'utf8');
    }

    parseFileContents() {}
}

module.exports = ApexDoc;