const ApexModel = require('./apexModel.js');
const ClassModel = require('./classModel.js');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

class ApexDoc {
    constructor(sourceDirectory) {
        this.sourceDirectory = sourceDirectory;
    }

    runApexDocs() {
        const registeredScope = ['global','public','webService'];

        const filesArray = this.getFilesFromDirectory(this.sourceDirectory);
        console.log(JSON.stringify(filesArray));

        //Create a new array of ClassModels
        const classModels = this.getClassModelsFromFiles(filesArray);
        //const mapGroupNameToClassGroup = this.createMapGroupNameToClassGroup(classModels, this.sourceDirectory);

        //const projectDetail;//fm.parseHTMLFile(authorfilepath);
        //const homeContents;//fm.parseHTMLFile(homefilepath);
        //fm.createDoc(mapGroupNameToClassGroup, classModels, projectDetail, homeContents, hostedSourceURL);
        console.log('ApexDoc has completed!');
    }

    getFilesFromDirectory(directoryName) {
        let filesArray = [];

        const directory = fs.readdirSync(directoryName,{encoding:'utf8',withFileTypes:true});

        directory.forEach((directoryEntry) => {
            if(directoryEntry.isFile()) {
                if(directoryEntry.name.endsWith('.js')) {
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
        let strLine;
        let commentsStarted = false;
        let docBlockStarted = false;
        let nestedCurlyBraceDepth = 0;
        let lstComments = []
        let cModel;
        let cModelParent;
        let cModels = [];
        let combinedMethodLine;

        const fileStreamByLines = readline.createInterface({
            input: fs.createReadStream(filePath),
            output: process.stdout,
            terminal: false
        });

        let iLine = 0;
        fileStreamByLines.on('line', (strLine) => {
            iLine++;

            if(combinedMethodLine) {
                combinedMethodLine += strLine;

                if (!combinedMethodLine.contains(')')) {
                    return;
                }

                MethodModel mModel = new MethodModel();
                this.fillMethodModel(mModel, combinedMethodLine, lstComments, iLine);
                cModel.getMethods().add(mModel);
                lstComments.clear();
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
            let openCurlies = countChars(strLine, '{');
            let closeCurlies = countChars(strLine, '}');
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
                    !(cModel && cModel.getIsInterface() && strLine.contains('('))) {
                return;
            }

            // look for a class
            if ((strLine.toLowerCase().contains(' class ') || strLine.toLowerCase().contains(' interface '))) {

                // create the new class
                ClassModel cModelNew = new ClassModel(cModelParent);
                this.fillClassModel(cModelParent, cModelNew, strLine, lstComments, iLine);
                lstComments.clear();

                // keep track of the new class, as long as it wasn't a single liner {}
                // but handle not having any curlies on the class line!
                if (openCurlies === 0 || openCurlies != closeCurlies) {
                    cModels.push(cModelNew);
                    cModel = cModelNew;
                }

                // add it to its parent (or track the parent)
                if (cModelParent) {
                    cModelParent.addChildClass(cModelNew);
                }
                else {
                    cModelParent = cModelNew;
                }

                return;
            }

            // look for a method
            if (strLine.contains('(')) {
                // deal with a method over multiple lines.
                if (!strLine.contains(')')) {
                    combinedMethodLine = strLine;
                    return;
                }
                MethodModel mModel = new MethodModel();
                fillMethodModel(mModel, strLine, lstComments, iLine);
                cModel.getMethods().add(mModel);
                lstComments.clear();
                return;
            }

            // handle set & get within the property
            if (strLine.contains(' get ') ||
                strLine.contains(' set ') ||
                strLine.contains(' get;') ||
                strLine.contains(' set;') ||
                strLine.contains(' get{') ||
                strLine.contains(' set{')
            ) {
                return;
            }

            // must be a property
            PropertyModel propertyModel = new PropertyModel();
            this.fillPropertyModel(propertyModel, strLine, lstComments, iLine);
            cModel.getProperties().add(propertyModel);
            lstComments.clear();
            return;
        });

        return cModelParent;
    }

    public static String strContainsScope(String str) {
        str = str.toLowerCase();
        for (int i = 0; i < rgstrScope.length; i++) {
            if (str.toLowerCase().contains(rgstrScope[i].toLowerCase() + " ")) {
                return rgstrScope[i];
            }
        }
        return null;
    }

    private static void fillPropertyModel(PropertyModel propertyModel, String name, ArrayList<String> lstComments,
            int iLine) {
        propertyModel.setNameLine(name, iLine);
        boolean inDescription = false;
        int i = 0;
        for (String comment : lstComments) {
        	i++;
            comment = comment.trim();
            int idxStart = comment.toLowerCase().indexOf("@description");
            if (idxStart != -1 || i == 1) {
            	if (idxStart != -1 && comment.length() > idxStart + 13)
            		propertyModel.setDescription(comment.substring(idxStart + 13).trim());
            	else{
                	Pattern p = Pattern.compile("\\s");
                	Matcher m = p.matcher(comment);
                	if (m.find()) {
                		propertyModel.setDescription(comment.substring(m.start()).trim());
                	}
                }
                inDescription = true;
                continue;
            }

            // handle multiple lines for description.
            if (inDescription) {
                int j;
                for (j = 0; j < comment.length(); j++) {
                    char ch = comment.charAt(j);
                    if (ch != '*' && ch != ' ')
                        break;
                }
                if (j < comment.length()) {
                    propertyModel.setDescription(propertyModel.getDescription() + ' ' + comment.substring(j));
                }
                continue;
            }
        }
    }

    private static void fillMethodModel(MethodModel mModel, String name, ArrayList<String> lstComments, int iLine) {
        mModel.setNameLine(name, iLine);
        boolean inDescription = false;
        boolean inExample = false;
        int i = 0;
        for (String comment : lstComments) {
        	i++;
            comment = comment.trim();

            int idxStart = comment.toLowerCase().indexOf("@author");
            if (idxStart != -1) {
                mModel.setAuthor(comment.substring(idxStart + 8).trim());
                inDescription = false;
                inExample = false;
                continue;
            }

            idxStart = comment.toLowerCase().indexOf("@date");
            if (idxStart != -1) {
                mModel.setDate(comment.substring(idxStart + 5).trim());
                inDescription = false;
                inExample = false;
                continue;
            }

            idxStart = comment.toLowerCase().indexOf("@return");
            if (idxStart != -1) {
                mModel.setReturns(comment.substring(idxStart + 7).trim());
                inDescription = false;
                inExample = false;
                continue;
            }

            idxStart = comment.toLowerCase().indexOf("@param");
            if (idxStart != -1) {
                mModel.getParams().add(comment.substring(idxStart + 6).trim());
                inDescription = false;
                inExample = false;
                continue;
            }

            idxStart = comment.toLowerCase().indexOf("@description");
            if (idxStart != -1 || i == 1) {
                if (idxStart != -1 && comment.length() >= idxStart + 12)
                    mModel.setDescription(comment.substring(idxStart + 12).trim());
                else{
                	Pattern p = Pattern.compile("\\s");
                	Matcher m = p.matcher(comment);
                	if (m.find()) {
                		mModel.setDescription(comment.substring(m.start()).trim());
                	}
                }
                inDescription = true;
                inExample = false;
                continue;
            }

            idxStart = comment.toLowerCase().indexOf("@example");
            if (idxStart != -1 || i == 1) {
                if (idxStart != -1 && comment.length() >= idxStart + 8) {
                    mModel.setExample(comment.substring(idxStart + 8).trim());
                } else {
                	Pattern p = Pattern.compile("\\s");
                	Matcher m = p.matcher(comment.substring(8));

                	if (m.find()) {
                		mModel.setExample(comment.substring(m.start()).trim());
                	}
                }
                inDescription = false;
                inExample = true;
                continue;
            }

            // handle multiple lines for @description and @example.
            if (inDescription || inExample) {
                int j;
                for (j = 0; j < comment.length(); j++) {
                    char ch = comment.charAt(j);
                    if (ch != '*' && ch != ' ')
                        break;
                }
                if (j < comment.length()) {
                    if (inDescription) {
                        mModel.setDescription(mModel.getDescription() + ' ' + comment.substring(j));
                    } else if (inExample) {
                        // Lets's not include the tag
                        if (j == 0 && comment.substring(2, 10) == "* @example") {
                            comment = comment.substring(10);
                        }

                        mModel.setExample(mModel.getExample()
                            + (mModel.getExample().trim().length() == 0 ? "" : "\n")
                            + comment.substring(2));
                    }
                }
                continue;
            }
        }
    }

    private static void fillClassModel(ClassModel cModelParent, ClassModel cModel, String name,
            ArrayList<String> lstComments, int iLine) {
        cModel.setNameLine(name, iLine);
        if (name.toLowerCase().contains(" interface "))
            cModel.setIsInterface(true);
        boolean inDescription = false;
        int i = 0;
        for (String comment : lstComments) {
        	i++;
            comment = comment.trim();

            int idxStart = comment.toLowerCase().indexOf("@author");
            if (idxStart != -1) {
                cModel.setAuthor(comment.substring(idxStart + 7).trim());
                inDescription = false;
                continue;
            }

            idxStart = comment.toLowerCase().indexOf("@date");
            if (idxStart != -1) {
                cModel.setDate(comment.substring(idxStart + 5).trim());
                inDescription = false;
                continue;
            }

            idxStart = comment.toLowerCase().indexOf("@group "); // needed to include space to not match group-content.
            if (idxStart != -1) {
                cModel.setClassGroup(comment.substring(idxStart + 6).trim());
                inDescription = false;
                continue;
            }

            idxStart = comment.toLowerCase().indexOf("@group-content");
            if (idxStart != -1) {
                cModel.setClassGroupContent(comment.substring(idxStart + 14).trim());
                inDescription = false;
                continue;
            }

            idxStart = comment.toLowerCase().indexOf("@description");
            if (idxStart != -1 || i == 1) {
            	if (idxStart != -1 && comment.length() > idxStart + 13)
            		cModel.setDescription(comment.substring(idxStart + 12).trim());
            	else{
                	Pattern p = Pattern.compile("\\s");
                	Matcher m = p.matcher(comment);
                	if (m.find()) {
                		cModel.setDescription(comment.substring(m.start()).trim());
                	}
                }
                inDescription = true;
                continue;
            }

            // handle multiple lines for description.
            if (inDescription) {
                int j;
                for (j = 0; j < comment.length(); j++) {
                    char ch = comment.charAt(j);
                    if (ch != '*' && ch != ' ')
                        break;
                }
                if (j < comment.length()) {
                    cModel.setDescription(cModel.getDescription() + ' ' + comment.substring(j));
                }
                continue;
            }
        }
    }

    /*************************************************************************
     * strPrevWord
     *
     * @param str
     *            - string to search
     * @param iSearch
     *            - where to start searching backwards from
     * @return - the previous word, or null if none found.
     */
    public static String strPrevWord(String str, int iSearch) {
        if (str == null)
            return null;
        if (iSearch >= str.length())
            return null;

        int iStart;
        int iEnd;
        for (iStart = iSearch - 1, iEnd = 0; iStart >= 0; iStart--) {
            if (iEnd == 0) {
                if (str.charAt(iStart) == ' ')
                    continue;
                iEnd = iStart + 1;
            } else if (str.charAt(iStart) == ' ') {
                iStart++;
                break;
            }
        }

        if (iStart == -1)
            return null;
        else
            return str.substring(iStart, iEnd);
    }

    /*************************************************************************
     * @description Count the number of occurrences of character in the string
     * @param str
     * @param ch
     * @return int
     */
    private static int countChars(String str, char ch) {
        int count = 0;
        for (int i = 0; i < str.length(); ++i) {
            if (str.charAt(i) == ch) {
                ++count;
            }
        }
        return count;
    }
}

module.exports = ApexDoc;