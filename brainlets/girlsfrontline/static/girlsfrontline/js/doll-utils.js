const GROWTH_FACTORS = {
  mod: {
    basic: {
      hp: [96.283, 0.138],
      armor: [13.979, 0.04],
      eva: [5],
      acc: [5],
      fp: [16],
      rof: [45],
    },
    grow: {
      eva: [0.075, 22.572],
      acc: [0.075, 22.572],
      fp: [0.06, 18.018],
      rof: [0.022, 15.741]
    }
  },
  normal: {
    basic: {
      hp: [55, 0.555],
      armor: [2, 0.161],
      eva: [5],
      acc: [5],
      fp: [16],
      rof: [45],
    },
    grow: {
      eva: [0.303, 0],
      acc: [0.303, 0],
      fp: [0.242, 0],
      rof: [0.181, 0]
    }
  }
};

const TYPE_MAPPING = {
  1: 'HG',
  2: 'SMG',
  3: 'RF',
  4: 'AR',
  5: 'MG',
  6: 'SG'
};

const TYPE_SCALARS = [
  { hp: 0.6, fp: 0.6, rof: 0.8, acc: 1.2, eva: 1.8, armor: 0 }, //hg
  { hp: 1.6, fp: 0.6, rof: 1.2, acc: 0.3, eva: 1.6, armor: 0 }, //smg
  { hp: 0.8, fp: 2.4, rof: 0.5, acc: 1.6, eva: 0.8, armor: 0 }, //rf
  { hp: 1.0, fp: 1.0, rof: 1.0, acc: 1.0, eva: 1.0, armor: 0 }, //ar
  { hp: 1.5, fp: 1.8, rof: 1.6, acc: 0.6, eva: 0.6, armor: 0 }, //mg
  { hp: 2.0, fp: 0.7, rof: 0.4, acc: 0.3, eva: 0.3, armor: 1 }, //sg
];

const LIST_DPS_SMG = [
  'vector',
  'mp40',
  'sr3mp',
  'klin',
  'vz61', // Skorpion
  'microuzi',
  'z62',
  'm12',
  'ppsh41',
  'pps43',
  'pp2000',
  'stenmk2',
  'evo3',
  'pp19',
  'stenmk2mod',
  'm3',
  'coltscw',
  'x95',
  'pdw', // Honey Badger
  'pm9',
  'microuzimod',
  'mab38mod'
];

const LIST_DPS_SMG_ID = {};

export const dollData = [];

/**
 * Mapping of ID to T-Doll data, preferred over dollData[doll.id - 1]
 */
export const dollDataMap = {};

