/* global Highcharts */
import damageUtils from './damage-utils.js';
import dollUtils, { dollData, dollDataMap, VALID_EQUIPS, SPECIAL_VALID_EQUIPS } from './doll-utils.js';
import uiUtils from './ui-utils.js';

let echelon;
let fairy;
let isNight;
let isBoss;
let equipData;
let fairyData;
let talentData;
let enemyEva;
let enemyArmor;
let enemyCount;
let graphData;
let showBuffedStats;
let battleLength;
let walkTime;
let useFortressNode;
let fortressNodeLevel;
let savedTeamList;
let savedTeamCount;
let isViewFancyPreference;      // Client-side preference for "Fancy View" | LocalStorage['preference-view-fancy']
let isTooltipClickablePreference; //Client-side preference for "Clickable Tooltip" | LocalStorage['preference-tooltip-clickable']
let isEnOnlyPreference;         // Client-side preference for "Show EN Only" | LocalStorage['preference-en-only']
let selectedDoll = undefined;
let graphColors = ['#7CB5EC', '#434348', '#90ED7D', '#F7A35C', '#8085E9', '#F15C80'];
let buttonsWithOpenTooltips = [], mousedOverTooltip = null;
let selectModalInitialized = false;   // Set to true after doll select modal initialized
let allowDollSelectTooltip = false;   // Bugfix for mouseover tooltips

const FAIRY_GROWTH_FACTORS = {
  basic: {
    fp: 7,
    acc: 25,
    eva: 20,
    armor: 5,
    critdmg: 10
  },
  grow: {
    fp: 0.076,
    acc: 0.252,
    eva: 0.202,
    armor: 0.05,
    critdmg: 0.101
  }
};

const FAIRY_RARITY_SCALARS = [0.4, 0.5, 0.6, 0.8, 1];

$(function () {
  $.ajax({
    async: false,
    dataType: 'json',
    url: '/static/girlsfrontline/equips.json',
    success: function (data, status, xhr) {
      equipData = data;
    },
    error: function (xhr, status, err) {
      console.log(status);
      console.log(err);
    }
  });

  dollUtils.init();

  $.ajax({
    async: false,
    dataType: 'json',
    url: '/static/girlsfrontline/fairies.json',
    success: function (data, status, xhr) {
      fairyData = data;
    },
    error: function (xhr, status, err) {
      console.log(status);
      console.log(err);
    }
  });

  $.ajax({
    async: false,
    dataType: 'json',
    url: '/static/girlsfrontline/talents.json',
    success: function (data, status, xhr) {
      talentData = data;
    },
    error: function (xhr, status, err) {
      console.log(status);
      console.log(err);
    }
  });

  initEchelon();

  isNight = false;
  $('#day-btn').click(toggleDayNight);
  $('#night-btn').click(toggleDayNight);

  isBoss = false;
  $('#boss-toggle').click(toggleBoss);

  showBuffedStats = true;
  $('#buffed-stats-toggle').change(toggleBuffedStats);

  battleLength = 20;
  $('#battle-length').change(changeBattleLength);

  walkTime = 0;
  $('#walk-time').change(changeWalkTime);

  useFortressNode = false;
  fortressNodeLevel = 10;
  $('#fortress-node-toggle').change(toggleFortressNode);
  $('#fortress-node-level-select').change(changeFortressNodeLevel);

  $('#save-btn').click(saveTeam);
  $('#load-btn').click(selectTeam);

  // Load user preferences
  isViewFancyPreference = uiUtils.getPreference('view-fancy', true);
  isTooltipClickablePreference = uiUtils.getPreference('tooltip-clickable', false);
  isEnOnlyPreference = uiUtils.getPreference('en-only', false);

  savedTeamCount = localStorage.getItem('savedTeamCount') !== null ? localStorage.savedTeamCount : 0;
  savedTeamList = [];
  if (savedTeamCount != 0) {
    let i = 0;
    let loadedCount = 0;
    while (loadedCount < savedTeamCount) {
      if (localStorage.getItem('team' + i) === null) {
        i++;
      } else {
        savedTeamList.push(JSON.parse(localStorage.getItem('team' + i)));
        i++;
        loadedCount++;
      }
    }
  }
  generateTeamsModal();

  initEquipSelectModal();
  // Defer until first time user clicks add T-Doll button
  // initDollSelectModal();
  $('#doll-filter').on('input', changeDollSelectFilter);
  initFairySelectModal();
  initTalentSelect();

  $('.fairy-talent-label').attr('data-original-title', talentData[$('.fairy-talent-select').val() - 1].tooltip);
  $('.fairy-talent-select').change(changeFairyTalent);
  $('.fairy-skill-toggle').change(toggleFairySkillUsage);
  $('.fairy-skill-level-select').change(changeFairySkillLevel);
  $('.fairy-rarity-select').change(changeFairyRarity);
  $('.fairy-level-select').change(changeFairyLevel);
  $('#fairy-skill-control').click(openFairySkillControl);

  $('#fairy-select button').click(changeFairy);
  $('#remove-fairy').click(removeFairy);

  for (let i = 1; i <= 5; i++) {
    $('#doll' + i + ' .add-doll').click(i, selectDoll);
    $('#doll' + i + ' .remove-doll').click(i, removeDoll);
    $('#doll' + i + ' .doll-level-select').change(i - 1, changeLevel);
    $('#doll' + i + ' .skill-level-select').change(i - 1, changeSkillLevel);
    $('#doll' + i + ' .skill2-level-select').change(i - 1, changeSkill2Level);
    $('#doll' + i + ' .skill-toggle').change(i - 1, toggleSkillUsage);
    $('#doll' + i + ' .skill-control button').click(i - 1, openSkillControl);
    $('#doll' + i + ' .affection').click(i - 1, changeAffection);
    for (let j = 1; j <= 3; j++) {
      $('#doll' + i + ' .equip' + j).click({ doll: i - 1, equip: j }, selectEquipment);
      $('#doll' + i + ' .equip' + j + '-level-select').change(i - 1, changeEquipLevel);
    }
  }

  let isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  let gridSquares = [12, 13, 14, 22, 23, 24, 32, 33, 34];
  for (let i = 0; i < gridSquares.length; i++) {
    if (isMobileDevice) {
      $('#pos' + gridSquares[i]).click(moveDoll);
    }
    $('#pos' + gridSquares[i]).on('dragstart', onDragStart);
    $('#pos' + gridSquares[i]).on('dragenter', onDragEnter);
    $('#pos' + gridSquares[i]).on('dragleave', onDragLeave);
    $('#pos' + gridSquares[i]).on('dragover', onDragOver);
    $('#pos' + gridSquares[i]).on('drop', onDrop);
  }

  $('#enemy-eva').change(changeEnemyStats);
  enemyEva = 15;
  $('#enemy-armor').change(changeEnemyStats);
  enemyArmor = 0;
  $('#enemy-count').change(changeEnemyStats);
  enemyCount = 3;

  $('#damage-graph-btn').click(showDamageGraph);

  // Enable every tooltip except those in doll select modal
  $('[data-toggle="tooltip"]').tooltip({ trigger: 'hover' });

  // Hide tooltip when user switches between tabs
  $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
    hideOpenTooltips();
  });
});

function initEchelon() {
  echelon = [createDummyDoll(12),
  createDummyDoll(22),
  createDummyDoll(32),
  createDummyDoll(13),
  createDummyDoll(23)];
  fairy = createDummyFairy();
}

function createDummyDoll(p) {
  let obj;
  obj = {
    id: -1,
    pos: p,
    name: '',
    affection: 2,
    tiles: {},
    equip1: -1,
    equip2: -1,
    equip3: -1,
    base: {},
    pre_battle: {},
    battle: {},
    equip_bonus: {},
    tile_bonus: {}
  };

  return obj;
}

function createDummyFairy() {
  let obj;
  obj = {
    id: -1,
    name: '',
    aura: {
      fp: 0,
      acc: 0,
      eva: 0,
      armor: 0,
      critdmg: 0
    }
  };
  return obj;
}

function initDollSelectModal() {
  let sheets = document.styleSheets;
  let sheetToModify = sheets[0];
  const SPRITE_WIDTH = 129;
  const SPRITE_HEIGHT = 85;
  let doll_types = ['All', 'HG', 'SMG', 'RF', 'AR', 'MG', 'SG'];
  let favorites = new Set(uiUtils.getPreference('favorites', [], 'data'));
  for (let i = 0; i < dollData.length; i++) {
    let doll = dollData[i];

    let tilegrid = getTileGridHTML(doll);

    let buttonFancy = `<button type="button" class="btn mb-1 mr-1 doll_portrait_button img_${doll.api_name}" data-id="${doll.id}" data-toggle="tooltip-doll-select" data-placement="top" data-html="true" data-original-title=""></button>`;
    let buttonBasic = `<button type="button" class="btn mb-1 mr-1 doll_simple_button" data-id="${doll.id}" data-toggle="tooltip-doll-select" data-placement="top" data-html="true" data-original-title="">${doll.name}</button>`;

    // Append buttons to nav tabs
    $(`#doll-list-${doll.type} .stars${doll.rarity}`)
      .append(buttonFancy)
      .append(buttonBasic);

    // Append buttons to search filter div
    $(`#doll-list-filter .stars${doll.rarity}`)
      .append(buttonFancy)
      .append(buttonBasic);

    /******
     * Add CSS for hover. Spritesheet is 40 rows by x columns.
     *   Sprites are two 129x85 images placed horizontally adjacent to each other.
     *   Left image : normal, right image : damaged
     *
     * Spritesheet visualization:
     *   row/col                 ### ID (as per dolls.json)
     *   1/1 1/3 1/5 1/7 1/9 ... ### 1   41  81  121 161 201 ...
     *   2/1 2/3 2/5 2/7 2/9 ... ### 2   42  82  122 162 202 ...
     *   3/1 3/3 3/5 3/7 3/9 ... ### 3   43  83  123 163 203 ...
     *   4/1 4/3 4/5 4/7 4/9 ... ### 4   44  84  124 164 204 ...
     *   ... ... ... ... ... ... ### ... ... ... ... ... ... ...
     */
    sheetToModify.insertRule(`.btn.img_${doll.api_name} { background-position: ${-1 * (2 * doll.spritesheet_col - 2) * SPRITE_WIDTH}px ${-1 * (doll.spritesheet_row - 1) * SPRITE_HEIGHT}px; }`, 0);
    sheetToModify.insertRule(`.btn.img_${doll.api_name}:hover, .btn.img_${doll.api_name}:focus { background-position: ${-1 * (2 * doll.spritesheet_col - 1) * SPRITE_WIDTH}px ${-1 * (doll.spritesheet_row - 1) * SPRITE_HEIGHT}px; }`, 0);

    let tileTargetTypes;
    if ($.isArray(doll.tiles.target_type)) {
      tileTargetTypes = doll_types[doll.tiles.target_type[0]];
      for (let j = 1; j < doll.tiles.target_type.length; j++) {
        tileTargetTypes += ', ' + doll_types[doll.tiles.target_type[j]];
      }
    } else {
      tileTargetTypes = doll_types[doll.tiles.target_type];
    }


    // Calculate max level stats
    let level = doll.mod ? 120 : 100;
    let dolldummy = dollUtils.getStatsAtLevel(doll, level);

    // Add hover

    // Render skill 2 if unit has it
    let optional_skill2 = doll.tooltip_skill2 ?
      `<hr>
  <div class="row">
  <div class="col-2 pl-3 pr-1"><div class="float-right"><img src="/static/girlsfrontline/sim/dolls/icon/skillicon/${doll.icon_name_skill2 ? doll.icon_name_skill2 : 'letiablebuff'}.png" class="img-fluid" /></div></div>
    <div class="col-10 pl-1 pr-3 text-left small"><b>${doll.name_skill2}</b><br />${doll.tooltip_skill2 ? doll.tooltip_skill2 : 'N/A'}</div>
  </div>` : '';

    // Render voodoo link if unit is craftable in EN
    let optional_voodoo = doll.en_craftable ? ` &middot; <a href="https://gf-db.github.io/gfdb/gfdb.html?type=tdoll&id=${doll.id_index}&sort.tdoll=[{%22sort_column%22:%22mean%20%%22,%22dir%22:1}]" target="_blank">Voodoo</a>`
      : '';

    //       <a href="https://gfl.matsuda.tips/search?q=${encodeURI(doll.name)}" target="_blank">Matsuda</a> &middot;
    let btnTooltip =
      `<div class="row">
  <div class="col-3 px-2">
      <div class="chibi-plus-circle float-left">
        <div class="chibi-plus-bar chibi-plus-horizontal"></div>
        <div class="chibi-plus-bar chibi-plus-vertical"></div>
      </div>
      <div><img src="/static/girlsfrontline/sim/dolls/${doll.id}.png" class="img-tooltip-chibi" data-id="${doll.id}"/></div>
      <div class="">
        <div class="doll_tooltip_stat_container_left"><img class="aura_container_img" src="/static/girlsfrontline/sim/hp.png" /><span class="doll_tooltip_stat_caption">${dolldummy.hp * 5}</span></div>
        <div class="doll_tooltip_stat_container_right"><img class="aura_container_img" src="/static/girlsfrontline/sim/crit.png" /><span class="doll_tooltip_stat_caption">${dolldummy.crit}%</span></div>
      </div>
      <div class="">
        <div class="doll_tooltip_stat_container_left"><img class="aura_container_img" src="/static/girlsfrontline/sim/fp.png" /><span class="doll_tooltip_stat_caption">${dolldummy.fp}</span></div>
        <div class="doll_tooltip_stat_container_right"><img class="aura_container_img" src="/static/girlsfrontline/sim/critdmg.png" /><span class="doll_tooltip_stat_caption">${dolldummy.critdmg + 100}%</span></div>
      </div>
      <div class="">
        <div class="doll_tooltip_stat_container_left"><img class="aura_container_img" src="/static/girlsfrontline/sim/acc.png" /><span class="doll_tooltip_stat_caption">${dolldummy.acc}</span></div>
        <div class="doll_tooltip_stat_container_right"><img class="aura_container_img" src="/static/girlsfrontline/sim/rounds.png" /><span class="doll_tooltip_stat_caption">${dolldummy.rounds == 0 ? '-' : dolldummy.rounds}</span></div>
      </div>
      <div class="">
        <div class="doll_tooltip_stat_container_left"><img class="aura_container_img" src="/static/girlsfrontline/sim/eva.png" /><span class="doll_tooltip_stat_caption">${dolldummy.eva}</span></div>
        <div class="doll_tooltip_stat_container_right"><img class="aura_container_img" src="/static/girlsfrontline/sim/armor.png" /><span class="doll_tooltip_stat_caption">${dolldummy.armor == 0 ? '-' : dolldummy.armor}</span></div>
      </div>
      <div class="">
        <div class="doll_tooltip_stat_container_left"><img class="aura_container_img" src="/static/girlsfrontline/sim/rof.png" /><span class="doll_tooltip_stat_caption">${dolldummy.rof}</span></div>
        <div class="doll_tooltip_stat_container_right"><img class="aura_container_img" src="/static/girlsfrontline/sim/ap.png" /><span class="doll_tooltip_stat_caption">${dolldummy.ap}</span></div>
      </div>
  </div>
  <div class="col-9">
    <p class="doll_tooltip_header">
      ${doll.aliases[0]} &middot;
      <a href="https://en.gfwiki.com/wiki/${doll.name.replace(' ', '_')}" target="_blank">Wiki</a>
      ${optional_voodoo}
    </p>
    ${`<div class="hr-sect">${doll.construct_time_formatted}</div>`}
    <div class="row">
      <div class="col-2 px-1"><div class="float-right">${tilegrid}</div></div>
      <div class="col-10 pl-1 pr-3 text-left small">Affects: ${tileTargetTypes}<br />${doll.tooltip_tiles}</div>
    </div>
    ${`<div class="hr-sect">Art: ${doll.artist} | Voice:&nbsp;<a href="https://myanimelist.net/search/all?q=${encodeURI(doll.voice)}"> ${doll.voice} </a></div>`}
    <div class="row">
      <div class="col-2 pl-3 px-1"><div class="float-right"><img src="/static/girlsfrontline/sim/dolls/icon/skillicon/${doll.icon_name_skill1 ? doll.icon_name_skill1 : 'letiablebuff'}.png" class="img-fluid" /></div></div>
      <div class="col-10 pl-1 pr-3 text-left small"><b>${doll.name_skill1}</b><br />${doll.tooltip_skill1}</div>
    </div>
    ${optional_skill2}
    <hr />
    <div class="text-center pb-1">
      <small>Click to dismiss</small>
    </div>
  </div>
</div>`;

    $('#doll-select button[data-id=' + doll.id + ']')
      .attr('data-original-title', btnTooltip);

    // Add fancy view button properties
    $('#doll-select button[data-id=' + doll.id + '].doll_portrait_button')
      .append(tilegrid)
      .append($(`<span class="doll_portrait_caption">${doll.name}</span>`))
      .append(`<svg class="favorite-icon${favorites.has(doll.api_name) ? ' favorited' : ''}" data-api-name=${doll.api_name}><use xlink:href="#star"></svg>`);

    // Add tile buff amounts
    let tileBuffContainer = $('<div>').addClass('aura_container_caption stroke-1px');

    for (let tileEffect in doll.tiles.effect) {
      let tileEffectAmount = typeof doll.tiles.effect[tileEffect] == 'object' ? doll.tiles.effect[tileEffect][1] : doll.tiles.effect[tileEffect];
      if (tileEffectAmount != 0) {
        tileBuffContainer.append(
          $('<div>').append($('<img>').prop('src', `/static/girlsfrontline/sim/${tileEffect}.png`).addClass('aura_container_img')).append(
            $('<span>').html(`${tileEffectAmount}%`)));
      }
    }

    $('#doll-select button[data-id=' + doll.id + '] .aura_container')
      .after(tileBuffContainer);

    // Make inline tile buff smaller
    $('#doll-select button[data-id=' + doll.id + '] div.aura_container')
      .removeClass('aura_container').addClass('aura_container_small');
  }

  // Init EN Filter
  let filterEnOnly = $('.switch-small.toggle-en-only input');
  filterEnOnly.prop('checked', false);
  filterEnOnly.change(function () {
    isEnOnlyPreference = this.checked;
    uiUtils.setPreference('en-only', isEnOnlyPreference);
    refilterVisibleButtons();
  });

  // Set switch state based on user setting
  filterEnOnly.prop('checked', isEnOnlyPreference != false ? true : false);

  // Init filter toggles
  let filterSwitches = $('.switch-small.toggle-filter input');
  filterSwitches.prop('checked', false);
  filterSwitches.change(function () {
    refilterVisibleButtons();
  });

  // Add listener to handle user clicking "Fancy View" switch
  let fancyViewSwitch = $('.switch-small.toggle_fancy_view input');
  fancyViewSwitch.change(function () {
    isViewFancyPreference = this.checked;
    uiUtils.setPreference('view-fancy', isViewFancyPreference);
    filterVisibleButtons();
    refilterVisibleButtons();
    changeDollSelectFilter(); // Handle user toggling view while search string not empty
  });

  // Set switch state based on user setting
  fancyViewSwitch.prop('checked', isViewFancyPreference != false ? true : false);

  // Add listener to handle user clicking "Clickable Tooltip" switch
  let clickableTooltipSwitch = $('.switch-small.toggle_clickable_tooltip input');
  clickableTooltipSwitch.change(function () {
    isTooltipClickablePreference = this.checked;
    uiUtils.setPreference('tooltip-clickable', isTooltipClickablePreference);
    hideOpenTooltips();
  });

  // Favorite icon click interaction
  $('.favorite-icon').on('click', function () {
    let icon = $(this);
    console.log(icon);
    let apiName = icon.data('apiName');
    if (!icon.hasClass('favorited')) {
      uiUtils.addToFavorites(apiName);
    } else {
      uiUtils.removeFromFavorites(apiName);
    }
    uiUtils.sortFavorites();
    return false;
  });

  // Set switch state based on user setting
  clickableTooltipSwitch.prop('checked', isTooltipClickablePreference);

  // Manual tooltip so user can hover over both the button and the tooltip
  $('[data-toggle="tooltip-doll-select"]').tooltip({ trigger: 'manual', boundary: 'window' })
    .on('mouseenter touchend focus', function (event) {
      if (!allowDollSelectTooltip) { return; }

      // Mobile workaround for touch events
      if ($('.tooltip').length == 1 && $(this).is(buttonsWithOpenTooltips[0])) {
        // Allow click event to propagate so user can select T-Doll
      } else {
        // Disable the click event
        event.preventDefault();
      }

      // Hide all other open tooltips
      hideOpenTooltips();
      buttonsWithOpenTooltips.push(this);

      $(this).tooltip('show');
      $('.img-tooltip-chibi').on('click', function () {
        $(`button[data-id="${$(this).data('id')}"]:visible`).click();
      }).hover(function () {
        $('.chibi-plus-circle').addClass('chibi-plus-circle-hover');
      }, function () {
        $('.chibi-plus-circle').removeClass('chibi-plus-circle-hover');
      });
      $('.tooltip')
        .on('mouseenter focus', function () {
          // Track last button moused over
          mousedOverTooltip = this;
        }).on('mouseleave', function () {
          // Hide this tooltip when user mouses out of it
          mousedOverTooltip = null;
          hideOpenTooltips();
        }).on('click', function () {
          // Hide this tooltip when user clicks it
          hideOpenTooltips();
        });
    }).on('mouseleave', function () {
      // .setTimeout needed because tooltip mouseenter fires after button mouseleave
      let _this = this;
      isTooltipClickablePreference = uiUtils.getPreference('tooltip-clickable', false);
      if (isTooltipClickablePreference) {
        window.setTimeout(function () {
          if ($('.tooltip').length == 1 && !$('.tooltip').is($(mousedOverTooltip))) {
            $(_this).tooltip('hide');
          }
        }, 100);
      } else {
        $(_this).tooltip('hide');
      }
    });

  // Hide buttons not matching user setting
  filterVisibleButtons();
  refilterVisibleButtons();
  uiUtils.sortFavorites();

  // Hide loading spinner and message
  selectModalInitialized = true;
  $('#doll-select-modal-spinner').prop('hidden', true);
  $('#doll-select-modal-container').prop('hidden', false);
}

// Hide all currently open tooltips
function hideOpenTooltips() {
  for (let button of buttonsWithOpenTooltips) {
    $(button).tooltip('hide');
  }
  buttonsWithOpenTooltips = [];
}

// Show/hide T-Doll buttons based on en-released status
function showBasedOnEnToggle() {
  let showEnOnly = $('.switch-small.toggle-en-only input').prop('checked');
  if (!showEnOnly) {
    $.each($('#doll-select button.should-be-visible'), (index, button) => {
      $(button).prop('hidden', false);
    });
  } else {
    $.each($('#doll-select button.should-be-visible'), (index, button) => {
      let dollId = $(button).data('id');
      let doll = dollDataMap[dollId];

      $(button).prop('hidden', !(doll.en_released));
    });
  }
}

// Show/hide T-Doll buttons based on tile buff
function hideBasedOnFilters() {
  let checkedSwitches = $('.switch-small.toggle-filter input:checked');
  if (checkedSwitches.length == 0) {
    // No filters selected, do nothing since already all shown
  } else {
    $.each($('#doll-select button.should-be-visible'), (index, button) => {
      let dollId = $(button).data('id');
      let doll = dollDataMap[dollId];
      let matchCount = 0;

      $.each(checkedSwitches, (index2, checkbox) => {
        let filterAttribute = $(checkbox).data('filter-attribute');
        let tileBuffAttr = doll.tiles.effect[filterAttribute];

        console.log(`${doll.name} ${tileBuffAttr} ${tileBuffAttr == [0, 0]} ${tileBuffAttr == 0}`);
        if (!(tileBuffAttr == 0 || (tileBuffAttr[0] == 0 && tileBuffAttr[1] == 0))) {
          matchCount = matchCount + 1;
        }
      });

      if (matchCount != checkedSwitches.length) {
        $(button).prop('hidden', true);
      }
    });
  }
}

// Filter fancy/normal T-Doll buttons based on setting
function filterVisibleButtons() {
  if (isViewFancyPreference) {
    $('#doll-select button.doll_portrait_button').show().addClass('should-be-visible');
    $('#doll-select button.doll_simple_button').hide().removeClass('should-be-visible');
  } else {
    $('#doll-select button.doll_portrait_button').hide().removeClass('should-be-visible');
    $('#doll-select button.doll_simple_button').show().addClass('should-be-visible');
  }
}

// Filter T-Doll buttons based on tile buff toggles and EN release status
function refilterVisibleButtons() {
  hideOpenTooltips();
  showBasedOnEnToggle();
  hideBasedOnFilters();
}

function getTileGridHTML(doll) {
  let selfSquare = doll.tiles.self;
  let targetSquares = doll.tiles.target.split(',').map(tile => parseInt(tile) + doll.tiles.self);

  let tileType = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  $.each([12, 13, 14, 22, 23, 24, 32, 33, 34], (index, tile) => {
    if (tile == doll.tiles.self) {
      tileType[index] = 'tilegrid-self';
    } else if ($.inArray(tile, targetSquares) != -1) {
      tileType[index] = 'tilegrid-target';
    } else {
      tileType[index] = 'tilegrid-neutral';
    }
  });

  let htmlstring = '<div class="aura_container">';
  htmlstring += '<div class="tilegrid-row mx-auto row no-gutters">';
  htmlstring += '<div class="tile12 tilegrid-col ' + tileType[0] + ' col border border-dark"></div>';
  htmlstring += '<div class="tile13 tilegrid-col ' + tileType[1] + ' col border-top border-bottom border-dark"></div>';
  htmlstring += '<div class="tile14 tilegrid-col ' + tileType[2] + ' col border border-dark"></div>';
  htmlstring += '</div>';
  htmlstring += '<div class="tilegrid-row mx-auto row tilegrid-row-center no-gutters">';
  htmlstring += '<div class="tile22 tilegrid-col ' + tileType[3] + ' col border-left border-right border-dark"></div>';
  htmlstring += '<div class="tile23 tilegrid-col ' + tileType[4] + ' col"></div>';
  htmlstring += '<div class="tile24 tilegrid-col ' + tileType[5] + ' col border-left border-right border-dark"></div>';
  htmlstring += '</div>';
  htmlstring += '<div class="tilegrid-row mx-auto row no-gutters">';
  htmlstring += '<div class="tile32 tilegrid-col ' + tileType[6] + ' col border border-dark"></div>';
  htmlstring += '<div class="tile33 tilegrid-col ' + tileType[7] + ' col border-top border-bottom border-dark"></div>';
  htmlstring += '<div class="tile34 tilegrid-col ' + tileType[8] + ' col border border-dark"></div>';
  htmlstring += '</div>';
  htmlstring += '</div>';

  return htmlstring;
}

function initEquipSelectModal() {
  for (let i = 0; i < equipData.length; i++) {
    let equip = equipData[i];
    $('#equip-select .stars' + equip.rarity).append('<button type="button" class="btn mb-1 mr-1" data-id="' + equip.id + '" data-type="' + equip.type + '" data-toggle="tooltip" data-placement="top" data-original-title="' + equip.tooltip + '"><img src="/static/girlsfrontline/sim/equips/' + equip.type + '.png" class="img-fluid"></img></button>');
  }
}

function initFairySelectModal() {
  let fairy_types = ['', 'combat', 'tactical'];
  for (let i = 0; i < fairyData.length; i++) {
    let fairy = fairyData[i];
    $('#fairy-select .' + fairy_types[fairy.type]).append('<button type="button" class="btn mb-1 mr-1" data-id="' + fairy.id + '" data-toggle="tooltip" data-placement="top" data-html="true" data-original-title="' + fairy.tooltip_aura + '<br>' + fairy.tooltip_skill + '">' + fairy.name + '</button>');
  }
}

function initTalentSelect() {
  for (let i = 0; i < talentData.length; i++) {
    let talent = talentData[i];
    $('.fairy-talent-select').append('<option value="' + talent.id + '">' + talent.name + '</option>');
  }
}

function changeEnemyStats() {
  enemyEva = Math.max(0, parseInt($('#enemy-eva').val()) || 0);
  enemyArmor = Math.max(0, parseInt($('#enemy-armor').val()) || 0);
  enemyCount = Math.max(1, parseInt($('#enemy-count').val()) || 1);

  simulateBattle();
  updateUIAllDolls();
}

function changeAffection(event) {
  let dollIndex = event.data;
  let doll = echelon[dollIndex];

  $('#doll' + (dollIndex + 1) + ' .affection').children().eq(doll.affection).prop('hidden', true);
  doll.affection++;
  doll.affection = doll.affection > 3 ? 0 : doll.affection;
  $('#doll' + (dollIndex + 1) + ' .affection').children().eq(doll.affection).prop('hidden', false);

  calculatePreBattleStatsForDoll(dollIndex);
  simulateBattle();
  updateUIForDoll(dollIndex);
}

function toggleDayNight(event) {
  if (isNight && $(event.target).attr('id').startsWith('day')) {
    $('#night-btn').removeClass('btn-success');
    $('#day-btn').addClass('btn-success');
    isNight = false;
  }
  if (!isNight && $(event.target).attr('id').startsWith('night')) {
    $('#day-btn').removeClass('btn-success');
    $('#night-btn').addClass('btn-success');
    isNight = true;
  }

  calculatePreBattleStatsAllDolls();
  simulateBattle();
  updateUIAllDolls();
}

