export default class uiUtils {
  /**
   * Given a name of a user preference, retrieve it from localStorage, 
   * setting its value to defaultValue if it does not yet exist. 
   *
   * @static
   * @param {string} preferenceName
   * @param {*} [defaultValue=true]
   * @returns {*} Retrieved value
   * @memberof uiUtils
   */
  static getPreference(preferenceName, defaultValue = true) {
    let flag = localStorage.getItem(`preference-${preferenceName}`);
    if (flag == undefined) {
      // Default to true
      return defaultValue;
    } else {
      return JSON.parse(flag);
    }
  }

  /**
   * Given a name of a user preference, set its value in localStorage
   * to the provided value.
   * 
   * @static
   * @param {string} preferenceName
   * @param {*} value
   * @memberof uiUtils
   */
  static setPreference (preferenceName, value) {
    localStorage.setItem(`preference-${preferenceName}`, value);
  }
}