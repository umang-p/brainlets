var echelon;
var isNight;
var isBoss;
var equipData;
var dollData;
var enemyEva;
var enemyArmor;
var enemyCount;
var graphData;
var showBuffedStats;
const VALID_EQUIPS = [[[4,13],[6],[10,12]], //hg
                    [[10,12],[6],[1,2,3,4,13]],//smg
                    [[5],[1,2,3,13],[15]],//rf
                    [[1,2,3,4,13],[8],[10,12]],//ar
                    [[5],[1,2,3],[14]],//mg
                    [[11],[7,9],[1,2,3,4]]]; //sg

const TYPE_SCALARS = [{hp:0.6,fp:0.6,rof:0.8,acc:1.2,eva:1.8,armor:0}, //hg
                    {hp:1.6,fp:0.6,rof:1.2,acc:0.3,eva:1.6,armor:0}, //smg
                    {hp:0.8,fp:2.4,rof:0.5,acc:1.6,eva:0.8,armor:0}, //rf
                    {hp:1,  fp:1,  rof:1,  acc:1,  eva:1,  armor:0},   //ar
                    {hp:1.5,fp:1.8,rof:1.6,acc:0.6,eva:0.6,armor:0}, //mg
                    {hp:2.0,fp:0.7,rof:0.4,acc:0.3,eva:0.3,armor:1}]; //sg

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

const SPECIAL_DEFAULT_EQUIPS = { //numbers indicate ID of the equipment
  52:[24,66,28], //M16
  54:[4,8,24], //SOP
  260:[4,92,24], //SOP mod3
  55:[4,8,59], //STAR
  261:[4,71,59], //STAR mod3
  72:[20,8,60], //M1918
  264:[20,81,60], // M1918 mod3
  35:[58,4,57], //Springfield
  26:[61,45,39], //MP5
  56:[62,24,35], //AK-47
  64:[62,24,35], //Type56-1
  // 96:[67,45,39], //UMP9
  // 97:[67,45,39], //UMP40
  // 98:[67,45,39], //UMP45
  270:[67,45,91], //UMP45 mod3
  180:[20,4,69], //Ameli
  259:[4,24,70], //M4A1 mod3
  252:[39,72,35], //M1911 mod3
  268:[73,45,39], //IDW mod3
  269:[28,45,74], //Type64 mod3
  258:[20,75,57], //FN-49 mod3
  // 44:[20,76,57], //Kar98k
  // 63:[77,24,35], //416
  // 83:[20,8,78], //MG3
  // 41:[20,4,79], //PTRD
  256:[20,80,65], //Mosin-Nagant mod3
  38:[20,4,65], //Mosin-Nagant
  253:[82,45,35], //M1895 mod3
  267:[83,45,35], //MP446 mod3
  257:[20,4,84], //SV-98 mod3
  249:[85,45,35], //CLEAR
  250:[86,45,35], //FAIL
  // 66:[87,24,35], //FAMAS
  251:[88,45,35], //SAA mod3
  266:[20,89,41], //Bren mod3
  262:[90,24,35], //G3 mod3
  // 60:[4,24,93], //G41
  254:[28,45,94], //STEN mod3
  255:[20,95,57], //M14 mod3
  263:[96,24,35], //G36 mod3
  265:[20,97,41], //LWMMG mod3
};

const SPECIAL_VALID_EQUIPS = { //numbers indicate TYPE of the equipment
  133:[-1,5,-1], //6P62
  208:[-1,5,-1], //C-MS
  178:[-1,5,-1],  //Contender
  72:[-1,-1,18], //M1918
  264:[-1,39,18], //M1918
  35:[16,-1,-1], //Springfield
  26:[19,-1,-1], //MP5
  56:[[20,21,22],-1,-1], //AK-47
  64:[[20,21,22],-1,-1], //Type56-1
  96:[25,-1,-1], //UMP9
  97:[25,-1,-1], //UMP40
  98:[25,-1,-1], //UMP45
  270:[25,-1,49], //UMP45 mod3
  113:[26,-1,-1], //9A-91
  180:[-1,-1,27], //Ameli
  259:[-1,-1,28], //M4A1 mod3
  252:[-1,30,-1], //M1911 mod3
  268:[31,-1,-1], //IDW mod3
  269:[-1,-1,32], //Type64 mod3
  258:[-1,33,-1], //FN-49 mod3
  44:[-1,34,-1], //Kar98k
  63:[35,-1,-1], //416
  83:[-1,-1,36], //MG3
  41:[-1,-1,37], //PTRD
  256:[-1,38,23], //Mosin-Nagant mod3
  38:[-1,-1,23], //Mosin-Nagant
  253:[40,-1,-1], //M1895 mod3
  267:[41,-1,-1], //MP446 mod3
  257:[-1,-1,42], //SV-98 mod3
  249:[43,-1,-1], //CLEAR
  250:[44,-1,-1], //FAIL
  66:[45,-1,-1], //FAMAS
  251:[46,-1,-1], //SAA mod3
  266:[-1,47,-1], //Bren mod3
  262:[48,-1,-1], //G3 mod3
  60:[-1,-1,51], //G41
  254:[-1,-1,52], //STEN mod3
  255:[-1,53,-1], //M14 mod3
  263:[54,-1,-1], //G36 mod3
  265:[-1,55,-1], //LWMMG mod3
};