function toggleBoss() {
  if (isBoss) {
    $('#boss-toggle').removeClass('btn-success');
    isBoss = false;
  } else {
    $('#boss-toggle').addClass('btn-success');
    isBoss = true;
  }

  simulateBattle();
  updateUIAllDolls();
}

function toggleBuffedStats() {
  showBuffedStats = $('#buffed-stats-toggle').prop('checked');

  updateUIAllDolls();
}

function changeBattleLength() {
  battleLength = Math.max(20, parseInt($('#battle-length').val()));

  simulateBattle();
  updateUIAllDolls();
}

function changeWalkTime() {
  walkTime = Math.max(0, parseInt($('#walk-time').val()));

  simulateBattle();
  updateUIAllDolls();
}

function toggleFortressNode() {
  useFortressNode = $('#fortress-node-toggle').prop('checked');

  simulateBattle();
  updateUIAllDolls();
}

function changeFortressNodeLevel() {
  fortressNodeLevel = parseInt($('#fortress-node-level-select').val());

  if (useFortressNode) {
    simulateBattle();
    updateUIAllDolls();
  }
}




function generateSavedTeamGrid(team) {
  let positions = {};

  if (team.doll1.id != -1) {
    positions[team.doll1.pos] = team.doll1.id;
  }
  if (team.doll2.id != -1) {
    positions[team.doll2.pos] = team.doll2.id;
  }
  if (team.doll3.id != -1) {
    positions[team.doll3.pos] = team.doll3.id;
  }
  if (team.doll4.id != -1) {
    positions[team.doll4.pos] = team.doll4.id;
  }
  if (team.doll5.id != -1) {
    positions[team.doll5.pos] = team.doll5.id;
  }

  let htmlstring = '';
  htmlstring += '<div class="col-auto">';
  htmlstring += '<div class="row no-gutters saved-team-row">';
  htmlstring += '<div class="col border border-dark saved-team-col">';
  if (12 in positions) {
    htmlstring += '<img src="/static/girlsfrontline/sim/dolls/' + positions[12] + '.png" class="pos12 img-fluid position-absolute"></img></div>';
  } else {
    htmlstring += '<img src="/static/girlsfrontline/sim/placeholder.png" class="pos12 img-fluid position-absolute"></img></div>';
  }
  htmlstring += '<div class="col border-top border-bottom border-dark saved-team-col">';
  if (13 in positions) {
    htmlstring += '<img src="/static/girlsfrontline/sim/dolls/' + positions[13] + '.png" class="pos13 img-fluid position-absolute"></img></div>';
  } else {
    htmlstring += '<img src="/static/girlsfrontline/sim/placeholder.png" class="pos13 img-fluid position-absolute"></img></div>';
  }
  htmlstring += '<div class="col border border-dark saved-team-col">';
  if (14 in positions) {
    htmlstring += '<img src="/static/girlsfrontline/sim/dolls/' + positions[14] + '.png" class="pos14 img-fluid position-absolute"></img></div>';
  } else {
    htmlstring += '<img src="/static/girlsfrontline/sim/placeholder.png" class="pos14 img-fluid position-absolute"></img></div>';
  }
  htmlstring += '</div>';

  htmlstring += '<div class="row no-gutters saved-team-row">';
  htmlstring += '<div class="col border-left border-right border-dark saved-team-col">';
  if (22 in positions) {
    htmlstring += '<img src="/static/girlsfrontline/sim/dolls/' + positions[22] + '.png" class="pos22 img-fluid position-absolute"></img></div>';
  } else {
    htmlstring += '<img src="/static/girlsfrontline/sim/placeholder.png" class="pos22 img-fluid position-absolute"></img></div>';
  }
  htmlstring += '<div class="col saved-team-col">';
  if (23 in positions) {
    htmlstring += '<img src="/static/girlsfrontline/sim/dolls/' + positions[23] + '.png" class="pos23 img-fluid position-absolute"></img></div>';
  } else {
    htmlstring += '<img src="/static/girlsfrontline/sim/placeholder.png" class="pos23 img-fluid position-absolute"></img></div>';
  }
  htmlstring += '<div class="col border-left border-right border-dark saved-team-col">';
  if (24 in positions) {
    htmlstring += '<img src="/static/girlsfrontline/sim/dolls/' + positions[24] + '.png" class="pos24 img-fluid position-absolute"></img></div>';
  } else {
    htmlstring += '<img src="/static/girlsfrontline/sim/placeholder.png" class="pos24 img-fluid position-absolute"></img></div>';
  }
  htmlstring += '</div>';

  htmlstring += '<div class="row no-gutters saved-team-row">';
  htmlstring += '<div class="col border border-dark saved-team-col">';
  if (32 in positions) {
    htmlstring += '<img src="/static/girlsfrontline/sim/dolls/' + positions[32] + '.png" class="pos32 img-fluid position-absolute"></img></div>';
  } else {
    htmlstring += '<img src="/static/girlsfrontline/sim/placeholder.png" class="pos32 img-fluid position-absolute"></img></div>';
  }
  htmlstring += '<div class="col border-top border-bottom border-dark saved-team-col">';
  if (33 in positions) {
    htmlstring += '<img src="/static/girlsfrontline/sim/dolls/' + positions[33] + '.png" class="pos33 img-fluid position-absolute"></img></div>';
  } else {
    htmlstring += '<img src="/static/girlsfrontline/sim/placeholder.png" class="pos33 img-fluid position-absolute"></img></div>';
  }
  htmlstring += '<div class="col border border-dark saved-team-col">';
  if (34 in positions) {
    htmlstring += '<img src="/static/girlsfrontline/sim/dolls/' + positions[34] + '.png" class="pos34 img-fluid position-absolute"></img></div>';
  } else {
    htmlstring += '<img src="/static/girlsfrontline/sim/placeholder.png" class="pos34 img-fluid position-absolute"></img></div>';
  }
  htmlstring += '</div></div>';

  return htmlstring;
}

function generateTeamsModal() {
  if (savedTeamCount == 0) {
    $('#teams-modal-body').html('No saved echelons found');
    return;
  }

  $('#teams-modal-body').html('');
  for (let i = 0; i < savedTeamList.length; i++) {
    let team = savedTeamList[i];
    let teamhtml = '<div class="row no-gutters">';
    teamhtml += '<div class="col-auto">';
    teamhtml += '<button class="load-team btn btn-sm btn-default mb-5" type="button" data-id="' + team.id + '">Load</button><br>';
    teamhtml += '<button class="delete-team btn btn-sm btn-danger mb-5" type="button" data-id="' + team.id + '">Delete</button><br>';
    teamhtml += '<button class="export-team btn btn-sm btn-default mb-1" type="button" data-id="' + team.id + '" hidden>Export</button></div>';
    teamhtml += generateSavedTeamGrid(team);
    teamhtml += '<div class="col-2">';
    if (team.fairy.id != -1) {
      teamhtml += '<img src="/static/girlsfrontline/sim/fairies/' + team.fairy.id + '.png" class="saved-fairy img-fluid"></img>';
    } else {
      teamhtml += '<img src="/static/girlsfrontline/sim/placeholder.png" class="saved-fairy img-fluid"></img>';
    }
    teamhtml += '</div>';
    teamhtml += '<div class="col"><textarea class="form-control saved-text" data-id="' + team.id + '" rows="9">' + team.savedText + '</textarea></div>';
    teamhtml += '</div><hr>';
    $('#teams-modal-body').append(teamhtml);
  }

  $('#teams-modal-body .load-team').off('click');
  $('#teams-modal-body .delete-team').off('click');
  // $('#teams-modal-body .export-team').off('click');
  $('#teams-modal-body .saved-text').off('change');

  $('#teams-modal-body .load-team').click(loadTeam);
  $('#teams-modal-body .delete-team').click(deleteTeam);
  // $('#teams-modal-body .export-team').click(exportTeam);
  $('#teams-modal-body .saved-text').change(changeTeamText);
}

function saveTeam() {
  //don't allow teams to be saved unless there is atleast one doll in them
  let doll = echelon.find(d => d.id != -1);
  if (doll === undefined) {
    return;
  }

  let name = prompt('Enter a name for this echelon:');
  if (name == null || name == '') {
    return;
  }

  let team = {
    doll1: $.extend(true, {}, echelon[0]),
    doll2: $.extend(true, {}, echelon[1]),
    doll3: $.extend(true, {}, echelon[2]),
    doll4: $.extend(true, {}, echelon[3]),
    doll5: $.extend(true, {}, echelon[4]),
    fairy: $.extend(true, {}, fairy),
    savedText: name
  };

  for (let i = 0; i < 5; i++) {
    doll = echelon[i];
    if (doll.id == -1) {
      continue;
    }
    team['doll' + (i + 1)].level = parseInt($('#doll' + (i + 1) + ' .doll-level-select').val());
    if (doll.equip1 != -1) {
      team['doll' + (i + 1)].equip1level = parseInt($('#doll' + (i + 1) + ' .equip1-level-select').val());
    }
    if (doll.equip2 != -1) {
      team['doll' + (i + 1)].equip2level = parseInt($('#doll' + (i + 1) + ' .equip2-level-select').val());
    }
    if (doll.equip3 != -1) {
      team['doll' + (i + 1)].equip3level = parseInt($('#doll' + (i + 1) + ' .equip3-level-select').val());
    }
  }

  let i = 0;
  let saved = false;
  while (!saved) {
    if (localStorage.getItem('team' + i) === null) {
      team.id = i;
      localStorage.setItem('team' + i, JSON.stringify(team));
      savedTeamList.push(team);
      savedTeamCount++;
      localStorage.setItem('savedTeamCount', savedTeamCount);
      saved = true;
    } else {
      i++;
    }
  }


  generateTeamsModal();
}

function selectTeam(event) {
  $('#teams-modal').modal('show');
}

function loadTeam(event) {
  $('#teams-modal').modal('hide');

  let t = savedTeamList.find(team => team.id == parseInt($(event.target).attr('data-id')));
  if (t === undefined) {
    return;
  }

  let team = $.extend(true, {}, t);

  echelon[0] = team.doll1;
  echelon[1] = team.doll2;
  echelon[2] = team.doll3;
  echelon[3] = team.doll4;
  echelon[4] = team.doll5;
  fairy = team.fairy;

  for (let i = 0; i < 5; i++) {
    if (echelon[i].id == -1) {
      continue;
    }

    let dollLevel = team['doll' + (i + 1)].level == 115 ? 120 : team['doll' + (i + 1)].level; //for teams with mod3 dolls saved before mod default level was changed to 120

    if (dollLevel == 120) {
      $('#doll' + (i + 1) + ' .doll-level-select').children().prop('disabled', true);
      $('#doll' + (i + 1) + ' .doll-level-select').children().filter(':first').prop('disabled', false);
    } else {
      $('#doll' + (i + 1) + ' .doll-level-select').children().prop('disabled', false);
      $('#doll' + (i + 1) + ' .doll-level-select').children().filter(':first').prop('disabled', true);
    }

    $('#doll' + (i + 1) + ' .doll-level-select').val(dollLevel);
    $('#doll' + (i + 1) + ' .equip1-level-select').val(team['doll' + (i + 1)].equip1level);
    $('#doll' + (i + 1) + ' .equip2-level-select').val(team['doll' + (i + 1)].equip2level);
    $('#doll' + (i + 1) + ' .equip3-level-select').val(team['doll' + (i + 1)].equip3level);
    $('#doll' + (i + 1) + ' .skill-level-select').val(team['doll' + (i + 1)].skilllevel);
    if (echelon[i].mod) {
      $('#doll' + (i + 1) + ' .skill2-level-select').val(team['doll' + (i + 1)].skill2level);
    }
    $('#doll' + (i + 1) + ' .skill-toggle').prop('checked', team['doll' + (i + 1)].useSkill);
  }

  if (fairy.id != -1) {
    $('.fairy-level-select').val(fairy.level);
    $('.fairy-skill-level-select').val(fairy.skilllevel);
    $('.fairy-rarity-select').val(fairy.rarity);
    $('.fairy-talent-select').val(fairy.talent.id);
    $('.fairy-talent-label').attr('data-original-title', fairy.talent.tooltip);
    $('.fairy-skill-toggle').prop('checked', fairy.useSkill);
  }

  $.each([12, 13, 14, 22, 23, 24, 32, 33, 34], (index, value) => {
    $('#pos' + value).attr('data-index', -1);
  });

  for (let i = 0; i < 5; i++) {
    $('#pos' + echelon[i].pos).attr('data-index', i);
  }

  calculatePreBattleStatsAllDolls();
  simulateBattle();
  updateUIAllDolls();
  updateUIForFairy();
}

function deleteTeam(event) {
  let id = parseInt($(event.target).attr('data-id'));
  let team = savedTeamList.find(team => team.id == id);
  if (team === undefined) {
    return;
  }

  if (!confirm('Are you sure you want to delete this echelon?')) {
    return;
  }

  localStorage.removeItem('team' + id);
  savedTeamCount--;
  localStorage.setItem('savedTeamCount', savedTeamCount);
  savedTeamList = savedTeamList.filter(team => team.id != id);

  generateTeamsModal();
}

function changeTeamText(event) {
  let team = savedTeamList.find(team => team.id == parseInt($(event.target).attr('data-id')));
  if (team === undefined) {
    return;
  }

  let newText = $(event.target).val();
  team.savedText = newText;
  localStorage.setItem('team' + team.id, JSON.stringify(team));

  generateTeamsModal();
}



function selectEquipment(event) {
  event.preventDefault();
  $('#equip-select button').off('click');
  $('#equip-select button').click(event.data, changeEquipment);
  $('#remove-equip').off('click');
  $('#remove-equip').click(event.data, removeEquipment);

  //show buttons for only equips that can be worn by current doll in current slot taking level into account
  $('#equip-select [data-id]').prop('hidden', true);
  let validTypes = getValidEquipTypes(event.data.doll, event.data.equip);
  let dollLevel = parseInt($('#doll' + (event.data.doll + 1) + ' .doll-level-select').val());
  if (dollLevel < 20) {
    validTypes = [-1];
  } else if (dollLevel < 50 && event.data.equip != 1) {
    validTypes = [-1];
  } else if (dollLevel < 80 && event.data.equip == 3) {
    validTypes = [-1];
  }
  for (let i = 0; i < validTypes.length; i++) {
    $('#equip-select [data-type=' + validTypes[i] + ']').prop('hidden', false);
  }

  //hide unequipable rarities
  if (dollLevel < 60)
    $('#equip-select .stars5 button').prop('hidden', true);
  if (dollLevel < 45)
    $('#equip-select .stars4 button').prop('hidden', true);
  if (dollLevel < 30)
    $('#equip-select .stars3 button').prop('hidden', true);

  $('#equip-select').modal('show');
}

function getValidEquipTypes(dollIndex, equipSlot) {
  let doll = echelon[dollIndex];

  if (doll.id == -1) {
    return [-1];
  }

  let validTypes = [];
  $.each(VALID_EQUIPS[doll.type - 1][equipSlot - 1], (index, value) => {
    validTypes.push(value);
  });

  if (doll.id in SPECIAL_VALID_EQUIPS) {
    if ($.isArray(SPECIAL_VALID_EQUIPS[doll.id][equipSlot - 1])) {
      $.each(SPECIAL_VALID_EQUIPS[doll.id][equipSlot - 1], (index, value) => {
        validTypes.push(value);
      });
    } else {
      validTypes.push(SPECIAL_VALID_EQUIPS[doll.id][equipSlot - 1]);
    }
  }

  //M16
  if (doll.id == 52) {
    if (equipSlot == 1) {
      return [8]; //hv ammo
    }
    if (equipSlot == 2 || equipSlot == 3) {
      validTypes = [10, 11, 12, 24]; //x-exo, armor, t-exo, m16 unique armor

      //ensure same accessory cannot be equipped twice
      let otherSlotEquipID = equipSlot == 2 ? doll.equip3 : doll.equip2;
      if (otherSlotEquipID != -1) {
        validTypes = validTypes.filter(type => type != equipData[otherSlotEquipID - 1].type);
        if (equipData[otherSlotEquipID - 1].type == 10) {
          validTypes = validTypes.filter(type => type != 12); //exo
        }
        if (equipData[otherSlotEquipID - 1].type == 12) {
          validTypes = validTypes.filter(type => type != 10); //exo
        }
        if (equipData[otherSlotEquipID - 1].type == 24) {
          validTypes = validTypes.filter(type => type != 11); //armor + special armor
        }
        if (equipData[otherSlotEquipID - 1].type == 11) {
          validTypes = validTypes.filter(type => type != 24); //armor + special armor
        }
      }
      return validTypes;
    }
  }

  //SOP and SOP mod3
  if (doll.id == 54 || doll.id == 260) {
    if (equipSlot == 1 || equipSlot == 2) {
      validTypes = [1, 2, 3, 4, 13]; //scope, eot, red dot sight, PEQ, suppressor
      if (doll.id == 260)
        validTypes.push(50); //sop unique equip

      //ensure same accessory cannot be equipped twice
      let otherSlotEquipID = equipSlot == 1 ? doll.equip2 : doll.equip1;
      if (otherSlotEquipID != -1) {
        validTypes = validTypes.filter(type => type != equipData[otherSlotEquipID - 1].type);
      }
      return validTypes;
    }
    if (equipSlot == 3) {
      return [8]; //hv ammo
    }
  }

  //STAR and STAR mod3
  if (doll.id == 55 || doll.id == 261) {
    if (equipSlot == 1 || equipSlot == 2) {
      validTypes = [1, 2, 3, 4, 13]; //scope, eot, red dot sight, PEQ, suppressor
      if (doll.id == 261)
        validTypes.push(29); //star mod3 unique equip

      //ensure same accessory cannot be equipped twice
      let otherSlotEquipID = equipSlot == 1 ? doll.equip2 : doll.equip1;
      if (otherSlotEquipID != -1) {
        validTypes = validTypes.filter(type => type != equipData[otherSlotEquipID - 1].type);
      }
      return validTypes;
    }
    if (equipSlot == 3) {
      return [8, 17]; //hv ammo and star unique black ammo
    }
  }

  return validTypes;
}

function changeEquipment(event) {
  $('#equip-select').modal('hide');

  let dollIndex = event.data.doll;
  let equipSlot = event.data.equip;

  echelon[dollIndex]['equip' + equipSlot] = parseInt($(event.target).attr('data-id'));
  $('#doll' + (dollIndex + 1) + ' .equip' + equipSlot + '-level-select').val(10);

  if (echelon[dollIndex].type == 6) {
    if (equipData[echelon[dollIndex]['equip' + equipSlot] - 1].type == 7) {
      echelon[dollIndex].hasSlug = true;
    } else {
      echelon[dollIndex].hasSlug = false;
    }
  }

  calculateEquipBonus(dollIndex);
  calculatePreBattleStatsForDoll(dollIndex);
  simulateBattle();
  updateUIAllDolls();
}

function changeEquipLevel(event) {
  let doll = echelon[event.data];

  calculateEquipBonus(event.data);
  calculatePreBattleStatsForDoll(event.data);
  simulateBattle();
  updateUIAllDolls();
}

function removeEquipment(event) {
  $('#equip-select').modal('hide');
  let dollIndex = event.data.doll;
  let equipSlot = event.data.equip;

  echelon[dollIndex]['equip' + equipSlot] = -1;

  if (echelon[dollIndex].type == 6 && equipSlot == 2) {
    echelon[dollIndex].hasSlug = false;
  }


  calculateEquipBonus(dollIndex);
  calculatePreBattleStatsForDoll(dollIndex);
  simulateBattle();
  //can't update just this doll anymore
  //because of jill,stechkin,etc where equips affect stats of other dolls
  updateUIAllDolls();
}



function selectDoll(event) {
  event.preventDefault();
  // $('#doll-select button').prop('disabled', false);
  // for(let i = 0; i < echelon.length; i++) {
  //   $('#doll-select button[data-id='+echelon[i].id+']').prop('disabled', true);
  // }

  if (!selectModalInitialized) {
    allowDollSelectTooltip = true;
    $('#doll-select').modal('show');

    /****
     * 500ms delay needed to make bootstrap fade in animation for modal play.
     * While JS engine is busy, page doesn't rerender except for CSS3 animations!
     */
    window.setTimeout(function () {
      initDollSelectModal();
      $('#doll-select button').off('click');
      processDollSelectModal(event.data);
    }, 500);
  } else {
    allowDollSelectTooltip = true;
    $('#doll-select').modal('show');
    processDollSelectModal(event.data);
  }
}

function processDollSelectModal(data) {
  $('#doll-select button').off('click');
  $('#doll-select button').click(data, changeDoll);
  window.setTimeout(function () {
    $('#doll-filter').focus();   // Use this instead of autofocus HTML5 attribute because it doesn't work on modal re-show
  }, 600); // Apparently 500ms not enough to make it focus consistently
}

function changeDollSelectFilter(event) {
  hideOpenTooltips();
  let query = $('#doll-filter').val();

  // Check if query works regex
  let searchTokens = [];

  // Replace empty tokens and delete or token from start and end of line
  let compiledRegexString = query.replace(/\|+/g, '|').replace(/^\||\|$/g, '');

  let regex;

  try {
    regex = new RegExp(compiledRegexString, 'i');
  } catch (e) {
    // Invalid regex
    return;
  }

  if (query.length == 0) {
    $('#doll-select #doll-list-filter button').prop('hidden', false);
    // hide div containing searchable buttons
    $('#doll-list-filter').prop('hidden', true);
    // show div containing tabs
    $('#doll-list-tabs').prop('hidden', false);
    $('#doll-list-tab-content').prop('hidden', false);
    return;
  } else {
    // show div containing searchable buttons
    $('#doll-list-filter').prop('hidden', false);
    // hide div containing tabs
    $('#doll-list-tabs').prop('hidden', true);
    $('#doll-list-tab-content').prop('hidden', true);
  }

  $.each($('#doll-select #doll-list-filter button'), (index, button) => {
    let dollId = $(button).data('id');
    let doll = dollDataMap[dollId];

    if (!dollMatchesSearchString(doll, regex)) {
      $(button).prop('hidden', true);
    } else {
      $(button).prop('hidden', false);
    }


    /*
    if ($(button).text().toUpperCase().indexOf(query.toUpperCase()) == -1) {
      $(button).prop('hidden', true);
    } else {
      $(button).prop('hidden', false);
    }
    */
  });
}

/***
 * Performs a deep search on:
 * - Name
 * - API Name
 * - Aliases
 */
function dollMatchesSearchString(doll, regex) {
  // console.log(searchTokens)
  if (regex.test(doll.name)) {
    return true;
  }
  if (regex.test(doll.api_name)) {
    return true;
  }
  for (let alias of doll.aliases) {
    if (regex.test(alias)) {
      return true;
    }
  }
  if (regex.test(doll.name_skill1)) {
    return true;
  }
  if (regex.test(doll.construct_time_formatted) || regex.test(doll.construct_time_index)) {
    return true;
  }
  return false;
}

function changeDoll(event) {
  // Clear search string, since user selected something
  $('#doll-filter').val('');
  changeDollSelectFilter();

  // Bug fix for lingering tooltips
  allowDollSelectTooltip = false;
  hideOpenTooltips();

  $('#doll-select').modal('hide');

  let selectedDoll = dollData[$(event.target).attr('data-id') - 1];
  let index = event.data - 1;

  echelon[index] = createDummyDoll(echelon[index].pos);
  echelon[index].name = selectedDoll.name;
  echelon[index].id = selectedDoll.id;
  echelon[index].type = selectedDoll.type;
  echelon[index].tiles = selectedDoll.tiles;
  echelon[index].tooltip_tiles = selectedDoll.tooltip_tiles;
  let doll_types = ['All', 'HG', 'SMG', 'RF', 'AR', 'MG', 'SG'];
  let tileTargetTypes;
  if ($.isArray(echelon[index].tiles.target_type)) {
    tileTargetTypes = doll_types[echelon[index].tiles.target_type[0]];
    for (let j = 1; j < echelon[index].tiles.target_type.length; j++) {
      tileTargetTypes += ', ' + doll_types[echelon[index].tiles.target_type[j]];
    }
  } else {
    tileTargetTypes = doll_types[echelon[index].tiles.target_type];
  }
  echelon[index].tooltip_tiles += '<br>Affects: ' + tileTargetTypes;

  echelon[index].skill = $.extend(true, {}, selectedDoll.skill);
  echelon[index].tooltip_skill1 = selectedDoll.tooltip_skill1;

  if ('frames_per_attack' in selectedDoll) {
    echelon[index].frames_per_attack = selectedDoll.frames_per_attack;
  }
  if (selectedDoll.type == 6) { //sg
    echelon[index].targets = 3;
    echelon[index].hasSlug = false;
  }

  if ('passives' in selectedDoll) {
    echelon[index].passives = selectedDoll.passives;
  }
  if ('skill_control' in selectedDoll) {
    // echelon[index].skill_control = selectedDoll.skill_control;
    echelon[index].special_control = true;
  } else {
    echelon[index].special_control = false;
  }

  $('#pos' + echelon[index].pos).attr('data-index', index);

  if (selectedDoll.mod) {
    $('#doll' + (index + 1) + ' .doll-level-select').children().prop('disabled', true);
    $('#doll' + (index + 1) + ' .doll-level-select').children().filter(':first').prop('disabled', false);
    $('#doll' + (index + 1) + ' .doll-level-select').val(120);
    $('#doll' + (index + 1) + ' .skill2-level-select').val(10);
    echelon[index].tooltip_skill2 = selectedDoll.tooltip_skill2;
    echelon[index].skill2 = $.extend(true, {}, selectedDoll.skill2);
    echelon[index].skill2level = 10;
    echelon[index].mod = true;
  } else {
    $('#doll' + (index + 1) + ' .doll-level-select').children().prop('disabled', false);
    $('#doll' + (index + 1) + ' .doll-level-select').children().filter(':first').prop('disabled', true);
    $('#doll' + (index + 1) + ' .doll-level-select').val(100);
    echelon[index].mod = false;
  }

  $('#doll' + (index + 1) + ' .skill-level-select').val(10);
  $('#doll' + (index + 1) + ' .skill-toggle').prop('checked', true);
  echelon[index].useSkill = true;
  echelon[index].skilllevel = 10;

  echelon[index].links = getNumLinks(index);

  calculateBaseStats(index);
  setDefaultEquips(index);
  calculateEquipBonus(index);
  calculateTileBonus();
  calculatePreBattleStatsAllDolls();
  simulateBattle();
  updateUIAllDolls();
}

function changeLevel(event) {
  let doll = echelon[event.data];

  if (doll.id == -1) {
    return;
  }

  //remove equipment if it can no longer be equipped
  let dollLevel = parseInt($('#doll' + (event.data + 1) + ' .doll-level-select').val());
  if (dollLevel < 80 && doll.equip3 != -1)
    doll.equip3 = -1;
  if (dollLevel < 50 && doll.equip2 != -1)
    doll.equip2 = -1;
  if (dollLevel < 20 && doll.equip1 != -1)
    doll.equip1 = -1;

  for (let i = 1; i <= 3; i++) {
    if (doll['equip' + i] == -1)
      continue;

    if (dollLevel < 30 && equipData[doll['equip' + i] - 1].rarity >= 3) {
      doll['equip' + i] = -1;
      continue;
    } else if (dollLevel < 45 && equipData[doll['equip' + i] - 1].rarity >= 4) {
      doll['equip' + i] = -1;
      continue;
    } else if (dollLevel < 60 && equipData[doll['equip' + i] - 1].rarity >= 5) {
      doll['equip' + i] = -1;
    }
  }

  doll.links = getNumLinks(event.data);

  calculateBaseStats(event.data);
  calculateEquipBonus(event.data);
  if (doll.type == 1) { //hg
    calculateTileBonus();
    calculatePreBattleStatsAllDolls();
  } else {
    calculatePreBattleStatsForDoll(event.data);
  }
  simulateBattle();
  updateUIAllDolls();
}

function removeDoll(event) {
  event.preventDefault();

  let index = event.data - 1;
  $('#pos' + echelon[index].pos).attr('data-index', index);
  echelon[index] = createDummyDoll(echelon[index].pos);
  $('#doll' + (index + 1) + ' .doll-level-select').children().prop('disabled', false);
  $('#doll' + (index + 1) + ' .doll-level-select').children().filter(':first').prop('disabled', true);
  $('#doll' + (index + 1) + ' .doll-level-select').val(100);

  calculateTileBonus();
  calculatePreBattleStatsAllDolls();
  simulateBattle();
  updateUIAllDolls();
}

function setDefaultEquips(dollIndex) {
  let doll = echelon[dollIndex];
  $('#doll' + (dollIndex + 1) + ' .equip1-level-select').val(10);
  $('#doll' + (dollIndex + 1) + ' .equip2-level-select').val(10);
  $('#doll' + (dollIndex + 1) + ' .equip3-level-select').val(10);

  dollUtils.setDefaultEquips(doll, isNight, !isEnOnlyPreference);
}

function changeSkillLevel(event) {
  echelon[event.data].skilllevel = parseInt($('#doll' + (event.data + 1) + ' .skill-level-select').val());

  simulateBattle();
  updateUIAllDolls();
}

