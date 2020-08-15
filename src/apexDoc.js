const ApexModel = require("./apexModel.js");
const ClassModel = require("./classModel.js");
const fs = require("fs");
const path = require("path");

class ApexDoc {
    constructor(sourceDirectory) {
        this.sourceDirectory = sourceDirectory;
    }

    runApexDocs() {
        const registeredScope = ["global","public","webService"];

        const filesArray = this.getFilesFromDirectory(this.sourceDirectory);
        console.log(JSON.stringify(filesArray));

        //Create a new array of ClassModels
        const classModels = this.getClassModelsFromFiles(filesArray);
        //const mapGroupNameToClassGroup = this.createMapGroupNameToClassGroup(classModels, this.sourceDirectory);

        //const projectDetail;//fm.parseHTMLFile(authorfilepath);
        //const homeContents;//fm.parseHTMLFile(homefilepath);
        //fm.createDoc(mapGroupNameToClassGroup, classModels, projectDetail, homeContents, hostedSourceURL);
        console.log("ApexDoc has completed!");
    }

    getFilesFromDirectory(directoryName) {
        let filesArray = [];

        const directory = fs.readdirSync(directoryName,{encoding:"utf8",withFileTypes:true});

        directory.forEach((directoryEntry) => {
            if(directoryEntry.isFile()) {
                if(directoryEntry.name.endsWith(".js")) {
                    filesArray.push(path.resolve(directoryName, directoryEntry.name));
                }
            } else if (directoryEntry.isDirectory()) {
                let subArray = this.getFilesFromDirectory( path.resolve(directoryName, directoryEntry.name) );
                filesArray = filesArray.concat(subArray);
            }
        });

        return filesArray;
    }

    getClassModelsFromFiles(filesArray) {
        let classModels = [];

        filesArray.forEach((filePath) => {
            //get absolute path of file
            const classModel = this.parseFileContents(filePath);

            if(classModel) {
                classModels.push(classModel);
            }
        });

        return classModels;
    }

    parseFileContents(filePath) {
        let file = fs.readFileSync(filePath,{flag:"r"});
        console.log("file read!");
    }

    createMapGroupNameToClassGroup(classModels, sourceDirectory) {
        //Get all files from the source directory
        raw = fs.readFileSync(filePath, "utf8");
    }
}

module.exports = ApexDoc;