const SPECIAL_DEFAULT_EQUIPS = { //numbers indicate ID of the equipment
  52: [24, 66, 28], //M16
  54: [4, 8, 24], //SOP
  260: [4, 92, 24], //SOP mod3
  55: [4, 8, 59], //STAR
  261: [4, 71, 59], //STAR mod3
  72: [20, 8, 60], //M1918
  264: [20, 81, 60], // M1918 mod3
  35: [58, 4, 57], //Springfield
  26: [61, 45, 39], //MP5
  56: [62, 24, 35], //AK-47
  64: [62, 24, 35], //Type56-1
  96: [67, 45, 39], //UMP9
  97: [67, 45, 39], //UMP40
  98: [67, 45, 39], //UMP45
  270: [67, 45, 91], //UMP45 mod3
  180: [20, 4, 69], //Ameli
  259: [4, 24, 70], //M4A1 mod3
  252: [39, 72, 35], //M1911 mod3
  268: [73, 45, 39], //IDW mod3
  269: [28, 45, 74], //Type64 mod3
  258: [20, 75, 57], //FN-49 mod3
  41: [20, 4, 79], //PTRD
  256: [20, 80, 65], //Mosin-Nagant mod3
  38: [20, 4, 65], //Mosin-Nagant
  253: [82, 45, 35], //M1895 mod3
  267: [83, 45, 35], //MP446 mod3
  257: [20, 4, 84], //SV-98 mod3
  249: [85, 45, 35], //CLEAR
  250: [86, 45, 35], //FAIL
  251: [88, 45, 35], //SAA mod3
  266: [20, 89, 41], //Bren mod3
  262: [90, 24, 35], //G3 mod3
  254: [28, 45, 94], //STEN mod3
  255: [20, 95, 57], //M14 mod3
  263: [96, 24, 35], //G36 mod3
  265: [20, 97, 41], //LWMMG mod3
  289: [4, 100, 35], //AS Val mod3
  290: [4, 101, 35], //StG44 mod3
  //her molotov is better with EOT instead of her unique equip 291: [35, 45, 102], //Micro Uzi mod3
  292: [111, 49, 12], //Dana
  294: [20, 4, 112], //Stella
  295: [39, 45, 113], //Sei
  296: [107, 108, 109], //Jill
  297: [28, 114, 39], //Dorothy
  293: [20, 8, 115], //Alma
  83: [20, 8, 78],   //MG3
  303: [77, 24, 116], //416 mod3
  304: [61, 45, 117], //MP5 mod3
  305: [67, 45, 118], //UMP9 mod3
  124: [126, 24, 35], //Type95
  125: [126, 24, 35], //Type97
  44: [20, 76, 57],  //Kar98k
  63: [77, 24, 35],  //416
  10: [119, 45, 35], //ppk
  71: [120, 24, 35], //sig510
  153: [31, 121, 12], //ks23
  50: [20, 122, 57], //bm59
  17: [28, 45, 123], //m3
  105: [20, 124, 41], //fg42
  167: [131, 24, 35], //rfb
  221: [28, 45, 132], //type100
  66: [87, 24, 35],  //FAMAS
  329: [35, 45, 133], //mab38mod
  330: [99, 45, 134],   //StechkinMod
  60: [4, 24, 93],   //G41
};

const SPECIAL_DEFAULT_EQUIPS_UNRELEASED = {
  120: [20, 98, 41], //MG4
  7: [99, 45, 35],   //Stechkin
  48: [20, 125, 57], //lee enfield
  18: [35, 45, 127], //ingram
  69: [4, 24, 128], //tar21
  3: [129, 45, 35], //m9
  79: [20, 4, 130], //rpd
};

// Night equips, mostly to give ARs PEQs instead of special equipment
const SPECIAL_DEFAULT_EQUIPS_NIGHT = { //numbers indicate ID of the equipment
  54: [4, 16, 24], //SOP
  55: [4, 16, 59], //STAR
  56: [16, 24, 35], //AK-47
  259: [16, 24, 70], //M4A1 mod3
  260: [4, 16, 24], //SOP mod3
  261: [4, 16, 59], //STAR mod3
  262: [90, 24, 35], //G3 mod3
  263: [16, 24, 35], //G36 mod3
  289: [16, 100, 35], //AS Val mod3
  290: [16, 101, 35], //StG44 mod3
};

const SPECIAL_DEFAULT_EQUIPS_NIGHT_UNRELEASED = { //numbers indicate ID of the equipment
};

export const VALID_EQUIPS = [
  [[4, 13], [6], [10, 12]],          //hg
  [[10, 12], [6], [1, 2, 3, 4, 13]], //smg
  [[5], [1, 2, 3, 13], [15]],        //rf
  [[1, 2, 3, 4, 13], [8], [10, 12]], //ar
  [[5], [1, 2, 3], [14]],            //mg
  [[11], [7, 9], [1, 2, 3, 4]]       //sg
];