function changeSkill2Level(event) {
  echelon[event.data].skill2level = parseInt($('#doll' + (event.data + 1) + ' .skill2-level-select').val());

  simulateBattle();
  updateUIAllDolls();
}

function toggleSkillUsage(event) {
  echelon[event.data].useSkill = $('#doll' + (event.data + 1) + ' .skill-toggle').prop('checked');

  simulateBattle();
  updateUIAllDolls();
}

function openSkillControl(event) {
  let doll = echelon[event.data];
  if (doll.id == -1 || !doll.special_control) {
    return;
  }

  $('#skill-control-body').html(SKILL_CONTROL_HTML[doll.id](doll));
  $('#skill-control-apply').click(event.data, closeSkillControl);
  $('#skill-control-modal').modal('show');
}

function closeSkillControl(event) {
  $('#skill-control-modal').modal('hide');
  $('#skill-control-apply').off('click');

  let doll = echelon[event.data];
  if (doll.id == -1 || !doll.special_control) {
    return;
  }

  SKILL_CONTROL[doll.id](doll);

  simulateBattle();
  updateUIAllDolls();
}



function changeFairy(event) {
  $('#fairy-select').modal('hide');

  let selectedFairy = fairyData[$(event.target).attr('data-id') - 1];

  fairy = $.extend(true, {}, selectedFairy);

  $('.fairy-level-select').val(100);
  $('.fairy-rarity-select').val(5);
  $('.fairy-skill-level-select').val(10);
  $('.fairy-skill-toggle').prop('checked', true);
  fairy.level = 100;
  fairy.rarity = 5;
  fairy.skilllevel = 10;
  fairy.useSkill = true;
  fairy.talent = $.extend(true, {}, talentData[$('.fairy-talent-select').val() - 1]);
  fairy.special_control = 'special_control' in selectedFairy ? true : false;

  if (fairy.id == 14) {
    //construction fairy
    $('.fairy-skill-level-select').prop('disabled', true);
    $('.fairy-skill-toggle').prop('checked', false);
    $('.fairy-skill-toggle').prop('disabled', true);
    fairy.useSkill = false;
  } else if (fairy.id == 11) {
    // Parachute fairy, disable skill by default
    $('.fairy-skill-toggle').prop('checked', false);
    fairy.useSkill = false;
  } else {
    $('.fairy-skill-toggle').prop('checked', true);
    fairy.useSkill = true;
    $('.fairy-skill-level-select').prop('disabled', false);
    $('.fairy-skill-toggle').prop('disabled', false);
  }

  calculateFairyBonus();
  calculatePreBattleStatsAllDolls();
  simulateBattle();
  updateUIAllDolls();
  updateUIForFairy();
}

function changeFairyLevel(event) {
  if (fairy.id == -1) {
    return;
  }

  fairy.level = parseInt($('.fairy-level-select').val());

  //change fairy rarity if level requirement is no longer met
  if (fairy.level < 20 && fairy.level >= 1 && fairy.rarity > 1) {
    fairy.rarity = 1;
    $('.fairy-rarity-select').val(fairy.rarity);
  } else if (fairy.level < 40 && fairy.level >= 20 && fairy.rarity > 2) {
    fairy.rarity = 2;
    $('.fairy-rarity-select').val(fairy.rarity);
  } else if (fairy.level < 70 && fairy.level >= 40 && fairy.rarity > 3) {
    fairy.rarity = 3;
    $('.fairy-rarity-select').val(fairy.rarity);
  } else if (fairy.level < 100 && fairy.level >= 70 && fairy.rarity > 4) {
    fairy.rarity = 4;
    $('.fairy-rarity-select').val(fairy.rarity);
  }

  calculateFairyBonus();
  calculatePreBattleStatsAllDolls();
  simulateBattle();
  updateUIAllDolls();
  updateUIForFairy();
}

function changeFairyRarity(event) {
  if (fairy.id == -1) {
    return;
  }

  fairy.rarity = parseInt($('.fairy-rarity-select').val());

  //change fairy level to meet the new rarity's min. level requirement if necessary
  if (fairy.rarity == 5 && fairy.level != 100) {
    fairy.level = 100;
    $('.fairy-level-select').val(fairy.level);
  } else if (fairy.rarity == 4 && fairy.level < 70) {
    fairy.level = 70;
    $('.fairy-level-select').val(fairy.level);
  } else if (fairy.rarity == 3 && fairy.level < 40) {
    fairy.level = 40;
    $('.fairy-level-select').val(fairy.level);
  } else if (fairy.rarity == 2 && fairy.level < 20) {
    fairy.level = 20;
    $('.fairy-level-select').val(fairy.level);
  }

  calculateFairyBonus();
  calculatePreBattleStatsAllDolls();
  simulateBattle();
  updateUIAllDolls();
  updateUIForFairy();
}

function changeFairySkillLevel(event) {
  if (fairy.id == -1) {
    return;
  }

  fairy.skilllevel = parseInt($('.fairy-skill-level-select').val());

  simulateBattle();
  updateUIAllDolls();
}

function changeFairyTalent(event) {
  if (fairy.id == -1) {
    $('.fairy-talent-label').attr('data-original-title', talentData[$('.fairy-talent-select').val() - 1].tooltip);
  } else {
    fairy.talent = $.extend(true, {}, talentData[$('.fairy-talent-select').val() - 1]);
    $('.fairy-talent-label').attr('data-original-title', fairy.talent.tooltip);
    simulateBattle();
    updateUIAllDolls();
    updateUIForFairy();
  }
}

function toggleFairySkillUsage(event) {
  if (fairy.id == -1) {
    return;
  }

  fairy.useSkill = $('.fairy-skill-toggle').prop('checked');

  simulateBattle();
  updateUIAllDolls();
}

function removeFairy(event) {
  event.preventDefault();

  fairy = createDummyFairy();
  $('.fairy-level-select').val(100);
  $('.fairy-rarity-select').val(5);
  $('.fairy-skill-level-select').val(10);
  $('.fairy-skill-level-select').prop('disabled', false);
  $('.fairy-skill-toggle').prop('disabled', false);

  calculateFairyBonus();
  calculatePreBattleStatsAllDolls();
  simulateBattle();
  updateUIAllDolls();
  updateUIForFairy();
}

function openFairySkillControl() {
  if (fairy.id == -1 || !fairy.special_control) {
    return;
  }

  $('#skill-control-body').html(FAIRY_SKILL_CONTROL_HTML[fairy.id]());
  $('#skill-control-apply').click(closeFairySkillControl);
  $('#skill-control-modal').modal('show');
}

function closeFairySkillControl() {
  $('#skill-control-modal').modal('hide');
  $('#skill-control-apply').off('click');

  if (fairy.id == -1 || !fairy.special_control) {
    return;
  }

  FAIRY_SKILL_CONTROL[fairy.id]();

  simulateBattle();
  updateUIAllDolls();
  updateUIForFairy();
}



function updateUIAllDolls() {
  for (let i = 0; i < echelon.length; i++) {
    updateUIForDoll(i); //update stat card and grid for each doll
  }

  //update ui for grid squares with no doll
  $.each([12, 13, 14, 22, 23, 24, 32, 33, 34], function (index, value) {
    if ($('#pos' + value).attr('data-index') != -1) {
      return true;
    }
    $('#pos' + value + ' > img').attr('src', '/static/girlsfrontline/sim/placeholder.png');
    $('#pos' + value + ' .tilegrid').prop('hidden', true);
    let tile_bonuses = ['fp', 'acc', 'eva', 'rof', 'crit', 'skillcd', 'armor'];
    for (let i = 0; i < tile_bonuses.length; i++) {
      $('#pos' + value + ' .' + tile_bonuses[i]).prop('hidden', true);
    }
  });

  if (echelon.find(doll => doll.mod) !== undefined) {
    $('#doll' + 1 + ' .skill2').prop('hidden', false);
    $('#doll' + 2 + ' .skill2').prop('hidden', false);
    $('#doll' + 3 + ' .skill2').prop('hidden', false);
    $('#doll' + 4 + ' .skill2').prop('hidden', false);
    $('#doll' + 5 + ' .skill2').prop('hidden', false);
  } else {
    $('#doll' + 1 + ' .skill2').prop('hidden', true);
    $('#doll' + 2 + ' .skill2').prop('hidden', true);
    $('#doll' + 3 + ' .skill2').prop('hidden', true);
    $('#doll' + 4 + ' .skill2').prop('hidden', true);
    $('#doll' + 5 + ' .skill2').prop('hidden', true);
  }

  if (echelon.find(doll => doll.special_control) !== undefined) {
    $('#doll' + 1 + ' .skill-control').prop('hidden', false);
    $('#doll' + 2 + ' .skill-control').prop('hidden', false);
    $('#doll' + 3 + ' .skill-control').prop('hidden', false);
    $('#doll' + 4 + ' .skill-control').prop('hidden', false);
    $('#doll' + 5 + ' .skill-control').prop('hidden', false);
  } else {
    $('#doll' + 1 + ' .skill-control').prop('hidden', true);
    $('#doll' + 2 + ' .skill-control').prop('hidden', true);
    $('#doll' + 3 + ' .skill-control').prop('hidden', true);
    $('#doll' + 4 + ' .skill-control').prop('hidden', true);
    $('#doll' + 5 + ' .skill-control').prop('hidden', true);
  }
}

function updateUIForDoll(index) {
  let doll = echelon[index];
  if (doll.id == -1) {
    $('#pos' + doll.pos + ' > img').attr('src', '/static/girlsfrontline/sim/placeholder.png');
    $('#pos' + doll.pos + ' .tilegrid').prop('hidden', true);
    $('#doll' + (index + 1) + ' .skill-label').attr('data-original-title', '-');
    $('#doll' + (index + 1) + ' .skill2').css('visibility', 'hidden');
    $('#doll' + (index + 1) + ' .skill-control').css('visibility', 'hidden');
    $('#doll' + (index + 1) + ' .skill-toggle').prop('checked', true);
    $('#doll' + (index + 1) + ' .skill-level-select').val(10);
    $('#doll' + (index + 1) + '-name').text('-');
    $('#doll' + (index + 1) + ' .hp span').text('-');
    $('#doll' + (index + 1) + ' .fp span').text('-');
    $('#doll' + (index + 1) + ' .acc span').text('-');
    $('#doll' + (index + 1) + ' .eva span').text('-');
    $('#doll' + (index + 1) + ' .rof span').text('-');
    $('#doll' + (index + 1) + ' .crit span').text('-');
    $('#doll' + (index + 1) + ' .critdmg span').text('-');
    $('#doll' + (index + 1) + ' .rounds span').text('-');
    $('#doll' + (index + 1) + ' .armor span').text('-');
    $('#doll' + (index + 1) + ' .ap span').text('-');
    $('#doll' + (index + 1) + '-dmg-label').text('-');
    $('#doll' + (index + 1) + '-dmg').text('-');
    $('#doll' + (index + 1) + '-shots').text('-');
  } else {
    $('#doll' + (index + 1) + '-name').text(doll.name);
    $('#doll' + (index + 1) + '-name').css('border-bottom', '2px solid');
    $('#doll' + (index + 1) + '-name').css('border-bottom-color', graphColors[index]);
    $('#doll' + (index + 1) + ' .affection').children().prop('hidden', true);
    $('#doll' + (index + 1) + ' .affection').children().eq(doll.affection).prop('hidden', false);
    $('#doll' + (index + 1) + ' .skill-label').attr('data-original-title', doll.tooltip_skill1);
    if (doll.mod) {
      $('#doll' + (index + 1) + ' .skill2').css('visibility', 'visible');
      $('#doll' + (index + 1) + ' .skill2-label').attr('data-original-title', doll.tooltip_skill2);
    } else {
      $('#doll' + (index + 1) + ' .skill2').css('visibility', 'hidden');
    }
    if (doll.special_control) {
      $('#doll' + (index + 1) + ' .skill-control').css('visibility', 'visible');
    } else {
      $('#doll' + (index + 1) + ' .skill-control').css('visibility', 'hidden');
    }

    if (showBuffedStats) {
      $('#doll' + (index + 1) + ' .fp span').text(doll.battle.finalstats.fp);
      $('#doll' + (index + 1) + ' .acc span').text(doll.battle.finalstats.acc);
      $('#doll' + (index + 1) + ' .eva span').text(doll.battle.finalstats.eva);
      $('#doll' + (index + 1) + ' .rof span').text(doll.battle.finalstats.rof);
      $('#doll' + (index + 1) + ' .crit span').text(doll.battle.finalstats.crit + '%');

      // Show tooltips for rof and crit
      let [hasRofWaste, hasCritWaste] = [doll.battle.finalstats.rof_waste > 0, doll.battle.finalstats.crit_waste > 0];
      let rofWasteString = hasRofWaste ? `+${doll.battle.finalstats.rof_waste.toFixed(0)}` : '';
      let critWasteString = hasCritWaste ? `+${(doll.battle.finalstats.crit_waste).toFixed(2)}%` : '';

      if (hasRofWaste) {
        $('#doll' + (index + 1) + ' .rof span').addClass('has_tooltip');
      } else {
        $('#doll' + (index + 1) + ' .rof span').removeClass('has_tooltip');
      }

      if (hasCritWaste) {
        $('#doll' + (index + 1) + ' .crit span').addClass('has_tooltip');
      } else {
        $('#doll' + (index + 1) + ' .crit span').removeClass('has_tooltip');
      }


      $('#doll' + (index + 1) + ' .rof span').attr('data-original-title',
        `
        Rate of Fire: ${(doll.battle.finalstats.effective_rof + doll.battle.finalstats.rof_waste).toFixed(0)} (${doll.battle.finalstats.effective_rof}<span class="text-danger">${rofWasteString}</span>)
        <br />
        Effective RoF: ${doll.battle.finalstats.effective_rof}
        <br />
        Frames per attack: ${getFrames(doll.battle.finalstats.effective_rof)}
        <br />
        Attacks per second: ${(30 / getFrames(doll.battle.finalstats.effective_rof)).toFixed(2)}
        `
      );
      $('#doll' + (index + 1) + ' .crit span').attr('data-original-title',
        `
         Crit Chance: ${(doll.battle.finalstats.effective_crit + doll.battle.finalstats.crit_waste).toFixed(0)}% (${(doll.battle.finalstats.effective_crit).toFixed(0)}<span class="text-danger">${critWasteString}</span>)
        `
      );

      $('#doll' + (index + 1) + ' .critdmg span').text((doll.battle.finalstats.critdmg + 100) + '%');
      if (doll.battle.finalstats.rounds != 0) {
        $('#doll' + (index + 1) + ' .rounds span').text(doll.battle.finalstats.rounds);
      } else {
        $('#doll' + (index + 1) + ' .rounds span').text('-');
      }
      if (doll.battle.finalstats.armor != 0) {
        $('#doll' + (index + 1) + ' .armor span').text(doll.battle.finalstats.armor);
      } else {
        $('#doll' + (index + 1) + ' .armor span').text('-');
      }
      $('#doll' + (index + 1) + ' .ap span').text(doll.battle.finalstats.ap);
    } else {
      $('#doll' + (index + 1) + ' .fp span').text(doll.pre_battle.fp);
      $('#doll' + (index + 1) + ' .acc span').text(doll.pre_battle.acc);
      $('#doll' + (index + 1) + ' .eva span').text(doll.pre_battle.eva);
      $('#doll' + (index + 1) + ' .rof span').text(Math.floor(doll.pre_battle.rof));
      $('#doll' + (index + 1) + ' .crit span').text(Math.floor(doll.pre_battle.crit) + '%');
      $('#doll' + (index + 1) + ' .critdmg span').text((doll.pre_battle.critdmg + 100) + '%');
      if (doll.pre_battle.rounds != 0) {
        $('#doll' + (index + 1) + ' .rounds span').text(doll.pre_battle.rounds);
      } else {
        $('#doll' + (index + 1) + ' .rounds span').text('-');
      }
      if (doll.pre_battle.armor != 0) {
        $('#doll' + (index + 1) + ' .armor span').text(doll.pre_battle.armor);
      } else {
        $('#doll' + (index + 1) + ' .armor span').text('-');
      }
      $('#doll' + (index + 1) + ' .ap span').text(doll.pre_battle.ap);
    }

    $('#doll' + (index + 1) + ' .hp span').text(doll.pre_battle.hp);

    $('#doll' + (index + 1) + '-dmg-label').text(doll.name);

    $('#pos' + doll.pos + ' > img').attr('src', '/static/girlsfrontline/sim/dolls/' + doll.id + '.png');

    $('#pos' + doll.pos + ' .tilegrid').prop('hidden', false);
    $('#pos' + doll.pos + ' .tilegrid').attr('data-original-title', doll.tooltip_tiles);
    let targetSquares = doll.tiles.target.split(',');
    $('#pos' + doll.pos + ' .tilegrid-col').removeClass('tilegrid-target tilegrid-neutral tilegrid-self');
    $('#pos' + doll.pos + ' .tile' + doll.tiles.self).addClass('tilegrid-self');
    for (let i = 0; i < targetSquares.length; i++) {
      $('#pos' + doll.pos + ' .tile' + (doll.tiles.self + parseInt(targetSquares[i]))).addClass('tilegrid-target');
    }
    $.each([12, 13, 14, 22, 23, 24, 32, 33, 34], function (index, value) {
      if (!$('#pos' + doll.pos + ' .tile' + value).hasClass('tilegrid-self') && !$('#pos' + doll.pos + ' .tile' + value).hasClass('tilegrid-target')) {
        $('#pos' + doll.pos + ' .tile' + value).addClass('tilegrid-neutral');
      }
    });
  }



  let tile_bonuses = ['fp', 'acc', 'eva', 'rof', 'crit', 'skillcd', 'armor'];
  for (let i = 0; i < tile_bonuses.length; i++) {
    if (doll.tile_bonus[tile_bonuses[i]] > 0) {
      $('#pos' + doll.pos + ' .' + tile_bonuses[i] + ' span').text(doll.tile_bonus[tile_bonuses[i]] + '%');
      $('#pos' + doll.pos + ' .' + tile_bonuses[i]).prop('hidden', false);
    } else {
      $('#pos' + doll.pos + ' .' + tile_bonuses[i]).prop('hidden', true);
    }
  }

  for (let i = 1; i <= 3; i++) {
    let equipId = doll['equip' + i];
    if (equipId == -1) {
      $('#doll' + (index + 1) + ' .equip' + i).removeClass('stars5 stars4 stars3 stars2 stars1');
      $('#doll' + (index + 1) + ' .equip' + i).attr('src', '/static/girlsfrontline/sim/placeholder.png');
    } else {
      $('#doll' + (index + 1) + ' .equip' + i).removeClass('stars5 stars4 stars3 stars2 stars1');
      $('#doll' + (index + 1) + ' .equip' + i).addClass('stars' + equipData[equipId - 1].rarity);
      $('#doll' + (index + 1) + ' .equip' + i).attr('src', '/static/girlsfrontline/sim/equips/' + equipData[equipId - 1].type + '.png');
    }
  }
}

function updateUIForFairy() {
  if (fairy.id == -1) {
    $('#fairy-name').text('-');
    $('#fairy-dmg-label').text('-');
    $('#fairy-img').attr('src', '/static/girlsfrontline/sim/placeholder.png');
    $('.fairy-skill-label').attr('data-original-title', '-');
    $('#fairy .fp span').text('-');
    $('#fairy .acc span').text('-');
    $('#fairy .eva span').text('-');
    $('#fairy .armor span').text('-');
    $('#fairy .critdmg span').text('-');
    $('#fairy-skill-control').prop('hidden', true);
  } else {
    $('#fairy-name').text(fairy.name);
    $('#fairy-name').css('border-bottom', '2px solid');
    $('#fairy-name').css('border-bottom-color', graphColors[5]);
    $('#fairy-dmg-label').text(fairy.name);
    $('#fairy-img').attr('src', '/static/girlsfrontline/sim/fairies/' + fairy.id + '.png');
    $('.fairy-skill-label').attr('data-original-title', fairy.tooltip_skill);
    $.each(['fp', 'acc', 'eva', 'armor', 'critdmg'], (i, stat) => {
      if (fairy.aura[stat] == 0) {
        $('#fairy .' + stat + ' span').text('-');
      } else {
        $('#fairy .' + stat + ' span').text(parseFloat(fairy.aura[stat].toFixed(2)) + '%');
      }
    });
    if (fairy.special_control) {
      $('#fairy-skill-control').prop('hidden', false);
    } else {
      $('#fairy-skill-control').prop('hidden', true);
    }
  }
}




function calculateEquipBonus(dollIndex) {
  echelon[dollIndex].equip_bonus = { fp: 0, acc: 0, eva: 0, rof: 0, critdmg: 0, crit: 0, ap: 0, armor: 0, nightview: 0, rounds: 0 };

  for (let i = 1; i <= 3; i++) {
    let equipId = echelon[dollIndex]['equip' + i];
    if (equipId == -1)
      continue;
    let equip = equipData[equipId - 1];
    let level = parseInt($('#doll' + (dollIndex + 1) + ' .equip' + i + '-level-select').val());
    echelon[dollIndex].equip_bonus.fp += Math.floor((equip.level_bonus.fp / 10000 * level + 1) * equip.fp);
    echelon[dollIndex].equip_bonus.acc += Math.floor((equip.level_bonus.acc / 10000 * level + 1) * equip.acc);
    echelon[dollIndex].equip_bonus.eva += Math.floor((equip.level_bonus.eva / 10000 * level + 1) * equip.eva);
    echelon[dollIndex].equip_bonus.rof += Math.floor((equip.level_bonus.rof / 10000 * level + 1) * equip.rof);
    echelon[dollIndex].equip_bonus.critdmg += Math.floor((equip.level_bonus.critdmg / 10000 * level + 1) * equip.critdmg);
    echelon[dollIndex].equip_bonus.crit += Math.floor((equip.level_bonus.crit / 10000 * level + 1) * equip.crit);
    echelon[dollIndex].equip_bonus.ap += Math.floor((equip.level_bonus.ap / 10000 * level + 1) * equip.ap);
    echelon[dollIndex].equip_bonus.armor += Math.floor((equip.level_bonus.armor / 10000 * level + 1) * equip.armor);
    echelon[dollIndex].equip_bonus.nightview += Math.floor((equip.level_bonus.nightview / 10000 * level + 1) * equip.nightview);
    echelon[dollIndex].equip_bonus.rounds += Math.floor((equip.level_bonus.rounds / 10000 * level + 1) * equip.rounds);
  }
}

function calculateTileBonus() {
  //reset everyone's tile bonus
  for (let i = 0; i < echelon.length; i++) {
    echelon[i].tile_bonus = { fp: 0, acc: 0, eva: 0, rof: 0, crit: 0, skillcd: 0, armor: 0 };
  }

  //iterate through all grid squares, checking for a doll
  let validSquares = [12, 13, 14, 22, 23, 24, 32, 33, 34];
  $.each(validSquares, function (index, value) {
    let dollIndex = parseInt($('#pos' + value).attr('data-index'));
    if (dollIndex == -1 || echelon[dollIndex].id == -1) {
      return true;
    }

    let targetSquares = echelon[dollIndex].tiles.target.split(',');
    //iterate through all squares this doll affects
    for (let i = 0; i < targetSquares.length; i++) {
      let targetSquare = value + parseInt(targetSquares[i]);
      if ($.inArray(targetSquare, validSquares) == -1) {
        continue;
      }

      let targetIndex = $('#pos' + targetSquare).attr('data-index');
      if (targetIndex == -1 || echelon[targetIndex].id == -1) {
        continue;
      }

      let target = echelon[targetIndex];
      let source = echelon[dollIndex];

      let targetReceivesBuff = false;
      if ($.isArray(source.tiles.target_type)) {
        targetReceivesBuff = $.inArray(target.type, source.tiles.target_type) == -1 ? false : true;
      } else {
        targetReceivesBuff = source.tiles.target_type == target.type;
      }
      if (source.tiles.target_type == 0 || targetReceivesBuff) {
        if (source.type == 1) {
          target.tile_bonus.fp += Math.floor(source.tiles.effect.fp[0] + ((source.tiles.effect.fp[1] - source.tiles.effect.fp[0]) / 4) * (getNumLinks(dollIndex) - 1));
          target.tile_bonus.acc += Math.floor(source.tiles.effect.acc[0] + ((source.tiles.effect.acc[1] - source.tiles.effect.acc[0]) / 4) * (getNumLinks(dollIndex) - 1));
          target.tile_bonus.eva += Math.floor(source.tiles.effect.eva[0] + ((source.tiles.effect.eva[1] - source.tiles.effect.eva[0]) / 4) * (getNumLinks(dollIndex) - 1));
          target.tile_bonus.rof += Math.floor(source.tiles.effect.rof[0] + ((source.tiles.effect.rof[1] - source.tiles.effect.rof[0]) / 4) * (getNumLinks(dollIndex) - 1));
          target.tile_bonus.crit += Math.floor(source.tiles.effect.crit[0] + ((source.tiles.effect.crit[1] - source.tiles.effect.crit[0]) / 4) * (getNumLinks(dollIndex) - 1));
          target.tile_bonus.skillcd += Math.floor(source.tiles.effect.skillcd[0] + ((source.tiles.effect.skillcd[1] - source.tiles.effect.skillcd[0]) / 4) * (getNumLinks(dollIndex) - 1));
          target.tile_bonus.armor += Math.floor(source.tiles.effect.armor[0] + ((source.tiles.effect.armor[1] - source.tiles.effect.armor[0]) / 4) * (getNumLinks(dollIndex) - 1));
        } else {
          target.tile_bonus.fp += source.tiles.effect.fp;
          target.tile_bonus.acc += source.tiles.effect.acc;
          target.tile_bonus.eva += source.tiles.effect.eva;
          target.tile_bonus.rof += source.tiles.effect.rof;
          target.tile_bonus.crit += source.tiles.effect.crit;
          target.tile_bonus.skillcd += source.tiles.effect.skillcd;
          target.tile_bonus.armor += source.tiles.effect.armor;
        }

        if (target.tile_bonus.skillcd > 30) {
          target.tile_bonus.skillcd = 30;
        }
      }
    }
  });
}

function calculateFairyBonus() {
  fairy.aura = {
    fp: 0,
    acc: 0,
    eva: 0,
    armor: 0,
    critdmg: 0
  };

  if (fairy.id == -1) {
    return;
  }

  fairy.aura.fp = (Math.ceil(FAIRY_GROWTH_FACTORS.basic.fp * fairy.fp / 100) + Math.ceil(FAIRY_GROWTH_FACTORS.grow.fp * fairy.fp * fairy.growth_rating * (fairy.level - 1) / 10000)) * FAIRY_RARITY_SCALARS[fairy.rarity - 1];
  fairy.aura.acc = (Math.ceil(FAIRY_GROWTH_FACTORS.basic.acc * fairy.acc / 100) + Math.ceil(FAIRY_GROWTH_FACTORS.grow.acc * fairy.acc * fairy.growth_rating * (fairy.level - 1) / 10000)) * FAIRY_RARITY_SCALARS[fairy.rarity - 1];
  fairy.aura.eva = (Math.ceil(FAIRY_GROWTH_FACTORS.basic.eva * fairy.eva / 100) + Math.ceil(FAIRY_GROWTH_FACTORS.grow.eva * fairy.eva * fairy.growth_rating * (fairy.level - 1) / 10000)) * FAIRY_RARITY_SCALARS[fairy.rarity - 1];
  fairy.aura.armor = (Math.ceil(FAIRY_GROWTH_FACTORS.basic.armor * fairy.armor / 100) + Math.ceil(FAIRY_GROWTH_FACTORS.grow.armor * fairy.armor * fairy.growth_rating * (fairy.level - 1) / 10000)) * FAIRY_RARITY_SCALARS[fairy.rarity - 1];
  fairy.aura.critdmg = (Math.ceil(FAIRY_GROWTH_FACTORS.basic.critdmg * fairy.critdmg / 100) + Math.ceil(FAIRY_GROWTH_FACTORS.grow.critdmg * fairy.critdmg * fairy.growth_rating * (fairy.level - 1) / 10000)) * FAIRY_RARITY_SCALARS[fairy.rarity - 1];
}

function calculateBaseStats(dollIndex) {
  let doll = echelon[dollIndex];
  let data = dollData[doll.id - 1];
  let level = parseInt($('#doll' + (dollIndex + 1) + ' .doll-level-select').val());

  doll.base = dollUtils.getStatsAtLevel(data, level);
}

