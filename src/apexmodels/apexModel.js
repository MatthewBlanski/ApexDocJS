const StringUtils = require('../utils/stringUtils');

class ApexModel {
    constructor(accessModifiers) {
        this.accessModifiers = accessModifiers;
        this.stringUtils = new StringUtils();
    }

    getNameLine() {
        return this.nameLine;
    }

    getInameLine() {
        return this.inameLine;
    }

    setNameLine(nameLine, iLine) {
        this.nameLine = nameLine.trim();
        this.inameLine = iLine;
        this.parseScope();
    }

    getDescription() {
        return this.stringUtils.getValueOrEmptyString(this.description);
    }

    setDescription(description) {
        this.description = description;
    }

    getAuthor() {
        return this.stringUtils.getValueOrEmptyString(this.author);
    }

    setAuthor(author) {
        this.author = author;
    }

    getDate() {
        return this.stringUtils.getValueOrEmptyString(this.date);
    }

    setDate(date) {
        this.date = date;
    }

    getReturns() {
        return this.stringUtils.getValueOrEmptyString(this.returns);
    }

    setReturns(returns) {
        this.returns = returns;
    }

    getExample() {
        return this.stringUtils.getValueOrEmptyString(this.example);
    }

    setExample(example) {
        this.example = example;
    }

    getScope() {
        return this.stringUtils.getValueOrEmptyString(this.scope);
    }

    setScope(scope) {
        this.scope = scope;
    }

    parseScope() {
        this.scope = null;

        if(this.nameLine) {
            let str = this.stringUtils.getMatchingSubstring(this.nameLine, this.accessModifiers);
            if (str) {
                this.scope = str;
            }
            this.scope = this.nameLine;
        }
    }
}

module.exports = ApexModel;