export const SPECIAL_VALID_EQUIPS = { //numbers indicate TYPE of the equipment
  133: [-1, 5, -1], //6P62
  208: [-1, 5, -1], //C-MS
  178: [-1, 5, -1],  //Contender
  72: [-1, -1, 18], //M1918
  264: [-1, 39, 18], //M1918
  35: [16, -1, -1], //Springfield
  26: [19, -1, -1], //MP5
  56: [[20, 21, 22], -1, -1], //AK-47
  64: [[20, 21, 22], -1, -1], //Type56-1
  96: [25, -1, -1], //UMP9
  97: [25, -1, -1], //UMP40
  98: [25, -1, -1], //UMP45
  270: [25, -1, 49], //UMP45 mod3
  113: [26, -1, -1], //9A-91
  180: [-1, -1, 27], //Ameli
  259: [-1, -1, 28], //M4A1 mod3
  252: [-1, 30, -1], //M1911 mod3
  268: [31, -1, -1], //IDW mod3
  269: [-1, -1, 32], //Type64 mod3
  258: [-1, 33, -1], //FN-49 mod3
  44: [-1, 34, -1], //Kar98k
  63: [35, -1, -1], //416
  83: [-1, -1, 36], //MG3
  41: [-1, -1, 37], //PTRD
  256: [-1, 38, 23], //Mosin-Nagant mod3
  38: [-1, -1, 23], //Mosin-Nagant
  253: [40, -1, -1], //M1895 mod3
  267: [41, -1, -1], //MP446 mod3
  257: [-1, -1, 42], //SV-98 mod3
  249: [43, -1, -1], //CLEAR
  250: [44, -1, -1], //FAIL
  66: [45, -1, -1], //FAMAS
  251: [46, -1, -1], //SAA mod3
  266: [-1, 47, -1], //Bren mod3
  262: [48, -1, -1], //G3 mod3
  60: [-1, -1, 51], //G41
  254: [-1, -1, 52], //STEN mod3
  255: [-1, 53, -1], //M14 mod3
  263: [54, -1, -1], //G36 mod3
  265: [-1, 55, -1], //LWMMG mod3
  120: [-1, 56, -1], //MG4
  7: [57, -1, -1], //Stechkin
  289: [-1, 58, -1], //AS Val mod3
  290: [-1, 59, -1], //StG44 mod3
  291: [-1, -1, 60], //Micro Uzi mod3
  296: [[61, 64, 65], [62, 63, 66], [68, 67]], //Jill
  292: [69, -1, -1], //Dana
  294: [-1, -1, 70], //Stella
  295: [-1, -1, 71], //Sei
  297: [-1, 72, -1], //Dorothy
  293: [-1, -1, 73], //Alma
  303: [35, -1, 74], //416 mod3
  304: [19, -1, 75], //MP5 mod3
  305: [25, -1, 76], //UMP9 mod3
  10: [77, -1, -1], //PPK
  71: [78, -1, -1], //sig510
  153: [-1, 79, -1], //ks23
  50: [-1, 80, -1], //bm59
  17: [-1, -1, 81], //m3
  105: [-1, 82, -1], //fg42
  48: [-1, 83, -1], //lee enfield
  124: [84, -1, -1], //type95
  125: [84, -1, -1], //type97
  18: [-1, -1, 85], //ingram
  69: [-1, -1, 86], //tar21
  3: [87, -1, -1], //m9
  79: [-1, -1, 88], //rpd
  167: [89, -1, -1], //rfb
  221: [-1, -1, 90], //type100
  329: [-1, -1, 91], //mab38mod
  330: [57, -1, 92],   //StechkinMod
};

export default class dollUtils {
  /**
   * Initialize values.
   */
  static init() {
    this.loadDollData();
  }