function calculatePreBattleStatsForDoll(dollIndex) {
  let doll = echelon[dollIndex];

  if (doll.id == -1)
    return;

  let affection_bonus = getAffectionBonus(doll.affection, doll.mod);

  doll.pre_battle.hp = doll.base.hp * getNumLinks(dollIndex);
  doll.pre_battle.fp = doll.base.fp;
  doll.pre_battle.acc = doll.base.acc;
  doll.pre_battle.eva = doll.base.eva;
  doll.pre_battle.rof = doll.base.rof;
  doll.pre_battle.armor = doll.base.armor;
  doll.pre_battle.crit = doll.base.crit;
  doll.pre_battle.critdmg = doll.base.critdmg;
  doll.pre_battle.ap = doll.base.ap;
  doll.pre_battle.rounds = doll.base.rounds;

  //apply affection bonus additively
  doll.pre_battle.fp += Math.sign(affection_bonus) * Math.ceil(Math.abs(doll.base.fp * affection_bonus));
  doll.pre_battle.acc += Math.sign(affection_bonus) * Math.ceil(Math.abs(doll.base.acc * affection_bonus));
  doll.pre_battle.eva += Math.sign(affection_bonus) * Math.ceil(Math.abs(doll.base.eva * affection_bonus));

  //apply equip bonus additively
  doll.pre_battle.fp += doll.equip_bonus.fp;
  if (doll.type == 6) { //sg
    if (doll.hasSlug) {
      doll.targets = 1;
      doll.pre_battle.fp *= 3;
    } else {
      doll.targets = 3;
    }
  }
  doll.pre_battle.acc += doll.equip_bonus.acc;
  doll.pre_battle.eva += doll.equip_bonus.eva;
  doll.pre_battle.rof += doll.equip_bonus.rof;
  doll.pre_battle.armor += doll.equip_bonus.armor;
  doll.pre_battle.crit += doll.equip_bonus.crit;
  doll.pre_battle.critdmg += doll.equip_bonus.critdmg;
  doll.pre_battle.ap += doll.equip_bonus.ap;
  doll.pre_battle.rounds += doll.equip_bonus.rounds;
  doll.pre_battle.nightview = doll.equip_bonus.nightview;

  //apply tile bonus multiplicatively, do not floor
  doll.pre_battle.fp = doll.pre_battle.fp * (1 + (doll.tile_bonus.fp / 100));
  doll.pre_battle.acc = doll.pre_battle.acc * (1 + (doll.tile_bonus.acc / 100));
  doll.pre_battle.eva = doll.pre_battle.eva * (1 + (doll.tile_bonus.eva / 100));
  doll.pre_battle.rof = doll.pre_battle.rof * (1 + (doll.tile_bonus.rof / 100));
  doll.pre_battle.armor = doll.pre_battle.armor * (1 + (doll.tile_bonus.armor / 100));
  doll.pre_battle.crit = doll.pre_battle.crit * (1 + (doll.tile_bonus.crit / 100));
  doll.pre_battle.skillcd = doll.tile_bonus.skillcd;

  //apply fairy bonus multiplicatively, ceiling
  doll.pre_battle.fp = Math.ceil(doll.pre_battle.fp * (1 + fairy.aura.fp / 100));
  doll.pre_battle.acc = Math.ceil(doll.pre_battle.acc * (1 + fairy.aura.acc / 100));
  doll.pre_battle.eva = Math.ceil(doll.pre_battle.eva * (1 + fairy.aura.eva / 100));
  doll.pre_battle.armor = Math.ceil(doll.pre_battle.armor * (1 + fairy.aura.armor / 100));
  doll.pre_battle.critdmg = Math.ceil((doll.pre_battle.critdmg + 100) * (1 + fairy.aura.critdmg / 100)) - 100;

  //cap stats & apply night acc penalty
  doll.pre_battle.fp = Math.max(0, doll.pre_battle.fp);
  doll.pre_battle.eva = Math.max(0, doll.pre_battle.eva);
  doll.pre_battle.critdmg = Math.max(0, doll.pre_battle.critdmg);
  doll.pre_battle.ap = Math.max(0, doll.pre_battle.ap);
  doll.pre_battle.armor = Math.max(0, doll.pre_battle.armor);
  doll.pre_battle.acc = Math.max(1, doll.pre_battle.acc);

  // Should not be necessary to cap RoF pre-battle if it's capped during calculations
  //
  // if (doll.type == 6) { //sg
  //   doll.pre_battle.rof = Math.min(60, Math.max(15, doll.pre_battle.rof));
  // } else if (doll.type == 5) { //mg
  //   doll.pre_battle.rof = Math.min(1000, Math.max(1, doll.pre_battle.rof));
  // } else { //hg,rf,ar,smg
  //   doll.pre_battle.rof = Math.min(120, Math.max(15, doll.pre_battle.rof));
  // }

  if (isNight) {
    doll.pre_battle.acc = Math.floor(doll.pre_battle.acc * (1 - (.9 - .9 * doll.pre_battle.nightview / 100)));
  }

  doll.pre_battle_capped = JSON.parse(JSON.stringify(doll.pre_battle));
  doll.pre_battle_capped.crit = getCapCrit(doll, doll.pre_battle_capped.crit);
  doll.pre_battle_capped.rof = getCapRoF(doll, doll.pre_battle_capped.rof);
}

function calculatePreBattleStatsAllDolls() {
  for (let i = 0; i < 5; i++) {
    calculatePreBattleStatsForDoll(i);
  }
}



function preBattleSkillChanges(doll) {
  if (doll.id == 192) {
    //strawberry cano probably
    let effect = doll.battle.skill.effects[0];
    for (let i = 0; i < 5; i++) {
      if (echelon[i].id == -1) {
        continue;
      }
      if (echelon[i].id != 192 && echelon[i].type == 3) {
        doll.battle.skill.effects.push($.extend(true, {}, effect));
      }
    }
  }

  if (doll.id == 239) {
    //Jericho
    let skilleffect = {
      type: 'passive',
      trigger: 'reload',
      effects: [
        {
          type: 'buff',
          target: 'self',
          name: 'jericho',
          stat: {
            fp: 5,
            acc: 5
          },
          duration: 15,
          stackable: true,
          stacks: 1,
          max_stacks: 3
        }
      ]
    };

    let targetSquares = doll.tiles.target.split(',');
    targetSquares = targetSquares.map(targetSquare => parseInt(targetSquare));
    targetSquares = targetSquares.map(targetSquare => targetSquare + doll.pos);
    for (let i = 0; i < 5; i++) {
      if (echelon[i].id != -1 && $.inArray(echelon[i].pos, targetSquares) != -1) {
        if (echelon[i].type == 5 || echelon[i].type == 6) { // have to specify mg/sg so it doesn't work on falcon
          echelon[i].battle.passives.push($.extend(true, {}, skilleffect));
        }
      }
    }
  }

  if (doll.id == 253) {
    //m1895 mod3 nagant revolver
    doll.battle.skill2.icd = (doll.battle.timers.find(t => t.type == 'normalAttack').timeLeft + 3) / 30;
  }

  if (doll.id == 199) {
    doll.battle.skill.marks = 0;
  }

  if (doll.id == 224) {
    //m82a1
    doll.battle.skillUseCount = 0;
  }

  if (doll.id == 262) {
    //g3mod
    if (doll.skill.buffednade) {
      doll.battle.skill.effects[0].multiplier = [5, 5.8, 6.6, 7.3, 8.1, 8.9, 9.7, 10.4, 11.2, 12].map(x => x + doll.skill2.effects[0].multiplier[doll.skill2level - 1]);
    } else {
      doll.battle.skill.effects[0].multiplier = [5, 5.8, 6.6, 7.3, 8.1, 8.9, 9.7, 10.4, 11.2, 12];
    }
  }

  if (doll.id == 263) {
    //g36mod
    let buffcount = 0;

    // Check right tile
    let tiledoll = echelon.find(d => d.pos == doll.pos + 1);
    if (tiledoll !== undefined && tiledoll.id != -1) {
      buffcount++;
    }

    // Check bottom right tile
    tiledoll = echelon.find(d => d.pos == doll.pos + 11);
    if (tiledoll !== undefined && tiledoll.id != -1) {
      buffcount++;
    }
    let buff = {
      type: 'buff',
      target: 'self',
      stat: {
        rof: [5, 6, 6, 7, 7, 8, 8, 9, 9, 10]
      },
      duration: [3, 3.2, 3.4, 3.7, 3.9, 4.1, 4.3, 4.6, 4.8, 5],
      name: 'g36mod',
      stackable: true,
      max_stacks: 2,
      stacks: 1
    };
    if (buffcount == 1) {
      doll.battle.skill2.effects.push($.extend({}, buff));
    } else if (buffcount == 2) {
      doll.battle.skill2.effects.push($.extend({}, buff));
      doll.battle.skill2.effects.push($.extend({}, buff));
    }
  }

  if (doll.id == 264) {
    let reloadbuff = {
      type: 'buff',
      target: 'self',
      name: 'reloadBuff',
      level: doll.skill2level,
      setTime: [5.5, 5.4, 5.4, 5.3, 5.3, 5.2, 5.2, 5.1, 5.1, 5],
      duration: -1
    };
    let attackbuff = {
      type: 'buff',
      target: 'self',
      name: 'normalAttackBuff',
      level: doll.skill2level,
      multiplier: [1.25, 1.27, 1.28, 1.3, 1.32, 1.33, 1.35, 1.37, 1.38, 1.4],
      attacksLeft: 3,
      duration: -1
    };
    doll.battle.buffs.push(reloadbuff);
    doll.battle.buffs.push(attackbuff);
  }

  if (doll.id == 227) {
    //js9
    let fpstacks = enemyCount > 3 ? 0 : 4 - enemyCount;
    let evastacks = enemyCount == 1 ? 0 : Math.min(6, enemyCount - 1);
    doll.battle.skill.effects[0].stacks = evastacks;
    doll.battle.skill.effects[1].stacks = fpstacks;
  }

  if (doll.id == 235) {
    //howa type64
    if (enemyCount > 5) {
      doll.battle.skill.effects[0].stat.fp = 0;
      doll.battle.skill.effects[0].stat.rof = [30, 36, 41, 47, 52, 58, 63, 69, 74, 80];
      doll.battle.skill.effects[0].stat.acc = [30, 36, 41, 47, 52, 58, 63, 69, 74, 80];
    } else {
      doll.battle.skill.effects[0].stat.fp = [40, 46, 51, 57, 62, 68, 73, 79, 84, 90];
      doll.battle.skill.effects[0].stat.rof = 0;
      doll.battle.skill.effects[0].stat.acc = 0;
    }
  }

  if (doll.id == 259) {
    //m4a1 mod3
    doll.battle.skill.effects[2].multiplier = doll.battle.skill.effects[2].multiplier[doll.skill2level - 1];
  }

  if (doll.id == 260) {
    //sop mod3
    doll.battle.skill.effects[0].after[1].multiplier = doll.battle.skill.effects[0].after[1].multiplier[doll.skill2level - 1];
    doll.battle.skill.effects[0].after[2].multiplier = doll.battle.skill.effects[0].after[2].multiplier[doll.skill2level - 1];
    doll.battle.skill.effects[0].after[3].multiplier = doll.battle.skill.effects[0].after[3].multiplier[doll.skill2level - 1];
  }

  if (doll.id == 268) {
    //idw mod3
    let buff = {
      type: 'buff',
      target: 'self',
      stat: {
        rof: [6, 6, 7, 7, 8, 8, 9, 9, 10, 10],
        fp: [12, 13, 14, 15, 16, 16, 17, 18, 19, 20]
      },
      level: doll.skill2level,
      duration: -1,
      name: 'idwmod',
      stackable: true,
      stacks: 3,
      stacksToAdd: 3,
      max_stacks: 3
    };
    doll.battle.buffs.push(buff);
  }

  if (doll.id == 256) {
    if (doll.battle.skill.effects[0].after.target == 'self') {
      let rof = [15, 17, 18, 20, 22, 23, 25, 27, 28, 30];
      doll.battle.skill.effects[0].after.stat.rof = rof[doll.skill2level - 1];
    }
  }

  if (doll.id == 249) {
    //clear
    let dollsToBuff = echelon.filter(d => {
      if (d.id == -1 || d.id == 249) {
        return false;
      } else {
        return true;
      }
    });
    if (dollsToBuff.length == 0) {
      return;
    }
    let hasEquip = doll.equip1 == 85 ? true : false;
    //hand out all 5 buffs in sequence
    for (let i = 0; i < 5; i += dollsToBuff.length) {
      for (let j = 0; j < Math.min(dollsToBuff.length, 5 - i); j++) {
        doll.battle.skill.effects[i + j + 1].after.target = 'doll';
        doll.battle.skill.effects[i + j + 1].after.dollid = dollsToBuff[j].id;
        if (hasEquip) {
          doll.battle.skill.effects[i + j + 1].after.stat.fp = [20, 22, 24, 27, 29, 31, 33, 36, 38, 40];
          doll.battle.skill.effects[i + j + 1].after.stat.acc = [20, 22, 24, 27, 29, 31, 33, 36, 38, 40];
        }
      }
    }
  }

  if (doll.id == 231) {
    //type88 (mg)
    let lmgbuff = {
      type: 'buff',
      target: 'self',
      level: doll.skilllevel,
      stat: {
        acc: [-40, -38, -36, -33, -31, -29, -27, -24, -22, -20]
      },
      duration: 6,
      timeLeft: 180
    };
    doll.battle.buffs.push(lmgbuff);
  }

  if (doll.id == 189) {
    //k2
    doll.skill.mode = 'fever';
    let feverbuff = {
      type: 'buff',
      target: 'self',
      name: 'normalAttackBuff',
      hitCount: 3,
      multiplier: [0.4, 0.412, 0.424, 0.436, 0.448, 0.46, 0.472, 0.484, 0.496, 0.52],
      duration: -1,
      level: doll.skilllevel
    };
    let heatbuff = {
      type: 'buff',
      target: 'self',
      duration: -1,
      stackable: true,
      stacks: 1,
      max_stacks: 20,
      stacksToAdd: 1,
      name: 'heat',
      stat: {
        fp: 0,
        acc: 0
      },
      level: doll.skilllevel
    };
    let normalAttackPassive = {
      type: 'passive',
      trigger: 'normalAttack',
      level: doll.skilllevel,
      effects: [
        {
          type: 'buff',
          target: 'self',
          duration: -1,
          stackable: true,
          stacks: 1,
          max_stacks: 20,
          stacksToAdd: 1,
          name: 'heat',
          stat: {
            fp: 0,
            acc: 0
          },
          level: doll.skilllevel
        },
        {
          type: 'modifySkill',
          modifySkill: 'singleEnemyAttackStack'
        }
      ]
    };
    let hasStacksPassive = {
      type: 'passive',
      trigger: 'hasStacks',
      stacksRequired: 16,
      name: 'heat',
      level: doll.skilllevel,
      effects: [
        {
          type: 'modifySkill',
          modifySkill: 'changeHeatStats'
        }
      ]
    };
    let notHasStacksPassive = {
      type: 'passive',
      trigger: 'notHasStacks',
      stacksRequired: 15,
      name: 'heat',
      level: doll.skilllevel,
      effects: [
        {
          type: 'modifySkill',
          modifySkill: 'changeHeatStatsDown'
        }
      ]
    };
    doll.battle.buffs.push(feverbuff);
    doll.battle.buffs.push(heatbuff);
    doll.battle.passives.push(normalAttackPassive);
    doll.battle.passives.push(hasStacksPassive);
    doll.battle.passives.push(notHasStacksPassive);
  }

  if (doll.id == 278) {
    //M200
    let buff = {
      type: 'buff',
      name: 'normalAttackBuff',
      target: 'self',
      duration: -1,
      level: doll.skilllevel,
      multiplier: 1.05
    };
    if (enemyArmor == 0) {
      doll.battle.buffs.push(buff);
    }
    doll.battle.skill.numShots = 0;
  }

  if (doll.id == 193) {
    //grape cano
    let buff = {
      type: 'buff',
      target: 'self',
      name: 'grape',
      duration: -1,
      stackable: true,
      max_stacks: 99,
      stacks: 0,
      stacksToAdd: [1, 1, 1, 1, 1, 1, 2, 2, 2, 2],
      stackChance: [30, 35, 40, 45, 50, 55, 55, 60, 65, 70],
      level: doll.skilllevel
    };
    let activeBuff = {
      type: 'buff',
      target: 'self',
      name: 'grape',
      duration: -1,
      stackable: true,
      max_stacks: 99,
      stacks: 0,
      stacksToAdd: [12, 13, 14, 14, 15, 16, 16, 17, 17, 18],
      stackChance: [30, 35, 40, 45, 50, 55, 55, 60, 65, 70],
      level: doll.skilllevel
    };
    activeBuff.stacksToAdd = Math.ceil(100 / activeBuff.stackChance[activeBuff.level - 1] * activeBuff.stacksToAdd[activeBuff.level - 1]); //to make up for the stackChance when hasStacks passive is calculated
    activeBuff.stacks = activeBuff.stacksToAdd; //in case there is a point in the battle where the skill goes off right after the hasStacks passive is triggered and removes all stacks

    doll.battle.buffs.push(buff);
    doll.battle.skill.effects[0] = activeBuff;
  }

  if (doll.id == 279) {
    //falcon
    let normalAttackBuff = {
      type: 'buff',
      target: 'self',
      name: 'normalAttackBuff',
      multiplier: 1.5,
      level: doll.skilllevel,
      duration: -1
    };
    doll.battle.buffs.push(normalAttackBuff);
  }

  if (doll.id == 7) {
    //Stechkin
    if (doll.equip1 == 99) {
      doll.battle.skill.effects[0].stat.fp = 4;
    }
  }

  //Chauchat
  if (doll.id == 282) {
    let buff = {
      type: 'buff',
      target: 'self',
      name: 'chauchat',
      duration: -1,
      stackable: true,
      stacks: 1,
      max_stacks: 4
    };
    doll.battle.buffs.push(buff);
  }

  //mg36
  if (doll.id == 283) {
    let targetSquares = doll.tiles.target.split(',');
    targetSquares = targetSquares.map(targetSquare => parseInt(targetSquare));
    targetSquares = targetSquares.map(targetSquare => targetSquare + doll.pos);
    let validSquares = [12, 13, 14, 22, 23, 24, 32, 33, 34];
    $.each(targetSquares, (index, targetSquare) => {
      if ($.inArray(targetSquare, validSquares) != -1) {
        let dollOnTile = echelon.find(d => d.pos == targetSquare);
        if (dollOnTile !== undefined && dollOnTile.id != -1) {
          if (dollOnTile.type == 4) {
            doll.battle.skill.effects[1].stacks++;
          }
          if (dollOnTile.type == 2) {
            doll.battle.skill.effects[2].stacks++;
          }
          if (dollOnTile.type == 6) {
            doll.battle.skill.effects[3].rounds++;
          }
        }
      }
    });
  }

  //stg44 mod3
  if (doll.id == 290) {
    let grenadeDamageBonus = [1.10, 1.11, 1.12, 1.13, 1.14, 1.16, 1.17, 1.18, 1.19, 1.20];
    doll.battle.skill.effects[0].multiplier[doll.skilllevel - 1] *= grenadeDamageBonus[doll.skill2level - 1];
    doll.battle.skill.effects[1].multiplier[doll.skilllevel - 1] *= grenadeDamageBonus[doll.skill2level - 1];
    doll.battle.skill.effects[2].multiplier[doll.skilllevel - 1] *= grenadeDamageBonus[doll.skill2level - 1];
  }

  //micro uzi mod3
  if (doll.id == 291) {
    doll.battle.skill2.effects[0].after.duration = doll.battle.skill2.effects[0].after.duration[doll.skilllevel - 1];
  }

  //dana
  if (doll.id == 292) {
    doll.battle.targets = 1;
    let normalAttack = {
      type: 'buff',
      name: 'normalAttackBuff',
      duration: -1,
      multiplier: [1.2, 1.27, 1.33, 1.4, 1.47, 1.53, 1.6, 1.67, 1.73, 1.8],
      level: doll.skilllevel
    };
    doll.battle.buffs.push($.extend(true, {}, normalAttack));
  }

  //dorothy
  if (doll.id == 297) {
    if (doll.pos == 22 || doll.pos == 23 || doll.pos == 24) {
      doll.battle.skill.effects[0].delay = 0;
      doll.battle.skill.effects[0].after[0].duration = doll.battle.skill.effects[1].delay;
      doll.battle.skill.effects[0].after[1].duration = doll.battle.skill.effects[1].delay;
    } else {
      doll.battle.skill.effects[1].delay = 0;
      doll.battle.skill.effects[1].after[0].duration = doll.battle.skill.effects[0].delay;
      doll.battle.skill.effects[1].after[1].duration = doll.battle.skill.effects[0].delay;
    }
  }

  //jill
  if (doll.id == 296) {
    doll.battle.timers.find(timer => timer.type == 'normalAttack').timeLeft = -1;

    let cooldownBonus = doll.base.fp > 30 ? 30 : doll.base.fp;
    let skillcdBuff = {
      type: 'buff',
      target: 'self',
      level: doll.skilllevel,
      stat: {
        skillcd: cooldownBonus * -1
      },
      duration: -1
    };
    doll.battle.buffs.push(skillcdBuff);

    if (doll.equip1 == 106 && doll.equip2 == 105 && doll.equip3 == 109) {
      doll.battle.skill.effects.find(e => e.name == 'bigbeer').delay = 3;
    } else if (doll.equip1 == 103 && doll.equip2 == 104 && doll.equip3 == 110) {
      doll.battle.skill.effects.find(e => e.name == 'brandtini').delay = 3;
    } else if (doll.equip1 == 103 && doll.equip2 == 105 && doll.equip3 == 109) {
      doll.battle.skill.effects.find(e => e.name == 'pianowoman').delay = 3;
      let dorothy = echelon.find(d => d.id == 297);
      if (dorothy !== undefined) {
        dorothy.battle.skill.effects[0].after[1].stat.eva = dorothy.battle.skill.effects[0].after[1].stat.eva.map(x => x / 2);
        dorothy.battle.skill.effects[1].after[1].stat.acc = dorothy.battle.skill.effects[0].after[1].stat.acc.map(x => x / 2);
      }
    } else if (doll.equip1 == 103 && doll.equip2 == 104 && doll.equip3 == 109) {
      doll.battle.skill.effects.find(e => e.name == 'moonblast').delay = 3;
    } else if (doll.equip1 == 106 && doll.equip2 == 105 && doll.equip3 == 110) {
      doll.battle.skill.effects.find(e => e.name == 'bleedingjane').delay = 3;
    } else if (doll.equip1 == 107 && doll.equip2 == 108 && doll.equip3 == 109) {
      doll.battle.skill.effects.find(e => e.name == 'fringeweaver').delay = 3;
    } else {
      doll.battle.skill.effects.find(e => e.name == 'sugarrush').delay = 3;
    }
  }

  //mp5mod
  if (doll.id == 304) {
    let numStacks = enemyCount > 3 ? 3 : enemyCount;
    doll.battle.skill.effects[0].after[0].stacks = numStacks;
    doll.battle.skill.effects[0].after[0].level = doll.skill2level;
  }

  //ssg3000
  if (doll.id == 307) {
    doll.battle.skill.numShots = 0;
  }

  //acr
  if (doll.id == 309) {
    let singleBuff = {
      type:"buff",
      target:"self",
      stat:{
        fp:[5,6,6,7,7,8,8,9,9,10]
      },
      name:"acrSingleDebuffBuff",
      stackable: true,
      stacks: 0,
      max_stacks: 1,
      level: doll.skilllevel,
      duration:-1
    };
    let multiBuff = {
      type:"buff",
      target:"self",
      stat:{
        fp:[3,3,3,4,4,4,4,5,5,5]
      },
      stackable: true,
      stacks: 0,
      max_stacks: 8,
      name:"acrMultipleDebuffBuff",
      level: doll.skilllevel,
      duration:-1
    };
    doll.battle.buffs.push(singleBuff);
    doll.battle.buffs.push(multiBuff);
  }

  //m1895cb
  if (doll.id == 310) {
    doll.battle.reserveAmmo = 30;
    doll.battle.reserveAmmoMode = false;
  }

  if (doll.id == 320) {
    //mat49
    let fpstacks = enemyCount > 3 ? 0 : 4 - enemyCount;
    let evastacks = enemyCount == 1 ? 0 : Math.min(6, enemyCount - 1);
    doll.battle.skill.effects[0].stacks = evastacks;
    doll.battle.skill.effects[1].stacks = fpstacks;
  }

  if (doll.id == 323) {
    //sl8
    let dollTypesOnTiles = [];
    let sl8Tiles = [-20,-10,-9,-8];
    $.each(sl8Tiles, (index, tile) => {
      let d = echelon.find(d => d.pos == doll.pos + tile);
      if (d != undefined && d.id != -1) {
        dollTypesOnTiles.push(d.type);
      }
    });
    let uniqueTypesOnTiles = [...new Set(dollTypesOnTiles)];
    let fpstacks = uniqueTypesOnTiles.length > 3 ? 3 : uniqueTypesOnTiles.length;
    doll.battle.skill.effects[1].stacks = fpstacks;
  }

  //webley
  if (doll.id == 328) {
    for (let i = 0; i < 5; i++) {
      if (echelon[i].id == -1) {
        continue;
      }
      if (echelon[i].pos != doll.pos) {
        doll.battle.skill.effects[0].target = 'none';
      } else {
        doll.battle.skill.effects[1].target = 'none';
        doll.battle.skill.effects[2].modifySkill = 'none';
      }
      break;
    }
  }

  //stechkinmod
  if (doll.id == 330) {
    //StechkinMod
    if (doll.equip1 == 99) {
      doll.battle.skill.effects[0].stat.fp = 4;
    }
  }

  if (doll.id == 332) {
    doll.battle.skill.effects[1].stacks = enemyCount;
    doll.battle.skill.effects[1].stacksToAdd = enemyCount;
  }
}

function initDollsForBattle() {
  for (let i = 0; i < 5; i++) {
    let doll = echelon[i];

    graphData.y.push({});
    graphData.y[i].name = doll.name;
    graphData.y[i].color = graphColors[i];
    graphData.y[i].data = [];
    graphData.y[i].data.push(0);

    if (doll.id == -1) {
      continue;
    }

    doll.battle = {};
    doll.shots = {};
    doll.shots.total = 0;
    doll.shots.hits = 0;
    doll.shots.misses = 0;
    doll.battle.fp = doll.pre_battle.fp;
    doll.battle.acc = doll.pre_battle.acc;
    doll.battle.eva = doll.pre_battle.eva;
    doll.battle.rof = doll.pre_battle.rof;
    doll.battle.crit = doll.pre_battle.crit;
    doll.battle.critdmg = doll.pre_battle.critdmg;
    doll.battle.rounds = doll.pre_battle.rounds;
    doll.battle.currentRounds = doll.battle.rounds;
    doll.battle.armor = doll.pre_battle.armor;
    doll.battle.ap = doll.pre_battle.ap;
    doll.battle.skillcd = 1 - doll.pre_battle.skillcd / 100;
    if (doll.type == 6) {
      doll.battle.targets = doll.targets;
    }
    if ('frames_per_attack' in doll) {
      doll.battle.frames_per_attack = doll.frames_per_attack;
    }
    doll.battle.busylinks = 0;
    doll.battle.skill = $.extend(true, {}, doll.skill);
    doll.battle.skill.effects = getUsableSkillEffects(doll.battle.skill.effects);
    doll.battle.skillbonus = {
      fp: 1,
      acc: 1,
      eva: 1,
      rof: 1,
      crit: 1,
      critdmg: 1,
      rounds: 0,
      armor: 1,
      ap: 1,
      skillcd: 1
    };
    doll.battle.maxstats = {
      fp: doll.pre_battle.fp,
      acc: doll.pre_battle.acc,
      eva: doll.pre_battle.eva,
      rof: getCapRoF(doll, doll.pre_battle.rof),
      rof_uncapped: doll.pre_battle.rof,
      crit: getCapCrit(doll, doll.pre_battle.crit),
      crit_uncapped: doll.pre_battle.crit,
      critdmg: doll.pre_battle.critdmg,
      rounds: doll.pre_battle.rounds,
      armor: doll.pre_battle.armor,
      ap: doll.pre_battle.ap
    };
    doll.battle.minstats = {
      fp: doll.pre_battle.fp,
      acc: doll.pre_battle.acc,
      eva: doll.pre_battle.eva,
      rof: getCapRoF(doll, doll.pre_battle.rof),
      rof_uncapped: doll.pre_battle.rof,
      crit: getCapCrit(doll, doll.pre_battle.crit),
      crit_uncapped: doll.pre_battle.crit,
      critdmg: doll.pre_battle.critdmg,
      rounds: doll.pre_battle.rounds,
      armor: doll.pre_battle.armor,
      ap: doll.pre_battle.ap
    };
    doll.battle.skilldamage = 0;

    if ('passives' in doll) {
      doll.battle.passives = JSON.parse(JSON.stringify(doll.passives));
      $.each(doll.battle.passives, (index, passive) => {
        if ('interval' in passive) {
          passive.startTime = 1;
        }
        passive.level = 'skill2passive' in passive ? doll.skill2level : doll.skilllevel;
        passive.effects = getUsableSkillEffects(passive.effects);
        $.each(passive.effects, (j, effect) => {
          effect.level = passive.level;
        });
      });
    } else {
      doll.battle.passives = [];
    }
    doll.battle.numAttacks = 1;
    doll.battle.buffs = [];
    doll.battle.effect_queue = [];
    doll.battle.action_queue = [];
    doll.battle.timers = [];

    let normalAttackTimer = {
      type: 'normalAttack',
      timeLeft: 0
    };
    normalAttackTimer.timeLeft = 'frames_per_attack' in doll.battle ? doll.battle.frames_per_attack : Math.floor(50 * 30 / doll.battle.rof);
    doll.battle.timers.push(normalAttackTimer);

    let skillTimer = {
      type: 'skill',
      timeLeft: Math.round(doll.battle.skill.icd * 30 * (1 - doll.pre_battle.skillcd / 100))
    };
    if (doll.useSkill) {
      doll.battle.timers.push(skillTimer);
    }

    if (doll.mod) {
      doll.battle.skill2 = $.extend(true, {}, doll.skill2);
      doll.battle.skill2.effects = getUsableSkillEffects(doll.battle.skill2.effects);
      let skill2Timer = {
        type: 'skill2',
        timeLeft: Math.round(doll.battle.skill2.icd * 30 * (1 - doll.pre_battle.skillcd / 100))
      };
      if (doll.useSkill) {
        doll.battle.timers.push(skill2Timer);
      }
    }
  }

  for (let i = 0; i < 5; i++) {
    preBattleSkillChanges(echelon[i]);
  }
}

