import { dollData, dollDataMap } from './doll-utils.js';

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
  static getPreference(preferenceName, defaultValue = true, prefix = 'preference') {
    let flag = localStorage.getItem(`${prefix}-${preferenceName}`);
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
  static setPreference(preferenceName, value, prefix = 'preference') {
    localStorage.setItem(`${prefix}-${preferenceName}`, JSON.stringify(value));
  }

  static addToFavorites(dollApiName) {
    let favorites = this.getPreference('favorites', [], 'data');
    favorites.push(dollApiName);
    this.setPreference('favorites', favorites, 'data');
  }

  static removeFromFavorites(dollApiName) {
    let favorites = this.getPreference('favorites', [], 'data');
    this.setPreference('favorites', favorites.filter(name => name !== dollApiName), 'data');
  }

  static sortFavorites() {
    $('#doll-list-filter .favs button.doll_portrait_button').each(function(index) {
      let button = $(this);
      let id = button.data('id');
      let doll = dollDataMap[id];
      button.appendTo($(`#doll-list-filter .stars${doll.rarity}`)).children('svg').removeClass('favorited');
    });

    $('#doll-list-tab-content .favs button.doll_portrait_button').each(function(index) {
      let button = $(this);
      let id = button.data('id');
      let doll = dollDataMap[id];
      button.appendTo($(`#doll-list-${doll.type} .stars${doll.rarity}`)).children('svg').removeClass('favorited');
    });

    let favorites = new Set(this.getPreference('favorites', [], 'data'));
    let ids = new Set(dollData.filter(doll => favorites.has(doll.api_name)).map(doll => doll.id));

    ids.forEach(id => {
      let doll = dollDataMap[id];
      console.log(dollDataMap[id]);
      $(`#doll-list-filter button.doll_portrait_button[data-id="${id}"]`).appendTo($('#doll-list-filter .favs')).children('svg').addClass('favorited');
      $(`#doll-list-${doll.type} button.doll_portrait_button[data-id="${id}"]`).appendTo($(`#doll-list-${doll.type} .favs`)).children('svg').addClass('favorited');
    });

    $.each($('#doll-list-filter button.doll_portrait_button'), (index, button) => {
      $(button).prop('hidden', false);
    });
  }
}