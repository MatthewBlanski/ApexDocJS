class Constants {
    constructor() {
        this.HEADER_OPEN = "<html><head>" +
        "<script type='text/javascript' src='jquery-1.11.1.js'></script>" +
        "<script type='text/javascript' src='CollapsibleList.js'></script>" +                                                                
        "<script type='text/javascript' src='ApexDoc.js'></script>" +                                                                
        "<link rel='stylesheet' type='text/css' href='ApexDoc.css' /> " + 
        "</head>" +
        "<body>";

        this.HEADER_CLOSE =                                                                               
        "</td>" +
        "</tr>" +
        "</table>" +
        "</div>";

        this.FOOTER = "</div></div></td></tr></table><hr/>" + 
        "<center style='font-size:.8em;'><a href='https://github.com/MatthewBlanski/ApexDocJS' target='_blank'>Powered By ApexDoc</a>" + 
        "</center></body></html>";

        this.ROOT_DIRECTORY = "ApexDocumentation";

        this.DEFAULT_HOME_CONTENTS = "<h1>Project Home</h2>";

        //TODO: have this point to the new location
        this.PROJECT_DETAIL = 
        "<div class='topsection'>" +
        "<table>" +
        "<tr><td>" +
        "<img src='apex_doc_logo.png' style='border:1px solid #000;'/>" +
        "</td>" +
        "<td>" +                
        "<h2 style='margin:0px;'>Project Demo</h2>" +
        "Check out the gitHub project at:<br/>" + 
        "<a href='https://github.com/MatthewBlanski/ApexDocJS'>https://github.com/MatthewBlanski/ApexDocJS</a><br/>";
    }

    getHeader(projectDetail) {
        if (projectDetail && projectDetail.trim().length > 0) {
            return header = this.HEADER_OPEN + projectDetail;
        }
        console.log(this.HEADER_OPEN + this.PROJECT_DETAIL + this.HEADER_CLOSE);
        return this.HEADER_OPEN + this.PROJECT_DETAIL + this.HEADER_CLOSE;
    }
}

module.exports = Constants;