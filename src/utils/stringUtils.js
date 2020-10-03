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
}