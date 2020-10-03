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
}

module.exports = StringUtils;