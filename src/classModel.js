const ApexModel = require('./apexModel.js');
  
class ClassModel extends ApexModel{
    constructor(cmodelParent,rgstrScope) {
        super(rgstrScope);
        this.methods = [];
        this.properties = [];
        this.cmodelParent = cmodelParent;
        this.childClasses = [];
    }

    getProperties() {
        return this.properties;
    }

    getPropertiesSorted() {
        let tm = new Map();
        this.properties.forEach((prop) =>{
            tm.set(prop.getPropertyName().toLowerCase(), prop);
        });

        return Array.from(tm.values());
    }

    setProperties(properties) {
        this.properties = properties;
    }

    getMethods() {
        return this.methods;
    }

    getMethodsSorted() {
        let sorted = [].concat(this.methods);
        
        sorted = sorted.sort((o1,o2) => {
            let methodName1 = o1.getMethodName();
            let methodName2 = o2.getMethodName();
            let className = this.getClassName();
            
            if(methodName1 === className){
                return -1;
            } else if(methodName2 === className){
                return 1;
            }
            return methodName1.toLowerCase().localeCompare(methodName2.toLowerCase());
        });

        return [].concat(sorted);
    }

    setMethods(methods) {
        this.methods = methods;
    }

    getChildClassesSorted() {
        let tm = new Map();
        this.childClasses.forEach((cm) => {
            tm.set(cm.getClassName().toLowerCase(), cm);
        });

        return Array.from(tm.values());
    }

    addChildClass(child) {
        this.childClasses.push(child);
    }

    getClassName() {
        let nameLine = this.getNameLine();
        let strParent = (!cmodelParent ? "" : cmodelParent.getClassName() + ".");
        if (nameLine) {
            nameLine = nameLine.trim();

        }
        if (nameLine && nameLine.trim().length > 0) {
            let fFound = nameLine.toLowerCase().indexOf("class ");
            let cch = 6;
            if (fFound === -1) {
                fFound = nameLine.toLowerCase().indexOf("interface ");
                cch = 10;
            }
            if (fFound > -1)
                nameLine = nameLine.substring(fFound + cch).trim();
            let lFound = nameLine.indexOf(" ");
            if (lFound === -1)
                return strParent + nameLine;
            try {
                let name = nameLine.substring(0, lFound);
                return strParent + name;
            } catch (ex) {
                return strParent + nameLine.substring(nameLine.lastIndexOf(" ") + 1);
            }
        } else {
            return "";
        }
    }

    getTopmostClassName() {
        if (this.cmodelParent) {
            return this.cmodelParent.getClassName();
        } else {
            return this.getClassName();
        }
    }

    getClassGroup() {
        if (this.cmodelParent) {
            return this.cmodelParent.getClassGroup();
        } else {
            return this.strClassGroup;
        }
    }

    setClassGroup(strGroup) {
        this.strClassGroup = strGroup;
    }

    getClassGroupContent() {
        return this.strClassGroupContent;
    }

    setClassGroupContent(strGroupContent) {
        this.strClassGroupContent = strGroupContent;
    }

    getIsInterface() {
        return this.isInterface;
    }

    setIsInterface(isInterface) {
        this.isInterface = isInterface;
    }
}

module.exports = ClassModel;