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
    $('#doll'+i+' .skill-control button').click(i-1,openSkillControl);
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
  enemyEva = Math.max(0, parseInt($('#enemy-eva').val()) || 0);
  enemyArmor = Math.max(0, parseInt($('#enemy-armor').val()) || 0);
  enemyCount = Math.max(1, parseInt($('#enemy-count').val()) || 1);

  simulateBattle();
  updateUIAllDolls();
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
  updateUIAllDolls();
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
    echelon[index].hasSlug = false;
  }

  if('passives' in selectedDoll) {
    echelon[index].passives = selectedDoll.passives;
  }
  if('skill_control' in selectedDoll) {
    // echelon[index].skill_control = selectedDoll.skill_control;
    echelon[index].special_control = true;
  } else {
    echelon[index].special_control = false;
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

function openSkillControl(event) {
  var doll = echelon[event.data];
  if(doll.id == -1 || !doll.special_control) {
    return;
  }

  $('#skill-control-body').html(SKILL_CONTROL_HTML[doll.id](doll));
  $('#skill-control-apply').click(event.data, closeSkillControl);
  $('#skill-control-modal').modal('show');
}

function closeSkillControl(event) {
  $('#skill-control-modal').modal('hide');
  $('#skill-control-apply').off('click');

  var doll = echelon[event.data];
  if(doll.id == -1 || !doll.special_control) {
    return;
  }

  SKILL_CONTROL[doll.id](doll);

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

  if(echelon.find(doll => doll.mod) !== undefined) {
    $('#doll'+1+' .skill2').prop('hidden', false);
    $('#doll'+2+' .skill2').prop('hidden', false);
    $('#doll'+3+' .skill2').prop('hidden', false);
    $('#doll'+4+' .skill2').prop('hidden', false);
    $('#doll'+5+' .skill2').prop('hidden', false);
  } else {
    $('#doll'+1+' .skill2').prop('hidden', true);
    $('#doll'+2+' .skill2').prop('hidden', true);
    $('#doll'+3+' .skill2').prop('hidden', true);
    $('#doll'+4+' .skill2').prop('hidden', true);
    $('#doll'+5+' .skill2').prop('hidden', true);
  }

  if(echelon.find(doll => doll.special_control) !== undefined) {
    $('#doll'+1+' .skill-control').prop('hidden', false);
    $('#doll'+2+' .skill-control').prop('hidden', false);
    $('#doll'+3+' .skill-control').prop('hidden', false);
    $('#doll'+4+' .skill-control').prop('hidden', false);
    $('#doll'+5+' .skill-control').prop('hidden', false);
  } else {
    $('#doll'+1+' .skill-control').prop('hidden', true);
    $('#doll'+2+' .skill-control').prop('hidden', true);
    $('#doll'+3+' .skill-control').prop('hidden', true);
    $('#doll'+4+' .skill-control').prop('hidden', true);
    $('#doll'+5+' .skill-control').prop('hidden', true);
  }
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
    if(doll.special_control) {
      $('#doll'+(index+1)+' .skill-control').css('visibility', 'visible');
    } else {
      $('#doll'+(index+1)+' .skill-control').css('visibility', 'hidden');
    }

    if(showBuffedStats) {
      $('#doll'+(index+1)+' .fp span').text(doll.battle.finalstats.fp);
      $('#doll'+(index+1)+' .acc span').text(doll.battle.finalstats.acc);
      $('#doll'+(index+1)+' .eva span').text(doll.battle.finalstats.eva);
      $('#doll'+(index+1)+' .rof span').text(doll.battle.finalstats.rof);
      $('#doll'+(index+1)+' .crit span').text(doll.battle.finalstats.crit+'%');
      $('#doll'+(index+1)+' .critdmg span').text((doll.battle.finalstats.critdmg+100)+'%');
      if(doll.battle.finalstats.rounds != 0) {
        $('#doll'+(index+1)+' .rounds span').text(doll.battle.finalstats.rounds);
      } else {
        $('#doll'+(index+1)+' .rounds span').text('-');
      }
      if(doll.battle.finalstats.armor != 0) {
        $('#doll'+(index+1)+' .armor span').text(doll.battle.finalstats.armor);
      } else {
        $('#doll'+(index+1)+' .armor span').text('-');
      }
      $('#doll'+(index+1)+' .ap span').text(doll.battle.finalstats.ap);
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



function preBattleSkillChanges(doll) {
  if(doll.id == 192) {
    //strawberry cano probably
    var effect = doll.battle.skill.effects[0];
    for(var i = 0; i < 5; i++) {
      if(echelon[i].id == -1) {
        continue;
      }
      if(echelon[i].id != 192 && echelon[i].type == 3) {
        doll.battle.skill.effects.push($.extend({}, effect));
      }
    }
  }

  if(doll.id == 239) {
    //Jericho
    var skilleffect = {
      type:"passive",
      trigger:"reload",
      effects:[
        {
          type:"buff",
          target:"self",
          name:"jericho",
          stat:{
            fp:5,
            acc:5
          },
          duration:15,
          stackable:true,
          stacks:1,
          max_stacks:1
        }
      ]
    };

    var targetSquares = doll.tiles.target.split(",");
    targetSquares = targetSquares.map(targetSquare => parseInt(targetSquare));
    targetSquares = targetSquares.map(targetSquare => targetSquare + doll.pos);
    for(var i = 0; i < 5; i++) {
      if(echelon[i].id != -1 && $.inArray(echelon[i].pos, targetSquares) != -1) {
        echelon[i].battle.passives.push($.extend({}, skilleffect));
      }
    }
  }

  if(doll.id == 253) {
    //m1895 mod3 nagant revolver
    doll.battle.skill2.icd = (doll.battle.timers.find(t => t.type == 'normalAttack').timeLeft+3) / 30 ;
  }

  if(doll.id == 199) {
    doll.battle.skill.marks = 0;
  }

  if(doll.id == 224) {
    //m82a1
    doll.battle.skillUseCount = 0;
  }

  if(doll.id == 262) {
    //g3mod
    if(doll.skill.buffednade) {
      doll.battle.skill.effects[0].multiplier = [5,5.8,6.6,7.3,8.1,8.9,9.7,10.4,11.2,12].map(x => x + doll.skill2.effects[0].multiplier[doll.skill2level-1]);
    } else {
      doll.battle.skill.effects[0].multiplier = [5,5.8,6.6,7.3,8.1,8.9,9.7,10.4,11.2,12];
    }
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
    doll.battle.skill = $.extend({},doll.skill);
    doll.battle.skill.effects = getUsableSkillEffects(doll.skill.effects);
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
      fp:doll.pre_battle.fp,
      acc:doll.pre_battle.acc,
      eva:doll.pre_battle.eva,
      rof:doll.pre_battle.rof,
      crit:doll.pre_battle.crit,
      critdmg:doll.pre_battle.critdmg,
      rounds:doll.pre_battle.rounds,
      armor:doll.pre_battle.armor,
      ap:doll.pre_battle.ap
    };
    doll.battle.minstats = {
      fp:doll.pre_battle.fp,
      acc:doll.pre_battle.acc,
      eva:doll.pre_battle.eva,
      rof:doll.pre_battle.rof,
      crit:doll.pre_battle.crit,
      critdmg:doll.pre_battle.critdmg,
      rounds:doll.pre_battle.rounds,
      armor:doll.pre_battle.armor,
      ap:doll.pre_battle.ap
    };
    if('passives' in doll) {
      doll.battle.passives = JSON.parse(JSON.stringify(doll.passives));
      $.each(doll.battle.passives, (index,passive) => {
        if('interval' in passive) {
          passive.startTime = 1;
        }
        passive.level = doll.skilllevel;
        passive.effects = getUsableSkillEffects(passive.effects);
        $.each(passive.effects, (j,effect) => {
          effect.level = doll.skilllevel;
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
      doll.battle.skill2 = $.extend({}, doll.skill2);
      doll.battle.skill2.effects = getUsableSkillEffects(doll.skill2.effects);
      var skill2Timer = {
        type:'skill2',
        timeLeft:Math.round(doll.battle.skill2.icd * 30 * (1-doll.pre_battle.skillcd / 100))
      }
      if(doll.useSkill) {
        doll.battle.timers.push(skill2Timer);
      }
    }
  }

  for(i = 0; i < 5; i++) {
    preBattleSkillChanges(echelon[i]);
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
      },
      buffs:[]
    }
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
      });

      $.each(doll.battle.timers, (index, timer) => {
        if(timer.timeLeft == 0) {
          var reloading = doll.battle.timers.find(timer => timer.type == 'reload') === undefined ? false : true;
          if(timer.type == 'skill') {
            if(reloading && doll.battle.timers.find(timer => timer.type == 'reload').timeLeft != 0) {
              timer.timeLeft++;
            } else {
              $.each(doll.battle.skill.effects, (index,effect) => {
                effect.level = doll.skilllevel;
                if(effect.type == 'loadRounds') {
                  var targets = getBuffTargets(doll, effect, enemy);
                  $.each(targets, (index,target) => {
                    target.battle.currentRounds += $.isArray(effect.rounds) ? effect.rounds[effect.level-1] : effect.rounds;
                  });
                } else {
                  doll.battle.effect_queue.push($.extend({}, effect));
                }
              });
              timer.timeLeft = Math.round(doll.battle.skill.cd[doll.skilllevel-1] * 30 * (1-doll.pre_battle.skillcd / 100));
            }
          } else if(timer.type == 'skill2') {
            if(reloading && doll.battle.timers.find(timer => timer.type == 'reload').timeLeft != 0) {
              timer.timeLeft++;
            } else {
              $.each(doll.battle.skill2.effects, (index,effect) => {
                effect.level = doll.skill2level;
                if(effect.type == 'loadRounds') {
                  var targets = getBuffTargets(doll, effect, enemy);
                  $.each(targets, (index,target) => {
                    target.battle.currentRounds += $.isArray(effect.rounds) ? effect.rounds[effect.level-1] : effect.rounds;
                  });
                } else {
                  doll.battle.effect_queue.push($.extend({}, effect));
                }
              });
              timer.timeLeft = Math.round(doll.battle.skill2.cd[doll.skill2level-1] * 30 * (1-doll.pre_battle.skillcd / 100));
            }
          } else {
            doll.battle.effect_queue.push($.extend({}, timer));
          }
        }
      });

      doll.battle.timers = doll.battle.timers.filter(timer => timer.timeLeft != 0); //remove expired timers

      //tick and remove buffs
      $.each(doll.battle.buffs, (index,buff) => {
        if('timeLeft' in buff) {
          buff.timeLeft--;
        }
      });
      doll.battle.buffs = doll.battle.buffs.filter(buff => {
        if('timeLeft' in buff) {
          if(buff.timeLeft == 0) {
            return false;
          }
        }
        return true;
      });

      //tick and remove passives
      $.each(doll.battle.passives, (index,passive) => {
        if('timeLeft' in passive) {
          passive.timeLeft--;
        }
      });
      doll.battle.passives = doll.battle.passives.filter(passive => {
        if('timeLeft' in passive) {
          if(passive.timeLeft == 0) {
            return false;
          }
        }
        return true;
      });

      //tick and trigger time-based passives
      $.each(doll.battle.passives.filter(passive => 'interval' in passive), (index,passiveskill) => {
        var interval = $.isArray(passiveskill.interval) ? passiveskill.interval[passiveskill.level-1] : passiveskill.interval;
        if((currentFrame - passiveskill.startTime) % Math.floor(interval * 30) == 0 && currentFrame != 1) {
          triggerPassive('time', doll, enemy);
        }
      });
    }

    //tick/remove enemy buffs
    $.each(enemy.battle.buffs, (index,buff) => {
      if('timeLeft' in buff) {
        buff.timeLeft--;
      }
    });
    enemy.battle.buffs = enemy.battle.buffs.filter(buff => {
      if('timeLeft' in buff) {
        if(buff.timeLeft == 0) {
          return false;
        }
      }
      return true;
    });


    //apply buffs
    for(i = 0; i < 5; i++) {
      doll = echelon[i];
      if(doll.id == -1) continue;

      var len = doll.battle.effect_queue.length;
      for(var j = 0; j < len; j++) {
        var action = doll.battle.effect_queue.shift();

        if(action.type == 'buff') {
          activateBuff(doll, action, enemy);
        } else if(action.type == 'passive') {
          addPassive(doll,action,enemy, currentFrame);
        } else if(action.type == 'removeBuff') {
          removeBuff(doll, action, enemy);
        } else if (action.type == 'removePassive') {
          removePassive(doll, action, enemy);
        } else if (action.type == 'modifySkill') {
          modifySkill(doll, action);
        } else {
          if('delay' in action) {
            action.timeLeft = Math.round(action.delay * 30) + 1;
          }
          if('busylinks' in action) {
            doll.battle.busylinks += Math.min(action.busylinks, doll.links);
          }
          if('duration' in action) {
            action.timeLeft = $.isArray(action.duration) ? Math.round(action.duration[action.level-1] * 30) : Math.round(action.duration * 30);
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

      len = doll.battle.action_queue.length;
      for(j = 0; j < len; j++) {
        action = doll.battle.action_queue.shift();

        if(action.type == 'normalAttack') {
          var attackBuff = doll.battle.buffs.find(buff => buff.name == 'normalAttackBuff');
          if(attackBuff !== undefined) {
            var canCrit = 'canCrit' in attackBuff ? attackBuff.canCrit : true;
            var sureCrit = 'sureCrit' in attackBuff ? attackBuff.sureCrit : false;
            var sureHit = 'sureHit' in attackBuff ? attackBuff.sureHit : false;

            dmg = Math.max(1, doll.battle.fp + Math.min(2, doll.battle.ap - enemy.battle.armor));
            if(!sureHit) {
              dmg *= (doll.battle.acc / (doll.battle.acc + enemy.battle.eva));
            }
            if(canCrit) {
              dmg *= sureCrit ? (1 + (doll.battle.critdmg / 100)) : 1 + (doll.battle.critdmg * (doll.battle.crit / 100) / 100);
            }
            dmg *= enemy.battle.vulnerability;
            dmg *= doll.links - doll.battle.busylinks;
            if('multiplier' in attackBuff) {
              dmg *= $.isArray(attackBuff.multiplier) ? attackBuff.multiplier[attackBuff.level-1] : attackBuff.multiplier;
            }
            if('hitCount' in attackBuff) {
              dmg *= $.isArray(attackBuff.hitCount) ? attackBuff.hitCount[attackBuff.level-1] : attackBuff.hitCount;
            }
            if(doll.type == 6) { //sg
              if(('targets' in attackBuff) && (!doll.hasSlug)) {
                dmg = dmg * Math.min(attackBuff.targets, enemy.count);
              } else {
                dmg = dmg * Math.min(doll.battle.targets, enemy.count);
              }
            }
            if('modifySkill' in attackBuff) {
              modifySkill(doll, attackBuff);
            }
          } else {

            dmg = Math.max(1, doll.battle.fp + Math.min(2, doll.battle.ap - enemy.battle.armor));
            dmg *= (doll.battle.acc / (doll.battle.acc + enemy.battle.eva));
            dmg *= 1 + (doll.battle.critdmg * (doll.battle.crit / 100) / 100);
            dmg *= enemy.battle.vulnerability;
            dmg *= doll.links - doll.battle.busylinks;
            if(doll.type == 6) { //sg
              dmg = dmg * Math.min(doll.battle.targets, enemy.count);
            }
          }

          //handle pkp
          var extradmg = 0;
          var afterAttack = doll.battle.passives.find(passive => passive.trigger == 'afterAttack');
          if(afterAttack !== undefined) {
            var extraAttack = afterAttack.effects[0];
            var canCrit = 'canCrit' in extraAttack ? extraAttack.canCrit : true;
            var sureCrit = 'sureCrit' in extraAttack ? extraAttack.sureCrit : false;
            var sureHit = 'sureHit' in extraAttack ? extraAttack.sureHit : false;

            var extradmg = Math.max(1, doll.battle.fp + Math.min(2, doll.battle.ap - enemy.battle.armor));
            if('multiplier' in extraAttack) {
              extradmg *= $.isArray(extraAttack.multiplier) ? extraAttack.multiplier[extraAttack.level-1] : extraAttack.multiplier;
            }
            extradmg *= !sureHit ? (doll.battle.acc / (doll.battle.acc + enemy.battle.eva)) : 1;
            if(canCrit) {
              extradmg *= sureCrit ? (1 + (doll.battle.critdmg / 100)) : 1 + (doll.battle.critdmg * (doll.battle.crit / 100) / 100);
            }
            dmg *= enemy.battle.vulnerability;
            extradmg *= doll.links - doll.battle.busylinks;
            extradmg *= 'extraAttackChance' in extraAttack ? extraAttack.extraAttackChance[extraAttack.level-1] / 100 : 1
          }
          dmg += extradmg;

          if(doll.type == 5 || doll.type == 6) { //mg/sg , do not change to doll.type < 5
            doll.battle.currentRounds--;

            if(doll.battle.currentRounds == 1) {
              triggerPassive('lastShot', doll, enemy);
              console.log(currentFrame);
            }

            if(doll.battle.currentRounds == 0) {
              var reloadTimer = {
                type:'reload',
                timeLeft:0
              };
              reloadTimer.timeLeft = doll.type == 5? Math.floor(30 * (4 + 200 / doll.battle.rof)) : Math.floor(30 * (1.4 + 0.5 * doll.battle.rounds));
              var reloadBuff = doll.battle.buffs.find(buff => buff.name == 'reloadBuff');
              if(reloadBuff !== undefined) {
                if('fixedTime' in reloadBuff) {
                  reloadTimer.timeLeft += $.isArray(reloadBuff.fixedTime) ? Math.floor(reloadBuff.fixedTime[reloadBuff.level-1] * 30) : Math.floor(30 * reloadBuff.fixedTime);
                }
                if('multiplier' in reloadBuff) {
                  if('stackable' in reloadBuff) {
                    reloadTimer.timeLeft *= $.isArray(reloadBuff.multiplier) ? ((reloadBuff.multiplier[reloadBuff.level-1] * reloadBuff.stacks) / 100) + 1 : (reloadBuff.multiplier * reloadBuff.stacks / 100) + 1;
                  } else {
                    reloadTimer.timeLeft *= $.isArray(reloadBuff.multiplier) ? ((reloadBuff.multiplier[reloadBuff.level-1]) / 100) + 1 : (reloadBuff.multiplier / 100) + 1;
                  }
                }

                if('uses' in reloadBuff) {
                  reloadBuff.uses--;
                  if(reloadBuff.uses == 0) {
                    reloadBuff.timeLeft = 1;
                  }
                }
              }
              if(reloadTimer.timeLeft != 0) {
                doll.battle.timers.push(reloadTimer);
              } else {
                doll.battle.currentRounds += doll.battle.rounds;
              }
            }
          }

          // TODO: add check for reloadtimer. if exists, do not add normalattacktimer
          var normalAttackTimer = {
            type:'normalAttack',
            timeLeft:0
          };
          normalAttackTimer.timeLeft = 'frames_per_attack' in doll.battle ? doll.battle.frames_per_attack : Math.floor(50 * 30 / doll.battle.rof);
          if(doll.battle.buffs.find(buff => buff.name == 'sweep') !== undefined) {
            normalAttackTimer.timeLeft = 10;
          }
          doll.battle.timers.push(normalAttackTimer);

          doll.battle.numAttacks++;


          var limitedAttackBuffs = doll.battle.buffs.filter(buff => 'attacksLeft' in buff);
          $.each(limitedAttackBuffs, (index,buff) => buff.attacksLeft--);
          doll.battle.buffs = doll.battle.buffs.filter(buff => {
            if('attacksLeft' in buff) {
              if(buff.attacksLeft == 0) {
                return false;
              }
            }
            return true;
          });

          var limitedAttackPassives = doll.battle.passives.filter(passive => 'attacksLeft' in passive);
          $.each(limitedAttackPassives, (index,passive) => passive.attacksLeft--);
          doll.battle.passives = doll.battle.passives.filter(passive => {
            if('attacksLeft' in passive) {
              if(passive.attacksLeft == 0) {
                return false;
              }
            }
            return true;
          });

          triggerPassive('normalAttack', doll, enemy);

          if(doll.battle.numAttacks % 4 == 0) {
            triggerPassive('every4thhit', doll, enemy);
          }
          if(doll.battle.numAttacks % 8 == 0) {
            triggerPassive('every8thhit', doll, enemy);
          }


          if(currentFrame <= 30 * 8 +1) {
            totaldamage8s += dmg;
          }
          totaldamage20s += dmg;
          graphData.y[i].data[currentFrame] += Math.round(dmg);
        }

        if(action.type == 'reload') {
          doll.battle.currentRounds += doll.battle.rounds;
          triggerPassive('reload', doll, enemy);
          //add normalAttackTimer here
        }

        if(action.type == 'grenade') {
          if('delay' in action) {
            if(action.timeLeft != 0) {
              action.timeLeft--;
              doll.battle.action_queue.push(action);
              continue;
            }
          }

          dmg = $.isArray(action.multiplier) ? doll.battle.fp * action.multiplier[action.level-1] : doll.battle.fp * action.multiplier;
          //grenades ignore Armor
          //grenades cant miss
          //grenades cant crit
          dmg *= enemy.battle.vulnerability;
          var hits = Math.min(action.radius * 1.5, enemy.count); //num enemy echelons hit

          if(hits >= 3) {
            triggerPassive('hit3ormore', doll, enemy);
          } else {
            triggerPassive('hitlessthanthree', doll, enemy);
          }

          if(!isBoss) {
            dmg *= hits * 5; //5 enemies per enemy echelon
          }

          doll.battle.busylinks -= Math.min(action.busylinks, doll.links);

          if('after' in action) {
            action.after.level = action.level;
            doll.battle.effect_queue.push(action.after);
          }


          if(currentFrame <= 30 * 8 +1) {
            totaldamage8s += dmg;
          }
          totaldamage20s += dmg;
          graphData.y[i].data[currentFrame] += Math.round(dmg);
        }

        if(action.type == 'grenadedot') {
          action.timeLeft--;

          if(action.timeLeft % action.tick == 0) {
            dmg = $.isArray(action.multiplier) ? doll.battle.fp * action.multiplier[action.level-1] : doll.battle.fp * action.multiplier;
            //grenades ignore Armor
            //grenades cant miss
            //grenades cant crit
            dmg *= enemy.battle.vulnerability;
            var hits = Math.min(action.radius * 1.5, enemy.count); //num enemy echelons hit
            if(!isBoss) {
              dmg *= hits * 5; //5 enemies per enemy echelon
            }
          }

          if(action.timeLeft != 0) {
            doll.battle.action_queue.push(action);
          }

          if(currentFrame <= 30 * 8 +1) {
            totaldamage8s += dmg;
          }
          totaldamage20s += dmg;
          graphData.y[i].data[currentFrame] += Math.round(dmg);
        }

        if(action.type == 'smoke' || action.type == 'stun') {
          if('delay' in action) {
            if(action.timeLeft != 0) {
              action.timeLeft--;
              doll.battle.action_queue.push(action);
              continue;
            }
          }

          doll.battle.busylinks -= Math.min(action.busylinks, doll.links);
        }

        if(action.type == 'chargedshot') {
          if(action.timeLeft != 0) {
            action.timeLeft--;
            doll.battle.action_queue.push(action);
            continue;
          }

          //unless specified, charged shots cannot miss and cannot crit
          var sureHit = 'sureHit' in action ? action.sureHit : true;
          var canCrit = 'canCrit' in action ? action.canCrit : false;

          dmg = $.isArray(action.multiplier) ? doll.battle.fp * action.multiplier[action.level-1] : doll.battle.fp * action.multiplier;
          dmg = Math.max(1, dmg + Math.min(2, doll.battle.ap - enemy.battle.armor));
          if(!sureHit) {
            dmg *= (doll.battle.acc / (doll.battle.acc + enemy.battle.eva));
          }
          if(canCrit) {
            dmg *= 1 + (doll.battle.critdmg * (doll.battle.crit / 100) / 100);
          }
          dmg *= enemy.battle.vulnerability;
          dmg *= doll.battle.busylinks;
          if('piercing' in action) {
            dmg *= enemy.count + 1;
          }
          if('skillDamageBonus' in action) {
            var skillbonus = $.isArray(action.skillDamageBonus) ? 1+(action.skillDamageBonus[action.level-1] / 100) : 1+(action.skillDamageBonus / 100);
            if('victories' in action) {
              skillbonus = Math.pow(skillbonus, action.victories);
            }
            dmg *= skillbonus;
          }

          doll.battle.busylinks -= Math.min(action.busylinks, doll.links);

          if('after' in action) {
            action.after.level = action.level;
            if(action.after.type == 'buff') {
              activateBuff(doll, action.after, enemy);
            } else {
              doll.battle.effect_queue.push(action.after);
            }
          }

          if('modifySkill' in action) {
            modifySkill(doll, action);
          }

          if(currentFrame <= 30 * 8 +1) {
            totaldamage8s += dmg;
          }
          totaldamage20s += dmg;
          graphData.y[i].data[currentFrame] += Math.round(dmg);
        }

        if(action.type == 'burstimpact') {
          if('delay' in action) {
            if(action.timeLeft != 0) {
              action.timeLeft--;
              doll.battle.action_queue.push(action);
              continue;
            }
          }

          var sureHit = 'sureHit' in action ? action.sureHit : true;
          var canCrit = 'canCrit' in action ? action.canCrit : true;

          dmg = $.isArray(action.multiplier) ? doll.battle.fp * action.multiplier[action.level-1] : doll.battle.fp * action.multiplier;
          dmg = Math.max(1, dmg + Math.min(2, doll.battle.ap - enemy.battle.armor));
          if(!sureHit) {
            dmg *= (doll.battle.acc / (doll.battle.acc + enemy.battle.eva));
          }
          if(canCrit) {
            dmg *= 1 + (doll.battle.critdmg * (doll.battle.crit / 100) / 100);
          }
          if('fixedDamage' in action) {
            dmg = $.isArray(action.fixedDamage) ? action.fixedDamage[action.level-1] : action.fixedDamage;
          }
          dmg *= enemy.battle.vulnerability;
          dmg *= doll.links;

          if(!('targets' in action)) {
            dmg = dmg * Math.min(doll.battle.targets, enemy.count);
          } else {
            dmg = dmg * Math.min(action.targets, enemy.count);
          }

          if(currentFrame <= 30 * 8 +1) {
            totaldamage8s += dmg;
          }
          totaldamage20s += dmg;
          graphData.y[i].data[currentFrame] += Math.round(dmg);
        }
      }
    }



  }

  $('#dmg-8s').text(Math.round(totaldamage8s));
  $('#dmg-20s').text(Math.round(totaldamage20s));

  determineFinalStats();

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
        var bonus = 1;
        if('stackable' in buff) {
          if(stat == 'rounds') {
            bonus = $.isArray(amount) ? amount[buff.level-1] * buff.stacks : amount * buff.stacks;
            doll.battle.skillbonus.rounds += bonus;
          } else {
            if('stackChance' in buff) {
              for(var i = 0; i < buff.stacks; i++) {
                bonus = $.isArray(buff.stackChance) ? buff.stackChance[buff.level-1] / 100 : buff.stackChance / 100;
                bonus *= $.isArray(amount) ? amount[buff.level-1] / 100 : amount / 100;
                bonus += 1;
                doll.battle.skillbonus[stat] *= bonus;
              }
            } else {
              for(var i = 0; i < buff.stacks; i++) {
                bonus = $.isArray(amount) ? amount[buff.level-1] / 100 : amount / 100;
                bonus += 1;
                doll.battle.skillbonus[stat] *= bonus;
              }
            }
          }
        } else {
          if(stat == 'rounds') {
            doll.battle.skillbonus.rounds += $.isArray(amount) ? amount[buff.level-1] : amount;
          } else {
            if('stackChance' in buff) {
              bonus = $.isArray(buff.stackChance) ? buff.stackChance[buff.level-1] / 100 : stackChance / 100;
              bonus *= $.isArray(amount) ? amount[buff.level-1] / 100 : amount/100;
              doll.battle.skillbonus[stat] *= (bonus + 1);
            } else {
              doll.battle.skillbonus[stat] *= $.isArray(amount) ? (1+(amount[buff.level-1] / 100)) : (1+(amount/100));
            }
          }
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
  doll.battle.maxstats.rounds = Math.max(doll.battle.currentRounds, Math.max(doll.battle.maxstats.rounds, doll.battle.rounds));
  doll.battle.maxstats.armor = Math.max(doll.battle.maxstats.armor, doll.battle.armor);
  doll.battle.maxstats.ap = Math.max(doll.battle.maxstats.ap, doll.battle.ap);

  //track min stats
  doll.battle.minstats.fp = Math.min(doll.battle.minstats.fp, doll.battle.fp);
  doll.battle.minstats.acc = Math.min(doll.battle.minstats.acc, doll.battle.acc);
  doll.battle.minstats.eva = Math.min(doll.battle.minstats.eva, doll.battle.eva);
  doll.battle.minstats.rof = Math.min(doll.battle.minstats.rof, doll.battle.rof);
  doll.battle.minstats.crit = Math.min(doll.battle.minstats.crit, doll.battle.crit);
  doll.battle.minstats.critdmg = Math.min(doll.battle.minstats.critdmg, doll.battle.critdmg);
  doll.battle.minstats.rounds = Math.min(doll.battle.minstats.rounds, doll.battle.rounds);
  doll.battle.minstats.armor = Math.min(doll.battle.minstats.armor, doll.battle.armor);
  doll.battle.minstats.ap = Math.min(doll.battle.minstats.ap, doll.battle.ap);
}

function calculateEnemyStats(enemy) {
  enemy.battle.skillbonus = {
    eva:1,
    armor:1,
    vulnerability:1,
  };

  //calculate skill bonus
  $.each(enemy.battle.buffs, (index,buff) => {
    if('stat' in buff) {
      $.each(buff.stat, (stat,amount) => {
        enemy.battle.skillbonus[stat] *= $.isArray(amount) ? (1 + (amount[buff.level-1] / 100)) : (1 + (amount / 100));
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

  buff.timeLeft = $.isArray(buff.duration) ? Math.floor(buff.duration[buff.level-1] * 30) : Math.floor(buff.duration * 30);
  $.each(targets, (index,target) => {
    if('stackable' in buff) {
      if(target.battle.buffs.find(b => b.name == buff.name) !== undefined) {
        addStack(target, buff, enemy);
      } else {
        target.battle.buffs.push($.extend({}, buff));
      }
    } else {
      target.battle.buffs.push($.extend({}, buff));
    }
    if('stat' in buff && doll != target) {
      if('fp' in buff.stat) {
        triggerPassive('receivefp', target, enemy);
      }
      if('rof' in buff.stat) {
        triggerPassive('receiverof', target, enemy);
      }
      if('eva' in buff.stat) {
        triggerPassive('receiveeva', target, enemy);
      }
      if('acc' in buff.stat) {
        triggerPassive('receiveacc', target, enemy);
      }
      if('crit' in buff.stat) {
        triggerPassive('receivecrit', target, enemy);
      }
    }
  });
}

function triggerPassive(trigger, doll, enemy) {
  if(!('passives' in doll.battle)) {
    return;
  }

  var passives = doll.battle.passives.filter(passive => passive.trigger == trigger);
  $.each(passives, (index, passive) => {
    $.each(passive.effects, (j,effect) => {
      if(effect.type == 'buff') {
        activateBuff(doll,effect,enemy);
      } else if (effect.type == 'loadRounds') {
        var targets = getBuffTargets(doll, effect, enemy);
        $.each(targets, (index,target) => {
          target.battle.currentRounds += $.isArray(effect.rounds) ? effect.rounds[effect.level-1] : effect.rounds;
        });
      } else {
        doll.battle.effect_queue.push($.extend({}, effect));
      }
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

  if(buff.target == 'enemy') {
    targets.push(enemy);
  }

  if(buff.target == 'self') {
    targets.push(doll);
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

  if(buff.target == 'tilesHGSMG') {
    var targetSquares = doll.tiles.target.split(",");
    targetSquares = targetSquares.map(targetSquare => parseInt(targetSquare));
    targetSquares = targetSquares.map(targetSquare => targetSquare + doll.pos);
    for(var i = 0; i < 5; i++) {
      if(echelon[i].id != -1 && $.inArray(echelon[i].pos, targetSquares) != -1) {
        if(echelon[i].type == 1 || echelon[i].type == 2) {
          targets.push(echelon[i]);
        }
      }
    }
  }

  if(buff.target == 'tilesARRF') {
    var targetSquares = doll.tiles.target.split(",");
    targetSquares = targetSquares.map(targetSquare => parseInt(targetSquare));
    targetSquares = targetSquares.map(targetSquare => targetSquare + doll.pos);
    for(var i = 0; i < 5; i++) {
      if(echelon[i].id != -1 && $.inArray(echelon[i].pos, targetSquares) != -1) {
        if(echelon[i].type == 4 || echelon[i].type == 3) {
          targets.push(echelon[i]);
        }
      }
    }
  }

  if(buff.target == 'tilesSGMG') {
    var targetSquares = doll.tiles.target.split(",");
    targetSquares = targetSquares.map(targetSquare => parseInt(targetSquare));
    targetSquares = targetSquares.map(targetSquare => targetSquare + doll.pos);
    for(var i = 0; i < 5; i++) {
      if(echelon[i].id != -1 && $.inArray(echelon[i].pos, targetSquares) != -1) {
        if(echelon[i].type == 6 || echelon[i].type == 5) {
          targets.push(echelon[i]);
        }
      }
    }
  }

  if(buff.target == 'column') {
    var col = [-20,-10,10,20];
    $.each(col, (index,distance) => {
      var target = echelon.find(d => d.pos == doll.pos+distance && d.id != -1);
      if(target !== undefined) {
        targets.push(target);
      }
    });
  }

  if(buff.target == 'front') {
    var dollInFront = echelon.find(d => d.pos == doll.pos+1);
    if(dollInFront !== undefined && dollInFront.id != -1) {
      targets.push(dollInFront);
    }
  }

  if(buff.target == 'doll') {
    targets.push(echelon.find(doll => doll.id == buff.dollid));
  }

  return targets;
}

function addStack(target, effect, enemy) {
  var buff = target.battle.buffs.find(buff => buff.name == effect.name);
  if('stacksToAdd' in buff) {
    buff.stacks += $.isArray(buff.stacksToAdd) ? buff.stacksToAdd[buff.level-1] : buff.stacksToAdd;
  } else {
    buff.stacks++;
  }
  if('max_stacks' in buff) {
    buff.stacks = buff.stacks > buff.max_stacks ? buff.max_stacks : buff.stacks;
  }
  var refresh = 'refreshduration' in buff ? buff.refreshduration : true; //buff = original buff, effect = new stack
  if(refresh) {
    buff.timeLeft = $.isArray(buff.duration) ? Math.floor(buff.duration[buff.level-1] * 30) : Math.floor(buff.duration * 30);
  }

  $.each(target.battle.passives.filter(passive => 'stacksRequired' in passive), (index,passiveskill) => {
    var b = target.battle.buffs.find(buf => buf.name == passiveskill.name);
    if(b != undefined) {
      if('stackChance' in b) {
        var expectedstacks = $.isArray(b.stackChance) ? b.stacks * b.stackChance[b.level-1] / 100 : b.stacks * b.stackChance / 100;
        if(expectedstacks >= passiveskill.stacksRequired) {
          triggerPassive('hasStacks', target, enemy);
        }
      } else if(b.stacks >= passiveskill.stacksRequired) {
        triggerPassive('hasStacks', target, enemy);
      }
    }
  });
}

function addPassive(doll, passive, enemy, currentTime) {
  var passiveskill = $.extend({}, passive);

  passiveskill.level = doll.skilllevel;
  $.each(passiveskill.effects, (index,effect) => effect.level = passiveskill.level);
  if('duration' in passiveskill) {
    passiveskill.timeLeft = $.isArray(passiveskill.duration) ? Math.floor(passiveskill.duration[passiveskill.level-1] * 30) : Math.floor(passiveskill.duration * 30);
  }
  if('interval' in passiveskill) {
    passiveskill.startTime = currentTime;
  }

  doll.battle.passives.push(passiveskill);
}

function removeBuff(doll, buff, enemy) {
  var targets = getBuffTargets(doll, buff, enemy);

  $.each(targets, (index,target) => {
    target.battle.buffs = target.battle.buffs.filter(b => {
      if('name' in b) {
        return b.name != buff.name;
      } else {
        return true;
      }
    });
  });
}

function removePassive(doll, passive, enemy) {
  var targets = getBuffTargets(doll, passive, enemy);

  $.each(targets, (index,target) => {
    target.battle.passives = target.battle.passives.filter(p => p.name != passive.name);
  });
}

function modifySkill(doll, effect) {
  if(doll.id == 199) {
    //ballista
    if(effect.modifySkill == 'addMark') {
      doll.battle.skill.marks++;
      var activeBuff = doll.battle.buffs.find(buff => buff.name == 'normalAttackBuff');
      if(activeBuff !== undefined) {
        activeBuff.attacksLeft++;
      }
    }
    if(effect.modifySkill == 'removeMark') {
      doll.battle.skill.marks--;
    }
    if(effect.modifySkill == 'accumulate') {
      doll.battle.effect_queue.find(action => action.name == 'normalAttackBuff').attacksLeft = doll.battle.skill.marks;
    }
  }

  if(doll.id == 224) {
    //m82a1
    if(effect.modifySkill == 'usedSkill') {
      doll.battle.skillUseCount++;
    }
    if(doll.battle.skillUseCount == 2) {
      doll.battle.skill.effects[0].multiplier = doll.battle.skill.effects[0].multiplier.map(mult => mult * 2);
    }
    if(doll.battle.skillUseCount >= 3) {
      doll.battle.skill.effects = [];
    }
  }
}

function getUsableSkillEffects(effects) {
  var validEffects = [];

  for(var i = 0; i < effects.length; i++) {
    if(!('requirements' in effects[i])) {
      validEffects.push($.extend({}, effects[i]));
      continue;
    }
    var valid = true;
    $.each(effects[i].requirements, (condition,value) => {
      if(condition == 'night') {
        valid = valid && (isNight == value);
      }
      if(condition == 'armored') {
        valid = valid && (enemyArmor > 0 == value);
      }
      if(condition == 'boss') {
        valid = valid && (isBoss == value);
      }
    });
    if(valid) {
      validEffects.push($.extend({}, effects[i]));
    }
  }

  return validEffects;
}

function determineFinalStats() {
  for(var i = 0; i < 5; i++) {
    var doll = echelon[i];
    if(doll.id == -1) continue;

    doll.battle.finalstats = {};
    $.each(['fp','eva','acc','rof','crit','critdmg','rounds','armor','ap'], (index,stat) => {
      if(doll.battle.maxstats[stat] == doll.pre_battle[stat]) {
        doll.battle.finalstats[stat] = doll.battle.minstats[stat];
      } else {
        doll.battle.finalstats[stat] = doll.battle.maxstats[stat];
      }

      //THIS IS A TERRIBLE WAY TO DO IT AND DOES NOT REFLECT WHAT THE STAT WILL BE WHEN ALL SKILLS ARE ON
      //however, this only applies to cases where a doll reduces a stat (aug, mp7, etc)
      //if a doll if only ever buffed during battle or only ever debuffed in battle, the stats shown in the ui will be correct
      if(doll.battle.maxstats[stat] != doll.pre_battle[stat] && doll.battle.minstats[stat] != doll.pre_battle[stat]) {
        doll.battle.finalstats[stat] = Math.round((doll.battle.maxstats[stat] + doll.battle.minstats[stat]) / 2);
      }
    });
  }
}



const SKILL_CONTROL = {
  97:function(doll) {
    //UMP40
    doll.skill = $.extend({}, dollData[doll.id-1].skill);

    var icd = Math.max(1, parseInt($('#ump40-icd').val()) || 0);
    doll.skill.icd = icd;
  },
  159:function(doll) {
    //FP-6
    doll.skill = $.extend({}, dollData[doll.id-1].skill);

    var target1 = parseInt($('#skill-control-body .shield1 input:checked').val());
    var target2 = parseInt($('#skill-control-body .shield2 input:checked').val());

    doll.skill.effects[0].target = 'doll'
    doll.skill.effects[1].target = 'doll'

    doll.skill.effects[0].dollid = target1;
    doll.skill.effects[1].dollid = target2;
  },
  178:function(doll) {
    //Contender
    doll.skill = $.extend({}, dollData[doll.id-1].skill);

    var icd = Math.max(6, parseInt($('#contender-icd').val()) || 0);
    doll.skill.icd = icd;
  },
  197:function(doll) {
    //thunder
    var miss = $('#thunder-skill').prop('checked');
    if(miss) {
      doll.skill.effects[0].delay = 3;
    } else {
      doll.skill.effects[0].delay = 1;
    }
  },
  209:function(doll) {
    //mdr
    var dollInFront = $('#mdr-skill').prop('checked');
    if(dollInFront) {
      doll.skill.effects[0] = {
        type:"buff",
        target:"front",
        stat:{
          eva:[40,44,49,53,58,62,67,71,76,80]
        },
        duration:[6,6.4,6.8,7.2,7.6,8,8.4,8.8,9.4,10]
      };
    } else {
      doll.skill.effects[0] = {
        type:"buff",
        target:"self",
        stat:{
          fp:[20,23,26,28,31,34,37,39,42,45],
          rof:[10,11,13,14,15,17,18,19,21,22]
        },
        duration:[6,6.4,6.8,7.2,7.6,8,8.4,8.8,9.4,10]
      };
    }
  },
  221:function(doll) {
    //type100
    var shieldNoBreak = $('#t100-skill').prop('checked');
    if(shieldNoBreak) {
      doll.skill.effects[0] = {
        type:"buff",
        target:"self",
        stat:{
          fp:[40,45,50,55,60,65,70,75,80,85]
        },
        duration:[3,3.2,3.4,3.7,3.9,4.1,4.3,4.6,4.8,5]
      };
    } else {
      doll.skill.effects[0] = {
        type:"buff",
        target:"self",
        stat:{
          eva:[30,34,38,42,46,49,53,57,61,65]
        },
        duration:[3,3.2,3.4,3.7,3.9,4.1,4.3,4.6,4.8,5]
      };
    }
  },
  224:function(doll) {
    //m82a1
    var victories = parseInt($('#m82a1-skill').val());
    doll.skill.effects[0].victories = victories;
    doll.skill.effects[0].skillDamageBonus = [5,6,6,7,7,8,8,9,9,10];
  },
  262:function(doll) {
    //g3mod
    var morethanhalfhp = $('#g3mod-skill').prop('checked');
    if(morethanhalfhp) {
      doll.skill.buffednade = false;
    } else {
      doll.skill.buffednade = true;
    }
  }
};

const SKILL_CONTROL_HTML = {
  97:function(doll) {
    //ump40
    var value = doll.skill.icd;
    return "Enter when UMP40's skill should be activated (in seconds), then hit apply<br><input id=\"ump40-icd\" type=\"number\" value=\""+value+"\"><br>Minimum is 1 second due to the initial cooldown. There is no maximum."
  },
  159:function(doll) {
    //FP-6
    var htmlstring = "Select the dolls that should receive the two shields/damage buffs from FP-6 then hit apply. (Her skill targets only the dolls in her column but since you can move everyone around in battle, you can pick any doll to receive the buff in this simulator)<br>";
    htmlstring += 'Shield 1:<div class="shield1">';
    for(var i = 0; i < 5; i++) {
      if(echelon[i].id == -1) continue;
      htmlstring += '<input type="radio" name="shield1" value="'+echelon[i].id;
      if(echelon[i] == doll)
        htmlstring += '" checked>'+echelon[i].name+'</input><br>';
      else
        htmlstring += '">'+echelon[i].name+'</input><br>';
    }
    htmlstring += '</div><br>Shield 2:<div class="shield2">'
    for(i = 0; i < 5; i++) {
      if(echelon[i].id == -1) continue;
      htmlstring += '<input type="radio" name="shield2" value="'+echelon[i].id;
      if(echelon[i] == doll)
        htmlstring += '" checked>'+echelon[i].name+'</input><br>';
      else
        htmlstring += '">'+echelon[i].name+'</input><br>';
    }
    htmlstring += '</div>'

    return htmlstring;
  },
  178:function(doll) {
    //Contender
    var value = doll.skill.icd;
    return "Enter when Contender's skill should be activated (in seconds, before skill cooldown tile effects are applied), then hit apply. Remember that there is a 1 second aiming time.<br><input id=\"contender-icd\" type=\"number\" value=\""+value+"\"><br>Minimum is 6 seconds due to the initial cooldown. There is no maximum.";
  },
  197:function(doll) {
    //thunder
    var checked = doll.skill.effects[0].delay > 1 ? true : false;
    var htmlstring = "Check the box if you want Thunder's skill to miss the first time, then hit apply.<br><input type=\"checkbox\" id=\"thunder-skill\"";
    if(checked) {
      htmlstring += 'checked>Miss</input>';
    } else {
      htmlstring += '>Miss</input>';
    }
    return htmlstring;
  },
  209:function(doll) {
    //MDR
    var htmlstring = "<p>Since the effects of MDR's skill depends on whether or not there is a doll in front of her IN BATTLE, check the box if you want the sim to assume there is a doll in front of her (default, provides shield+evasion bonus to that doll) or not (provides firepower+rate of fire buff to MDR), then hit apply</p>";
    var checked = doll.skill.effects[0].target == 'front' ? true: false;
    if(checked) {
      htmlstring += '<br><input type="checkbox" id="mdr-skill" checked>doll in front of mdr</input>';
    } else {
      htmlstring += '<br><input type="checkbox" id="mdr-skill">doll in front of mdr</input>';
    }
    return htmlstring;
  },
  221:function(doll) {
    //type100
    var htmlstring = "<p>Uncheck the box if you want the shield to break (evasion buff), check the box if you want the shield to stay (default, damage buff), then hit apply.</p>";
    var checked = 'fp' in doll.skill.effects[0].stat ? true: false;
    if(checked) {
      htmlstring += '<br><input type="checkbox" id="t100-skill" checked>Shield does not break</input>';
    } else {
      htmlstring += '<br><input type="checkbox" id="t100-skill">Shield does not break</input>';
    }
    return htmlstring;
  },
  224:function(doll) {
    //m82a1
    var htmlstring = "<p>Each victory in the current mission increases M82A1's skill damage by 10% (up to 3 stacks). Select the number of victories in the current mission, then hit apply.</p><br>";
    htmlstring += 'Number of victories in current mission:<select id="m82a1-skill">';
    for(var i = 0; i < 4; i++) {
      htmlstring += '<option value="'+i+'"';
      if(doll.skill.effects[0].victories == i) {
        htmlstring += 'selected>'+i+'</option>';
      } else {
        htmlstring += '>'+i+'</option>';
      }
    }
    htmlstring += '</select>';
    return htmlstring;
  },
  262:function(doll) {
    //g3mod
    var htmlstring = "<p>Check the box if you want the sim to assume targets have more than 50% hp (stun). Uncheck for less than 50% hp (default, grenade damage increase) then hit apply.</p>"
    var morethanhalfhp = doll.skill.buffednade ? false : true;
    if(!morethanhalfhp) {
      htmlstring += '<br><input type="checkbox" id="g3mod-skill">More than 50% hp</input>';
    } else {
      htmlstring += '<br><input type="checkbox" id="g3mod-skill" checked>More than 50% hp</input>';
    }
    return htmlstring;
  }
};


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
