const fs = require('fs');

const ClassModel = require('../apexmodels/classModel.js');
const MethodModel = require('../apexmodels/methodModel.js');
const PropertyModel = require('../apexmodels/propertyModel.js');

class ApexParser {
    constructor(accessModifiers,sourceDirectory) {
        this.accessModifiers = accessModifiers;
        this.sourceDirectory = sourceDirectory;
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

        //TODO - get someone better at handling readfiles
        let file = fs.readFileSync(filePath, {encoding:'utf8',flag:'r'});
        let lineArray = file.split("\n");
 
        let iLine = 0;

        try{
            lineArray.forEach((strLine) => {
                iLine++;

                if(combinedMethodLine) {
                    combinedMethodLine += strLine;

                    if (!combinedMethodLine.includes(')')) {
                        return;
                    }

                    let mModel = new MethodModel(this.accessModifiers);
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

                    // create the new class
                    let cModelNew = new ClassModel(cModelParent, this.accessModifiers);
                    this.fillClassModel(cModelNew, strLine, filePath, lstComments,  iLine);
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
                    let mModel = new MethodModel(this.accessModifiers);
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
                let propertyModel = new PropertyModel(this.accessModifiers);
                this.fillPropertyModel(propertyModel, strLine, lstComments, iLine);
                cModel.getProperties().push(propertyModel);
                lstComments = [];
                return;
            });
        } catch(e) {
            console.log("Error on Line " + iLine + " " + filePath);
            return null;
        }

        return cModelParent;
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

    fillClassModel(cModel, name, filePath, lstComments, iLine) {
        cModel.setNameLine(name, iLine);
        if (name.toLowerCase().includes(" interface ")) {
            cModel.setIsInterface(true);
        }
        
        cModel.setRelativeFilePath(
            filePath.replace(this.sourceDirectory,'')
        );

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

    strContainsScope(str) {
        str = str.toLowerCase();
        for (let i = 0; i < this.accessModifiers.length; i++) {
            if (str.toLowerCase().includes(this.accessModifiers[i].toLowerCase() + " ")) {
                return this.accessModifiers[i];
            }
        }
        return null;
    }
}

module.exports = ApexParser;