$(function () {
  $.ajax({
    async: false,
    dataType: 'json',
    url: '/static/girlsfrontline/equips.json',
    success: function(data, status, xhr) {
      equipData = data;
    },
    error: function(xhr, status, err) {
      console.log(status);
      console.log(err);
    }
  });

  $.ajax({
    async: false,
    dataType: 'json',
    url: '/static/girlsfrontline/dolls.json',
    success: function(data, status, xhr) {
      dollData = data;
    },
    error: function(xhr, status, err) {
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

  showBuffedStats = false;
  $('#buffed-stats-toggle').change(toggleBuffedStats);

  initEquipSelectModal();
  initDollSelectModal();

  for(var i = 1; i <= 5; i++) {
    $('#doll'+i+' .add-doll').click(i,selectDoll);
    $('#doll'+i+' .remove-doll').click(i,removeDoll);
    $('#doll'+i+' .doll-level-select').change(i-1,changeLevel);
    $('#doll'+i+' .skill-level-select').change(i-1,changeSkillLevel);
    $('#doll'+i+' .skill2-level-select').change(i-1,changeSkill2Level);
    $('#doll'+i+' .skill-toggle').change(i-1,toggleSkillUsage);
    $('#doll'+i+' .affection').click(i-1, changeAffection);
    for(var j = 1; j <= 3; j++) {
      $('#doll'+i+' .equip'+j).click({doll:i-1, equip:j}, selectEquipment);
      $('#doll'+i+' .equip'+j+'-level-select').change(i-1, changeEquipLevel);
    }
  }

  var gridSquares = [12,13,14,22,23,24,32,33,34];
  for(i = 0; i < gridSquares.length; i++) {
    $('#pos'+gridSquares[i]).on('dragstart', onDragStart);
    $('#pos'+gridSquares[i]).on('dragenter', onDragEnter);
    $('#pos'+gridSquares[i]).on('dragleave', onDragLeave);
    $('#pos'+gridSquares[i]).on('dragover', onDragOver);
    $('#pos'+gridSquares[i]).on('drop', onDrop);
  }

  $('#enemy-eva').change(changeEnemyStats);
  enemyEva = 15;
  $('#enemy-armor').change(changeEnemyStats);
  enemyArmor = 0;
  $('#enemy-count').change(changeEnemyStats);
  enemyCount = 3;

  $('#damage-graph-btn').click(showDamageGraph);

  $('[data-toggle="tooltip"]').tooltip({trigger:'hover'});
});

function initEchelon() {
  echelon = [createDummyDoll(12),
              createDummyDoll(22),
              createDummyDoll(32),
              createDummyDoll(13),
              createDummyDoll(23)];
}

function createDummyDoll(p) {
  var obj;
  obj = {
    id:-1,
    pos:p,
    name:'',
    affection:2,
    tiles:{},
    equip1:-1,
    equip2:-1,
    equip3:-1,
    base:{},
    pre_battle:{},
    battle:{},
    equip_bonus:{},
    tile_bonus:{}
  }

  return obj;
}

function initDollSelectModal() {
  var doll_types = ['All','HG','SMG','RF','AR','MG','SG'];
  for(var i = 0; i < dollData.length; i++) {
    var doll = dollData[i];
    $('#doll-list-'+doll.type+' .stars'+doll.rarity).append('<button type="button" class="btn mb-1 mr-1" data-id="'+doll.id+'" data-toggle="tooltip" data-placement="top" data-html="true" data-original-title="'+doll.tooltip_tiles+' Affects: '+doll_types[doll.tiles.target_type]+'<br>'+doll.tooltip_skill1+'<br>'+doll.tooltip_skill2+'">'+doll.name+'</button>');
  }
}

function initEquipSelectModal() {
  for(var i = 0; i < equipData.length; i++) {
    var equip = equipData[i];
    $('#equip-select .stars'+equip.rarity).append('<button type="button" class="btn mb-1 mr-1" data-id="'+equip.id+'" data-type="'+equip.type+'" data-toggle="tooltip" data-placement="top" data-original-title="'+equip.tooltip+'"><img src="/static/girlsfrontline/sim/equips/'+equip.type+'.png" class="img-fluid"></img></button>');
  }
}

function changeEnemyStats() {
  enemyEva = Math.max(0, parseInt($('#enemy-eva').val()));
  enemyArmor = Math.max(0, parseInt($('#enemy-armor').val()));
  enemyCount = Math.max(1, parseInt($('#enemy-count').val()));

  simulateBattle();
}

function changeAffection(event) {
  var dollIndex = event.data;
  var doll = echelon[dollIndex];

  $('#doll'+(dollIndex+1)+' .affection').children().eq(doll.affection).prop('hidden', true);
  doll.affection++;
  doll.affection = doll.affection > 3 ? 0 : doll.affection;
  $('#doll'+(dollIndex+1)+' .affection').children().eq(doll.affection).prop('hidden', false);

  calculatePreBattleStatsForDoll(dollIndex);
  simulateBattle();
  updateUIForDoll(dollIndex);
}

function toggleDayNight(event) {
  if(isNight && $(event.target).attr('id').startsWith('day')) {
    $('#night-btn').removeClass('btn-success');
    $('#day-btn').addClass('btn-success');
    isNight = false;
  }
  if(!isNight && $(event.target).attr('id').startsWith('night')) {
    $('#day-btn').removeClass('btn-success');
    $('#night-btn').addClass('btn-success');
    isNight = true;
  }

  calculatePreBattleStatsAllDolls();
  simulateBattle();
  updateUIAllDolls();
}

function toggleBoss() {
  if(isBoss) {
    $('#boss-toggle').removeClass('btn-success');
    isBoss = false;
  } else {
    $('#boss-toggle').addClass('btn-success');
    isBoss = true;
  }

  simulateBattle();
}

function toggleBuffedStats() {
  showBuffedStats = $('#buffed-stats-toggle').prop('checked');

  updateUIAllDolls();
}

function selectEquipment(event) {
  event.preventDefault();
  $('#equip-select button').off('click');
  $('#equip-select button').click(event.data, changeEquipment);
  $('#remove-equip').off('click');
  $('#remove-equip').click(event.data, removeEquipment);

  //show buttons for only equips that can be worn by current doll in current slot taking level into account
  $('#equip-select [data-id]').prop('hidden', true);
  var validTypes = getValidEquipTypes(event.data.doll, event.data.equip);
  var dollLevel = parseInt($('#doll'+(event.data.doll+1)+' .doll-level-select').val());
  if(dollLevel < 20) {
    validTypes = [-1];
  } else if(dollLevel < 50 && event.data.equip != 1) {
    validTypes = [-1];
  } else if(dollLevel < 80 && event.data.equip == 3) {
    validTypes = [-1];
  }
  for(var i = 0; i < validTypes.length; i++) {
    $('#equip-select [data-type='+validTypes[i]+']').prop('hidden', false);
  }

  //hide unequipable rarities
  if(dollLevel < 60)
    $('#equip-select .stars5 button').prop('hidden',true);
  if(dollLevel < 45)
    $('#equip-select .stars4 button').prop('hidden',true);
  if(dollLevel < 30)
    $('#equip-select .stars3 button').prop('hidden',true);

  $('#equip-select').modal('show');
}

function getValidEquipTypes(dollIndex, equipSlot) {
  var doll = echelon[dollIndex];

  if(doll.id == -1) {
    return [-1];
  }

  var validTypes = [];
  $.each(VALID_EQUIPS[doll.type-1][equipSlot-1], (index,value) => {
    validTypes.push(value);
  });

  if(doll.id in SPECIAL_VALID_EQUIPS) {
    if($.isArray(SPECIAL_VALID_EQUIPS[doll.id][equipSlot-1])) {
      $.each(SPECIAL_VALID_EQUIPS[doll.id][equipSlot-1], (index,value) => {
        validTypes.push(value);
      });
    } else {
      validTypes.push(SPECIAL_VALID_EQUIPS[doll.id][equipSlot-1]);
    }
  }

  //M16
  if(doll.id == 52) {
    if(equipSlot == 1) {
      return [8]; //hv ammo
    }
    if(equipSlot == 2 || equipSlot == 3) {
      validTypes = [10,11,12,24]; //x-exo, armor, t-exo, m16 unique armor

      //ensure same accessory cannot be equipped twice
      var otherSlotEquipID = equipSlot == 2 ? doll.equip3 : doll.equip2;
      if(otherSlotEquipID != -1) {
        validTypes = validTypes.filter(type => type != equipData[otherSlotEquipID-1].type);
        if(equipData[otherSlotEquipID-1].type == 10) {
          validTypes = validTypes.filter(type => type != 12); //exo
        }
        if(equipData[otherSlotEquipID-1].type == 12) {
          validTypes = validTypes.filter(type => type != 10); //exo
        }
        if(equipData[otherSlotEquipID-1].type == 24) {
          validTypes = validTypes.filter(type => type != 11); //armor + special armor
        }
        if(equipData[otherSlotEquipID-1].type == 11) {
          validTypes = validTypes.filter(type => type != 24); //armor + special armor
        }
      }
      return validTypes;
    }
  }

  //SOP and SOP mod3
  if(doll.id == 54 || doll.id == 260) {
    if(equipSlot == 1 || equipSlot == 2) {
      validTypes = [1,2,3,4,13]; //scope, eot, red dot sight, PEQ, suppressor
      if(doll.id == 260)
        validTypes.push(50); //sop unique equip

      //ensure same accessory cannot be equipped twice
      var otherSlotEquipID = equipSlot == 1 ? doll.equip2 : doll.equip1;
      if(otherSlotEquipID != -1) {
        validTypes = validTypes.filter(type => type != equipData[otherSlotEquipID-1].type);
      }
      return validTypes;
    }
    if(equipSlot == 3) {
      return [8]; //hv ammo
    }
  }

  //STAR and STAR mod3
  if(doll.id == 55 || doll.id == 261) {
    if(equipSlot == 1 || equipSlot == 2) {
      validTypes = [1,2,3,4,13]; //scope, eot, red dot sight, PEQ, suppressor
      if(doll.id == 261)
        validTypes.push(29); //star mod3 unique equip

      //ensure same accessory cannot be equipped twice
      var otherSlotEquipID = equipSlot == 1 ? doll.equip2 : doll.equip1;
      if(otherSlotEquipID != -1) {
        validTypes = validTypes.filter(type => type != equipData[otherSlotEquipID-1].type);
      }
      return validTypes;
    }
    if(equipSlot == 3) {
      return [8,17]; //hv ammo and star unique black ammo
    }
  }

  return validTypes;
}

function changeEquipment(event) {
  $('#equip-select').modal('hide');

  var dollIndex = event.data.doll;
  var equipSlot = event.data.equip;

  echelon[dollIndex]['equip'+equipSlot] = parseInt($(event.target).attr('data-id'));
  $('#doll'+(dollIndex+1)+' .equip'+equipSlot+'-level-select').val(10);

  if(echelon[dollIndex].type == 6) {
    if(equipData[echelon[dollIndex]['equip'+equipSlot]-1].type == 7) {
      echelon[dollIndex].hasSlug = true;
    } else {
      echelon[dollIndex].hasSlug = false;
    }
  }

  calculateEquipBonus(dollIndex);
  calculatePreBattleStatsForDoll(dollIndex);
  simulateBattle();
  updateUIForDoll(dollIndex);
}

function changeEquipLevel(event) {
  var doll = echelon[event.data];

  calculateEquipBonus(event.data);
  calculatePreBattleStatsForDoll(event.data);
  simulateBattle();
  updateUIAllDolls();
}

function removeEquipment(event) {
  $('#equip-select').modal('hide');
  var dollIndex = event.data.doll;
  var equipSlot = event.data.equip;

  echelon[dollIndex]['equip'+equipSlot] = -1;

  if(echelon[dollIndex].type == 6 && equipSlot == 2) {
    echelon[dollIndex].hasSlug = false;
  }


  calculateEquipBonus(dollIndex);
  calculatePreBattleStatsForDoll(dollIndex);
  simulateBattle();
  updateUIForDoll(dollIndex);
}

function selectDoll(event) {
  event.preventDefault();
  $('#doll-select button').off('click');
  $('#doll-select button').click(event.data, changeDoll);

  $('#doll-select button').prop('disabled', false);
  for(var i = 0; i < echelon.length; i++) {
    $('#doll-select button[data-id='+echelon[i].id+']').prop('disabled', true);
  }

  $('#doll-select').modal('show');
}

function changeDoll(event) {
  $('#doll-select').modal('hide');

  var selectedDoll = dollData[$(event.target).attr('data-id')-1];
  var index = event.data-1;

  echelon[index] = createDummyDoll(echelon[index].pos);
  echelon[index].name = selectedDoll.name;
  echelon[index].id = selectedDoll.id;
  echelon[index].type = selectedDoll.type;
  echelon[index].tiles = selectedDoll.tiles;
  echelon[index].tooltip_tiles = selectedDoll.tooltip_tiles;
  echelon[index].skill = selectedDoll.skill;
  echelon[index].tooltip_skill1 = selectedDoll.tooltip_skill1;
  echelon[index].links = getNumLinks(index);

  if(selectedDoll.type == 5) { //mg
    echelon[index].frames_per_attack = selectedDoll.frames_per_attack;
  }
  if(selectedDoll.type == 6) { //sg
    echelon[index].targets = 3;
  }

  if('passives' in selectedDoll) {
    echelon[index].passives = selectedDoll.passives;
  }

  $('#pos'+echelon[index].pos).attr('data-index', index);

  if(selectedDoll.mod) {
    $('#doll'+(index+1)+' .doll-level-select').children().prop('disabled', true);
    $('#doll'+(index+1)+' .doll-level-select').children().filter(':first').prop('disabled', false);
    $('#doll'+(index+1)+' .doll-level-select').val(115);
    $('#doll'+(index+1)+' .skill2-level-select').val(10);
    echelon[index].tooltip_skill2 = selectedDoll.tooltip_skill2;
    echelon[index].skill2 = selectedDoll.skill2;
    echelon[index].skill2level = 10;
    echelon[index].mod = true;
  } else {
    $('#doll'+(index+1)+' .doll-level-select').children().prop('disabled', false);
    $('#doll'+(index+1)+' .doll-level-select').children().filter(':first').prop('disabled', true);
    $('#doll'+(index+1)+' .doll-level-select').val(100);
    echelon[index].mod = false;
  }

  $('#doll'+(index+1)+' .skill-level-select').val(10);
  $('#doll'+(index+1)+' .skill-toggle').prop('checked', true);
  echelon[index].useSkill = true;
  echelon[index].skilllevel = 10;

  calculateBaseStats(index);
  setDefaultEquips(index);
  calculateEquipBonus(index);
  calculateTileBonus();
  calculatePreBattleStatsAllDolls();
  simulateBattle();
  updateUIAllDolls();
}

function changeLevel(event) {
  var doll = echelon[event.data];

  if(doll.id == -1) {
    return;
  }

  //remove equipment if it can no longer be equipped
  var dollLevel = parseInt($('#doll'+(event.data+1)+' .doll-level-select').val());
  if(dollLevel < 80 && doll.equip3 != -1)
    doll.equip3 = -1;
  if(dollLevel < 50 && doll.equip2 != -1)
    doll.equip2 = -1;
  if(dollLevel < 20 && doll.equip1 != -1)
    doll.equip1 = -1;

  for(var i = 1; i <= 3; i++) {
    if(doll['equip'+i] == -1)
      continue;

    if(dollLevel < 30 && equipData[doll['equip'+i]-1].rarity >= 3) {
      doll['equip'+i] = -1;
      continue;
    } else if(dollLevel < 45 && equipData[doll['equip'+i]-1].rarity >= 4) {
      doll['equip'+i] = -1;
      continue;
    } else if(dollLevel < 60 && equipData[doll['equip'+i]-1].rarity >= 5) {
      doll['equip'+i] = -1;
    }
  }

  doll.links = getNumLinks(event.data);

  calculateBaseStats(event.data);
  calculateEquipBonus(event.data);
  if(doll.type == 1) { //hg
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

  var index = event.data-1;
  $('#pos'+echelon[index].pos).attr('data-index', index);
  echelon[index] = createDummyDoll(echelon[index].pos);
  $('#doll'+(index+1)+' .doll-level-select').children().prop('disabled', false);
  $('#doll'+(index+1)+' .doll-level-select').children().filter(':first').prop('disabled', true);
  $('#doll'+(index+1)+' .doll-level-select').val(100);

  calculateTileBonus();
  calculatePreBattleStatsAllDolls();
  simulateBattle();
  updateUIAllDolls();
}

function setDefaultEquips(dollIndex) {
  var doll = echelon[dollIndex];
  $('#doll'+(dollIndex+1)+' .equip1-level-select').val(10);
  $('#doll'+(dollIndex+1)+' .equip2-level-select').val(10);
  $('#doll'+(dollIndex+1)+' .equip3-level-select').val(10);

  switch(doll.type) {
    case 1: //hg
      doll.equip1 = 39; //suppressor
      doll.equip2 = 45; //hp ammo
      doll.equip3 = 35; //X-exo
      if(isNight) {
        doll.equip1 = 16; //PEQ
      }
      break;
    case 2: //smg
      doll.equip1 = 28; //T-exo
      doll.equip2 = 45; //hp ammo
      doll.equip3 = 39; //suppressor (no point using peq on main tank)
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
      if(isNight) {
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
      if(isNight) {
        doll.equip3 = 16; //PEQ
      }
      break;
  }

  if(doll.id in SPECIAL_DEFAULT_EQUIPS) {
    doll.equip1 = SPECIAL_DEFAULT_EQUIPS[doll.id][0];
    doll.equip2 = SPECIAL_DEFAULT_EQUIPS[doll.id][1];
    doll.equip3 = SPECIAL_DEFAULT_EQUIPS[doll.id][2];
  }
}

function changeSkillLevel(event) {
  echelon[event.data].skilllevel = parseInt($('#doll'+(event.data+1)+' .skill-level-select').val());

  simulateBattle();
  updateUIAllDolls();
}

function changeSkill2Level(event) {
  echelon[event.data].skill2level = parseInt($('#doll'+(event.data+1)+' .skill2-level-select').val());

  simulateBattle();
  updateUIAllDolls();
}

function toggleSkillUsage(event) {
  echelon[event.data].useSkill = $('#doll'+(event.data+1)+' .skill-toggle').prop('checked');

  simulateBattle();
  updateUIAllDolls();
}

function updateUIAllDolls() {
  for(var i = 0; i < echelon.length; i++) {
    updateUIForDoll(i); //update stat card and grid for each doll
  }

  //update ui for grid squares with no doll
  $.each([12,13,14,22,23,24,32,33,34], function(index, value) {
    if($('#pos'+value).attr('data-index') != -1) {
      return true;
    }
    $('#pos'+value+' > img').attr('src', '/static/girlsfrontline/sim/placeholder.png');
    $('#pos'+value+' .tilegrid').prop('hidden', true);
    var tile_bonuses = ['fp','acc','eva','rof','crit','skillcd','armor'];
    for(i = 0; i < tile_bonuses.length; i++) {
      $('#pos'+value+' .'+tile_bonuses[i]).prop('hidden', true);
    }
  });
}

function updateUIForDoll(index) {
  var doll = echelon[index];
  if(doll.id == -1) {
    $('#pos'+doll.pos+' > img').attr('src', '/static/girlsfrontline/sim/placeholder.png');
    $('#pos'+doll.pos+' .tilegrid').prop('hidden', true);
    $('#doll'+(index+1)+' .skill-label').attr('data-original-title', '-');
    $('#doll'+(index+1)+' .skill2').css('visibility', 'hidden');
    $('#doll'+(index+1)+' .skill-toggle').prop('checked', true);
    $('#doll'+(index+1)+' .skill-level-select').val(10);
    $('#doll'+(index+1)+'-name').text('-');
    $('#doll'+(index+1)+' .hp span').text('-');
    $('#doll'+(index+1)+' .fp span').text('-');
    $('#doll'+(index+1)+' .acc span').text('-');
    $('#doll'+(index+1)+' .eva span').text('-');
    $('#doll'+(index+1)+' .rof span').text('-');
    $('#doll'+(index+1)+' .crit span').text('-');
    $('#doll'+(index+1)+' .critdmg span').text('-');
    $('#doll'+(index+1)+' .rounds span').text('-');
    $('#doll'+(index+1)+' .armor span').text('-');
    $('#doll'+(index+1)+' .ap span').text('-');
  } else {
    $('#doll'+(index+1)+'-name').text(doll.name);
    $('#doll'+(index+1)+' .affection').children().prop('hidden', true);
    $('#doll'+(index+1)+' .affection').children().eq(doll.affection).prop('hidden', false);
    $('#doll'+(index+1)+' .skill-label').attr('data-original-title', doll.tooltip_skill1);
    if(doll.mod) {
      $('#doll'+(index+1)+' .skill2').css('visibility', 'visible');
      $('#doll'+(index+1)+' .skill2-label').attr('data-original-title', doll.tooltip_skill2);
    } else {
      $('#doll'+(index+1)+' .skill2').css('visibility', 'hidden');
    }

    if(showBuffedStats) {
      $('#doll'+(index+1)+' .fp span').text(doll.battle.maxstats.fp);
      $('#doll'+(index+1)+' .acc span').text(doll.battle.maxstats.acc);
      $('#doll'+(index+1)+' .eva span').text(doll.battle.maxstats.eva);
      $('#doll'+(index+1)+' .rof span').text(doll.battle.maxstats.rof);
      $('#doll'+(index+1)+' .crit span').text(doll.battle.maxstats.crit+'%');
      $('#doll'+(index+1)+' .critdmg span').text((doll.battle.maxstats.critdmg+100)+'%');
      if(doll.battle.maxstats.rounds != 0) {
        $('#doll'+(index+1)+' .rounds span').text(doll.battle.maxstats.rounds);
      } else {
        $('#doll'+(index+1)+' .rounds span').text('-');
      }
      if(doll.battle.maxstats.armor != 0) {
        $('#doll'+(index+1)+' .armor span').text(doll.battle.maxstats.armor);
      } else {
        $('#doll'+(index+1)+' .armor span').text('-');
      }
      $('#doll'+(index+1)+' .ap span').text(doll.battle.maxstats.ap);
    } else {
      $('#doll'+(index+1)+' .fp span').text(doll.pre_battle.fp);
      $('#doll'+(index+1)+' .acc span').text(doll.pre_battle.acc);
      $('#doll'+(index+1)+' .eva span').text(doll.pre_battle.eva);
      $('#doll'+(index+1)+' .rof span').text(doll.pre_battle.rof);
      $('#doll'+(index+1)+' .crit span').text(doll.pre_battle.crit+'%');
      $('#doll'+(index+1)+' .critdmg span').text((doll.pre_battle.critdmg+100)+'%');
      if(doll.pre_battle.rounds != 0) {
        $('#doll'+(index+1)+' .rounds span').text(doll.pre_battle.rounds);
      } else {
        $('#doll'+(index+1)+' .rounds span').text('-');
      }
      if(doll.pre_battle.armor != 0) {
        $('#doll'+(index+1)+' .armor span').text(doll.pre_battle.armor);
      } else {
        $('#doll'+(index+1)+' .armor span').text('-');
      }
      $('#doll'+(index+1)+' .ap span').text(doll.pre_battle.ap);
    }

    $('#doll'+(index+1)+' .hp span').text(doll.pre_battle.hp);


    $('#pos'+doll.pos+' > img').attr('src', '/static/girlsfrontline/sim/dolls/'+doll.id+'.png');

    $('#pos'+doll.pos+' .tilegrid').prop('hidden', false);
    $('#pos'+doll.pos+' .tilegrid').attr('data-original-title', doll.tooltip_tiles);
    var targetSquares = doll.tiles.target.split(',');
    $('#pos'+doll.pos+' .tilegrid-col').removeClass('tilegrid-target tilegrid-neutral tilegrid-self');
    $('#pos'+doll.pos+' .tile'+doll.tiles.self).addClass('tilegrid-self');
    for(var i = 0; i < targetSquares.length; i++) {
      $('#pos'+doll.pos+' .tile'+(doll.tiles.self+parseInt(targetSquares[i]))).addClass('tilegrid-target');
    }
    $.each([12,13,14,22,23,24,32,33,34], function(index, value) {
      if(!$('#pos'+doll.pos+' .tile'+value).hasClass('tilegrid-self') && !$('#pos'+doll.pos+' .tile'+value).hasClass('tilegrid-target')) {
        $('#pos'+doll.pos+' .tile'+value).addClass('tilegrid-neutral');
      }
    });
  }

  var tile_bonuses = ['fp','acc','eva','rof','crit','skillcd','armor'];
  for(i = 0; i < tile_bonuses.length; i++) {
    if(doll.tile_bonus[tile_bonuses[i]] > 0) {
      $('#pos'+doll.pos+' .'+tile_bonuses[i]+' small').text(doll.tile_bonus[tile_bonuses[i]]+'%');
      $('#pos'+doll.pos+' .'+tile_bonuses[i]).prop('hidden', false);
    } else {
      $('#pos'+doll.pos+' .'+tile_bonuses[i]).prop('hidden', true);
    }
  }

  for(i = 1; i <= 3; i++) {
    var equipId = doll['equip'+i];
    if(equipId == -1) {
      $('#doll'+(index+1)+' .equip'+i).removeClass('stars5 stars4 stars3 stars2 stars1');
      $('#doll'+(index+1)+' .equip'+i).attr('src', '/static/girlsfrontline/sim/placeholder.png');
    } else {
      $('#doll'+(index+1)+' .equip'+i).removeClass('stars5 stars4 stars3 stars2 stars1');
      $('#doll'+(index+1)+' .equip'+i).addClass('stars'+equipData[equipId-1].rarity);
      $('#doll'+(index+1)+' .equip'+i).attr('src', '/static/girlsfrontline/sim/equips/'+equipData[equipId-1].type+'.png');
    }
  }
}




function calculateEquipBonus(dollIndex) {
  echelon[dollIndex].equip_bonus = {fp:0,acc:0,eva:0,rof:0,critdmg:0,crit:0,ap:0,armor:0,nightview:0,rounds:0};

  for(var i = 1; i <= 3; i++) {
    var equipId = echelon[dollIndex]['equip'+i];
    if(equipId == -1)
      continue;
    var equip = equipData[equipId-1];
    var level = parseInt($('#doll'+(dollIndex+1)+' .equip'+i+'-level-select').val());
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
  for(var i = 0; i < echelon.length; i++) {
    echelon[i].tile_bonus = {fp:0,acc:0,eva:0,rof:0,crit:0,skillcd:0,armor:0};
  }

  var validSquares = [12,13,14,22,23,24,32,33,34];
  $.each(validSquares, function(index, value) {
    var dollIndex = parseInt($('#pos'+value).attr('data-index'));
    if(dollIndex == -1 || echelon[dollIndex].id == -1) {
      return true;
    }

    var targetSquares = echelon[dollIndex].tiles.target.split(",");

    for(i = 0; i < targetSquares.length; i++) {
      var targetSquare = value + parseInt(targetSquares[i]);
      if($.inArray(targetSquare, validSquares) == -1) {
        continue;
      }

      var targetIndex = $('#pos'+targetSquare).attr('data-index');
      if(targetIndex == -1 || echelon[targetIndex].id == -1) {
        continue;
      }

      var target = echelon[targetIndex];
      var source = echelon[dollIndex];

      if(source.tiles.target_type == 0 || source.tiles.target_type == target.type) {
        if(source.type == 1) {
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

        if(target.tile_bonus.skillcd > 30) {
          target.tile_bonus.skillcd = 30;
        }
      }
    }
  });
}

function calculateBaseStats(dollIndex) {
  var doll = echelon[dollIndex];
  var data = dollData[doll.id-1];
  var level = parseInt($('#doll'+(dollIndex+1)+' .doll-level-select').val());
  var dollTypeScalars = TYPE_SCALARS[doll.type-1];

  var basicFactors = level > 100 ? GROWTH_FACTORS.mod.basic : GROWTH_FACTORS.normal.basic;
  var growFactors = level > 100 ? GROWTH_FACTORS.mod.grow : GROWTH_FACTORS.normal.grow;

  doll.base.hp = Math.ceil((basicFactors.hp[0] + ((level - 1) * basicFactors.hp[1])) * dollTypeScalars.hp * data.hp / 100);

  doll.base.fp = Math.ceil(basicFactors.fp[0] * dollTypeScalars.fp * data.fp / 100);
  doll.base.fp += Math.ceil((growFactors.fp[1] + ((level - 1) * growFactors.fp[0])) * dollTypeScalars.fp * data.fp * data.growth_rating / 100 / 100);

  doll.base.acc = Math.ceil(basicFactors.acc[0] * dollTypeScalars.acc * data.acc / 100);
  doll.base.acc += Math.ceil((growFactors.acc[1] + ((level - 1) * growFactors.acc[0])) * dollTypeScalars.acc * data.acc * data.growth_rating / 100 / 100);

  doll.base.eva = Math.ceil(basicFactors.eva[0] * dollTypeScalars.eva * data.eva / 100);
  doll.base.eva += Math.ceil((growFactors.eva[1] + ((level - 1) * growFactors.eva[0])) * dollTypeScalars.eva * data.eva * data.growth_rating / 100 / 100);

  doll.base.rof = Math.ceil(basicFactors.rof[0] * dollTypeScalars.rof * data.rof / 100);
  doll.base.rof += Math.ceil((growFactors.rof[1] + ((level - 1) * growFactors.rof[0])) * dollTypeScalars.rof * data.rof * data.growth_rating / 100 / 100);

  doll.base.armor = Math.ceil((basicFactors.armor[0] + ((level - 1) * basicFactors.armor[1])) * dollTypeScalars.armor * data.armor / 100);

  doll.base.crit = data.crit;
  doll.base.critdmg = data.critdmg;
  doll.base.ap = data.ap;
  doll.base.rounds = data.rounds;
}

function calculatePreBattleStatsForDoll(dollIndex) {
  var doll = echelon[dollIndex];

  if(doll.id == -1)
    return;

  var affection_bonus = getAffectionBonus(doll.affection, doll.mod);

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
  if(doll.type == 6) { //sg
    if(doll.hasSlug) {
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

  //apply tile bonus multiplicatively, floored
  doll.pre_battle.fp = Math.floor(doll.pre_battle.fp * (1 + (doll.tile_bonus.fp / 100)));
  doll.pre_battle.acc = Math.floor(doll.pre_battle.acc * (1 + (doll.tile_bonus.acc / 100)));
  doll.pre_battle.eva = Math.floor(doll.pre_battle.eva * (1 + (doll.tile_bonus.eva / 100)));
  doll.pre_battle.rof = Math.floor(doll.pre_battle.rof * (1 + (doll.tile_bonus.rof / 100)));
  doll.pre_battle.armor = Math.floor(doll.pre_battle.armor * (1 + (doll.tile_bonus.armor / 100)));
  doll.pre_battle.crit = Math.floor(doll.pre_battle.crit * (1 + (doll.tile_bonus.crit / 100)));
  doll.pre_battle.skillcd = doll.tile_bonus.skillcd;

  //cap stats & apply night acc penalty
  doll.pre_battle.fp = Math.max(0, doll.pre_battle.fp);
  doll.pre_battle.eva = Math.max(0, doll.pre_battle.eva);
  doll.pre_battle.crit = Math.max(0, Math.min(100, doll.pre_battle.crit));
  doll.pre_battle.critdmg = Math.max(0, doll.pre_battle.critdmg);
  doll.pre_battle.ap = Math.max(0, doll.pre_battle.ap);
  doll.pre_battle.armor = Math.max(0, doll.pre_battle.armor);
  doll.pre_battle.acc = Math.max(1, doll.pre_battle.acc);
  if(doll.type == 6) { //sg
    doll.pre_battle.rof = Math.min(60, Math.max(15,doll.pre_battle.rof));
  } else if(doll.type == 5) { //mg
    doll.pre_battle.rof = Math.min(1000, Math.max(1,doll.pre_battle.rof));
  } else { //hg,rf,ar,smg
    doll.pre_battle.rof = Math.min(120, Math.max(15,doll.pre_battle.rof));
  }
  if(isNight) {
    doll.pre_battle.acc = Math.floor(doll.pre_battle.acc * (1 - (.9 - .9 * doll.pre_battle.nightview / 100)));
  }
}

function calculatePreBattleStatsAllDolls() {
  for(var i = 0; i < 5; i++) {
    calculatePreBattleStatsForDoll(i);
  }
}




function initDollsForBattle() {
  for(var i = 0; i < 5; i++) {
    var doll = echelon[i];

    graphData.y.push({});
    graphData.y[i].name = doll.name;
    graphData.y[i].data = [];
    graphData.y[i].data.push(0);

    if(doll.id == -1) {
      continue;
    }

    doll.battle = {};
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
    if(doll.type == 6) {
      doll.battle.targets = doll.targets;
    }
    if(doll.type == 5) {
      doll.battle.frames_per_attack = doll.frames_per_attack;
    }
    doll.battle.busylinks = 0;
    doll.battle.skill = doll.skill;
    doll.battle.skillbonus = {
      fp:1,
      acc:1,
      eva:1,
      rof:1,
      crit:1,
      critdmg:1,
      rounds:0,
      armor:1,
      ap:1
    };
    doll.battle.maxstats = {
      fp:0,
      acc:0,
      eva:0,
      rof:0,
      crit:0,
      critdmg:0,
      rounds:0,
      armor:0,
      ap:0
    };
    if('passives' in doll) {
      doll.battle.passives = doll.passives;
      $.each(doll.battle.passives, (index,passive) => {
        $.each(passive.effects, (j,effect) => {
          effect.level = doll.skilllevel;
        });
      });
    }
    doll.battle.buffs = [];
    doll.battle.effect_queue = [];
    doll.battle.action_queue = [];
    doll.battle.timers = [];

    var normalAttackTimer = {
      type:'normalAttack',
      timeLeft:0
    };
    normalAttackTimer.timeLeft = 'frames_per_attack' in doll.battle ? doll.battle.frames_per_attack : Math.floor(50 * 30 / doll.battle.rof);
    doll.battle.timers.push(normalAttackTimer);

    var skillTimer = {
      type:'skill',
      timeLeft:Math.round(doll.battle.skill.icd * 30 * (1-doll.pre_battle.skillcd / 100))
    };
    if(doll.useSkill) {
      doll.battle.timers.push(skillTimer);
    }

    if(doll.mod) {
      doll.battle.skill2 = doll.skill2;
      var skill2Timer = {
        type:'skill2',
        timeLeft:Math.round(doll.battle.skill2.icd * 30 * (1-doll.pre_battle.skillcd / 100))
      }
      if(doll.useSkill) {
        doll.battle.timers.push(skill2Timer);
      }
    }
  }
}

function initEnemyForBattle() {
  var enemy = {
    count:enemyCount,
    eva:enemyEva,
    armor:enemyArmor,
    vulnerability:1,
    battle:{
      eva:enemyEva,
      armor:enemyArmor,
      vulnerability:1,
      skillbonus:{
        eva:1,
        armor:1,
        vulnerability:1,
      }
    },
    buffs:[]
  };

  return enemy;
}

function simulateBattle() {
  graphData = {x:[], y:[]};

  initDollsForBattle();
  var enemy = initEnemyForBattle();
  var battleLength = 30 * 20;
  var totaldamage8s = 0;
  var totaldamage20s = 0;


  //walk time can be handled here


  graphData.x.push(0);
  for(var currentFrame = 1; currentFrame < battleLength; currentFrame++) {
    graphData.x.push(parseFloat((currentFrame / 30.0).toFixed(2)));

    //tick timers, queue actions
    for(var i = 0; i < 5; i++) {
      var doll = echelon[i];
      if(doll.id == -1) continue;

      graphData.y[i].data.push(graphData.y[i].data[currentFrame-1]);

      $.each(doll.battle.timers, (index, timer) => {
        if(timer.type == 'normalAttack') {
          var reloading = doll.battle.timers.find(timer => timer.type == 'reload') === undefined ? false : true;
          if(doll.links - doll.battle.busylinks > 0 && !reloading) {
            timer.timeLeft--;
          }
        } else {
          timer.timeLeft--;
        }

        if(timer.timeLeft == 0) {
          if(timer.type == 'skill') {
            $.each(doll.battle.skill.effects, (index,effect) => {
              effect.level = doll.skilllevel;
              doll.battle.effect_queue.push($.extend({}, effect));
            });
            timer.timeLeft = Math.round(doll.battle.skill.cd[doll.skilllevel-1] * 30 * (1-doll.pre_battle.skillcd / 100));
          } else if(timer.type == 'skill2') {
            $.each(doll.battle.skill2.effects, (index,effect) => {
              effect.level = doll.skill2level;
              doll.battle.effect_queue.push($.extend({}, effect));
            });
            timer.timeLeft = Math.round(doll.battle.skill2.cd[doll.skill2level-1] * 30 * (1-doll.pre_battle.skillcd / 100));
          } else {
            doll.battle.effect_queue.push($.extend({}, timer));
          }
        }
      });

      doll.battle.timers = doll.battle.timers.filter(timer => timer.timeLeft != 0); //remove expired timers

      //tick buffs
      $.each(doll.battle.buffs, (index,buff) => {
        buff.timeLeft--;
      });

      doll.battle.buffs = doll.battle.buffs.filter(buff => buff.timeLeft != 0); //remove expired buffs
    }


    //apply buffs and recalculate stats
    for(i = 0; i < 5; i++) {
      doll = echelon[i];
      if(doll.id == -1) continue;

      for(var j = 0; j < doll.battle.effect_queue.length; j++) {
        var action = doll.battle.effect_queue.shift();

        if(action.type == 'buff') {
          activateBuff(doll, action, enemy);
        } else {
          if('delay' in action) {
            action.timeLeft = Math.round(action.delay * 30) + 1;
          }
          if('busylinks' in action) {
            doll.battle.busylinks += action.busylinks;
          }
          doll.battle.action_queue.push(action);
        }
      }
    }

    //recalculate stats to include all buffs
    for(i = 0; i < 5; i++) {
      if(echelon[i].id != -1) {
        calculateSkillBonus(i);
        calculateBattleStats(i);
      }
    }
    calculateEnemyStats(enemy);


    //perform actions
    for(i = 0; i < 5; i++) {
      doll = echelon[i];
      if(doll.id == -1) continue;

      var dmg = 0;

      for(j = 0; j < doll.battle.action_queue.length; j++) {
        action = doll.battle.action_queue.shift();

        if(action.type == 'normalAttack') {
          dmg = Math.max(1, doll.battle.fp + Math.min(2, doll.battle.ap - enemy.armor));
          dmg *= (doll.battle.acc / (doll.battle.acc + enemy.eva));
          dmg *= 1 + (doll.battle.critdmg * (doll.battle.crit / 100) / 100);
          //enemy vuln up taken into account here
          dmg *= doll.links - doll.battle.busylinks;

          if(doll.type == 6) { //sg
            dmg = dmg * Math.min(doll.battle.targets, enemy.count);
          }

          if(doll.type == 5 || doll.type == 6) { //mg/sg , do not change to doll.type < 5
            doll.battle.currentRounds--;
            if(doll.battle.currentRounds == 0) {
              var reloadTimer = {
                type:'reload',
                timeLeft:0
              };
              reloadTimer.timeLeft = doll.type == 5? Math.floor(30 * (4 + 200 / doll.battle.rof)) : Math.floor(30 * (1.4 + 0.5 * doll.battle.rounds));
              doll.battle.timers.push(reloadTimer);
            }
          }

          var normalAttackTimer = {
            type:'normalAttack',
            timeLeft:0
          };
          normalAttackTimer.timeLeft = 'frames_per_attack' in doll.battle ? doll.battle.frames_per_attack : Math.floor(50 * 30 / doll.battle.rof);
          doll.battle.timers.push(normalAttackTimer);

          if(currentFrame < 30 * 8) {
            totaldamage8s += dmg;
          }
          totaldamage20s += dmg;
          graphData.y[i].data[currentFrame] += Math.round(dmg);
        }

        if(action.type == 'reload') {
          doll.battle.currentRounds += doll.battle.rounds;
        }

        if(action.type == 'grenade') {
          //doll busylinks -= action busylinks
        }

        if(action.type == 'smoke' || action.type == 'stun') {
          if('delay' in action) {
            if(action.timeLeft != 0) {
              action.timeLeft--;
              doll.battle.action_queue.push(action);
              continue;
            }
          }

          doll.battle.busylinks -= action.busylinks;
        }
      }
    }



  }

  $('#dmg-8s').text(Math.round(totaldamage8s));
  $('#dmg-20s').text(Math.round(totaldamage20s));

  graphData.y = graphData.y.filter(v => v.name != '');
}

function calculateSkillBonus(dollIndex) {
  var doll = echelon[dollIndex];

  doll.battle.skillbonus = {
    fp:1,
    acc:1,
    eva:1,
    rof:1,
    crit:1,
    critdmg:1,
    rounds:0,
    armor:1,
    ap:1
  };

  $.each(doll.battle.buffs, (index,buff) => {
    if('stat' in buff) {
      $.each(buff.stat, (stat, amount) => {
        if(stat == 'rounds') {
          if($.isArray(amount)) {
            doll.battle.skillbonus.rounds += amount[buff.level-1];
          } else {
            doll.battle.skillbonus.rounds += amount;
          }
          return true;
        }
        if($.isArray(amount)) {
          doll.battle.skillbonus[stat] *= (1+(amount[buff.level-1] / 100));
        } else {
          doll.battle.skillbonus[stat] *= (1 + (amount / 100));
        }
      });
    }
  });
}

function calculateBattleStats(dollIndex) {
  var doll = echelon[dollIndex];
  doll.battle.fp = Math.floor(doll.pre_battle.fp * doll.battle.skillbonus.fp);
  doll.battle.acc = Math.floor(doll.pre_battle.acc * doll.battle.skillbonus.acc);
  doll.battle.eva = Math.floor(doll.pre_battle.eva * doll.battle.skillbonus.eva);
  doll.battle.rof = Math.floor(doll.pre_battle.rof * doll.battle.skillbonus.rof);
  doll.battle.crit = Math.floor(doll.pre_battle.crit * doll.battle.skillbonus.crit);
  doll.battle.critdmg = Math.floor(doll.pre_battle.critdmg * doll.battle.skillbonus.critdmg);
  doll.battle.armor = Math.floor(doll.pre_battle.armor * doll.battle.skillbonus.armor);
  doll.battle.rounds = Math.floor(doll.pre_battle.rounds + doll.battle.skillbonus.rounds);
  doll.battle.ap = Math.floor(doll.pre_battle.ap * doll.battle.skillbonus.ap);

  //cap stats
  doll.battle.fp = Math.max(0, doll.battle.fp);
  doll.battle.eva = Math.max(0, doll.battle.eva);
  doll.battle.crit = Math.max(0, Math.min(100, doll.battle.crit));
  doll.battle.critdmg = Math.max(0, doll.battle.critdmg);
  doll.battle.ap = Math.max(0, doll.battle.ap);
  doll.battle.armor = Math.max(0, doll.battle.armor);
  doll.battle.acc = Math.max(1, doll.battle.acc);
  if(doll.type == 6) { //sg
    doll.battle.rof = Math.min(60, Math.max(15,doll.battle.rof));
  } else if(doll.type == 5) { //mg
    doll.battle.rof = Math.min(1000, Math.max(1,doll.battle.rof));
  } else { //hg,rf,ar,smg
    doll.battle.rof = Math.min(120, Math.max(15,doll.battle.rof));
  }

  //track max stats
  doll.battle.maxstats.fp = Math.max(doll.battle.maxstats.fp, doll.battle.fp);
  doll.battle.maxstats.acc = Math.max(doll.battle.maxstats.acc, doll.battle.acc);
  doll.battle.maxstats.eva = Math.max(doll.battle.maxstats.eva, doll.battle.eva);
  doll.battle.maxstats.rof = Math.max(doll.battle.maxstats.rof, doll.battle.rof);
  doll.battle.maxstats.crit = Math.max(doll.battle.maxstats.crit, doll.battle.crit);
  doll.battle.maxstats.critdmg = Math.max(doll.battle.maxstats.critdmg, doll.battle.critdmg);
  doll.battle.maxstats.rounds = Math.max(doll.battle.maxstats.rounds, doll.battle.rounds);
  doll.battle.maxstats.armor = Math.max(doll.battle.maxstats.armor, doll.battle.armor);
  doll.battle.maxstats.ap = Math.max(doll.battle.maxstats.ap, doll.battle.ap);
}

function calculateEnemyStats(enemy) {
  enemy.battle.skillbonus = {
    eva:1,
    armor:1,
    vulnerability:1,
  };

  //calculate skill bonus
  $.each(enemy.buffs, (index,buff) => {
    if('stat' in buff) {
      $.each(buff.stat, (stat,amount) => {
        if($.isArray(amount)) {
          enemy.battle.skillbonus[stat] *= (1 + (amount[buff.level] / 100));
        } else {
          enemy.battle.skillbonus[stat] *= (1 + (amount / 100));
        }
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
  var targets = getBuffTargets(doll, buff, enemy);

  buff.timeLeft = $.isArray(buff.duration) ? buff.duration[buff.level-1] * 30 : buff.duration * 30;

  $.each(targets, (index,target) => {
    target.battle.buffs.push($.extend({}, buff));
    if('stat' in buff) {
      if('fp' in buff.stat) {
        triggerPassive('receivefp', target);
      }
      if('rof' in buff.stat) {
        triggerPassive('receiverof', target);
      }
      if('eva' in buff.stat) {
        triggerPassive('receiveeva', target);
      }
      if('acc' in buff.stat) {
        triggerPassive('receiveacc', target);
      }
      if('crit' in buff.stat) {
        triggerPassive('receivecrit', target);
      }
    }
  })
}

function triggerPassive(trigger, doll) {
  if(!('passives' in doll.battle)) {
    return;
  }

  var passives = doll.battle.passives.filter(passive => passive.trigger == trigger);
  $.each(passives, (index, passive) => {
    $.each(passive.effects, (j,effect) => {
      doll.battle.effect_queue.push($.extend({}, effect));
    });
  });
}

function getBuffTargets(doll, buff, enemy) {
  var targets = [];

  if(buff.target == 'all') {
    for(var i = 0; i < 5; i++) {
      if(echelon[i].id != -1) {
        targets.push(echelon[i]);
      }
    }
  }

  if(buff.target == 'tiles') {
    var targetSquares = doll.tiles.target.split(",");
    targetSquares = targetSquares.map(targetSquare => parseInt(targetSquare));
    targetSquares = targetSquares.map(targetSquare => targetSquare + doll.pos);
    for(var i = 0; i < 5; i++) {
      if(echelon[i].id != -1 && $.inArray(echelon[i].pos, targetSquares) != -1) {
        targets.push(echelon[i]);
      }
    }
  }

  return targets;
}




function getNumLinks(dollIndex) {
  var level = parseInt($('#doll'+(dollIndex+1)+' .doll-level-select').val());
  if(level >= 90)
    return 5;
  if(level >= 70)
    return 4;
  if(level >= 30)
    return 3;
  if(level >= 10)
    return 2;
  return 1;
}

function getAffectionBonus(affection, mod) {
  if(affection == 0) {
    return -0.05;
  } else if(affection == 1) {
    return 0;
  } else if(affection == 2) {
    return 0.05;
  } else {
    if(mod) {
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
  var dropSource = event.originalEvent.dataTransfer.getData('text');
  if($('#'+dropSource).is($(event.target))) {
    return;
  }

  var sourceIndex = $('#'+dropSource).attr('data-index');
  var targetIndex = $(event.target).attr('data-index');

  if(sourceIndex == -1 && targetIndex == -1) {
    return;
  }

  //swap data-index attributes in html elements
  var temp = $('#'+dropSource).attr('data-index');
  $('#'+dropSource).attr('data-index', $(event.target).attr('data-index'));
  $(event.target).attr('data-index', temp);

  //swap pos attributes of doll objects in echelon
  if(sourceIndex != -1 && targetIndex != -1) {
    echelon[temp].pos = parseInt($(event.target).attr('id').slice(3));
    echelon[$('#'+dropSource).attr('data-index')].pos = parseInt(dropSource.slice(3));
  } else if(sourceIndex != -1 && targetIndex == -1) {
    echelon[temp].pos = parseInt($(event.target).attr('id').slice(3));
  } else if(sourceIndex == -1 && targetIndex != -1) {
    echelon[$('#'+dropSource).attr('data-index')].pos = parseInt(dropSource.slice(3));
  }

  calculateTileBonus();
  calculatePreBattleStatsAllDolls();
  simulateBattle();
  updateUIAllDolls();
}

function showDamageGraph() {
  $('#damage-graph-modal').modal('show');

  Highcharts.chart('damage-graph', {
    title: {
      text: 'Damage over Time'
    },
    tooltip: {
      shared: true
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
