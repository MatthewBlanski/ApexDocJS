const fs = require('fs');
const path = require('path');

const ClassGroup = require('./classGroup.js');
const ClassModel = require('./classModel.js');
const MethodModel = require('./methodModel.js');
const PropertyModel = require('./propertyModel.js');
const FileManager = require('./fileManager.js');

class ApexDoc {
    constructor(sourceDirectory) {
        this.sourceDirectory = sourceDirectory;
        this.targetDirectory = "../";
        this.authorFilePath = "";
        this.homefilepath = "";
        this.rgstrScope = ['global','public','webService'];
        this.rgstrArgs = [];
        this.fm = new FileManager(this.targetDirectory,this.rgstrScope);
        this.hostedSourceUrl = "";//TODO include calculation for this
    }

    runApexDocs() {
        this.fm = new FileManager(this.targetDirectory,this.rgstrScope);

        const filesArray = this.getFilesFromDirectory(this.sourceDirectory);

        //Create a new array of ClassModels
        const classModels = this.getClassModelsFromFiles(filesArray);
        const mapGroupNameToClassGroup = this.createMapGroupNameToClassGroup(classModels, this.sourceDirectory);

        //TODO: Add resolve HTML and file creation
        const projectDetail = this.fm.parseHTMLFile(this.authorfilepath);
        const homeContents = this.fm.parseHTMLFile(this.homefilepath);
        this.fm.createDoc(mapGroupNameToClassGroup, classModels, projectDetail, homeContents, this.hostedSourceURL);
        console.log('ApexDoc has completed!');
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

    printHelp() {
        console.log("ApexDoc - a tool for generating documentation from Salesforce Apex code class files.\n");
        console.log("    Invalid Arguments detected.  The correct syntax is:\n");
        console.log("apexdoc -s <source_directory> [-t <target_directory>] [-g <source_url>] [-h <homefile>] [-a <authorfile>] [-p <scope>]\n");
        console.log("<source_directory> - The folder location which contains your apex .cls classes");
        console.log("<target_directory> - Optional. Specifies your target folder where documentation will be generated.");
        console.log("<source_url> - Optional. Specifies a URL where the source is hosted (so ApexDoc can provide links to your source).");
        console.log("<homefile> - Optional. Specifies the html file that contains the contents for the home page\'s content area.");
        console.log("<authorfile> - Optional. Specifies the text file that contains project information for the documentation header.");
        console.log("<scope> - Optional. Semicolon seperated list of scopes to document.  Defaults to 'global;public'. ");
    }

    createMapGroupNameToClassGroup(cModels,sourceDirectory) {
        let map = new Map();
        cModels.forEach((cmodel) => {
            let strGroup = cmodel.getClassGroup();
            let strGroupContent = cmodel.getClassGroupContent();
            if (strGroupContent) {
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
            const classModel = this.parseFileContents(filePath);

            if(classModel) {
                classModels.push(classModel);
            }
        });

        return classModels;
    }

    parseFileContents(filePath) {
        let commentsStarted = false;
        let docBlockStarted = false;
        let nestedCurlyBraceDepth = 0;
        let lstComments = []
        let cModel;
        let cModelParent;
        let cModels = [];
        let combinedMethodLine;
        let error;

        //TODO - get someone better at handling readfiles
        console.log("Processing file " + filePath);

        let file = fs.readFileSync(filePath, {encoding:'utf8',flag:'r'});
        let lineArray = file.split("\n");
 
        let iLine = 0;

        try{
        lineArray.forEach((strLine) => {
            iLine++;

            //TODO - figure out a better way to handle this
            if(error) {
                return;
            }

            if(combinedMethodLine) {
                combinedMethodLine += strLine;

                if (!combinedMethodLine.includes(')')) {
                    return;
                }

                let mModel = new MethodModel(this.rgstrScope);
                this.fillMethodModel(mModel, combinedMethodLine, lstComments, iLine);
                cModel.getMethods().push(mModel);
                lstComments = [];
                combinedMethodLine = undefined;
                return;
            }

            strLine = strLine.trim();
            if (strLine.length === 0) {
                return;
            }

            // ignore anything after // style comments. this allows hiding of tokens from ApexDoc.
            let ich = strLine.indexOf('//');
            if (ich > -1) {
                strLine = strLine.substring(0, ich);
            }

            // gather up our comments
            if (strLine.startsWith('/*')) {
                commentsStarted = true;
                let commentEnded = false;
                if(strLine.startsWith('/**')){
                    if (strLine.endsWith('*/')) {
                        strLine = strLine.replace('*/', '');
                        commentEnded = true;
                    }
                    lstComments.push(strLine);
                    docBlockStarted = true;
                }
                if (strLine.endsWith('*/') || commentEnded) {
                    commentsStarted = false;
                    docBlockStarted = false;
                }
                return;
            }

            if (commentsStarted && strLine.endsWith('*/')) {
                strLine = strLine.replace('*/', '');
                if(docBlockStarted){
                    lstComments.push(strLine);
                    docBlockStarted = false;
                }
                commentsStarted = false;
                return;
            }

            if (commentsStarted) {
                if(docBlockStarted){
                    lstComments.push(strLine);
                }
                return;
            }

            // keep track of our nesting so we know which class we are in
            let openCurlies = this.countChars(strLine, '{');
            let closeCurlies = this.countChars(strLine, '}');
            nestedCurlyBraceDepth += openCurlies;
            nestedCurlyBraceDepth -= closeCurlies;

            // if we are in a nested class, and we just got back to nesting level 1,
            // then we are done with the nested class, and should set its props and methods.
            if (nestedCurlyBraceDepth === 1
                && openCurlies != closeCurlies
                && cModels.length > 1
                && cModel
            ) {
                cModels.pop();
                cModel = cModels[cModels.length - 1];
                return;
            }

            // ignore anything after an =. this avoids confusing properties with methods.
            ich = strLine.indexOf('=');
            if (ich > -1) {
                strLine = strLine.substring(0, ich);
            }

            // ignore anything after an {. this avoids confusing properties with methods.
            ich = strLine.indexOf('{');
            if (ich > -1) {
                strLine = strLine.substring(0, ich);
            }

            // ignore lines not dealing with scope
            if (!this.strContainsScope(strLine) &&
                    // interface methods don't have scope
                !(cModel &&
                    cModel.getIsInterface()
                    && strLine.includes('(')
                )
            ) {
                return;
            }

            // look for a class
            if (strLine.toLowerCase().includes(' class ') ||
                strLine.toLowerCase().includes(' interface ')
            ) {
                console.log("Class found for " + filePath);

                // create the new class
                let cModelNew = new ClassModel(cModelParent, this.rgstrScope);
                this.fillClassModel(cModelParent, cModelNew, strLine, lstComments, iLine);
                lstComments = [];

                // keep track of the new class, as long as it wasn't a single liner {}
                // but handle not having any curlies on the class line!
                if (openCurlies === 0 || openCurlies != closeCurlies) {
                    cModels.push(cModelNew);
                    cModel = cModelNew;
                }

                // add it to its parent (or track the parent)
                if (cModelParent) {
                    cModelParent.addChildClass(cModelNew);
                } else {
                    cModelParent = cModelNew;
                }

                return;
            }

            // look for a method
            if (strLine.includes('(')) {
                // deal with a method over multiple lines.
                if (!strLine.includes(')')) {
                    combinedMethodLine = strLine;
                    return;
                }
                let mModel = new MethodModel(this.rgstrScope);
                this.fillMethodModel(mModel, strLine, lstComments, iLine);
                cModel.getMethods().push(mModel);
                lstComments = [];
                return;
            }

            // handle set & get within the property
            if (strLine.includes(' get ') ||
                strLine.includes(' set ') ||
                strLine.includes(' get;') ||
                strLine.includes(' set;') ||
                strLine.includes(' get{') ||
                strLine.includes(' set{')
            ) {
                return;
            }

            // must be a property
            let propertyModel = new PropertyModel(this.rgstrScope);
            this.fillPropertyModel(propertyModel, strLine, lstComments, iLine);
            cModel.getProperties().push(propertyModel);
            lstComments = [];
            return;
        });

        } catch(e) {
            console.log("Error on Line " + iLine + " " + filePath);
            return null;
        }

        console.log("Finished on Line " + iLine + " " + filePath);

        return cModelParent;
    }

    strContainsScope(str) {
        str = str.toLowerCase();
        for (let i = 0; i < this.rgstrScope.length; i++) {
            if (str.toLowerCase().includes(this.rgstrScope[i].toLowerCase() + " ")) {
                return this.rgstrScope[i];
            }
        }
        return null;
    }

    fillPropertyModel(propertyModel, name, lstComments, iLine) {
        propertyModel.setNameLine(name, iLine);
        let inDescription = false;
        let i = 0;
        lstComments.forEach((comment) => {
        	i++;
            comment = comment.trim();
            let idxStart = comment.toLowerCase().indexOf("@description");
            if (idxStart != -1 || i === 1) {
            	if (idxStart != -1 && comment.length > idxStart + 13) {
                    propertyModel.setDescription(comment.substring(idxStart + 13).trim());
                } else {
                    //TODO - Confirm this is identical
                    let mStart = comment.indexOf('\\s')
                	if (mStart != -1) {
                		propertyModel.setDescription(comment.substring(mStart).trim());
                	}
                }
                inDescription = true;
                return;
            }

            // handle multiple lines for description.
            if (inDescription) {
                let j;
                for (j = 0; j < comment.length; j++) {
                    const ch = comment.charAt(j);
                    if (ch != '*' && ch != ' ') {
                        break;
                    }
                }
                if (j < comment.length) {
                    propertyModel.setDescription(propertyModel.getDescription() + ' ' + comment.substring(j));
                }
                return;
            }
        });
    }

    fillMethodModel(mModel, name, lstComments, iLine) {
        mModel.setNameLine(name, iLine);
        let inDescription = false;
        let inExample = false;
        let i = 0;
        lstComments.forEach((comment) => {
        	i++;
            comment = comment.trim();

            let idxStart = comment.toLowerCase().indexOf("@author");
            if (idxStart != -1) {
                mModel.setAuthor(comment.substring(idxStart + 8).trim());
                inDescription = false;
                inExample = false;
                return;
            }

            idxStart = comment.toLowerCase().indexOf("@date");
            if (idxStart != -1) {
                mModel.setDate(comment.substring(idxStart + 5).trim());
                inDescription = false;
                inExample = false;
                return;
            }

            idxStart = comment.toLowerCase().indexOf("@return");
            if (idxStart != -1) {
                mModel.setReturns(comment.substring(idxStart + 7).trim());
                inDescription = false;
                inExample = false;
                return;
            }

            idxStart = comment.toLowerCase().indexOf("@param");
            if (idxStart != -1) {
                mModel.getParams().push(comment.substring(idxStart + 6).trim());
                inDescription = false;
                inExample = false;
                return;
            }

            idxStart = comment.toLowerCase().indexOf("@description");
            if (idxStart != -1 || i === 1) {
                if (idxStart != -1 && comment.length >= idxStart + 12)
                    mModel.setDescription(comment.substring(idxStart + 12).trim());
                else{
                    //TODO - Confirm this is identical
                    let mStart = comment.indexOf('\\s')
                	if (mStart != -1) {
                		mModel.setDescription(comment.substring(mStart).trim());
                	}
                }
                inDescription = true;
                inExample = false;
                return;
            }

            idxStart = comment.toLowerCase().indexOf("@example");
            if (idxStart != -1 || i === 1) {
                if (idxStart != -1 && comment.length >= idxStart + 8) {
                    mModel.setExample(comment.substring(idxStart + 8).trim());
                } else {
                    //TODO - Confirm this is identical
                    let mStart = comment.indexOf('\\s')
                	if (mStart != -1) {
                		mModel.setExample(comment.substring(mStart).trim());
                	}
                }
                inDescription = false;
                inExample = true;
                return;
            }

            // handle multiple lines for @description and @example.
            if (inDescription || inExample) {
                let j;
                for (j = 0; j < comment.length; j++) {
                    let ch = comment.charAt(j);
                    if (ch != '*' && ch != ' ') {
                        break;
                    }
                }
                if (j < comment.length) {
                    if (inDescription) {
                        mModel.setDescription(mModel.getDescription() + ' ' + comment.substring(j));
                    } else if (inExample) {
                        // Lets's not include the tag
                        if (j === 0 && comment.substring(2, 10) === "* @example") {
                            comment = comment.substring(10);
                        }

                        mModel.setExample(mModel.getExample()
                            + (mModel.getExample().trim().length === 0 ? "" : "\n")
                            + comment.substring(2));
                    }
                }
                return;
            }
        });
    }

    fillClassModel(cModelParent, cModel, name, lstComments, iLine) {
        cModel.setNameLine(name, iLine);
        if (name.toLowerCase().includes(" interface ")) {
            cModel.setIsInterface(true);
        }
        let inDescription = false;
        let i = 0;
        lstComments.forEach((comment) => {
        	i++;
            comment = comment.trim();

            let idxStart = comment.toLowerCase().indexOf("@author");
            if (idxStart != -1) {
                cModel.setAuthor(comment.substring(idxStart + 7).trim());
                inDescription = false;
                return;
            }

            idxStart = comment.toLowerCase().indexOf("@date");
            if (idxStart != -1) {
                cModel.setDate(comment.substring(idxStart + 5).trim());
                inDescription = false;
                return;
            }

            idxStart = comment.toLowerCase().indexOf("@group "); // needed to include space to not match group-content.
            if (idxStart != -1) {
                cModel.setClassGroup(comment.substring(idxStart + 6).trim());
                inDescription = false;
                return;
            }

            idxStart = comment.toLowerCase().indexOf("@group-content");
            if (idxStart != -1) {
                cModel.setClassGroupContent(comment.substring(idxStart + 14).trim());
                inDescription = false;
                return;
            }

            idxStart = comment.toLowerCase().indexOf("@description");
            if (idxStart != -1 || i === 1) {
            	if (idxStart != -1 && comment.length > idxStart + 13)
            		cModel.setDescription(comment.substring(idxStart + 12).trim());
            	else{
                    //TODO - Confirm this is identical
                    let mStart = comment.indexOf('\\s')
                	if (mStart != -1) {
                		cModel.setDescription(comment.substring(mStart).trim());
                	}
                }
                inDescription = true;
                return;
            }

            // handle multiple lines for description.
            if (inDescription) {
                let j;
                for (j = 0; j < comment.length; j++) {
                    let ch = comment.charAt(j);
                    if (ch != '*' && ch != ' ') {
                        break;
                    }
                }
                if (j < comment.length) {
                    cModel.setDescription(cModel.getDescription() + ' ' + comment.substring(j));
                }
                return;
            }
        });
    }

    strPrevWord(str, iSearch) {
        if (!str || iSearch >= str.length) {
            return null;
        }

        let iStart;
        let iEnd = 0;
        for (iStart = iSearch - 1; iStart >= 0; iStart--) {
            if (iEnd === 0) {
                if (str.charAt(iStart) === ' ') {
                    continue;
                }
                iEnd = iStart + 1;
            } else if (str.charAt(iStart) === ' ') {
                iStart++;
                break;
            }
        }

        if (iStart === -1) {
            return null;
        } else {
            return str.substring(iStart, iEnd);
        }
    }

    countChars(str, ch) {
        let count = 0;
        for (let i = 0; i < str.length; ++i) {
            if (str.charAt(i) === ch) {
                ++count;
            }
        }
        return count;
    }
}

module.exports = ApexDoc;