  /**
   * Returns object containing stats of the given T-Doll
   * at the provided level.
   *
   * @static
   *
   * @param {Object} dollData - Object with T-Doll data
   * @param {number} level - Level to get the stats for the T-Doll
   *
   * @returns {Object} New object containing attributes
   *   <code>[hp, fp, acc, eva, rof, armor, crit, critdmg, ap, rounds]</code>
   *   for the T-Doll at the specified level.
   */
  static getStatsAtLevel(dollData, level) {
    let dolldummy = {};
    let dollTypeScalars = TYPE_SCALARS[dollData.type - 1];

    let basicFactors = level > 100 ? GROWTH_FACTORS.mod.basic : GROWTH_FACTORS.normal.basic;
    let growFactors = level > 100 ? GROWTH_FACTORS.mod.grow : GROWTH_FACTORS.normal.grow;

    dolldummy.hp = Math.ceil((basicFactors.hp[0] + ((level - 1) * basicFactors.hp[1])) * dollTypeScalars.hp * dollData.hp / 100);

    dolldummy.fp = Math.ceil(basicFactors.fp[0] * dollTypeScalars.fp * dollData.fp / 100);
    dolldummy.fp += Math.ceil((growFactors.fp[1] + ((level - 1) * growFactors.fp[0])) * dollTypeScalars.fp * dollData.fp * dollData.growth_rating / 100 / 100);

    dolldummy.acc = Math.ceil(basicFactors.acc[0] * dollTypeScalars.acc * dollData.acc / 100);
    dolldummy.acc += Math.ceil((growFactors.acc[1] + ((level - 1) * growFactors.acc[0])) * dollTypeScalars.acc * dollData.acc * dollData.growth_rating / 100 / 100);

    dolldummy.eva = Math.ceil(basicFactors.eva[0] * dollTypeScalars.eva * dollData.eva / 100);
    dolldummy.eva += Math.ceil((growFactors.eva[1] + ((level - 1) * growFactors.eva[0])) * dollTypeScalars.eva * dollData.eva * dollData.growth_rating / 100 / 100);

    dolldummy.rof = Math.ceil(basicFactors.rof[0] * dollTypeScalars.rof * dollData.rof / 100);
    dolldummy.rof += Math.ceil((growFactors.rof[1] + ((level - 1) * growFactors.rof[0])) * dollTypeScalars.rof * dollData.rof * dollData.growth_rating / 100 / 100);

    dolldummy.armor = Math.ceil((basicFactors.armor[0] + ((level - 1) * basicFactors.armor[1])) * dollTypeScalars.armor * dollData.armor / 100);

    dolldummy.crit = dollData.crit;
    dolldummy.critdmg = dollData.critdmg;
    dolldummy.ap = dollData.ap;
    dolldummy.rounds = dollData.rounds;

    return dolldummy;
  }

  /**
   * Given the API name of a T-Doll, return its ID.
   *
   * @static
   * @param {string} name - API name of a T-Doll, e.g. "vz61" for Skorpion;
   *   see dolls.json for details.
   * @returns {number} ID of the T-Doll with the specified API name
   * @memberof dollUtils
   */
  static getDollIdFromApiName(name) {
    let match = dollData.find(obj => {
      return obj.api_name == name;
    });
    return match.id;
  }

  /**
   * Loads dolls.json and populates constants.
   *
   * @static
   * @memberof dollUtils
   */
  static loadDollData() {
    let _this = this;
    $.ajax({
      async: false,
      dataType: 'json',
      url: '/static/girlsfrontline/dolls.json',
      success: function (data, status, xhr) {
        dollData.push(...data);

        dollData.forEach(doll => {
          if (doll.uncraftable) {
            doll.construct_time_formatted = 'Uncraftable';
            doll.construct_time_index = 'uncraftable';
          } else {
            if (doll.construct_time !== null) {
              doll.construct_time_formatted = `${('00' + Math.floor(doll.construct_time / 3600)).slice(-2)}:${('00' + Math.floor((doll.construct_time % 3600) / 60)).slice(-2)}:00`;
              doll.construct_time_index = `${('00' + Math.floor(doll.construct_time / 3600)).slice(-2)}${('00' + Math.floor((doll.construct_time % 3600) / 60)).slice(-2)}`;
            } else {
              doll.construct_time_formatted = '';
              doll.construct_time_index = '';
            }
          }
        });

        // map T-Doll data to dollDataMap
        dollData.reduce(function (map, doll) {
          map[doll.id] = doll;
          return map;
        }, dollDataMap);

        // populate list of DPS SMGs to LIST_DPS_SMG_ID
        LIST_DPS_SMG.reduce((map, name) => {
          map[_this.getDollIdFromApiName(name)] = name;
          return map;
        }, LIST_DPS_SMG_ID);
      },
      error: function (xhr, status, err) {
        console.log(status);
        console.log(err);
        return {};
      }
    });
  }

