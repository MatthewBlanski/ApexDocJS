class ApexModel {
    constructor() {}

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
        return this.getValueOrEmptyString(this.description);
    }

    setDescription(description) {
        this.description = description;
    }

    getAuthor() {
        return this.getValueOrEmptyString(this.author);
    }

    setAuthor(author) {
        this.author = author;
    }

    getDate() {
        return this.getValueOrEmptyString(this.date);
    }

    setDate(date) {
        this.date = date;
    }

    getReturns() {
        return this.getValueOrEmptyString(this.returns);
    }

    setReturns(returns) {
        this.returns = returns;
    }

    getExample() {
        return this.getValueOrEmptyString(this.example);
    }

    setExample(example) {
        this.example = example;
    }

    getScope() {
        return this.getValueOrEmptyString(this.scope);
    }

    setScope(scope) {
        this.scope = scope;
    }

    getValueOrEmptyString(value) {
        if(!value) {
            return '';
        }

        return value;
    }

    parseScope() {
        this.scope = null;

        if(this.nameLine) {
            let str = this.strContainsScope(nameLine);
            if (str) {
                scope = str;
            }
            this.scope = nameLine;
        }
    }

    strContainsScope(str) {
        str = str.toLowerCase();
        for (let i = 0; i < rgstrScope.length; i++) {
            if (str.toLowerCase().contains(rgstrScope[i].toLowerCase() + " ")) {
                return rgstrScope[i];
            }
        }
        return null;
    }
}