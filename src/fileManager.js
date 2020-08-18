const fs = require('fs');
const path = require('path');
const readline = require('readline');

const escapeHtml = require('escape-html');

const Constants = require('./constants.js');
const ClassGroup = require('./classGroup');

class FileManager {

/*    constructor() {
        this.path = "";
        this.header = "";
        this.APEX_DOC_PATH = "";
    }*/

    constructor(path,rgstrScope) {
        this.rgstrScope = rgstrScope;
        this.path = "";
        this.header = "";
        this.APEX_DOC_PATH = "";

        if (!path|| path.trim().length === 0) {
            this.path = ".";
        }
        else {
            this.path = path;
        }
    }

    /*escapeHTML(s) {
        //TODO confirm this is functional. Was stringbuilder
        let out = "";
        for (let i = 0; i < s.length; i++) {
            let c = s.charAt(i);
            out += escapeHtml(c);
        }
        return out;
    }*/

    createHTML(mapFNameToContent, monitor) {
        let constants = new Constants();
        try {
            //TODO: Confirm this is unnecessary due to file path capabilities.
            /*
            if (this.path.endsWith("/") || this.path.endsWith("\\")) {
                this.path += constants.ROOT_DIRECTORY; // + "/" + fileName + ".html";
            } else {
                this.path += "/" + constants.ROOT_DIRECTORY; // + "/" + fileName + ".html";
            }*/

            //Make directory and dependent directories
            if(!fs.existsSync(this.path)) {
                //TODO: Confirm this is appropriately funcioning with mode
                fs.mkdirSync(this.path,{recursive:true,mode:"0o777"});
            }

            let mapKeysArray = Array.from(mapFNameToContent.keys());
            mapKeysArray.forEach((fileName) => {
                //TODO: Confirm this is functional
                let contents = mapFNameToContent.get(fileName);
                let resolvedFileName = path.resolve(this.path, fileName + ".html");
                fs.writeFileSync(resolvedFileName,contents);
                console.log(fileName + " Processed...");
            });

            this.copy(this.path);
            return true;
        } catch (e) {
            //TODO: make functional
            //e.printStackTrace();
        }

        return false;
    }

    strLinkfromModel(model, strClassName, hostedSourceURL) {
        return "<a target='_blank' class='hostedSourceLink' href='" + hostedSourceURL + strClassName + ".cls#L"
                + model.getInameLine() + "'>";
    }

    strHTMLScopingPanel() {
        let str = "<tr><td colspan='2' style='text-align: center;' >";
        str += "Show: ";

        for (let i = 0; i < this.rgstrScope.length; i++) {
            str += "<input type='checkbox' checked='checked' id='cbx" + this.rgstrScope[i] +
                    "' onclick='ToggleScope(\"" + this.rgstrScope[i] + "\", this.checked );'>" +
                    this.rgstrScope[i] + "</input>&nbsp;&nbsp;";
        }
        str += "</td></tr>";
        return str;
    }

    /********************************************************************************************
     * @description main routine that creates an HTML file for each class specified
     * @param mapGroupNameToClassGroup
     * @param cModels
     * @param projectDetail
     * @param homeContents
     * @param hostedSourceURL
     * @param monitor
     */
    makeFile(mapGroupNameToClassGroup, cModels,projectDetail, homeContents, hostedSourceURL) {
        const constants = new Constants();
        let links = "<table width='100%'>";
        links += this.strHTMLScopingPanel();
        links += "<tr style='vertical-align:top;' >";
        links += this.getPageLinks(mapGroupNameToClassGroup, cModels);

        if (homeContents && homeContents.trim().length > 0) {
            homeContents = links + "<td class='contentTD'>" + "<h2 class='section-title'>Home</h2>" + homeContents + "</td>";
            homeContents = constants.getHeader(projectDetail) + homeContents + constants.FOOTER;
        } else {
            homeContents = constants.DEFAULT_HOME_CONTENTS;
            homeContents = links + "<td class='contentTD'>" + "<h2 class='section-title'>Home</h2>" + homeContents + "</td>";
            homeContents = constants.getHeader(projectDetail) + homeContents + constants.FOOTER;
        }

        let fileName = "";
        let mapFNameToContent = new Map();
        mapFNameToContent.set("index", homeContents);

        // create our Class Group content files
        this.createClassGroupContent(mapFNameToContent, links, projectDetail, mapGroupNameToClassGroup, cModels);

        cModels.forEach((cModel) => {
            let contents = links;
            if (cModel.getNameLine() && cModel.getNameLine().length > 0) {
                fileName = cModel.getClassName();
                contents += "<td class='contentTD'>";

                contents += this.htmlForClassModel(cModel, hostedSourceURL);

                // deal with any nested classes
                cModel.getChildClassesSorted().forEach((cmChild) => {
                    contents += "<p/>";
                    contents += this.htmlForClassModel(cmChild, hostedSourceURL);

                });
            } else {
                return;
            }
            contents += "</div>";

            contents = Constants.getHeader(projectDetail) + contents + Constants.FOOTER;
            mapFNameToContent.put(fileName, contents);
        });
        this.createHTML(mapFNameToContent);
    }