  /**
   * Given a doll object, set its equips to the recommended default equipment.
   *
   * @static
   *
   * @param {Object} doll - Doll object, which will be modified by this method
   * @param {boolean} isNight - If set to true, units will default to using optimized night battle equipment.
   * @param {boolean} [useUnreleasedEquips=true] - If set to true, will use default equips that are not released on EN yet
   * @memberof dollUtils
   */
  static setDefaultEquips(doll, isNight, useUnreleasedEquips = true) {
    switch (doll.type) {
      case 1: //hg
        doll.equip1 = 39; //suppressor
        doll.equip2 = 45; //hp ammo
        doll.equip3 = 35; //X-exo
        if (isNight) {
          doll.equip1 = 16; //PEQ
        }
        break;
      case 2: //smg
        doll.equip1 = doll.id in LIST_DPS_SMG_ID ? 35 : 28; //T-exo, or X-exo if considered DPS
        doll.equip2 = 45; //hp ammo
        doll.equip3 = doll.id in LIST_DPS_SMG_ID ? 8 : 39; //Suppressor, or EOT if considered DPS
        break;
      case 3: //rf
        doll.equip1 = 20; //ap ammo
        doll.equip2 = 4;  //scope
        doll.equip3 = 57; //cape
        break;
      case 4: //ar
        doll.equip1 = 4;  //scope
        doll.equip2 = 24; //hv ammo
        doll.equip3 = 35; //X-exo
        if (isNight) {
          doll.equip1 = 16; //PEQ
        }
        break;
      case 5: //mg
        doll.equip1 = 20; //ap ammo
        doll.equip2 = 4;  //scope
        doll.equip3 = 41; //ammo box
        break;
      case 6: //sg
        doll.equip1 = 31; //armor
        doll.equip2 = 49; //buckshot
        doll.equip3 = 12; //red dot sight
        if (isNight) {
          doll.equip3 = 16; //PEQ
        }
        break;
    }

    if (doll.id in SPECIAL_DEFAULT_EQUIPS) {
      if (isNight && (doll.id in SPECIAL_DEFAULT_EQUIPS_NIGHT)) {
        doll.equip1 = SPECIAL_DEFAULT_EQUIPS_NIGHT[doll.id][0];
        doll.equip2 = SPECIAL_DEFAULT_EQUIPS_NIGHT[doll.id][1];
        doll.equip3 = SPECIAL_DEFAULT_EQUIPS_NIGHT[doll.id][2];
      } else {
        doll.equip1 = SPECIAL_DEFAULT_EQUIPS[doll.id][0];
        doll.equip2 = SPECIAL_DEFAULT_EQUIPS[doll.id][1];
        doll.equip3 = SPECIAL_DEFAULT_EQUIPS[doll.id][2];
      }
    } else if (useUnreleasedEquips && doll.id in SPECIAL_DEFAULT_EQUIPS_UNRELEASED) {
      doll.equip1 = SPECIAL_DEFAULT_EQUIPS_UNRELEASED[doll.id][0];
      doll.equip2 = SPECIAL_DEFAULT_EQUIPS_UNRELEASED[doll.id][1];
      doll.equip3 = SPECIAL_DEFAULT_EQUIPS_UNRELEASED[doll.id][2];
    }
  }
}
