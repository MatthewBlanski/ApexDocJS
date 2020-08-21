const ApexModel = require('./apexModel.js');

class PropertyModel extends ApexModel {

    constructor(accessModifiers) {
        super(accessModifiers);
    }

    setNameLine(nameLine, iLine) {
        if (nameLine) {
            // remove any trailing stuff after property name. { =
            let i = nameLine.indexOf('{');
            if (i === -1) {
                i = nameLine.indexOf('=');

            }
            if (i === -1) {
                i = nameLine.indexOf(';');
            }
            if (i >= 0) {
                nameLine = nameLine.substring(0, i);
            }

        }
        super.setNameLine(nameLine, iLine);
    }

    getPropertyName() {
        let nameLine = this.getNameLine().trim();
        if (nameLine && nameLine.length > 0) {
            const lastindex = nameLine.lastIndexOf(" ");
            if (lastindex >= 0) {
                const propertyName = nameLine.substring(lastindex + 1);
                return propertyName;
            }
        }
        return "";
    }
}

module.exports = PropertyModel;