function initEnemyForBattle() {
  let enemy = {
    count: enemyCount,
    eva: enemyEva,
    armor: enemyArmor,
    fp: 0,
    acc: 0,
    rof: 0,
    crit: 0,
    critdmg: 0,
    rounds: 0,
    ap: 0,
    movespeed: 0,
    skillcd: 0,
    vulnerability: 1,
    battle: {
      eva: enemyEva,
      armor: enemyArmor,
      vulnerability: 1,
      skillbonus: {
        eva: 1,
        armor: 1,
        vulnerability: 1,
      },
      buffs: [],
      passives:[]
    }
  };

  return enemy;
}

function initiFairyForBattle() {
  graphData.y.push({});
  graphData.y[5].name = fairy.name;
  graphData.y[5].color = graphColors[5];
  graphData.y[5].data = [];
  graphData.y[5].data.push(0);

  if (fairy.id == -1) {
    return;
  }

  fairy.battle = {};
  fairy.battle.skill = $.extend(true, {}, fairy.skill);
  fairy.battle.timers = [];
  fairy.battle.effect_queue = [];
  fairy.battle.action_queue = [];

  let skilltimer = {
    type: 'skill',
    timeLeft: fairy.battle.skill.icd == 0 ? 1 : Math.round(fairy.battle.skill.icd * 30)
  };
  if (fairy.useSkill && fairy.id != 14) {
    fairy.battle.timers.push(skilltimer);
  }
}

function simulateBattle() {
  graphData = { x: [], y: [] };

  initDollsForBattle();
  let enemy = initEnemyForBattle();
  initiFairyForBattle();
  let simulationLength = 30 * battleLength;
  let totaldamage8s = 0;
  let totaldamage12s = 0;
  let totaldamage20s = 0;

  //apply fairy talent effect to dolls
  if (fairy.id != -1) {
    let talenteffect = $.extend(true, {}, fairy.talent.effect);
    talenteffect.level = fairy.rarity;
    if (talenteffect.type == 'passive') {
      $.each(talenteffect.effects, (i, effect) => effect.level = fairy.rarity);
      for (let i = 0; i < 5; i++) {
        if (echelon[i].id != -1) {
          talenteffect.startTime = 1;
          echelon[i].battle.passives.push($.extend(true, {}, talenteffect));
        }
      }
      if (fairy.talent.id == 17) { //fervor
        let initialFervorStack = {
          type: 'buff',
          target: 'all',
          stat: {
            fp: 10
          },
          duration: -1,
          name: 'fairytalent',
          stackable: true,
          stacks: 1,
          max_stacks: 3
        };
        activateBuff(fairy, initialFervorStack, enemy);
      }
    } else if (talenteffect.type == 'buff') {
      activateBuff(fairy, $.extend(true, {}, talenteffect), enemy);
    }
  }

  //apply fortress node effect
  if (useFortressNode) {
    if (fairy.id != 24 || (fairy.id == 24 && !fairy.useSkill)) { //sue skill overrides fortress node
      for (let i = 0; i < 5; i++) {
        if (echelon[i].id != -1) {
          let fortressbuff = $.extend(true, {}, fairyData[13].skill.effects[0]);
          fortressbuff.level = fortressNodeLevel;
          echelon[i].battle.buffs.push(fortressbuff);
        }
      }
    }
  }


  //walk time
  graphData.x.push(0);
  let time = 0;
  for (time = 1; time < walkTime * 30; time++) {
    graphData.x.push(parseFloat((time / 30.0).toFixed(2)));

    if (fairy.id != -1) {
      graphData.y[5].data.push(graphData.y[5].data[time - 1]);
      $.each(fairy.battle.timers, (index, timer) => {
        if (timer.timeLeft > 1) {
          timer.timeLeft--;
        }
      });
    }

    for (let i = 0; i < 5; i++) {
      graphData.y[i].data.push(graphData.y[i].data[time - 1]);
      let doll = echelon[i];
      if (doll.id == -1) continue;

      $.each(doll.battle.timers, (index, timer) => {
        if (timer.timeLeft > 1) { // && timer.type != 'normalAttack' ??? need to check this assumption
          timer.timeLeft--;
        }
      });

      //tick and remove buffs
      $.each(doll.battle.buffs, (index, buff) => {
        if ('timeLeft' in buff) {
          buff.timeLeft--;
        }
      });
      doll.battle.buffs = doll.battle.buffs.filter(buff => {
        if ('timeLeft' in buff) {
          if (buff.timeLeft == 0) {
            if ('after' in buff) {
              if ($.isArray(buff.after)) {
                $.each(buff.after, (index, effect) => {
                  if (!('level' in effect))
                    effect.level = buff.level;
                  doll.battle.effect_queue.push($.extend(true, {}, effect));
                });
              } else {
                if (!('level' in buff.after))
                  buff.after.level = buff.level;
                doll.battle.effect_queue.push($.extend(true, {}, buff.after));
              }
            }
            return false;
          }
        }
        return true;
      });

      //tick and remove passives
      $.each(doll.battle.passives, (index, passive) => {
        if ('timeLeft' in passive) {
          passive.timeLeft--;
        }
      });
      doll.battle.passives = doll.battle.passives.filter(passive => {
        if ('timeLeft' in passive) {
          if (passive.timeLeft == 0) {
            return false;
          }
        }
        return true;
      });

      //tick and trigger time-based passives
      $.each(doll.battle.passives.filter(passive => 'interval' in passive), (index, passiveskill) => {
        let interval = $.isArray(passiveskill.interval) ? passiveskill.interval[passiveskill.level - 1] : passiveskill.interval;
        if ((time - passiveskill.startTime) % Math.floor(interval * 30) == 0 && time != 1 && interval != -1) {
          triggerPassive('time', doll, enemy);
        }
      });

      calculateSkillBonus(i);
      calculateBattleStats(i);
    }
  }



  graphData.x.push((time / 30.0).toFixed(2));
  let currentFrame = time;
  for (currentFrame = time; currentFrame < simulationLength; currentFrame++) {
    graphData.x.push(parseFloat((currentFrame / 30.0).toFixed(2)));

    //tick timers, queue actions
    for (let i = 0; i < 5; i++) {
      let doll = echelon[i];
      if (doll.id == -1) continue;

      graphData.y[i].data.push(graphData.y[i].data[currentFrame - 1]);

      $.each(doll.battle.timers, (index, timer) => {
        if (timer.type == 'normalAttack') {
          let reloading = doll.battle.timers.find(timer => timer.type == 'reload') === undefined ? false : true;
          let stunned = doll.battle.buffs.find(b => 'stun' in b) === undefined ? false : true;
          if (doll.links - doll.battle.busylinks > 0 && !reloading && !stunned) {
            timer.timeLeft--;
          }
        } else {
          if (timer.timeLeft > 0)
            timer.timeLeft--;
        }
      });

      $.each(doll.battle.timers, (index, timer) => {
        if (timer.timeLeft == 0) {
          let reloading = doll.battle.timers.find(timer => timer.type == 'reload') === undefined ? false : true;
          let stunned = doll.battle.buffs.find(b => 'stun' in b) === undefined ? false : true;
          if (timer.type == 'skill') {
            if (stunned || (reloading && doll.battle.timers.find(timer => timer.type == 'reload').timeLeft != 0)) {
              timer.timeLeft++;
            } else {
              $.each(doll.battle.skill.effects, (index, effect) => {
                if (!('level' in effect)) {
                  effect.level = doll.skilllevel;
                }
                if (effect.type == 'loadRounds') {
                  let targets = getBuffTargets(doll, effect, enemy);
                  $.each(targets, (index, target) => {
                    target.battle.currentRounds += $.isArray(effect.rounds) ? effect.rounds[effect.level - 1] : effect.rounds;
                  });
                } else {
                  doll.battle.effect_queue.push($.extend({}, effect));
                }
              });
              timer.timeLeft = Math.round(doll.battle.skill.cd[doll.skilllevel - 1] * 30 * doll.battle.skillcd);
            }
          } else if (timer.type == 'skill2') {
            if (stunned || (reloading && doll.battle.timers.find(timer => timer.type == 'reload').timeLeft != 0)) {
              timer.timeLeft++;
            } else {
              $.each(doll.battle.skill2.effects, (index, effect) => {
                if (!('level' in effect)) {
                  effect.level = doll.skill2level;
                }
                if (effect.type == 'loadRounds') {
                  let targets = getBuffTargets(doll, effect, enemy);
                  $.each(targets, (index, target) => {
                    target.battle.currentRounds += $.isArray(effect.rounds) ? effect.rounds[effect.level - 1] : effect.rounds;
                  });
                } else {
                  doll.battle.effect_queue.push($.extend({}, effect));
                }
              });
              timer.timeLeft = Math.round(doll.battle.skill2.cd[doll.skill2level - 1] * 30 * doll.battle.skillcd);
            }
          } else {
            doll.battle.effect_queue.push($.extend({}, timer));
          }
        }
      });

      doll.battle.timers = doll.battle.timers.filter(timer => timer.timeLeft != 0); //remove expired timers

      //tick and remove buffs
      $.each(doll.battle.buffs, (index, buff) => {
        if ('timeLeft' in buff) {
          buff.timeLeft--;
        }
      });
      doll.battle.buffs = doll.battle.buffs.filter(buff => {
        if ('timeLeft' in buff) {
          if (buff.timeLeft == 0) {
            if ('after' in buff) {
              if ($.isArray(buff.after)) {
                $.each(buff.after, (index, effect) => {
                  if (!('level' in effect))
                    effect.level = buff.level;
                  doll.battle.effect_queue.push($.extend(true, {}, effect));
                });
              } else {
                if (!('level' in buff.after))
                  buff.after.level = buff.level;
                doll.battle.effect_queue.push($.extend(true, {}, buff.after));
              }
            }
            return false;
          }
        }
        return true;
      });

      //tick and remove passives
      $.each(doll.battle.passives, (index, passive) => {
        if ('timeLeft' in passive) {
          passive.timeLeft--;
        }
      });
      doll.battle.passives = doll.battle.passives.filter(passive => {
        if ('timeLeft' in passive) {
          if (passive.timeLeft == 0) {
            return false;
          }
        }
        return true;
      });

      //tick and trigger time-based passives
      $.each(doll.battle.passives.filter(passive => 'interval' in passive), (index, passiveskill) => {
        let interval = $.isArray(passiveskill.interval) ? passiveskill.interval[passiveskill.level - 1] : passiveskill.interval;
        if ((currentFrame - passiveskill.startTime) % Math.floor(interval * 30) == 0 && currentFrame != 1 && interval != -1) {
          triggerPassive('time', doll, enemy);
        }
      });
    }

    //tick fairy skill timer
    if (fairy.id != -1) {
      graphData.y[5].data.push(graphData.y[5].data[currentFrame - 1]);
      $.each(fairy.battle.timers, (index, timer) => timer.timeLeft--);
      $.each(fairy.battle.timers, (index, timer) => {
        if (timer.timeLeft == 0) {
          if (timer.type == 'skill') {
            $.each(fairy.battle.skill.effects, (i, effect) => {
              effect.level = fairy.skilllevel;
              fairy.battle.effect_queue.push(effect);
            });
            timer.timeLeft = Math.round(fairy.battle.skill.cd * 30);
          }
        }
      });
      fairy.battle.timers = fairy.battle.timers.filter(timer => timer.timeLeft != 0);
    }

    //tick/remove enemy buffs
    $.each(enemy.battle.buffs, (index, buff) => {
      if ('timeLeft' in buff) {
        buff.timeLeft--;
      }
    });
    enemy.battle.buffs = enemy.battle.buffs.filter(buff => {
      if ('timeLeft' in buff) {
        if (buff.timeLeft == 0) {
          return false;
        }
      }
      return true;
    });


    //apply buffs, handle effects that aren't actions
    for (let i = 0; i < 5; i++) {
      let doll = echelon[i];
      if (doll.id == -1) continue;

      let len = doll.battle.effect_queue.length;
      for (let j = 0; j < len; j++) {
        let action = doll.battle.effect_queue.shift();

        if (action.type == 'buff') {
          activateBuff(doll, action, enemy);
        } else if (action.type == 'passive') {
          addPassive(doll, action, enemy, currentFrame);
        } else if (action.type == 'removeBuff') {
          removeBuff(doll, action, enemy);
        } else if (action.type == 'removePassive') {
          removePassive(doll, action, enemy);
        } else if (action.type == 'modifySkill') {
          modifySkill(doll, action, enemy, currentFrame);
        } else {
          if ('delay' in action) {
            action.timeLeft = $.isArray(action.delay) ? Math.round(action.delay[action.level - 1] * 30) : Math.round(action.delay * 30) + 1;
          }
          if ('busylinks' in action) {
            doll.battle.busylinks += Math.min(action.busylinks, doll.links);
          }
          if ('duration' in action) {
            action.timeLeft = $.isArray(action.duration) ? Math.round(action.duration[action.level - 1] * 30) : Math.round(action.duration * 30);
          }
          doll.battle.action_queue.push(action);
        }
      }
    }

    if (fairy.id != -1) {
      let len = fairy.battle.effect_queue.length;
      for (let j = 0; j < len; j++) {
        let action = fairy.battle.effect_queue.shift();

        if (action.type == 'buff') {
          activateBuff(fairy, action, enemy);
        } else {
          fairy.battle.action_queue.push(action);
        }
      }
    }

    //recalculate stats to include all buffs
    for (let i = 0; i < 5; i++) {
      if (echelon[i].id != -1) {
        calculateSkillBonus(i);
        calculateBattleStats(i);
      }
    }
    calculateEnemyStats(enemy);


    //perform actions
    for (let i = 0; i < 5; i++) {
      let doll = echelon[i];
      if (doll.id == -1) continue;

      let dmg = 0;

      let len = doll.battle.action_queue.length;
      for (let j = 0; j < len; j++) {
        let action = doll.battle.action_queue.shift();

        if (action.type == 'normalAttack') {
          let attackBuff = doll.battle.buffs.find(buff => buff.name == 'normalAttackBuff');
          // Handle Stella
          let shotmultiplier = doll.id == 294 ? 2 : 1;

          if (attackBuff !== undefined) {
            let canCrit = 'canCrit' in attackBuff ? attackBuff.canCrit : true;
            let sureCrit = 'sureCrit' in attackBuff ? attackBuff.sureCrit : false;
            let sureHit = 'sureHit' in attackBuff ? attackBuff.sureHit : false;
            let piercing = 'piercing' in attackBuff ? attackBuff.piercing : false;

            let multiplier = 1;
            if ('multiplier' in attackBuff) {
              multiplier = $.isArray(attackBuff.multiplier) ? attackBuff.multiplier[attackBuff.level - 1] : attackBuff.multiplier;
            }
            dmg = Math.max(shotmultiplier, doll.battle.fp * multiplier + shotmultiplier * Math.min(2, doll.battle.ap - enemy.battle.armor));

            if (!sureHit) {
              dmg *= (doll.battle.acc / (doll.battle.acc + enemy.battle.eva));
            }
            if (canCrit) {
              let critdmg = doll.battle.critdmg;
              if ('extraCritDamage' in attackBuff) {
                critdmg += $.isArray(attackBuff.extraCritDamage) ? attackBuff.extraCritDamage[attackBuff.level - 1] : attackBuff.extraCritDamage;
              }
              dmg *= sureCrit ? (1 + (critdmg / 100)) : (1 + critdmg / 100) * (doll.battle.crit / 100) + (1 - doll.battle.crit / 100);
            }
            dmg *= enemy.battle.vulnerability;
            dmg *= doll.links - doll.battle.busylinks;

            let hitCount = 1;
            if ('hitCount' in attackBuff) {
              hitCount = $.isArray(attackBuff.hitCount) ? attackBuff.hitCount[attackBuff.level - 1] : attackBuff.hitCount;
            }
            dmg *= hitCount;

            doll.shots.hits += Math.floor ((doll.links - doll.battle.busylinks) * hitCount * shotmultiplier * (doll.battle.acc / (doll.battle.acc + enemy.battle.eva)));
            doll.shots.total += Math.floor((doll.links - doll.battle.busylinks) * hitCount * shotmultiplier);

            if (doll.type == 6) { //sg
              if (('targets' in attackBuff) && (!doll.hasSlug)) {
                dmg = dmg * Math.min(attackBuff.targets, enemy.count);
              } else {
                dmg = dmg * Math.min(doll.battle.targets, enemy.count);
              }
            }

            if ('aoe' in attackBuff) {
              let damage = Math.max(1, doll.battle.fp + Math.min(2, doll.battle.ap - enemy.battle.armor));
              // damage *= (doll.battle.acc / (doll.battle.acc + enemy.battle.eva));
              if ('aoe_multiplier' in attackBuff) {
                damage *= $.isArray(attackBuff.aoe_multiplier) ? attackBuff.aoe_multiplier[attackBuff.level - 1] : attackBuff.aoe_multiplier;
              }

              let aoe_sureHit = 'aoe_sureHit' in attackBuff ? attackBuff.aoe_sureHit : true;
              let aoe_canCrit = 'aoe_canCrit' in attackBuff ? attackBuff.aoe_canCrit : false;
              let aoe_sureCrit = 'aoe_sureCrit' in attackBuff ? attackBuff.aoe_sureCrit : false;

              if (!aoe_sureHit) {
                damage *= (doll.battle.acc / (doll.battle.acc + enemy.battle.eva));
              }

              if (aoe_canCrit) {
                if (aoe_sureCrit) {
                  damage *= 1 + (doll.battle.critdmg / 100);
                } else {
                  damage *= 1 + (doll.battle.critdmg * (doll.battle.crit / 100) / 100);
                }
              }


              damage *= damageUtils.getNumEnemyLinksHit(attackBuff.aoe_radius, enemy.count, isBoss);

              dmg += damage;
            }

            if (piercing) {
              //temporary solution: hit half of the enemies on the field, not including the target
              //need to decide on how to determine number of enemies hit by a piercing attack
              let piercedamage = dmg * (enemy.count - 1) / 2;
              dmg += piercedamage;
            }

            if ('modifySkill' in attackBuff) {
              modifySkill(doll, attackBuff, enemy, currentFrame);
            }
          } else {

            dmg = Math.max(shotmultiplier, doll.battle.fp + shotmultiplier * Math.min(2, doll.battle.ap - enemy.battle.armor));
            dmg *= (doll.battle.acc / (doll.battle.acc + enemy.battle.eva));
            dmg *= 1 + (doll.battle.critdmg * (doll.battle.crit / 100) / 100);
            dmg *= enemy.battle.vulnerability;
            dmg *= doll.links - doll.battle.busylinks;
            if (doll.type == 6) { //sg
              dmg = dmg * Math.min(doll.battle.targets, enemy.count);
            }
            doll.shots.hits += Math.floor ((doll.links - doll.battle.busylinks) * shotmultiplier * (doll.battle.acc / (doll.battle.acc + enemy.battle.eva)));
            doll.shots.total += Math.floor((doll.links - doll.battle.busylinks) * shotmultiplier);
          }

          //handle pkp
          let extradmg = 0;
          let afterAttack = doll.battle.passives.find(passive => passive.trigger == 'afterAttack');
          if (afterAttack !== undefined) {
            let extraAttack = afterAttack.effects[0];
            let canCrit = 'canCrit' in extraAttack ? extraAttack.canCrit : true;
            let sureCrit = 'sureCrit' in extraAttack ? extraAttack.sureCrit : false;
            let sureHit = 'sureHit' in extraAttack ? extraAttack.sureHit : false;

            let extraAttackFP = doll.battle.fp;
            if ('multiplier' in extraAttack) {
              extraAttackFP *= $.isArray(extraAttack.multiplier) ? extraAttack.multiplier[extraAttack.level - 1] : extraAttack.multiplier;
            }
            extradmg = Math.max(1, extraAttackFP + Math.min(2, doll.battle.ap - enemy.battle.armor));

            /* pretty sure the multiplier for all skills are applied to fp directly
            if ('multiplier' in extraAttack) {
              extradmg *= $.isArray(extraAttack.multiplier) ? extraAttack.multiplier[extraAttack.level - 1] : extraAttack.multiplier;
            }
            */

            extradmg *= !sureHit ? (doll.battle.acc / (doll.battle.acc + enemy.battle.eva)) : 1;
            if (canCrit) {
              extradmg *= sureCrit ? (1 + (doll.battle.critdmg / 100)) : 1 + (doll.battle.critdmg * (doll.battle.crit / 100) / 100);
            }

            let extrashots = 1;
            let extratotalshots = 1;
            if ('hitCount' in extraAttack) {
              extradmg *= $.isArray(extraAttack.hitCount) ? extraAttack.hitCount[extraAttack.level - 1] : extraAttack.hitCount;
              extrashots *= $.isArray(extraAttack.hitCount) ? extraAttack.hitCount[extraAttack.level - 1] : extraAttack.hitCount;
              extratotalshots *= $.isArray(extraAttack.hitCount) ? extraAttack.hitCount[extraAttack.level - 1] : extraAttack.hitCount;
            }

            extrashots *= sureHit? doll.links - doll.battle.busylinks :  Math.floor ((doll.links - doll.battle.busylinks) * (doll.battle.acc / (doll.battle.acc + enemy.battle.eva)));
            extratotalshots = doll.links - doll.battle.busylinks;

            if ('extraAttackChance' in extraAttack) {
              extrashots *= extraAttack.extraAttackChance[extraAttack.level - 1] / 100;
            }
            doll.shots.hits += Math.floor(extrashots);
            doll.shots.total += extratotalshots;

            extradmg *= enemy.battle.vulnerability;
            extradmg *= doll.links - doll.battle.busylinks;
            extradmg *= 'extraAttackChance' in extraAttack ? extraAttack.extraAttackChance[extraAttack.level - 1] / 100 : 1;
          }
          dmg += extradmg;

          if (doll.battle.rounds > 0) {
            doll.battle.currentRounds--;

            if (doll.battle.currentRounds == 1) {
              triggerPassive('lastShot', doll, enemy);
            }
            if (doll.battle.currentRounds == 0) {
              triggerPassive('outOfAmmo', doll, enemy);
            }

            if (doll.battle.currentRounds == 0 && doll.battle.buffs.find(buff => buff.name == 'ARmode') == undefined) {
              let reloadTimer = {
                type: 'reload',
                timeLeft: 0
              };
              if (doll.type == 5) {
                //mg reload formula
                reloadTimer.timeLeft = Math.floor(30 * (4 + 200 / doll.battle.rof));
              } else if (doll.type == 6) {
                //sg reload formula
                reloadTimer.timeLeft = Math.floor(30 * (1.4 + 0.5 * doll.battle.rounds));
              } else {
                //falcon reload formula
                reloadTimer.timeLeft = Math.floor(30 * (120 / (doll.battle.rof + 10))) + 30;
              }

              let reloadBuff = doll.battle.buffs.find(buff => buff.name == 'reloadBuff');
              if (reloadBuff !== undefined) {
                if ('fixedTime' in reloadBuff) {
                  reloadTimer.timeLeft += $.isArray(reloadBuff.fixedTime) ? Math.floor(reloadBuff.fixedTime[reloadBuff.level - 1] * 30) : Math.floor(30 * reloadBuff.fixedTime);
                }
                if ('multiplier' in reloadBuff) {
                  if ('stackable' in reloadBuff) {
                    reloadTimer.timeLeft *= $.isArray(reloadBuff.multiplier) ? Math.pow((reloadBuff.multiplier[reloadBuff.level - 1] / 100 + 1), reloadBuff.stacks) : Math.pow(reloadBuff.multiplier / 100 + 1, reloadBuff.stacks);
                  } else {
                    reloadTimer.timeLeft *= $.isArray(reloadBuff.multiplier) ? ((reloadBuff.multiplier[reloadBuff.level - 1]) / 100) + 1 : (reloadBuff.multiplier / 100) + 1;
                  }
                }

                if ('setTime' in reloadBuff) {
                  reloadTimer.timeLeft = $.isArray(reloadBuff.setTime) ? Math.floor(reloadBuff.setTime[reloadBuff.level - 1] * 30) : Math.floor(30 * reloadBuff.setTime);
                }

                if ('uses' in reloadBuff) {
                  reloadBuff.uses--;
                  if (reloadBuff.uses == 0) {
                    reloadBuff.timeLeft = 1;
                  }
                }

                reloadTimer.timeLeft = Math.floor(reloadTimer.timeLeft);
              }
              if (reloadTimer.timeLeft != 0) {
                doll.battle.timers.push(reloadTimer);
                triggerPassive('reloadStart', doll, enemy);
              } else {
                doll.battle.currentRounds += doll.battle.rounds;
              }
            }
          }

          // TODO: add check for reloadtimer. if exists, do not add normalattacktimer <- why???
          let normalAttackTimer = {
            type: 'normalAttack',
            timeLeft: 0
          };
          normalAttackTimer.timeLeft = 'frames_per_attack' in doll.battle ? doll.battle.frames_per_attack : Math.floor(50 * 30 / doll.battle.rof);
          if (doll.battle.buffs.find(buff => buff.name == 'ARmode') !== undefined) {
            normalAttackTimer.timeLeft = Math.floor(50 * 30 / doll.battle.rof);
          }
          if (doll.battle.buffs.find(buff => buff.name == 'sweep') !== undefined) {
            normalAttackTimer.timeLeft = 10;
          }
          doll.battle.timers.push(normalAttackTimer);

          doll.battle.numAttacks++;


          let limitedAttackBuffs = doll.battle.buffs.filter(buff => 'attacksLeft' in buff);
          $.each(limitedAttackBuffs, (index, buff) => buff.attacksLeft--);
          doll.battle.buffs = doll.battle.buffs.filter(buff => {
            if ('attacksLeft' in buff) {
              if (buff.attacksLeft == 0) {
                return false;
              }
            }
            return true;
          });

          let limitedAttackPassives = doll.battle.passives.filter(passive => 'attacksLeft' in passive);
          $.each(limitedAttackPassives, (index, passive) => passive.attacksLeft--);
          doll.battle.passives = doll.battle.passives.filter(passive => {
            if ('attacksLeft' in passive) {
              if (passive.attacksLeft == 0) {
                return false;
              }
            }
            return true;
          });

          triggerPassive('normalAttack', doll, enemy);

          $.each(doll.battle.passives.filter(p => p.trigger == 'everyXhits'), (index, passive) => {
            let hits = $.isArray(passive.hits) ? passive.hits[passive.level - 1] : passive.hits;
            if (doll.battle.numAttacks % hits == 0 && hits != -1) {
              triggerPassive('everyXhits', doll, enemy);
            }
          });


          if (currentFrame <= 30 * 8 + 1) {
            totaldamage8s += dmg;
          }
          if (currentFrame <= 30 * 12 + 1) {
            totaldamage12s += dmg;
          }
          if (currentFrame <= 30 * 20 + 1) {
            totaldamage20s += dmg;
          }
          graphData.y[i].data[currentFrame] += Math.round(dmg);
        }

        if (action.type == 'reload') {
          doll.battle.currentRounds += doll.battle.rounds;

          //apparently the counter for terminating barrage MGs resets when they reload
          doll.battle.numAttacks = 1;

          triggerPassive('reload', doll, enemy);
          //add normalAttackTimer here
        }

        if (action.type == 'grenade') {
          if ('delay' in action) {
            if (action.timeLeft != 0) {
              action.timeLeft--;
              doll.battle.action_queue.push(action);
              continue;
            }
          }

          let sureHit = 'sureHit' in action ? action.sureHit : true;
          let canCrit = 'canCrit' in action ? action.canCrit : false;
          let ignoreArmor = 'ignoreArmor' in action ? action.ignoreArmor : true;

          if (!('multiplier' in action)) {
            dmg = doll.battle.fp;
          } else {
            dmg = $.isArray(action.multiplier) ? doll.battle.fp * action.multiplier[action.level - 1] : doll.battle.fp * action.multiplier;
          }
          if (!ignoreArmor) {
            dmg = Math.max(1, dmg + Math.min(2, doll.battle.ap - enemy.battle.armor));
          }
          if (!sureHit) {
            dmg *= (doll.battle.acc / (doll.battle.acc + enemy.battle.eva));
          }
          if (canCrit) {
            dmg *= damageUtils.getExpectedCritDamageMultiplier(doll, action);
          }

          dmg *= enemy.battle.vulnerability;

          dmg *= damageUtils.getNumEnemyLinksHit(action.radius, enemy.count, isBoss);

          if (enemy.count >= 3) {
            triggerPassive('hit3ormore', doll, enemy);
          } else {
            triggerPassive('hitlessthanthree', doll, enemy);
          }

          // maybe a custom skill control for choosing how many nades overlap
          // would be better
          if (doll.id == 229) {
            //k11
            if (isBoss) {
              // Overlapping nades deal 6x instead of 4x, 50% boost
              let additionalDmg = dmg * (doll.links - 1) * 0.5;
              dmg = dmg * doll.links + additionalDmg;
            } else {
              dmg *= doll.links;
            }
          }

          doll.battle.busylinks -= Math.min(action.busylinks, doll.links);

          if ('after' in action) {
            if ($.isArray(action.after)) {
              $.each(action.after, (index, effect) => {
                effect.level = action.level;
                doll.battle.effect_queue.push(effect);
              });
            } else {
              action.after.level = action.level;
              doll.battle.effect_queue.push(action.after);
            }
          }

          doll.battle.skilldamage += Math.round(dmg);

          if (currentFrame <= 30 * 8 + 1) {
            totaldamage8s += dmg;
          }
          if (currentFrame <= 30 * 12 + 1) {
            totaldamage12s += dmg;
          }
          if (currentFrame <= 30 * 20 + 1) {
            totaldamage20s += dmg;
          }
          graphData.y[i].data[currentFrame] += Math.round(dmg);
        }

        if (action.type == 'grenadedot') {
          action.timeLeft--;

          if (action.timeLeft % action.tick == 0) {
            dmg = $.isArray(action.multiplier) ? doll.battle.fp * action.multiplier[action.level - 1] : doll.battle.fp * action.multiplier;
            //grenades ignore Armor
            //grenades cant miss
            //grenades cant crit
            dmg *= enemy.battle.vulnerability;

            if ('fixedDamage' in action) {
              dmg = $.isArray(action.fixedDamage) ? action.fixedDamage[action.level - 1] : action.fixedDamage;
            }

            dmg *= damageUtils.getNumEnemyLinksHit(action.radius, enemy.count, isBoss);
          }

          if (action.timeLeft != 0) {
            doll.battle.action_queue.push(action);
          }

          doll.battle.skilldamage += Math.round(dmg);

          if (currentFrame <= 30 * 8 + 1) {
            totaldamage8s += dmg;
          }
          if (currentFrame <= 30 * 12 + 1) {
            totaldamage12s += dmg;
          }
          if (currentFrame <= 30 * 20 + 1) {
            totaldamage20s += dmg;
          }
          graphData.y[i].data[currentFrame] += Math.round(dmg);
        }

        if (action.type == 'smoke' || action.type == 'stun') {
          if ('delay' in action) {
            if (action.timeLeft != 0) {
              action.timeLeft--;
              doll.battle.action_queue.push(action);
              continue;
            }
          }

          if ('after' in action) {
            if ($.isArray(action.after)) {
              $.each(action.after, (index, effect) => {
                if (!('level' in effect))
                  effect.level = action.level;
                doll.battle.effect_queue.push(effect);
              });
            } else {
              if (!('level' in action.after))
                action.after.level = action.level;
              doll.battle.effect_queue.push(action.after);
            }
          }

          doll.battle.busylinks -= Math.min(action.busylinks, doll.links);
        }

        if (action.type == 'chargedshot') {
          if (action.timeLeft != 0) {
            action.timeLeft--;
            doll.battle.action_queue.push(action);
            continue;
          }

          //unless specified, charged shots cannot miss and cannot crit and ignore armor
          let sureHit = 'sureHit' in action ? action.sureHit : true;
          let canCrit = 'canCrit' in action ? action.canCrit : false;
          let ignoreArmor = 'ignoreArmor' in action ? action.ignoreArmor : true;

          dmg = $.isArray(action.multiplier) ? doll.battle.fp * action.multiplier[action.level - 1] : doll.battle.fp * action.multiplier;
          if (!('multiplier' in action)) {
            dmg = doll.battle.fp;
          }
          if (!ignoreArmor) {
            dmg = Math.max(1, dmg + Math.min(2, doll.battle.ap - enemy.battle.armor));
          }

          if (!sureHit) {
            dmg *= (doll.battle.acc / (doll.battle.acc + enemy.battle.eva));
          }
          if (canCrit) {
            dmg *= damageUtils.getExpectedCritDamageMultiplier(doll, action);
          }
          dmg *= enemy.battle.vulnerability;
          dmg *= doll.battle.busylinks;

          doll.shots.hits += sureHit? doll.battle.busylinks : Math.floor (doll.battle.busylinks * (doll.battle.acc / (doll.battle.acc + enemy.battle.eva)));
          doll.shots.total += doll.battle.busylinks;

          if ('piercing' in action) {
            dmg *= enemy.count + 1;
          }
          if ('skillDamageBonus' in action) {
            let skillbonus = $.isArray(action.skillDamageBonus) ? 1 + (action.skillDamageBonus[action.level - 1] / 100) : 1 + (action.skillDamageBonus / 100);
            if ('victories' in action) {
              skillbonus = Math.pow(skillbonus, action.victories);
            }
            dmg *= skillbonus;
          }

          doll.battle.busylinks -= Math.min(action.busylinks, doll.links);

          if ('after' in action) {
            action.after.level = action.level;
            if (action.after.type == 'buff') {
              activateBuff(doll, action.after, enemy);
            } else {
              doll.battle.effect_queue.push(action.after);
            }
          }

          if ('modifySkill' in action) {
            modifySkill(doll, action, enemy, currentFrame);
          }

          doll.battle.skilldamage += Math.round(dmg);

          if (currentFrame <= 30 * 8 + 1) {
            totaldamage8s += dmg;
          }
          if (currentFrame <= 30 * 12 + 1) {
            totaldamage12s += dmg;
          }
          if (currentFrame <= 30 * 20 + 1) {
            totaldamage20s += dmg;
          }
          graphData.y[i].data[currentFrame] += Math.round(dmg);
        }

        if (action.type == 'burstimpact') {
          if ('delay' in action) {
            if (action.timeLeft != 0) {
              action.timeLeft--;
              doll.battle.action_queue.push(action);
              continue;
            }
          }

          let sureHit = 'sureHit' in action ? action.sureHit : true;
          let canCrit = 'canCrit' in action ? action.canCrit : true;

          dmg = $.isArray(action.multiplier) ? doll.battle.fp * action.multiplier[action.level - 1] : doll.battle.fp * action.multiplier;
          dmg = Math.max(1, dmg + Math.min(2, doll.battle.ap - enemy.battle.armor));
          if (!sureHit) {
            dmg *= (doll.battle.acc / (doll.battle.acc + enemy.battle.eva));
          }
          if (canCrit) {
            dmg *= damageUtils.getExpectedCritDamageMultiplier(doll, action);
          }
          if ('fixedDamage' in action) {
            dmg = $.isArray(action.fixedDamage) ? action.fixedDamage[action.level - 1] : action.fixedDamage;
          }
          dmg *= enemy.battle.vulnerability;

          if ('busylinks' in action) {
            dmg *= doll.battle.busylinks;
            doll.shots.hits += sureHit? doll.battle.busylinks : doll.battle.busylinks * (doll.battle.acc / (doll.battle.acc + enemy.battle.eva));
            doll.shots.total += doll.battle.busylinks;
          } else {
            dmg *= doll.links;
            doll.shots.hits += sureHit? doll.links : doll.links * (doll.battle.acc / (doll.battle.acc + enemy.battle.eva));
            doll.shots.total += doll.links;
          }

          if (!('targets' in action)) {
            dmg = dmg * Math.min(doll.battle.targets, enemy.count);
          } else {
            dmg = dmg * Math.min(action.targets, enemy.count);
          }

          if ('busylinks' in action) {
            doll.battle.busylinks -= Math.min(action.busylinks, doll.links);
          }

          if (currentFrame <= 30 * 8 + 1) {
            totaldamage8s += dmg;
          }
          if (currentFrame <= 30 * 12 + 1) {
            totaldamage12s += dmg;
          }
          if (currentFrame <= 30 * 20 + 1) {
            totaldamage20s += dmg;
          }
          graphData.y[i].data[currentFrame] += Math.round(dmg);
        }
      }
    }

    if (fairy.id != -1 && echelon.find(d => d.id != -1) !== undefined) {
      let len = fairy.battle.action_queue.length;
      let dmg = 0;
      for (let j = 0; j < len; j++) {
        let action = fairy.battle.action_queue.shift();

        if (action.type == 'chargedshot') {
          dmg = $.isArray(action.damage) ? action.damage[action.level - 1] : action.damage;
          dmg *= enemy.battle.vulnerability;

          if (currentFrame <= 30 * 8 + 1) {
            totaldamage8s += dmg;
          }
          if (currentFrame <= 30 * 12 + 1) {
            totaldamage12s += dmg;
          }
          if (currentFrame <= 30 * 20 + 1) {
            totaldamage20s += dmg;
          }
          graphData.y[5].data[currentFrame] += Math.round(dmg);
        }

        if (action.type == 'grenade') {
          dmg = $.isArray(action.damage) ? action.damage[action.level - 1] : action.damage;
          dmg *= enemy.battle.vulnerability;

          dmg *= damageUtils.getNumEnemyLinksHit(action.radius, enemy.count, isBoss);

          if (currentFrame <= 30 * 8 + 1) {
            totaldamage8s += dmg;
          }
          if (currentFrame <= 30 * 12 + 1) {
            totaldamage12s += dmg;
          }
          if (currentFrame <= 30 * 20 + 1) {
            totaldamage20s += dmg;
          }
          graphData.y[5].data[currentFrame] += Math.round(dmg);
        }

        if (action.type == 'grenadedot') {
          action.timeLeft--;

          if (action.timeLeft % action.tick == 0) {
            dmg = $.isArray(action.damage) ? action.damage[action.level - 1] : action.damage;
            dmg *= enemy.battle.vulnerability;

            dmg *= damageUtils.getNumEnemyLinksHit(action.radius, enemy.count, isBoss);
          }

          if (action.timeLeft != 0) {
            fairy.battle.action_queue.push(action);
          }

          if (currentFrame <= 30 * 8 + 1) {
            totaldamage8s += dmg;
          }
          if (currentFrame <= 30 * 12 + 1) {
            totaldamage12s += dmg;
          }
          if (currentFrame <= 30 * 20 + 1) {
            totaldamage20s += dmg;
          }
          graphData.y[5].data[currentFrame] += Math.round(dmg);
        }
      }
    }
  }

  $('#dmg-8s').text(Math.round(totaldamage8s));
  $('#dmg-12s').text(Math.round(totaldamage12s));
  $('#dmg-20s').text(Math.round(totaldamage20s));

  for (let i = 0; i < 5; i++) {
    if (echelon[i].id == -1) {
      continue;
    }

    echelon[i].totaldmg = graphData.y[i].data[currentFrame - 1];
    $('#doll' + (i + 1) + '-dmg').text(echelon[i].totaldmg);
    $('#doll' + (i + 1) + '-shots').text(echelon[i].shots.hits);
    if (echelon[i].battle.skilldamage != 0) {
      $('#doll' + (i + 1) + '-dmg').attr('data-original-title', `<b>${dollDataMap[echelon[i].id].name_skill1}:</b> ${echelon[i].battle.skilldamage}`);
    } else {
      $('#doll' + (i + 1) + '-dmg').attr('data-original-title', '');
    }
  }

  if (fairy.id != -1) {
    $('#fairy-dmg').text(graphData.y[5].data[currentFrame - 1]);
  } else {
    $('#fairy-dmg').text('-');
  }

  determineFinalStats();

  graphData.y = graphData.y.filter(v => v.name != '');
}

