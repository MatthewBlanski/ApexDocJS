class StringUtils {

    /**
     * @summary
     * Returns an empty string if its a null-ish value, otherwise returns
     * the original string.
     * 
     * @param {string} str 
     */
    getValueOrEmptyString(str) {
        return str ? str : '';
    }

    /**
     * 
     * @param {string} str 
     * @param {number} iSearch 
     */
    getPrevWord(str, iSearch) {
        if (!str || iSearch >= str.length) return null;
        let iStart = 0, iEnd = 0;
        for (iStart = iSearch - 1; iStart >= 0; iStart--) {
            if (iEnd === 0) {
                if (str.charAt(iStart) === ' ') continue;
                iEnd = iStart + 1;
            }
            else if (str.charAt(iStart) === ' ') {
                iStart++;
                break;
            }
        }

        return iStart < 0 ? null : str.substring(iStart, iEnd);
    }

    /**
     * 
     * @param {string} str 
     * @param {string} ch 
     */
    countChars(str, ch) {
        let count = 0;
        for (let i = 0; i < str.length; ++i) {
            if (str.charAt(i) === ch) {
                ++count;
            }
        }
        return count;
    }

    /**
     * @summary
     * Does a case-insensitive match to check if any of the options exist
     * in the original string. It returns the string that exists, if any.
     * Otherwise it returns null.
     * 
     * @param {string} str 
     * @param {string[]} options 
     */
    getMatchingSubstring(str, options) {
        const s = str.toLowerCase();
        for (let i = 0; i < options.length; i++) {
            if (s.includes(options[i].toLowerCase() + " ")) {
                return options[i];
            }
        }
        return null;
    }
}

module.exports = StringUtils;