    /*********************************************************************************************
     * @description creates the HTML for the provided class, including its
     *              property and methods
     * @param cModel
     * @param hostedSourceURL
     * @return html string
     */
    htmlForClassModel(cModel, hostedSourceURL) {
        let contents = "";
        contents += "<h2 class='section-title'>" +
                strLinkfromModel(cModel, cModel.getTopmostClassName(), hostedSourceURL) +
                cModel.getClassName() + "</a>" +
                "</h2>";

        contents += "<div class='classSignature'>" +
                this.strLinkfromModel(cModel, cModel.getTopmostClassName(), hostedSourceURL) +
                escapeHTML(cModel.getNameLine()) + "</a></div>";

        //TODO: Confirm this is functional in JS
        if (cModel.getDescription() != "") {
            contents += "<div class='classDetails'>" + escapeHTML(cModel.getDescription());
        }
        if (cModel.getAuthor() != "") {
            contents += "<br/><br/>" + escapeHTML(cModel.getAuthor());
        }
        if (cModel.getDate() != "") {
            contents += "<br/>" + escapeHTML(cModel.getDate());
        }
        contents += "</div><p/>";

        if (cModel.getProperties().length > 0) {
            // start Properties
            contents +=
                    "<h2 class='subsection-title'>Properties</h2>" +
                            "<div class='subsection-container'> " +
                            "<table class='properties' > ";

            cModel.getPropertiesSorted().forEach((prop) =>{
                contents += "<tr class='propertyscope" + prop.getScope() + "'><td class='clsPropertyName'>" +
                        prop.getPropertyName() + "</td>";
                contents += "<td><div class='clsPropertyDeclaration'>" +
                        this.strLinkfromModel(prop, cModel.getTopmostClassName(), hostedSourceURL) +
                        escapeHTML(prop.getNameLine()) + "</a></div>";
                contents += "<div class='clsPropertyDescription'>" + escapeHTML(prop.getDescription()) + "</div></tr>";
            });
            // end Properties
            contents += "</table></div><p/>";
        }

        if (cModel.getMethods().length > 0) {
            // start Methods
            contents +=
                    "<h2 class='subsection-title'>Methods</h2>" +
                            "<div class='subsection-container'> ";

            // method Table of Contents (TOC)
            contents += "<ul class='methodTOC'>";
            cModel.getMethodsSorted().forEach((method) => {
                contents += "<li class='methodscope" + method.getScope() + "' >";
                contents += "<a class='methodTOCEntry' href='#" + method.getMethodName() + "'>"
                        + method.getMethodName() + "</a>";
                if (method.getDescription() != "")
                    contents += "<div class='methodTOCDescription'>" + method.getDescription() + "</div>";
                contents += "</li>";

            });
            contents += "</ul>";

            // full method display
            cModel.getMethodsSorted().forEach((method) => {
                contents += "<div class='methodscope" + method.getScope() + "' >";
                contents += "<h2 class='methodHeader'><a id='" + method.getMethodName() + "'/>"
                        + method.getMethodName() + "</h2>" +
                        "<div class='methodSignature'>" +
                        this.strLinkfromModel(method, cModel.getTopmostClassName(), hostedSourceURL) +
                        escapeHTML(method.getNameLine()) + "</a></div>";

                if (method.getDescription() != "") {
                    contents += "<div class='methodDescription'>" + escapeHTML(method.getDescription()) + "</div>";
                }

                if (method.getParams().length > 0) {
                    contents += "<div class='methodSubTitle'>Parameters</div>";
                    method.getParams().forEach((param) => {
                        param = escapeHTML(param);
                        if (param && param.trim().length > 0) {

                            //Confirm this works
                            let mStart = param.indexOf('\\s')

                            let paramName;
                            let paramDescription;
                            if (mStart != -1) {
                            	let ich = mStart;
                                paramName = param.substring(0, ich);
                                paramDescription = param.substring(ich + 1);
                            } else {
                                paramName = param;
                                paramDescription = null;
                            }
                            contents += "<div class='paramName'>" + paramName + "</div>";

                            if (paramDescription) {
                                contents += "<div class='paramDescription'>" + paramDescription + "</div>";
                            }
                        }
                    });
                    // end Parameters
                }

                //TODO: Confirm this works in js
                if (method.getReturns() != "") {
                    contents += "<div class='methodSubTitle'>Return Value</div>";
                    contents += "<div class='methodReturns'>" + escapeHTML(method.getReturns()) + "</div>";
                }

                if (method.getExample() != "") {
                    contents += "<div class='methodSubTitle'>Example</div>";
                    contents += "<code class='methodExample'>" + escapeHTML(method.getExample()) + "</code>";
                }

                if (method.getAuthor() != "") {
                    contents += "<div class='methodSubTitle'>Author</div>";
                    contents += "<div class='methodReturns'>" + escapeHTML(method.getAuthor()) + "</div>";
                }

                if (method.getDate() != "") {
                    contents += "<div class='methodSubTitle'>Date</div>";
                    contents += "<div class='methodReturns'>" + escapeHTML(method.getDate()) + "</div>";
                }

                // end current method
                contents += "</div>";
            });
            // end all methods
            contents += "</div>";
        }

        return contents;
    }