function calculateSkillBonus(dollIndex) {
  let doll = echelon[dollIndex];

  doll.battle.skillbonus = {
    fp: 1,
    acc: 1,
    eva: 1,
    rof: 1,
    crit: 1,
    critdmg: 1,
    rounds: 0,
    armor: 1,
    ap: 1,
    skillcd: 1
  };

  $.each(doll.battle.buffs, (index, buff) => {
    if ('stat' in buff) {
      $.each(buff.stat, (stat, amount) => {
        let bonus = 1;
        if ('stackable' in buff) {
          if (stat == 'rounds') {
            bonus = $.isArray(amount) ? amount[buff.level - 1] * buff.stacks : amount * buff.stacks;
            doll.battle.skillbonus[stat] += bonus;
          } else {
            if ('stackChance' in buff) {
              for (let i = 0; i < buff.stacks; i++) {
                bonus = $.isArray(buff.stackChance) ? buff.stackChance[buff.level - 1] / 100 : buff.stackChance / 100;
                bonus *= $.isArray(amount) ? amount[buff.level - 1] / 100 : amount / 100;
                bonus += 1;
                doll.battle.skillbonus[stat] *= bonus;
              }
            } else {
              for (let i = 0; i < buff.stacks; i++) {
                bonus = $.isArray(amount) ? amount[buff.level - 1] / 100 : amount / 100;
                bonus += 1;
                doll.battle.skillbonus[stat] *= bonus;
              }
            }
          }
        } else {
          if (stat == 'rounds') {
            doll.battle.skillbonus[stat] += $.isArray(amount) ? amount[buff.level - 1] : amount;
          } else {
            if ('stackChance' in buff) {
              bonus = $.isArray(buff.stackChance) ? buff.stackChance[buff.level - 1] / 100 : buff.stackChance / 100;
              bonus *= $.isArray(amount) ? amount[buff.level - 1] / 100 : amount / 100;
              doll.battle.skillbonus[stat] *= (bonus + 1);
            } else {
              doll.battle.skillbonus[stat] *= $.isArray(amount) ? (1 + (amount[buff.level - 1] / 100)) : (1 + (amount / 100));
            }
          }
        }
      });
    }
  });
}

function calculateBattleStats(dollIndex) {
  let doll = echelon[dollIndex];
  doll.battle.fp = doll.pre_battle.fp * doll.battle.skillbonus.fp;
  doll.battle.acc = Math.floor(doll.pre_battle.acc * doll.battle.skillbonus.acc);
  doll.battle.eva = Math.floor(doll.pre_battle.eva * doll.battle.skillbonus.eva);
  doll.battle.rof = Math.floor(doll.pre_battle.rof * doll.battle.skillbonus.rof);
  doll.battle.rof_uncapped = doll.battle.rof;
  doll.battle.crit = doll.pre_battle.crit * doll.battle.skillbonus.crit;
  doll.battle.crit_uncapped = doll.battle.crit;
  doll.battle.critdmg = Math.floor(((doll.pre_battle.critdmg + 100) * doll.battle.skillbonus.critdmg) - 100);
  doll.battle.armor = Math.floor(doll.pre_battle.armor * doll.battle.skillbonus.armor);
  doll.battle.rounds = Math.floor(doll.pre_battle.rounds + doll.battle.skillbonus.rounds);
  doll.battle.ap = Math.floor(doll.pre_battle.ap * doll.battle.skillbonus.ap);
  doll.battle.skillcd = (1 - doll.pre_battle.skillcd / 100) * doll.battle.skillbonus.skillcd;

  //cap stats
  doll.battle.fp = Math.max(0, doll.battle.fp);
  doll.battle.eva = Math.max(0, doll.battle.eva);
  doll.battle.crit = getCapCrit(doll, doll.battle.crit);
  doll.battle.critdmg = Math.max(0, doll.battle.critdmg);
  doll.battle.ap = Math.max(0, doll.battle.ap);
  doll.battle.armor = Math.max(0, doll.battle.armor);
  doll.battle.acc = Math.max(1, doll.battle.acc);
  // if (doll.type == 6) { //sg
  //   doll.battle.rof = Math.min(60, Math.max(15, doll.battle.rof));
  // } else if (doll.type == 5) { //mg
  //   doll.battle.rof = Math.min(1000, Math.max(1, doll.battle.rof));
  // } else { //hg,rf,ar,smg
  //   doll.battle.rof = Math.min(120, Math.max(15, doll.battle.rof));
  // }

  // cap RoF properly
  doll.battle.rof = getCapRoF(doll, doll.battle.rof);

  //track max stats
  doll.battle.maxstats.fp = Math.max(doll.battle.maxstats.fp, doll.battle.fp);
  doll.battle.maxstats.acc = Math.max(doll.battle.maxstats.acc, doll.battle.acc);
  doll.battle.maxstats.eva = Math.max(doll.battle.maxstats.eva, doll.battle.eva);
  doll.battle.maxstats.rof = Math.max(doll.battle.maxstats.rof, doll.battle.rof);
  doll.battle.maxstats.rof_uncapped = Math.max(doll.battle.maxstats.rof_uncapped, doll.battle.rof_uncapped);
  doll.battle.maxstats.crit = Math.max(doll.battle.maxstats.crit, doll.battle.crit);
  doll.battle.maxstats.crit_uncapped = Math.max(doll.battle.maxstats.crit_uncapped, doll.battle.crit_uncapped);
  doll.battle.maxstats.critdmg = Math.max(doll.battle.maxstats.critdmg, doll.battle.critdmg);
  doll.battle.maxstats.rounds = Math.max(doll.battle.currentRounds, Math.max(doll.battle.maxstats.rounds, doll.battle.rounds));
  doll.battle.maxstats.armor = Math.max(doll.battle.maxstats.armor, doll.battle.armor);
  doll.battle.maxstats.ap = Math.max(doll.battle.maxstats.ap, doll.battle.ap);

  //track min stats
  doll.battle.minstats.fp = Math.min(doll.battle.minstats.fp, doll.battle.fp);
  doll.battle.minstats.acc = Math.min(doll.battle.minstats.acc, doll.battle.acc);
  doll.battle.minstats.eva = Math.min(doll.battle.minstats.eva, doll.battle.eva);
  doll.battle.minstats.rof = Math.min(doll.battle.minstats.rof, doll.battle.rof);
  doll.battle.minstats.rof_uncapped = Math.min(doll.battle.minstats.rof_uncapped, doll.battle.rof_uncapped);
  doll.battle.minstats.crit = Math.min(doll.battle.minstats.crit, doll.battle.crit);
  doll.battle.minstats.crit_uncapped = Math.min(doll.battle.minstats.crit_uncapped, doll.battle.crit_uncapped);
  doll.battle.minstats.critdmg = Math.min(doll.battle.minstats.critdmg, doll.battle.critdmg);
  doll.battle.minstats.rounds = Math.min(doll.battle.minstats.rounds, doll.battle.rounds);
  doll.battle.minstats.armor = Math.min(doll.battle.minstats.armor, doll.battle.armor);
  doll.battle.minstats.ap = Math.min(doll.battle.minstats.ap, doll.battle.ap);
}

function calculateEnemyStats(enemy) {
  enemy.battle.skillbonus = {
    eva: 1,
    armor: 1,
    vulnerability: 1,
  };

  //calculate skill bonus
  $.each(enemy.battle.buffs, (index, buff) => {
    if ('stat' in buff) {
      $.each(buff.stat, (stat, amount) => {
        enemy.battle.skillbonus[stat] *= $.isArray(amount) ? (1 + (amount[buff.level - 1] / 100)) : (1 + (amount / 100));
      });
    }
  });

  //apply skill bonus
  enemy.battle.eva = Math.floor(enemy.eva * enemy.battle.skillbonus.eva);
  enemy.battle.armor = Math.floor(enemy.armor * enemy.battle.skillbonus.armor);
  enemy.battle.vulnerability = enemy.vulnerability * enemy.battle.skillbonus.vulnerability;

  //cap stats
  enemy.battle.eva = Math.max(0, enemy.battle.eva);
  enemy.battle.armor = Math.max(0, enemy.battle.armor);
}

function activateBuff(doll, buff, enemy) {
  let targets = getBuffTargets(doll, buff, enemy);

  buff.timeLeft = $.isArray(buff.duration) ? Math.floor(buff.duration[buff.level - 1] * 30) : Math.floor(buff.duration * 30);
  $.each(targets, (index, target) => {
    if ('stackable' in buff) {
      if (target.battle.buffs.find(b => b.name == buff.name) !== undefined) {
        addStack(target, buff, enemy);
      } else {
        target.battle.buffs.push($.extend(true, {}, buff));
      }
    } else {
      target.battle.buffs.push($.extend(true, {}, buff));
    }
    if ('stat' in buff && doll.name != 'Python' && !('triggerPythonPassive' in buff)) {
      let triggerChance = 'stackChance' in buff ? buff.stackChance : undefined;
      if ('fp' in buff.stat) {
        triggerPassive('receivefp', target, enemy, triggerChance);
      }
      if ('rof' in buff.stat) {
        triggerPassive('receiverof', target, enemy, triggerChance);
      }
      if ('eva' in buff.stat) {
        triggerPassive('receiveeva', target, enemy, triggerChance);
      }
      if ('acc' in buff.stat) {
        triggerPassive('receiveacc', target, enemy, triggerChance);
      }
      if ('crit' in buff.stat) {
        triggerPassive('receivecrit', target, enemy, triggerChance);
      }
    }
  });
}

function triggerPassive(trigger, doll, enemy, triggerChance = undefined) {
  if (!('passives' in doll.battle)) {
    return;
  }

  let passives = doll.battle.passives.filter(passive => passive.trigger == trigger);
  $.each(passives, (index, passive) => {
    $.each(passive.effects, (j, effect) => {
      if (effect.type == 'buff') {
        let buff = $.extend(true, {}, effect);
        if (triggerChance != undefined) {
          buff.stackChance = triggerChance;
        }
        activateBuff(doll, buff, enemy);
      } else if (effect.type == 'loadRounds') {
        let targets = getBuffTargets(doll, effect, enemy);
        $.each(targets, (index, target) => {
          target.battle.currentRounds += $.isArray(effect.rounds) ? effect.rounds[effect.level - 1] : effect.rounds;
        });
      } else {
        doll.battle.effect_queue.push($.extend(true, {}, effect));
      }
    });
  });
}

function getBuffTargets(doll, buff, enemy) {
  let targets = [];

  if (buff.target == 'all') {
    for (let i = 0; i < 5; i++) {
      if (echelon[i].id != -1) {
        targets.push(echelon[i]);
      }
    }
  }

  if (buff.target == 'leader') {
    for (let i = 0; i < 5; i++) {
      if (echelon[i].id == -1) {
        continue;
      } else {
        targets.push(echelon[i]);
        break;
      }
    }
  }

  if (buff.target == 'enemy') {
    targets.push(enemy);
  }

  if (buff.target == 'self') {
    targets.push(doll);
  }

  if (buff.target == 'tiles') {
    let targetSquares = doll.tiles.target.split(',');
    targetSquares = targetSquares.map(targetSquare => parseInt(targetSquare));
    targetSquares = targetSquares.map(targetSquare => targetSquare + doll.pos);
    for (let i = 0; i < 5; i++) {
      if (echelon[i].id != -1 && $.inArray(echelon[i].pos, targetSquares) != -1) {
        targets.push(echelon[i]);
      }
    }
  }

  if (buff.target == 'selfandtiles') {
    let targetSquares = doll.tiles.target.split(',');
    targetSquares = targetSquares.map(targetSquare => parseInt(targetSquare));
    targetSquares = targetSquares.map(targetSquare => targetSquare + doll.pos);
    for (let i = 0; i < 5; i++) {
      if (echelon[i].id != -1 && $.inArray(echelon[i].pos, targetSquares) != -1) {
        targets.push(echelon[i]);
      }
    }
    targets.push(doll);
  }

  if (buff.target == 'tilesHGSMG') {
    let targetSquares = doll.tiles.target.split(',');
    targetSquares = targetSquares.map(targetSquare => parseInt(targetSquare));
    targetSquares = targetSquares.map(targetSquare => targetSquare + doll.pos);
    for (let i = 0; i < 5; i++) {
      if (echelon[i].id != -1 && $.inArray(echelon[i].pos, targetSquares) != -1) {
        if (echelon[i].type == 1 || echelon[i].type == 2) {
          targets.push(echelon[i]);
        }
      }
    }
  }

  if (buff.target == 'tilesARRF') {
    let targetSquares = doll.tiles.target.split(',');
    targetSquares = targetSquares.map(targetSquare => parseInt(targetSquare));
    targetSquares = targetSquares.map(targetSquare => targetSquare + doll.pos);
    for (let i = 0; i < 5; i++) {
      if (echelon[i].id != -1 && $.inArray(echelon[i].pos, targetSquares) != -1) {
        if (echelon[i].type == 4 || echelon[i].type == 3) {
          targets.push(echelon[i]);
        }
      }
    }
  }

  if (buff.target == 'tilesSGMG') {
    let targetSquares = doll.tiles.target.split(',');
    targetSquares = targetSquares.map(targetSquare => parseInt(targetSquare));
    targetSquares = targetSquares.map(targetSquare => targetSquare + doll.pos);
    for (let i = 0; i < 5; i++) {
      if (echelon[i].id != -1 && $.inArray(echelon[i].pos, targetSquares) != -1) {
        if (echelon[i].type == 6 || echelon[i].type == 5) {
          targets.push(echelon[i]);
        }
      }
    }
  }

  if (buff.target == 'column') {
    let col = [-20, -10, 10, 20];
    $.each(col, (index, distance) => {
      let target = echelon.find(d => d.pos == doll.pos + distance && d.id != -1);
      if (target !== undefined) {
        targets.push(target);
      }
    });
  }

  if (buff.target == 'front') {
    let dollInFront = echelon.find(d => d.pos == doll.pos + 1);
    if (dollInFront !== undefined && dollInFront.id != -1) {
      targets.push(dollInFront);
    }
  }

  if (buff.target == 'behind') {
    let dollBehind = echelon.find(d => d.pos == doll.pos - 1);
    if (dollBehind !== undefined && dollBehind.id != -1) {
      targets.push(dollBehind);
    }
  }

  if (buff.target == 'frontrow') {
    let dollInFront = echelon.find(d => d.pos == 14);
    if (dollInFront !== undefined && dollInFront.id != -1) {
      targets.push(dollInFront);
    }
    dollInFront = echelon.find(d => d.pos == 24);
    if (dollInFront !== undefined && dollInFront.id != -1) {
      targets.push(dollInFront);
    }
    dollInFront = echelon.find(d => d.pos == 34);
    if (dollInFront !== undefined && dollInFront.id != -1) {
      targets.push(dollInFront);
    }
  }

  if (buff.target == 'middlerow') {
    let dollInMiddle = echelon.find(d => d.pos == 13);
    if (dollInMiddle !== undefined && dollInMiddle.id != -1) {
      targets.push(dollInMiddle);
    }
    dollInMiddle = echelon.find(d => d.pos == 23);
    if (dollInMiddle !== undefined && dollInMiddle.id != -1) {
      targets.push(dollInMiddle);
    }
    dollInMiddle = echelon.find(d => d.pos == 33);
    if (dollInMiddle !== undefined && dollInMiddle.id != -1) {
      targets.push(dollInMiddle);
    }
  }

  if (buff.target == 'backrow') {
    let dollInBack = echelon.find(d => d.pos == 12);
    if (dollInBack !== undefined && dollInBack.id != -1) {
      targets.push(dollInBack);
    }
    dollInBack = echelon.find(d => d.pos == 22);
    if (dollInBack !== undefined && dollInBack.id != -1) {
      targets.push(dollInBack);
    }
    dollInBack = echelon.find(d => d.pos == 32);
    if (dollInBack !== undefined && dollInBack.id != -1) {
      targets.push(dollInBack);
    }
  }

  if (buff.target == 'frontline') {
    let frontColumnDolls = echelon.filter(d => d.id != -1 && (d.pos == 14 || d.pos == 24 || d.pos == 34));
    let middleColumnDolls = echelon.filter(d => d.id != -1 && (d.pos == 13 || d.pos == 23 || d.pos == 33));
    let backColumnDolls = echelon.filter(d => d.id != -1 && (d.pos == 12 || d.pos == 22 || d.pos == 32));

    if (frontColumnDolls.length > 0) {
      targets.push(...frontColumnDolls);
    } else if (middleColumnDolls.length > 0) {
      targets.push(...middleColumnDolls);
    } else if (backColumnDolls.length > 0) {
      targets.push(...backColumnDolls);
    }
  }

  if (buff.target == 'rearline') {
    let frontColumnDolls = echelon.filter(d => d.id != -1 && (d.pos == 14 || d.pos == 24 || d.pos == 34));
    let middleColumnDolls = echelon.filter(d => d.id != -1 && (d.pos == 13 || d.pos == 23 || d.pos == 33));
    let backColumnDolls = echelon.filter(d => d.id != -1 && (d.pos == 12 || d.pos == 22 || d.pos == 32));

    if (frontColumnDolls.length > 0) {
      targets.push(...middleColumnDolls);
      targets.push(...backColumnDolls);
    } else if (middleColumnDolls.length > 0) {
      targets.push(...backColumnDolls);
    }
  }

  if (buff.target == 'doll') {
    let t = echelon.find(doll => doll.id == buff.dollid);
    if (t !== undefined) {
      targets.push(t);
    }
  }

  if (buff.target == 'hg') {
    let allHG = echelon.filter(d => d.id != -1 && d.type == 1);
    $.each(allHG, (index, hg) => targets.push(hg));
  }
  if (buff.target == 'smg') {
    let allSMG = echelon.filter(d => d.id != -1 && d.type == 2);
    $.each(allSMG, (index, smg) => targets.push(smg));
  }
  if (buff.target == 'rf') {
    let allRF = echelon.filter(d => d.id != -1 && d.type == 3);
    $.each(allRF, (index, rf) => targets.push(rf));
  }
  if (buff.target == 'ar') {
    let allAR = echelon.filter(d => d.id != -1 && d.type == 4);
    $.each(allAR, (index, ar) => targets.push(ar));
  }
  if (buff.target == 'mg') {
    let allMG = echelon.filter(d => d.id != -1 && d.type == 5);
    $.each(allMG, (index, mg) => targets.push(mg));
  }
  if (buff.target == 'sg') {
    let allSG = echelon.filter(d => d.id != -1 && d.type == 6);
    $.each(allSG, (index, sg) => targets.push(sg));
  }

  return targets;
}

