const ApexModel = require('./apexModel.js');

class MethodModel extends ApexModel {

    constructor(accessModifiers) {
        super(accessModifiers);
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
                const methodName = this.stringUtils.getPrevWord(nameLine, lastindex);
                return methodName;
            }
        }
        return "";
    }
}

module.exports = MethodModel;