    // create our Class Group content files
    createClassGroupContent(mapFNameToContent, links, projectDetail, mapGroupNameToClassGroup, cModels) {
        const constants = new Constants();
        let mapGroupNameToClassGroupKeysArray = Array.from(mapGroupNameToClassGroup.keys());
        mapGroupNameToClassGroupKeysArray.forEach((strGroup) => {
            let cg = mapGroupNameToClassGroup.get(strGroup);
            if (cg.getContentSource()) {
                let cgContent = this.parseHTMLFile(cg.getContentSource());
                if (cgContent != "") {
                    let strHtml = constants.getHeader(projectDetail) + links + "<td class='contentTD'>" +
                            "<h2 class='section-title'>" +
                            escapeHTML(cg.getName()) + "</h2>" + cgContent + "</td>";
                    strHtml += constants.FOOTER;
                    mapFNameToContent.set(cg.getContentFilename(), strHtml);
                }
            }
        });
    }

    /**********************************************************************************************************
     * @description generate the HTML string for the Class Menu to display on
     *              each page.
     * @param mapGroupNameToClassGroup
     *            map that holds all the Class names, and their respective Class
     *            Group.
     * @param cModels
     *            list of ClassModels
     * @return String of HTML
     */
    getPageLinks(mapGroupNameToClassGroup, cModels) {
        let createMiscellaneousGroup = false;

        // this is the only place we need the list of class models sorted by name.
        let tm = new Map();
        cModels.forEach((cm) => {
            tm.set(cm.getClassName().toLowerCase(), cm);
            if (!createMiscellaneousGroup && !cm.getClassGroup()) {
                createMiscellaneousGroup = true;
            }
        });

        let cModelsFromMap = Array.from(tm.values());

        let links = "<td width='20%' vertical-align='top' >";
        links += "<div class='sidebar'><div class='navbar'><nav role='navigation'><ul id='mynavbar'>";
        links += "<li id='idMenuindex'><a href='.' onclick=\"gotomenu('index.html', event);return false;\" class='nav-item'>Home</a></li>";

        // add a bucket ClassGroup for all Classes without a ClassGroup specified
        if (createMiscellaneousGroup) {
            mapGroupNameToClassGroup.set("Miscellaneous", new ClassGroup("Miscellaneous", null));
        }

        // create a sorted list of ClassGroups
        let mapGroupNameToClassGroupKeys = Array.from(tm.keys());
        mapGroupNameToClassGroupKeys.forEach((strGroup) => {
            let cg = mapGroupNameToClassGroup.get(strGroup);
            let strGoTo = "onclick=\"gotomenu(document.location.href, event);return false;\"";
            if (cg.getContentFilename()) {
                strGoTo = "onclick=\"gotomenu('" + cg.getContentFilename() + ".html" + "', event);return false;\"";
            }
            links += "<li class='header' id='idMenu" + cg.getContentFilename() +
                    "'><a class='nav-item nav-section-title' href='.' " +
                    strGoTo + " class='nav-item'>" + strGroup + "<span class='caret'></span></a></li>";
            links += "<ul>";

            // even though this algorithm is O(n^2), it was timed at just 12
            // milliseconds, so not an issue!
            cModelsFromMap.forEach((cModel) => {
                if (strGroup === cModel.getClassGroup() ||
                    (cModel.getClassGroup() && strGroup == "Miscellaneous")
                ) {
                    if (cModel.getNameLine() && cModel.getNameLine().trim().length > 0) {
                        let fileName = cModel.getClassName();
                        links += "<li class='subitem classscope" + cModel.getScope() + "' id='idMenu" + fileName +
                                "'><a href='.' onclick=\"gotomenu('" + fileName + ".html', event);return false;\" class='nav-item sub-nav-item scope" +
                                cModel.getScope() + "'>" +
                                fileName + "</a></li>";
                    }
                }
            });

            links += "</ul>";
        });

        links += "</ul></nav></div></div></div>";

        links += "</td>";
        return links;
    }