function addStack(target, effect, enemy) {
  let buff = target.battle.buffs.find(buff => buff.name == effect.name);
  if ('stacksToAdd' in effect) {
    buff.stacks += $.isArray(effect.stacksToAdd) ? effect.stacksToAdd[effect.level - 1] : effect.stacksToAdd;
  } else {
    buff.stacks++;
  }
  if ('max_stacks' in buff) {
    buff.stacks = buff.stacks > buff.max_stacks ? buff.max_stacks : buff.stacks;
  }
  buff.stacks = Math.max(0, buff.stacks);
  let refresh = 'refreshduration' in buff ? buff.refreshduration : true; //buff = original buff, effect = new stack
  if (refresh) {
    buff.timeLeft = $.isArray(buff.duration) ? Math.floor(buff.duration[buff.level - 1] * 30) : Math.floor(buff.duration * 30);
  }

  $.each(target.battle.passives.filter(passive => 'hasStacks' == passive.trigger), (index, passiveskill) => {
    let b = target.battle.buffs.find(buf => buf.name == passiveskill.name);
    if (b != undefined) {
      let stacksNeeded = $.isArray(passiveskill.stacksRequired) ? passiveskill.stacksRequired[passiveskill.level - 1] : passiveskill.stacksRequired;
      if ('stackChance' in b) {
        let expectedstacks = $.isArray(b.stackChance) ? b.stacks * b.stackChance[b.level - 1] / 100 : b.stacks * b.stackChance / 100;
        if (expectedstacks >= stacksNeeded) {
          triggerPassive('hasStacks', target, enemy);
        }
      } else if (b.stacks >= stacksNeeded) {
        triggerPassive('hasStacks', target, enemy);
      }
    }
  });

  //notstacksrequired passive
  $.each(target.battle.passives.filter(passive => 'notHasStacks' == passive.trigger), (index, passiveskill) => {
    let b = target.battle.buffs.find(buf => buf.name == passiveskill.name);
    if (b != undefined) {
      let stacksNeeded = $.isArray(passiveskill.stacksRequired) ? passiveskill.stacksRequired[passiveskill.level - 1] : passiveskill.stacksRequired;
      if ('stackChance' in b) {
        let expectedstacks = $.isArray(b.stackChance) ? b.stacks * b.stackChance[b.level - 1] / 100 : b.stacks * b.stackChance / 100;
        if (expectedstacks <= stacksNeeded) {
          triggerPassive('notHasStacks', target, enemy);
        }
      } else if (b.stacks <= stacksNeeded) {
        triggerPassive('notHasStacks', target, enemy);
      }
    }
  });
}

function addPassive(doll, passive, enemy, currentTime) {
  let passiveskill = $.extend(true, {}, passive);

  if (!('level' in passiveskill)) {
    passiveskill.level = doll.skilllevel;
  }
  $.each(passiveskill.effects, (index, effect) => effect.level = passiveskill.level);
  if ('duration' in passiveskill) {
    passiveskill.timeLeft = $.isArray(passiveskill.duration) ? Math.floor(passiveskill.duration[passiveskill.level - 1] * 30) : Math.floor(passiveskill.duration * 30);
  }
  if ('interval' in passiveskill) {
    passiveskill.startTime = currentTime;
  }

  if ('target' in passiveskill) {
    let targets = getBuffTargets(doll, passiveskill, enemy);
    $.each(targets, (index, target) => target.battle.passives.push($.extend(true, {}, passiveskill)));
  } else {
    doll.battle.passives.push($.extend(true, {}, passiveskill));
  }
}

function removeBuff(doll, buff, enemy) {
  let targets = getBuffTargets(doll, buff, enemy);

  $.each(targets, (index, target) => {
    target.battle.buffs = target.battle.buffs.filter(b => {
      if ('name' in b) {
        return b.name != buff.name;
      } else {
        return true;
      }
    });
  });
}

function removePassive(doll, passive, enemy) {
  let targets = getBuffTargets(doll, passive, enemy);

  $.each(targets, (index, target) => {
    target.battle.passives = target.battle.passives.filter(p => p.name != passive.name);
  });
}

function modifySkill(doll, effect, enemy, currentTime) {
  if (doll.id == 199) {
    //ballista
    if (effect.modifySkill == 'addMark') {
      doll.battle.skill.marks++;
      let activeBuff = doll.battle.buffs.find(buff => buff.name == 'normalAttackBuff');
      if (activeBuff !== undefined) {
        activeBuff.attacksLeft++;
      }
    }
    if (effect.modifySkill == 'removeMark') {
      doll.battle.skill.marks--;
    }
    if (effect.modifySkill == 'accumulate') {
      doll.battle.effect_queue.find(action => action.name == 'normalAttackBuff').attacksLeft = doll.battle.skill.marks;
    }
  }

  if (doll.id == 224) {
    //m82a1
    if (effect.modifySkill == 'usedSkill') {
      doll.battle.skillUseCount++;

      if (doll.battle.skillUseCount == 2) {
        doll.battle.skill.effects[0].multiplier = doll.battle.skill.effects[0].multiplier.map(mult => mult * 2);
      }

      if (doll.battle.skillUseCount >= 3) {
        doll.battle.skill.effects = [];
      }
    }
  }

  if (doll.id == 261) {
    //star mod3
    if (effect.modifySkill == 'checkAvenger') {
      let buffExists = enemy.battle.buffs.find(b => b.name == 'avenger');
      if (buffExists) {
        let buff = doll.battle.buffs.find(b => b.name == 'normalAttackBuff');
        buff.multiplier = [1.1, 1.12, 1.12, 1.14, 1.14, 1.16, 1.16, 1.18, 1.18, 1.2];
      }
    }
  }

  if (doll.id == 260) {
    //sop mod3
    if (effect.modifySkill == 'checkAvenger') {
      let buffExists = enemy.battle.buffs.find(b => b.name == 'avenger');
      if (buffExists) {
        let skill2bonus = [0.15, 0.16, 0.17, 0.18, 0.19, 0.21, 0.22, 0.23, 0.24, 0.25];
        $.each(doll.battle.effect_queue, (index, effect) => {
          if (effect.type == 'grenade') {
            effect.multiplier += skill2bonus[doll.skill2level - 1];
          }
        });
      }
    }
  }

  if (doll.id == 257) {
    //sv98 mod3
    if (effect.modifySkill == 'checkBuff') {
      let buff = doll.battle.buffs.find(b => b.name == 'sv98mod');
      if (buff !== undefined) {
        let damagebonus = [10, 11, 12, 13, 14, 14, 15, 16, 17, 18];
        let chargedshot = doll.battle.action_queue.find(action => action.name == 'sv98modshot');
        if (chargedshot !== undefined) {
          chargedshot.skillDamageBonus = damagebonus[doll.skill2level - 1];
        }
      }
    }
    if (effect.modifySkill == 'resetTimer') {
      let passive = doll.battle.passives.find(p => p.name == 'sv98modpassive');
      passive.startTime = currentTime;
    }
  }

  if (doll.id == 189) {
    //k2
    if (effect.modifySkill == 'changeHeatStats') {
      let heatbuff = doll.battle.buffs.find(b => b.name == 'heat');
      heatbuff.stat.fp = [-3.2, -3.1, -3, -2.8, -2.7, -2.6, -2.4, -2.3, -2.2, -2];
      heatbuff.stat.acc = [-3.2, -3.1, -3, -2.8, -2.7, -2.6, -2.4, -2.3, -2.2, -2];
    }
    if (effect.modifySkill == 'changeHeatStatsDown') {
      let heatbuff = doll.battle.buffs.find(b => b.name == 'heat');
      heatbuff.stat.fp = 0;
      heatbuff.stat.acc = 0;
    }
    if (effect.modifySkill == 'singleEnemyAttackStack') {
      let singleTargetBuff = doll.battle.buffs.find(b => 'attacksOnSingle' in b);
      if (singleTargetBuff !== undefined) {
        singleTargetBuff.attacksOnSingle++;
        if (singleTargetBuff.attacksOnSingle > 10) {
          singleTargetBuff.attacksOnSingle = 10;
        }
        singleTargetBuff.multiplier = 0.05 * singleTargetBuff.attacksOnSingle + 1;
      }
    }
    if (effect.modifySkill == 'switchMode') {
      if (doll.skill.mode == 'fever') {
        //switch to note
        let normalpassive = doll.battle.passives.find(p => p.trigger == 'normalAttack');
        normalpassive.effects[0].stacksToAdd = -1;
        doll.battle.buffs = doll.battle.buffs.filter(b => b.name != 'normalAttackBuff');
        let sittingbuff = {
          type: 'buff',
          target: 'self',
          stat: {
            eva: [-60, -58, -56, -54, -52, -50, -48, -46, -44, -40]
          },
          level: doll.skilllevel,
          duration: -1,
          name: 'sitting'
        };
        let singleTargetBuff = {
          type: 'buff',
          target: 'self',
          name: 'normalAttackBuff',
          attacksOnSingle: 0,
          multiplier: 1,
          duration: -1,
          level: doll.skilllevel
        };
        doll.battle.buffs.push(sittingbuff);
        doll.battle.buffs.push(singleTargetBuff);
        doll.skill.mode = 'note';
      } else {
        //switch to fever
        let normalpassive = doll.battle.passives.find(p => p.trigger == 'normalAttack');
        normalpassive.effects[0].stacksToAdd = 1;
        doll.battle.buffs = doll.battle.buffs.filter(b => b.name != 'sitting');
        doll.battle.buffs = doll.battle.buffs.filter(b => !('attacksOnSingle' in b));
        let feverbuff = {
          type: 'buff',
          target: 'self',
          name: 'normalAttackBuff',
          hitCount: 3,
          multiplier: [0.4, 0.412, 0.424, 0.436, 0.448, 0.46, 0.472, 0.484, 0.496, 0.52],
          duration: -1,
          level: doll.skilllevel
        };
        doll.battle.buffs.push(feverbuff);
        doll.skill.mode = 'fever';
      }
    }
  }

  if (doll.id == 278) {
    //m200
    if (effect.modifySkill == 'resetShotCount') {
      doll.battle.skill.numShots = 0;
    }
    if (effect.modifySkill == 'addChargedShot') {
      doll.battle.skill.numShots++;
      let hasSniperMode = doll.battle.buffs.find(b => b.name == 'm200') !== undefined ? true : false;
      if (hasSniperMode) {
        let chargedshot = {
          type: 'chargedshot',
          delay: [2.5, 2.4, 2.3, 2.2, 2.1, 1.9, 1.8, 1.7, 1.6, 1.5],
          busylinks: 5,
          canCrit: true,
          ignoreArmor: false,
          multiplier: [1.5, 1.56, 1.61, 1.67, 1.72, 1.78, 1.83, 1.89, 1.94, 2],
          modifySkill: 'addChargedShot',
          level: doll.skilllevel
        };

        if (doll.battle.skill.numShots < 7) {
          if ('delay' in chargedshot) {
            chargedshot.timeLeft = $.isArray(chargedshot.delay) ? Math.round(chargedshot.delay[chargedshot.level - 1] * 30) : Math.round(chargedshot.delay * 30) + 1;
            if (doll.pre_battle.skillcd > 0) {
              chargedshot.timeLeft = Math.floor((1 - doll.pre_battle.skillcd / 100) * chargedshot.timeLeft);
            }
          }
          if ('busylinks' in chargedshot) {
            doll.battle.busylinks += Math.min(chargedshot.busylinks, doll.links);
          }
          doll.battle.action_queue.push(chargedshot);
        }
      }
    }
  }

  if (doll.id == 279) {
    //Falcon
    if (effect.modifySkill == 'changePassiveTimer') {
      if (doll.battle.passives[0].interval == 6) {
        doll.battle.passives[0].interval = 10;
        doll.battle.passives[0].startTime = currentTime;
      }
    }

    if (effect.modifySkill == 'useSpecialAmmo') {
      let ammoBuff = doll.battle.buffs.find(b => b.name == 'falcon');
      if (ammoBuff !== undefined) {
        if (ammoBuff.stacks > 0) {
          ammoBuff.stacks--;
          let chargedshot = {
            type: 'chargedshot',
            delay: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
            busylinks: 5,
            canCrit: true,
            multiplier: [1.5, 1.61, 1.72, 1.83, 1.94, 2.06, 2.17, 2.28, 2.39, 2.5],
            level: doll.skilllevel
          };
          if ('delay' in chargedshot) {
            chargedshot.timeLeft = $.isArray(chargedshot.delay) ? Math.round(chargedshot.delay[chargedshot.level - 1] * 30) : Math.round(chargedshot.delay * 30) + 1;
          }
          if ('busylinks' in chargedshot) {
            doll.battle.busylinks += Math.min(chargedshot.busylinks, doll.links);
          }
          doll.battle.action_queue.push(chargedshot);
        }
      }
    }
  }

  //chauchat
  if (doll.id == 282) {
    if (effect.modifySkill == 'consumeStack') {
      let buff = doll.battle.buffs.find(b => b.name == 'chauchat');
      if (buff == undefined) {
        return;
      }

      let reloadBuff = {
        type: 'buff',
        target: 'self',
        name: 'reloadBuff',
        duration: -1,
        uses: 1,
        stackable: true,
        max_stacks: 2,
        stacks: 1,
        multiplier: [-10, -11, -12, -13, -14, -16, -17, -18, -19, -20],
        level: doll.skilllevel
      };

      if (buff.stacks > 0) { //add a check for existing reloadbuff if stacks can't be wasted. needs ingame testing
        buff.stacks--;
        activateBuff(doll, $.extend({}, reloadBuff), enemy);
      }
    }
  }

  //dana
  if (doll.id == 292) {
    if (effect.modifySkill == 'buffSkillDamage') {
      doll.battle.effect_queue[0].multiplier[doll.battle.effect_queue[0].level - 1] *= (1 + doll.battle.armor / 100);
    }
  }

  //jill
  if (doll.id == 296) {
    if (effect.modifySkill == 'danafavorite') {
      //its a shield not armor zzzzz
      // let dana = echelon.find(d => d.id == 292);
      // if(dana !== undefined) {
      //   let armorBuff = {
      //     type:"buff",
      //     target:"self",
      //     stat:{
      //       armor:50
      //     },
      //     level:doll.skilllevel,
      //     duration:[5,5.3,5.7,6,6.3,6.7,7,7.3,7.7,8]
      //   };
      //   activateBuff(dana, armorBuff, null);
      // }
    }

    if (effect.modifySkill == 'almafavorite') {
      let alma = echelon.find(d => d.id == 293);
      if (alma !== undefined) {
        alma.battle.skill.effects[0].duration = alma.battle.skill.effects[0].duration.map(time => time + 1);
      }
    }

    if (effect.modifySkill == 'stellafavorite') {
      let stella = echelon.find(d => d.id == 294);
      if (stella !== undefined) {
        stella.battle.passives.find(p => p.name == 'stella').stacksRequired = 10;
      }
    }
  }

  //ads
  if (doll.id == 301) {
    if (effect.modifySkill == 'increaseStackChance') {
      let corrosionBuff = doll.battle.buffs.find(b => b.name == 'corrosion');
      if (corrosionBuff !== undefined) {
        corrosionBuff.stackChance = 100;
      }
    }

    if (effect.modifySkill == 'decreaseStackChance') {
      let corrosionBuff = doll.battle.buffs.find(b => b.name == 'corrosion');
      if (corrosionBuff !== undefined) {
        corrosionBuff.stackChance = [20, 22, 24, 26, 30, 32, 34, 36, 38, 40];
      }
    }
  }

  //ssg3000
  if (doll.id == 307) {
    if (effect.modifySkill == 'resetShotCount') {
      doll.battle.skill.numShots = 0;
    }
    if (effect.modifySkill == 'addChargedShot') {
      doll.battle.skill.numShots++;
      let hasSniperMode = doll.battle.buffs.find(b => b.name == 'ssg3000') !== undefined ? true : false;
      if (hasSniperMode) {
        let chargedshot = {
          type: 'chargedshot',
          delay: [2.5, 2.4, 2.3, 2.2, 2.1, 1.9, 1.8, 1.7, 1.6, 1.5],
          busylinks: 5,
          canCrit: true,
          ignoreArmor: false,
          sureHit: true,
          multiplier: [1.2, 1.27, 1.33, 1.4, 1.47, 1.53, 1.6, 1.67, 1.73, 1.8],
          modifySkill: 'addChargedShot',
          level: doll.skilllevel
        };

        if (doll.battle.skill.numShots < 7) {
          if ('delay' in chargedshot) {
            chargedshot.timeLeft = $.isArray(chargedshot.delay) ? Math.round(chargedshot.delay[chargedshot.level - 1] * 30) : Math.round(chargedshot.delay * 30) + 1;
            if (doll.pre_battle.skillcd > 0) {
              chargedshot.timeLeft = Math.floor((1 - doll.pre_battle.skillcd / 100) * chargedshot.timeLeft);
            }
          }
          if ('busylinks' in chargedshot) {
            doll.battle.busylinks += Math.min(chargedshot.busylinks, doll.links);
          }
          doll.battle.action_queue.push(chargedshot);
        }
      }
    }
  }

  //acr
  if (doll.id == 309) {
    if (effect.modifySkill == 'checkEnemyDebuffs') {
      let debuffCount = 0;

      let fpdebuff = false, accdebuff = false, evadebuff = false, rofdebuff = false;
      let armordebuff = false, movespeeddebuff = false, burning = false, stunned = false;
      $.each(enemy.battle.buffs, (index, enemyBuff) => {
        if ('stat' in enemyBuff) {
          if ('fp' in enemyBuff.stat) {
            let buffAmount = $.isArray(enemyBuff.stat.fp) ? enemyBuff.stat.fp[enemyBuff.level - 1] : enemyBuff.stat.fp;
            if (buffAmount < 0)
              fpdebuff = true;
          }
          if ('acc' in enemyBuff.stat) {
            let buffAmount = $.isArray(enemyBuff.stat.acc) ? enemyBuff.stat.acc[enemyBuff.level - 1] : enemyBuff.stat.acc;
            if (buffAmount < 0)
              accdebuff = true;
          }
          if ('eva' in enemyBuff.stat) {
            let buffAmount = $.isArray(enemyBuff.stat.eva) ? enemyBuff.stat.eva[enemyBuff.level - 1] : enemyBuff.stat.eva;
            if (buffAmount < 0)
              evadebuff = true;
          }
          if ('rof' in enemyBuff.stat) {
            let buffAmount = $.isArray(enemyBuff.stat.rof) ? enemyBuff.stat.rof[enemyBuff.level - 1] : enemyBuff.stat.rof;
            if (buffAmount < 0)
              rofdebuff = true;
          }
          if ('armor' in enemyBuff.stat) {
            let buffAmount = $.isArray(enemyBuff.stat.armor) ? enemyBuff.stat.armor[enemyBuff.level - 1] : enemyBuff.stat.armor;
            if (buffAmount < 0)
              armordebuff = true;
          }
          if ('movespeed' in enemyBuff.stat) {
            let buffAmount = $.isArray(enemyBuff.stat.movespeed) ? enemyBuff.stat.movespeed[enemyBuff.level - 1] : enemyBuff.stat.movespeed;
            if (buffAmount < 0)
              movespeeddebuff = true;
          }
        }

        if ('stun' in enemyBuff && enemyBuff.stun)
          stunned = true;
      });

      $.each(echelon, (index, d) => {
        if (d.id != -1) {
          if (d.battle.action_queue.find(action => action.type == 'grenadedot')) {
            burning = true;
          }
        }
      });

      if (fpdebuff)
        debuffCount++;
      if (accdebuff)
        debuffCount++;
      if (evadebuff)
        debuffCount++;
      if (rofdebuff)
        debuffCount++;
      if (armordebuff)
        debuffCount++;
      if (movespeeddebuff)
        debuffCount++;
      if (burning)
        debuffCount++;
      if (stunned)
        debuffCount++;

      if (debuffCount > 0) {
        doll.battle.buffs.find(b => b.name == 'acrSingleDebuffBuff').stacks = 1;
        doll.battle.buffs.find(b => b.name == 'acrMultipleDebuffBuff').stacks = debuffCount - 1;
      } else {
        doll.battle.buffs.find(b => b.name == 'acrSingleDebuffBuff').stacks = 0;
        doll.battle.buffs.find(b => b.name == 'acrMultipleDebuffBuff').stacks = 0;
      }
    }
  }

  //m1895cb
  if (doll.id == 310) {
    if (effect.modifySkill == 'gainReserveAmmo') {
      if (doll.battle.reserveAmmoMode) {
        doll.battle.buffs.find(b => b.name == 'normalAttackBuff').attacksLeft++;
        doll.battle.currentRounds++;
      } else {
        doll.battle.reserveAmmo = doll.battle.reserveAmmo > 30 ? 30 : doll.battle.reserveAmmo++;
      }
    }

    if (effect.modifySkill == 'useReserveAmmo') {
      if (doll.battle.reserveAmmoMode) {
        let fpBuff = {
          type:"buff",
          target:"self",
          stat:{
            fp:[10,11,12,13,14,16,17,18,19,20]
          },
          level: doll.skilllevel,
          name:"m1895cb_fp",
          stackable:true,
          stacks:1,
          max_stacks:1,
          duration:5
        };
        let accBuff = {
          type:"buff",
          target:"self",
          stat:{
            acc:[-25,-24,-23,-22,-21,-19,-18,-17,-16,-15]
          },
          level: doll.skilllevel,
          name:"m1895cb_acc",
          stackable:true,
          stacks:1,
          max_stacks:10,
          duration:5
        };

        activateBuff(doll, fpBuff, enemy);
        activateBuff(doll, accBuff, enemy);

        if (doll.battle.buffs.find(b => b.name == 'normalAttackBuff').attacksLeft == 1) {
          let lastShotPassive = {
            type:"passive",
            name:"m1895cb_lastShot",
            trigger:"lastShot",
            effects:[
              {
                type:"modifySkill",
                modifySkill:"useReserveAmmo"
              }
            ]
          };
          let delayBuff = {
            type:"stun",
            busylinks:0,
            delay:0.5,
            after:[
              lastShotPassive
            ],
            timeLeft: doll.frames_per_attack + 2
          };
          doll.battle.action_queue.push(delayBuff);
          doll.battle.reserveAmmoMode = false;
        }
      } else {
        if (doll.battle.passives.find(p => p.name == 'm1895cb_lastShot')) {
          let removePassiveEffect = {
            type:"removePassive",
            target:"self",
            name:"m1895cb_lastShot"
          };
          removePassive(doll, removePassiveEffect, enemy);

          let normalAttackBuff = {
            type:"buff",
            target:"self",
            name:"normalAttackBuff",
            modifySkill:"useReserveAmmo",
            attacksLeft:doll.battle.reserveAmmo
          };
          doll.battle.buffs.push(normalAttackBuff);
        } else {
          doll.battle.currentRounds += doll.battle.reserveAmmo;
          doll.battle.reserveAmmo = 0;

          let fpBuff = {
            type:"buff",
            target:"self",
            stat:{
              fp:[10,11,12,13,14,16,17,18,19,20]
            },
            level: doll.skilllevel,
            name:"m1895cb_fp",
            stackable:true,
            stacks:1,
            max_stacks:1,
            duration:5
          };
          let accBuff = {
            type:"buff",
            target:"self",
            stat:{
              acc:[-25,-24,-23,-22,-21,-19,-18,-17,-16,-15]
            },
            level: doll.skilllevel,
            name:"m1895cb_acc",
            stackable:true,
            stacks:1,
            max_stacks:10,
            duration:5
          };

          activateBuff(doll, fpBuff, enemy);
          activateBuff(doll, accBuff, enemy);

          doll.battle.reserveAmmoMode = true;
        }
      }
    }
  }

  //desert Eagle
  if (doll.id == 312) {
    if (effect.modifySkill == 'stackMultiplier') {
      let attackbuff = doll.battle.buffs.find(b => b.name == 'normalAttackBuff');
      if (attackbuff) {
        if (attackbuff.multiplier == 1.6)
          attackbuff.multiplier = 2.56;
        else if (attackbuff.multiplier == 2.56)
          attackbuff.multiplier = 4.096;
      }
    }
  }

  //kacpdw
  if (doll.id == 326) {
    if (effect.modifySkill == 'clearDebuffs') {
      $.each(doll.battle.buffs, (i, buff) => {
        if ('stat' in buff) {
          $.each(buff.stat, (stat, amount) => {
            if ($.isArray(amount)) {
              amount[buff.level - 1] = amount[buff.level - 1] < 0 ? 0 : amount[buff.level - 1];
            } else {
              amount = amount < 0 ? 0 : amount;
            }
          });
        }
      });
    }
  }

  //rpk16
  if (doll.id == 327) {
    if (effect.modifySkill == 'switchtoMGmode') {
      let reloadTimer = {
        type: 'reload',
        timeLeft: 30
      };
      doll.battle.timers.push(reloadTimer);
      doll.battle.currentRounds = 0;
    }
  }

  //webley
  if (doll.id == 328) {
    if (effect.modifySkill == 'reduceLeaderCD') {
      let leader = undefined;
      for (let i = 0; i < 5; i++) {
        if (echelon[i].id == -1) {
          continue;
        } else {
          leader = echelon[i];
          break;
        }
      }
      let leaderSkillTimer = leader.battle.timers.find(t => t.type == 'skill');
      if (leaderSkillTimer !== undefined) {
        let cdReduction = [15,16,17,18,19,21,22,23,24,25];
        let cdr = 1 - (cdReduction[doll.skilllevel - 1] / 100);
        leaderSkillTimer.timeLeft = Math.ceil(leaderSkillTimer.timeLeft * cdr);
      }
    }
  }

  //sig556
  if (doll.id == 331) {
    if (effect.modifySkill == 'toggleSkill') {
      let isActive = doll.battle.buffs.find(b => b.name == 'sweep') !== undefined;

      if (isActive) {
        doll.battle.buffs = doll.battle.buffs.filter(b => b.name != 'sweep');
        doll.battle.passives[0].effects[0].stacksToAdd = -1;
      } else {
        let skillBuff = {
          type:"buff",
          target:"self",
          name:"sweep",
          stat:{
            fp:[25,28,31,33,36,39,42,44,47,50]
          },
          duration:-1,
          level: doll.skilllevel
        };
        doll.battle.buffs.push(skillBuff);
        doll.battle.passives[0].effects[0].stacksToAdd = 1;
      }
    }
  }

  //no doll id check to have this work on any doll
  if (effect.modifySkill == 'bleedingjane') {
    for (let i = 0; i < 5; i++) {
      if (echelon[i].pos == doll.pos) {
        calculateSkillBonus(i);
        let extraCrit = doll.pre_battle.crit * doll.battle.skillbonus.crit - 100;
        if (extraCrit > 0) {
          let bleedingjaneBuff = doll.battle.buffs.find(b => b.name == 'bleedingjane');
          bleedingjaneBuff.stat.critdmg = 0.6 * extraCrit;
        }
      }
    }
  }
}

function getUsableSkillEffects(effects) {
  let validEffects = [];

  for (let i = 0; i < effects.length; i++) {
    if (!('requirements' in effects[i])) {
      validEffects.push($.extend({}, effects[i]));
      continue;
    }
    let valid = true;
    $.each(effects[i].requirements, (condition, value) => {
      if (condition == 'night') {
        valid = valid && (isNight == value);
      }
      if (condition == 'armored') {
        valid = valid && (enemyArmor > 0 == value);
      }
      if (condition == 'boss') {
        valid = valid && (isBoss == value);
      }
    });
    if (valid) {
      validEffects.push($.extend({}, effects[i]));
    }
  }

  return validEffects;
}

let getFrames = function (originalRoF) {
  let frames = 1500 / originalRoF;
  frames = Math.floor(frames);
  return frames;
};

let getEffectiveRoF = function (originalRoF) {
  let frames = getFrames(originalRoF);
  let effectiveRoF = Math.ceil(1500 / (frames + 0.9999));
  return effectiveRoF;
};

let getCapRoF = function (doll, originalRoF) {
  originalRoF = Math.floor(originalRoF);
  let capBasedOnType;
  if (doll.type == 6) { //sg
    capBasedOnType = 60;
  } else if (doll.type == 5) { //mg
    return Math.floor(Math.min(1000, Math.max(1, doll.battle.rof)));
  } else { //hg,rf,ar,smg
    capBasedOnType = 120;
    // doll.battle.rof_waste = Math.max(0, doll.battle.rof - cap)
    // console.log(`${doll.battle.rof} ; ${doll.battle.maxstats.rof} ; ${doll.battle.rof_waste} ; ${doll.battle.maxstats.rof_waste}`)
  }
  let cap = Math.min(getEffectiveRoF(capBasedOnType), getEffectiveRoF(originalRoF));
  return Math.floor(Math.min(cap, Math.max(15, originalRoF)));
};

