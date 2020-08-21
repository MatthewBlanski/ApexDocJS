const ApexModel = require('./apexModel.js');

class MethodModel extends ApexModel {

    constructor(rgstrScope) {
        super(rgstrScope);
        this.params = [];
    }

    setNameLine(nameLine, iLine) {
        // remove anything after the parameter list
        if (nameLine) {
            let i = nameLine.lastIndexOf(")");
            if (i >= 0) {
                nameLine = nameLine.substring(0, i + 1);
            }
        }
        super.setNameLine(nameLine, iLine);
    }

    getParams() {
        return this.params;
    }

    setParams(params) {
        this.params = params;
    }

    getReturnType() {
        return this.returnType;
    }

    setReturnType(returnType) {
        this.returnType = returnType;
    }

    getMethodName() {
        let nameLine = this.getNameLine().trim();
        if (nameLine && nameLine.length > 0) {
            const lastindex = nameLine.indexOf("(");
            if (lastindex >= 0) {
                const methodName = this.strPrevWord(nameLine, lastindex);
                return methodName;
            }
        }
        return "";
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
}

module.exports = MethodModel;