    docopy(sourceDirectory,source, target) {
        let contents = "";
        const filePath = path.resolve(sourceDirectory,source);

        const fileStreamByLines = readline.createInterface({
            input: fs.createReadStream(filePath),
            output: process.stdout,
            terminal: false
        });

        fileStreamByLines.on('line', (strLine) => {
            strLine = strLine.trim();
            if (strLine && strLine.length > 0) {
                contents += strLine;
            }
        });

        let resolvedFileName = path.resolve(target, source);
        fs.writeFileSync(resolvedFileName,contents);
    }

    copy(toFileName) {
        docopy("../resources","apex_doc_logo.png", toFileName);
        docopy("../resources","ApexDoc.css", toFileName);
        docopy("../resources","ApexDoc.js", toFileName);
        docopy("../resources","CollapsibleList.js", toFileName);
        docopy("../resources","jquery-1.11.1.js", toFileName);
        docopy("../resources","toggle_block_btm.gif", toFileName);
        docopy("../resources","toggle_block_stretch.gif", toFileName);
    }

    getFiles(path) {
        //TODO: Confirm this is fully functional and matches. Returns a path array!
        const folder = fs.readdirSync(path,{encoding:'utf8',withFileTypes:true});
        let listOfFilesToCopy = [];

        if (folder) {
            if(folder.length > 0) {
                folder.forEach((directoryEntry) => {
                    if(directoryEntry.isFile()) {
                        listOfFilesToCopy.push(path.resolve(directoryName, directoryEntry.name));
                    }
                });
            } else {
                console.log("WARNING: No files found in directory: " + path);
            }
        }

        return filesArray;
    }

    createDoc(mapGroupNameToClassGroup, cModels, projectDetail, homeContents, hostedSourceURL, monitor) {
        this.makeFile(mapGroupNameToClassGroup, cModels, projectDetail, homeContents, hostedSourceURL, monitor);
    }

    parseFile(filePath) {
        try {
            if (filePath && filePath.trim().length > 0) {
                let contents = "";

                const fileStreamByLines = readline.createInterface({
                    input: fs.createReadStream(filePath),
                    output: process.stdout,
                    terminal: false
                });
        
                fileStreamByLines.on('line', (strLine) => {
                    strLine = strLine.trim();
                    if (strLine && strLine.length > 0) {
                        contents += strLine;
                    }
                });
                return contents;
            }
        } catch (e) {
            //TODO: Resolve error passing
            //e.printStackTrace();
        }

        return "";
    }

    parseHTMLFile(filePath) {
        let contents = (this.parseFile(filePath)).trim();
        if (contents && contents.length > 0) {
            let startIndex = contents.indexOf("<body>");
            let endIndex = contents.indexOf("</body>");
            if (startIndex != -1) {
                if (contents.indexOf("</body>") != -1) {
                    contents = contents.substring(startIndex, endIndex);
                    return contents;
                }
            }
        }
        return "";
    }

}

module.exports = FileManager;