let getCapCrit = function (doll, originalCrit) {
  return Math.min(100, Math.max(0, originalCrit));
};

function determineFinalStats() {
  //this whole mechanism of determining which numbers to show the user if they have enabled showBuffedStats
  //needs to be redone.

  for (let i = 0; i < 5; i++) {
    let doll = echelon[i];
    if (doll.id == -1) continue;

    doll.battle.finalstats = {};

    doll.battle.maxstats.fp = Math.floor(doll.battle.maxstats.fp);
    doll.battle.maxstats.crit = Math.floor(doll.battle.maxstats.crit);
    doll.battle.minstats.fp = Math.floor(doll.battle.minstats.fp);
    doll.battle.minstats.crit = Math.floor(doll.battle.minstats.crit);

    $.each(['fp', 'eva', 'acc', 'rof', 'crit', 'critdmg', 'rounds', 'armor', 'ap'], (index, stat) => {
      if (doll.battle.maxstats[stat] == Math.floor(doll.pre_battle[stat])) {
        doll.battle.finalstats[stat] = Math.floor(doll.battle.minstats[stat]);
      } else {
        doll.battle.finalstats[stat] = Math.floor(doll.battle.maxstats[stat]);
      }

      //if stat went both up and down in battle, just show both min and max
      if (doll.battle.maxstats[stat] != Math.floor(doll.pre_battle_capped[stat]) && doll.battle.minstats[stat] != Math.floor(doll.pre_battle_capped[stat])) {
        doll.battle.finalstats[stat] = Math.floor(doll.battle.minstats[stat]) + '-' + Math.floor(doll.battle.maxstats[stat]);
      }
    });

    // Show overcap RoF/crit
    doll.battle.finalstats.effective_rof = getCapRoF(doll, doll.battle.maxstats.rof_uncapped);
    doll.battle.finalstats.effective_crit = getCapCrit(doll, doll.battle.maxstats.crit_uncapped);

    let wastedRoF = doll.battle.maxstats.rof_uncapped - doll.battle.finalstats.effective_rof;
    doll.battle.finalstats.rof_waste = wastedRoF;

    let wastedCrit = Math.max(0, doll.battle.maxstats.crit_uncapped - 100);
    doll.battle.finalstats.crit_waste = wastedCrit;

    if (doll.pre_battle.rounds == 0)
      doll.battle.finalstats.rounds = 0;
  }
}



const SKILL_CONTROL = {
  97: function (doll) {
    //UMP40
    doll.skill = $.extend(true, {}, dollData[doll.id - 1].skill);

    let icd = Math.max(1, parseInt($('.ump40-icd').val()) || 0);
    doll.skill.icd = icd;
  },
  159: function (doll) {
    //FP-6
    doll.skill = $.extend(true, {}, dollData[doll.id - 1].skill);

    let target1 = parseInt($('#skill-control-body .shield1 input:checked').val());
    let target2 = parseInt($('#skill-control-body .shield2 input:checked').val());

    doll.skill.effects[0].target = 'doll';
    doll.skill.effects[1].target = 'doll';

    doll.skill.effects[0].dollid = target1;
    doll.skill.effects[1].dollid = target2;
  },
  178: function (doll) {
    //Contender
    doll.skill = $.extend(true, {}, dollData[doll.id - 1].skill);

    let icd = Math.max(6, parseInt($('.contender-icd').val()) || 0);
    doll.skill.icd = icd;
  },
  197: function (doll) {
    //thunder
    let miss = $('.thunder-skill').prop('checked');
    if (miss) {
      doll.skill.effects[0].delay = 3;
    } else {
      doll.skill.effects[0].delay = 1;
    }
  },
  209: function (doll) {
    //mdr
    let dollInFront = $('.mdr-skill').prop('checked');
    if (dollInFront) {
      doll.skill.effects[0] = {
        type: 'buff',
        target: 'front',
        stat: {
          eva: [40, 44, 49, 53, 58, 62, 67, 71, 76, 80]
        },
        duration: [6, 6.4, 6.8, 7.2, 7.6, 8, 8.4, 8.8, 9.4, 10]
      };
    } else {
      doll.skill.effects[0] = {
        type: 'buff',
        target: 'self',
        stat: {
          fp: [20, 23, 26, 28, 31, 34, 37, 39, 42, 45],
          rof: [10, 11, 13, 14, 15, 17, 18, 19, 21, 22]
        },
        duration: [6, 6.4, 6.8, 7.2, 7.6, 8, 8.4, 8.8, 9.4, 10]
      };
    }
  },
  221: function (doll) {
    //type100
    let shieldNoBreak = $('.t100-skill').prop('checked');
    if (shieldNoBreak) {
      doll.skill.effects[0] = {
        type: 'buff',
        target: 'self',
        stat: {
          fp: [40, 45, 50, 55, 60, 65, 70, 75, 80, 85]
        },
        duration: [3, 3.2, 3.4, 3.7, 3.9, 4.1, 4.3, 4.6, 4.8, 5]
      };
    } else {
      doll.skill.effects[0] = {
        type: 'buff',
        target: 'self',
        stat: {
          eva: [30, 34, 38, 42, 46, 49, 53, 57, 61, 65]
        },
        duration: [3, 3.2, 3.4, 3.7, 3.9, 4.1, 4.3, 4.6, 4.8, 5]
      };
    }
  },
  224: function (doll) {
    //m82a1
    let victories = parseInt($('.m82a1-skill').val()) || 0;
    doll.skill.effects[0].victories = victories;
    doll.skill.effects[0].skillDamageBonus = [5, 6, 6, 7, 7, 8, 8, 9, 9, 10];
  },
  262: function (doll) {
    //g3mod
    let morethanhalfhp = $('.g3mod-skill').prop('checked');
    if (morethanhalfhp) {
      doll.skill.buffednade = false;
    } else {
      doll.skill.buffednade = true;
    }
  },
  276: function (doll) {
    //hs2000
    doll.skill.effects = [];
    for (let i = 0; i < 5; i++) {
      if (echelon[i].id == -1) {
        continue;
      }
      let giveBuff = $('.dollindex' + i).prop('checked');
      if (giveBuff) {
        let buff = {
          type: 'buff',
          target: 'doll',
          dollid: echelon[i].id,
          stat: {
            fp: [18, 20, 22, 24, 26, 27, 29, 31, 33, 35],
            acc: [18, 20, 22, 24, 26, 27, 29, 31, 33, 35]
          },
          duration: [3, 3.2, 3.4, 3.7, 3.9, 4.1, 4.3, 4.6, 4.8, 5]
        };
        doll.skill.effects.push(buff);
      }
    }
  },
  228: function (doll) {
    //spr a3g
    let targetdies = $('.spra3g-skill').prop('checked');
    if (targetdies) {
      doll.skill.effects[0] = {
        type: 'chargedshot',
        delay: 1.5,
        multiplier: [2.8, 3.1, 3.4, 3.7, 4, 4.3, 4.6, 4.9, 5.2, 5.5],
        busylinks: 5,
        after: {
          type: 'buff',
          target: 'self',
          stat: {
            rof: [15, 16, 17, 18, 19, 21, 22, 23, 24, 25]
          },
          duration: 5
        }
      };
    } else {
      doll.skill.effects[0] = {
        type: 'chargedshot',
        delay: 1.5,
        multiplier: [2.8, 3.1, 3.4, 3.7, 4, 4.3, 4.6, 4.9, 5.2, 5.5],
        busylinks: 5
      };
    }
  },
  235: function (doll) {
    //Howa
    let shield = $('.howa-skill').prop('checked');
    if (shield) {
      doll.skill.effects[0] = {
        type: 'buff',
        target: 'self',
        stat: {
          fp: [40, 46, 51, 57, 62, 68, 73, 79, 84, 90]
        },
        duration: 3
      };
    } else {
      doll.skill.effects[0] = {
        type: 'buff',
        target: 'self',
        stat: {
          fp: [40, 46, 51, 57, 62, 68, 73, 79, 84, 90]
        },
        duration: 3,
        after: {
          type: 'buff',
          target: 'selfandtiles',
          stat: {
            fp: [25, 28, 32, 35, 38, 42, 45, 48, 52, 55]
          },
          duration: 5
        }
      };
    }
  },
  259: function (doll) {
    //m4a1 mod3
    doll.skill = $.extend(true, {}, dollData[doll.id - 1].skill);
    let lessthan3 = $('.m4mod3-skill').prop('checked');
    if (lessthan3) {
      doll.skill.effects[1].target = 'self';
      doll.skill.effects[2].target = 'self';
    }
  },
  256: function (doll) {
    //mosin-nagant mod3
    let skill1kill = $('.mosinmod3-skill1').prop('checked');
    let hitsperkill = Math.max(0, parseInt($('.mosinmod3-skill2').val()) || 0);

    doll.skill = $.extend(true, {}, dollData[doll.id - 1].skill);
    if (skill1kill) {
      doll.skill.effects[0].after.target = 'self';
    } else {
      doll.skill.effects[0].after.target = 'none';
    }

    if (hitsperkill == 0) {
      doll.passives[0].hits = -1;
    } else {
      doll.passives[0].hits = hitsperkill;
    }
  },
  208: function (doll) {
    //c-ms
    doll.skill = $.extend(true, {}, dollData[doll.id - 1].skill);
    let toDamage = Math.max(0, parseInt($('.cms-skill').val()) || 0);
    let toAcc = Math.max(0, parseInt($('.cms-skill2').val()) || 0);
    if (toDamage == 0) {
      return;
    } else {
      doll.skill.effects[0].after.duration = toDamage;
      doll.skill.effects[1].delay = toDamage;
    }
    if (toAcc == 0) {
      return;
    } else {
      doll.skill.effects[1].after.duration = toAcc;
      doll.skill.effects[2].delay = toAcc;
    }
  },
  272: function (doll) {
    //x95
    doll.skill = $.extend(true, {}, dollData[doll.id - 1].skill);
    let missinghp = parseInt($('.x95-skill').val()) || 0;
    missinghp = Math.max(0, missinghp);
    missinghp = Math.min(99, missinghp);
    let skillmodifier = [1.2, 1.4, 1.6, 1.8, 2, 2.2, 2.4, 2.6, 2.8, 3];

    doll.skill.effects[0].multiplier = missinghp * skillmodifier[doll.skilllevel - 1] / 100;
  },
  200: function (doll) {
    //an-94
    let numHits = parseInt($('.an94-skill').val()) || 0;
    doll.passives[0].hits = numHits;
  },
  303: function (doll) {
    //416 mod3
    let targetDies = $('.416mod-skill').prop('checked');
    if (targetDies) {
      doll.skill2.effects[0].delay = 1.5;
      doll.skill2.effects[1].delay = -1;
    } else {
      doll.skill2.effects[0].delay = -1;
      doll.skill2.effects[1].delay = 1.5;
    }
  },
  305: function (doll) {
    //UMP9 mod3
    let targetStunned = $('.UMP9mod-skill').prop('checked');
    if (targetStunned) {
      doll.skill2.effects[0].delay = 1.5;
      doll.skill2.effects[1].delay = -1;
    } else {
      doll.skill2.effects[0].delay = -1;
      doll.skill2.effects[1].delay = 1.5;
    }
  },
  308: function (doll) {
    //Kord
    let isPenetrationMode = $('.kord-skill').prop('checked');
    if (isPenetrationMode) {
      doll.skill.effects[0].target = "self";
      doll.skill.effects[1].target = "none";
    } else {
      doll.skill.effects[0].target = "none";
      doll.skill.effects[1].target = "self";
    }
  },
  297: function (doll) {
    //Dorothy
    doll.skill = $.extend(true, {}, dollData[doll.id - 1].skill);
    let switchTime = Math.max(0, parseInt($('.dorothy-skill').val()) || 0);
    if (switchTime == 0) {
      return;
    } else {
      switchTime = Math.max(2, switchTime);
      doll.skill.effects[0].delay = switchTime;
      doll.skill.effects[1].delay = switchTime;
    }
  },
  330: function (doll) {
    //stechkinmod
    let useEnemyDebuff = $('.stechkinmod-skill').prop('checked');
    if (useEnemyDebuff) {
      doll.skill2.effects[1].target = 'enemy';
    } else {
      doll.skill2.effects[1].target = 'none';
    }
  }
};

const SKILL_CONTROL_HTML = {
  97: function (doll) {
    //ump40
    let value = doll.skill.icd;
    return 'Enter when UMP40\'s skill should be activated (in seconds), then hit apply<br><input class="ump40-icd" type="number" value="' + value + '"><br>Minimum is 1 second due to the initial cooldown. There is no maximum.';
  },
  159: function (doll) {
    //FP-6
    let htmlstring = 'Select the dolls that should receive the two shields/damage buffs from FP-6 then hit apply. (Her skill targets only the dolls in her column but since you can move everyone around in battle, you can pick any doll to receive the buff in this simulator)<br>';
    htmlstring += 'Shield 1:<div class="shield1">';
    for (let i = 0; i < 5; i++) {
      if (echelon[i].id == -1) continue;
      htmlstring += '<input type="radio" name="shield1" value="' + echelon[i].id;
      if (echelon[i] == doll)
        htmlstring += '" checked>' + echelon[i].name + '</input><br>';
      else
        htmlstring += '">' + echelon[i].name + '</input><br>';
    }
    htmlstring += '</div><br>Shield 2:<div class="shield2">';
    for (let i = 0; i < 5; i++) {
      if (echelon[i].id == -1) continue;
      htmlstring += '<input type="radio" name="shield2" value="' + echelon[i].id;
      if (echelon[i] == doll)
        htmlstring += '" checked>' + echelon[i].name + '</input><br>';
      else
        htmlstring += '">' + echelon[i].name + '</input><br>';
    }
    htmlstring += '</div>';

    return htmlstring;
  },
  178: function (doll) {
    //Contender
    let value = doll.skill.icd;
    return 'Enter when Contender\'s skill should be activated (in seconds, before skill cooldown tile effects are applied), then hit apply. Remember that there is a 1 second aiming time.<br><input class="contender-icd" type="number" value="' + value + '"><br>Minimum is 6 seconds due to the initial cooldown. There is no maximum.';
  },
  197: function (doll) {
    //thunder
    let checked = doll.skill.effects[0].delay > 1 ? true : false;
    let htmlstring = 'Check the box if you want Thunder\'s skill to miss the first time, then hit apply.<br><input type="checkbox" class="thunder-skill"';
    if (checked) {
      htmlstring += 'checked>Miss</input>';
    } else {
      htmlstring += '>Miss</input>';
    }
    return htmlstring;
  },
  209: function (doll) {
    //MDR
    let htmlstring = '<p>Since the effects of MDR\'s skill depends on whether or not there is a doll in front of her IN BATTLE, check the box if you want the sim to assume there is a doll in front of her (default, provides shield+evasion bonus to that doll) or not (provides firepower+rate of fire buff to MDR), then hit apply</p>';
    let checked = doll.skill.effects[0].target == 'front' ? true : false;
    if (checked) {
      htmlstring += '<br><input type="checkbox" class="mdr-skill" checked>doll in front of mdr</input>';
    } else {
      htmlstring += '<br><input type="checkbox" class="mdr-skill">doll in front of mdr</input>';
    }
    return htmlstring;
  },
  221: function (doll) {
    //type100
    let htmlstring = '<p>Uncheck the box if you want the shield to break (evasion buff), check the box if you want the shield to stay (default, damage buff), then hit apply.</p>';
    let checked = 'fp' in doll.skill.effects[0].stat ? true : false;
    if (checked) {
      htmlstring += '<br><input type="checkbox" class="t100-skill" checked>Shield does not break</input>';
    } else {
      htmlstring += '<br><input type="checkbox" class="t100-skill">Shield does not break</input>';
    }
    return htmlstring;
  },
  224: function (doll) {
    //m82a1
    let htmlstring = '<p>Each victory in the current mission increases M82A1\'s skill damage by 10% (up to 3 stacks). Select the number of victories in the current mission, then hit apply.</p><br>';
    htmlstring += 'Number of victories in current mission:<select class="m82a1-skill">';
    for (let i = 0; i < 4; i++) {
      htmlstring += '<option value="' + i + '"';
      if (doll.skill.effects[0].victories == i) {
        htmlstring += 'selected>' + i + '</option>';
      } else {
        htmlstring += '>' + i + '</option>';
      }
    }
    htmlstring += '</select>';
    return htmlstring;
  },
  262: function (doll) {
    //g3mod
    let htmlstring = '<p>Check the box if you want the sim to assume targets have more than 50% hp (stun). Uncheck for less than 50% hp (default, grenade damage increase) then hit apply.</p>';
    let morethanhalfhp = doll.skill.buffednade ? false : true;
    if (!morethanhalfhp) {
      htmlstring += '<br><input type="checkbox" class="g3mod-skill">More than 50% hp</input>';
    } else {
      htmlstring += '<br><input type="checkbox" class="g3mod-skill" checked>More than 50% hp</input>';
    }
    return htmlstring;
  },
  276: function (doll) {
    //hs2000
    let htmlstring = '<p>Check the box if you want that doll\'s shield not to break (damage/accuracy buff), uncheck it to break the shield (no buff) then hit apply</p>';
    for (let i = 0; i < 5; i++) {
      if (echelon[i].id == -1) {
        htmlstring += '<input type="checkbox" class="dollindex' + i + '"hidden></input>';
      } else {
        htmlstring += '<input type="checkbox" class="dollindex' + i + '">' + echelon[i].name + '</input><br>';
      }
    }
    return htmlstring;
  },
  228: function (doll) {
    //spr a3g
    let htmlstring = '<p>Check the box if you want the marked target to die while the mark is active (rate of fire buff), uncheck to leave it alive while mark expires (no effect)</p>';
    htmlstring += '<input type="checkbox" class="spra3g-skill">Marked target dies with mark active</input>';
    return htmlstring;
  },
  235: function (doll) {
    //howa
    let htmlstring = '<p>Check the box if you want to assume more than 2 groups of enemies exist after the buff expires (shields allies on tiles) or uncheck if you want to assume 2 or less enemies remain (damage buff for self/allies on tiles) then hit apply</p>';
    htmlstring += '<input type="checkbox" class="howa-skill" checked>More than 2 groups of enemies</input>';
    return htmlstring;
  },
  259: function (doll) {
    //m4a1 mod3
    let htmlstring = '<p>Check the box to have the sim assume only 3 or less dolls are on the field, uncheck otherwise, then hit apply.</p>';
    htmlstring += '<input type="checkbox" class="m4mod3-skill">3 or less dolls on field when skill activates</input>';
    return htmlstring;
  },
  256: function (doll) {
    //mosin-nagant mod3
    let htmlstring = '<p>Make changes then hit apply. Check the box if you want mosin-nagants first skill to kill an enemy (rate of fire buff), uncheck it otherwise. For the second field, enter how often she kills an enemy (provides damage buff). Enter 0 for never (no buff). Example: 1 = every shot kills an enemy, 2 = every other shot kills an enemy, 3 = every 3rd shot, etc etc.</p><br>';
    htmlstring += '<input type="checkbox" class="mosinmod3-skill1">Skill1 kills an enemy</input><br>';
    htmlstring += '<input type="number" value="0" class="mosinmod3-skill2">Number of hits to kill an enemy</input><p></p>';
    return htmlstring;
  },
  208: function (doll) {
    //c-ms
    let htmlstring = '<p>Enter when you would like to activate the skill and switch effects then hit apply.<br>Enter a value of 0 to not switch to that ammunition. Entering 0 for both means C-MS will stay in evasion mode the entire time. Remember there is a 1s cooldown time every time you switch modes.<br></p><br>';
    htmlstring += '<input type="number" class="cms-skill">Enter how many seconds into evasion mode you want to switch into damage mode</input><br>';
    htmlstring += '<input type="number" class="cms-skill2">Enter how many seconds into damage mode you want to switch into accuracy mode</input><br><p></p>';
    return htmlstring;
  },
  272: function (doll) {
    //x95
    let htmlstring = '<p>Enter the percentage of hp missing from the enemy (so if the enemy has 10% hp left, you enter 90 here) then hit apply</p><br>';
    htmlstring += '<input type="number" class="x95-skill">% of hp missing from enemy (min: 0, max:99)</input><p></p>';
    return htmlstring;
  },
  200: function (doll) {
    //an94
    return `<p>Enter how often AN-94's passive should trigger, in number of attacks, then hit apply.
     For example, entering a value of 2 means every other attack will have an extra hit,
     entering a value of 3 means every 3rd attack will have an extra hit, and so on.
     By default, the sim does not trigger her passive.</p><br /><input type="number" class="an94-skill">
      Number of attacks until passive activation</input><p></p>`;
  },
  303: function (doll) {
    //416 mod3
    return `<p>Check the box if 416's grenade should kill the target (extra damage in a 4 unit radius) [default],
     uncheck it if the grenade's target should live (extra damage taken by target + DoT effect)</p><br />
     <input type="checkbox" class="416mod-skill" checked>Grenade kills the main target<p></p>`;
  },
  305: function (doll) {
    //UMP9 mod3
    return `<p>Check the box if UMP9's stun grenade should stun the target (damage buff for same column) [default],
     uncheck it if the target should not be stunned (evasion buff + shield for same column)</p><br />
     <input type="checkbox" class="UMP9mod-skill" checked>Stun grenade stuns the main target<p></p>`;
  },
  308: function (doll) {
    //kord
    return `<p>Check the box if Kord should be in Penetration mode (damage/armor penetration debuff) [default],
     uncheck it if she should be in Assault mode (damage/accuracy buff). Click apply to save.</p><br />
     <input type="checkbox" class="kord-skill" checked>Penetration mode<p></p>`;
  },
  297: function (doll) {
    //dorothy
    return `<p>Enter the number of seconds after which you would like dorothy to switch between Nano-Camouflage mode and MIRD113 mode.
     This will happen only once. Her starting mode is determined by the row she is in. Enter 0 to never switch (default).</p><br />
     <input type="number" class="dorothy-skill">Number of seconds into battle she should switch modes (min 2 because of initial cooldown)</input><br><p></p>`;
  },
  330: function (doll) {
    //stechkinmod
    return `<p>Stechkin's 2nd skill can give an evasion debuff to enemies with less than 30% hp.
    Check the box if you want the sim to apply this debuff to enemies (default), or uncheck it to have the sim not use the debuff.
    Click apply to save.</p><br />
    <input type="checkbox" class="stechkinmod-skill" checked>Apply evasion debuff to enemies<p></p>`;
  }
};

const FAIRY_SKILL_CONTROL_HTML = {
  19: function () {
    let htmlstring = 'The effect from the cooking fairy is random in battle, but for simulation purposes you can select which effect you want here<br>';
    htmlstring += '<div class="effect"><input type="radio" name="effect" value="1" checked>Damage buff</input><br>';
    htmlstring += '<input type="radio" name="effect" value="2">Rate of fire buff</input><br>';
    htmlstring += '<input type="radio" name="effect" value="3">Accuracy buff</input><br>';
    htmlstring += '<input type="radio" name="effect" value="4">Evasion buff</input><br>';
    htmlstring += '<input type="radio" name="effect" value="5">Damage debuff</input><br>';
    return htmlstring;
  },
  31: function () {
    return `Select the number of [Combo] stacks to use, then hit apply.
      <div class="combo-fairy">
        <input type="radio" name="combo-fairy" value ="1" checked>1 stack of [Combo]</input><br />
        <input type="radio" name="combo-fairy" value ="2">2 stacks of [Combo]</input><br />
        <input type="radio" name="combo-fairy" value ="3">3 stacks of [Combo]</input><br />
      </div>`;
  }
};

const FAIRY_SKILL_CONTROL = {
  19: function () {
    fairy.skill = $.extend(true, {}, fairyData[fairy.id - 1].skill);

    let bufftype = parseInt($('#skill-control-body .effect input:checked').val());
    if (bufftype == 1) {
      fairy.skill.effects[0].stat.fp = [8, 9, 10, 11, 12, 13, 14, 16, 18, 20];
    } else if (bufftype == 2) {
      fairy.skill.effects[0].stat.rof = [8, 9, 10, 11, 12, 13, 14, 16, 18, 20];
    } else if (bufftype == 3) {
      fairy.skill.effects[0].stat.acc = [12, 14, 15, 16, 18, 20, 22, 24, 27, 30];
    } else if (bufftype == 4) {
      fairy.skill.effects[0].stat.eva = [10, 12, 13, 14, 15, 16, 18, 20, 22, 25];
    } else if (bufftype == 5) {
      fairy.skill.effects[0].stat.fp = [-15, -14, -13, -12, -11, -10, -8, -5, 0, 0];
    }
  },
  31: function () {
    fairy.skill = $.extend(true, {}, fairyData[fairy.id - 1].skill);

    let numStacks = parseInt($('#skill-control-body .combo-fairy input:checked').val());
    fairy.skill.effects[0].stacks = numStacks;
  }
};



function getNumLinks(dollIndex) {
  let level = parseInt($('#doll' + (dollIndex + 1) + ' .doll-level-select').val());
  if (level >= 90)
    return 5;
  if (level >= 70)
    return 4;
  if (level >= 30)
    return 3;
  if (level >= 10)
    return 2;
  return 1;
}

function getAffectionBonus(affection, mod) {
  if (affection == 0) {
    return -0.05;
  } else if (affection == 1) {
    return 0;
  } else if (affection == 2) {
    return 0.05;
  } else {
    if (mod) {
      return 0.15;
    }
    return 0.10;
  }
}

function onDragEnter(event) {
  $(event.target).addClass('bg-primary dragging');
}

function onDragLeave(event) {
  $(event.target).removeClass('bg-primary dragging');
}

function onDragOver(event) {
  event.preventDefault(); //necessary to trigger drop event
}

function onDragStart(event) {
  event.originalEvent.dataTransfer.setData('text', this.id);
}

function onDrop(event) {
  event.preventDefault();
  $(event.target).removeClass('bg-primary dragging');
  let dropSource = event.originalEvent.dataTransfer.getData('text');
  if ($('#' + dropSource).is($(event.target))) {
    return;
  }

  swapGridPositions($('#' + dropSource), $(event.target));
}

function swapGridPositions(sourceSquare, destinationSquare) {
  let sourceIndex = sourceSquare.attr('data-index');
  let targetIndex = destinationSquare.attr('data-index');

  if (sourceIndex == -1 && targetIndex == -1) {
    return;
  }

  //swap data-index attributes in html elements
  let temp = sourceSquare.attr('data-index');
  sourceSquare.attr('data-index', destinationSquare.attr('data-index'));
  destinationSquare.attr('data-index', temp);

  //swap pos attributes of doll objects in echelon
  if (sourceIndex != -1 && targetIndex != -1) {
    echelon[temp].pos = parseInt(destinationSquare.attr('id').slice(3));
    echelon[sourceSquare.attr('data-index')].pos = parseInt(sourceSquare.attr('id').slice(3));
  } else if (sourceIndex != -1 && targetIndex == -1) {
    echelon[temp].pos = parseInt(destinationSquare.attr('id').slice(3));
  } else if (sourceIndex == -1 && targetIndex != -1) {
    echelon[sourceSquare.attr('data-index')].pos = parseInt(sourceSquare.attr('id').slice(3));
  }

  calculateTileBonus();
  calculatePreBattleStatsAllDolls();
  simulateBattle();
  updateUIAllDolls();
}

function moveDoll(event) {
  if ($(event.target).attr('data-index') == undefined) return;

  let gridSquares = [12, 13, 14, 22, 23, 24, 32, 33, 34];

  if (selectedDoll == undefined) {
    for (let i = 0; i < gridSquares.length; i++) {
      $('#pos' + gridSquares[i]).addClass('bg-primary');
    }
    $(event.target).removeClass('bg-primary');

    selectedDoll = $(event.target);
    return;
  } else {
    for (let i = 0; i < gridSquares.length; i++) {
      $('#pos' + gridSquares[i]).removeClass('bg-primary');
    }

    if ($(event.target).is(selectedDoll)) {
      selectedDoll = undefined;
      return;
    } else {
      swapGridPositions(selectedDoll, $(event.target));
      selectedDoll = undefined;
    }
  }
}

function showDamageGraph() {
  $('#damage-graph-modal').modal('show');

  Highcharts.chart('damage-graph', {
    title: {
      text: 'Damage over Time'
    },
    tooltip: {
      shared: true,
      useHTML: true,
      formatter: function () {
        let output = '<span style="font-size: 10px">' + this.x + '</span><br/>'; //time
        let total = 0;
        $.each(this.points, (index, point) => {
          output += '<span style="color:' + point.color + '">\u25CF</span> ' + point.series.name + ': <b>' + point.y + '</b><br/>'; //each doll's total dmg
          total += point.y;
        });
        output += '<hr>TOTAL: <b>' + total + '</b>';
        return output;
      }
    },
    xAxis: {
      categories: graphData.x,
      title: {
        text: 'Time (seconds)'
      }
    },
    yAxis: {
      title: {
        text: 'Total Damage Done'
      }
    },
    series: graphData.y
  });
}
