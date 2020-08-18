class ClassGroup {
    constructor(strName,strContent) {
        this.strName = strName;
        this.strContentSource = strContent;
    }

    getName() {
        return this.strName;
    }

    setName(strName) {
        this.strName = strName;
    }

    getContentSource() {
        return this.strContentSource;
    }

    setContentSource(strContentSource) {
        this.strContentSource = strContentSource;
    }

    getContentFilename() {
        if (this.strContentSource) {
            let idx1 = this.strContentSource.lastIndexOf("/");
            let idx2 = this.strContentSource.lastIndexOf(".");
            if (idx1 != -1 && idx2 != -1) {
                return this.strContentSource.substring(idx1 + 1, idx2);
            }
        }
        return null;
    }
}

module.exports = ClassGroup;