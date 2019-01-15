var echelon;
var isNight;
var isBoss;
var equipData;
var dollData;
var enemyEva;
var enemyArmor;
var enemyCount;
var VALID_EQUIPS = [[[4,13],[6],[10,12]], //hg
                    [[10,12],[6],[1,2,3,4,13]],//smg
                    [[5],[1,2,3,13],[15]],//rf
                    [[1,2,3,4,13],[8],[10,12]],//ar
                    [[5],[1,2,3],[14]],//mg
                    [[11],[7,9],[1,2,3,4]]]; //sg

var TYPE_SCALARS = [{"fp":0.6,"rof":0.8,"acc":1.2,"eva":1.8,"armor":0}, //hg
                    {"fp":0.6,"rof":1.2,"acc":0.3,"eva":1.6,"armor":0}, //smg
                    {"fp":2.4,"rof":0.5,"acc":1.6,"eva":0.8,"armor":0}, //rf
                    {"fp":1,  "rof":1,  "acc":1,  "eva":1,  "armor":0},   //ar
                    {"fp":1.8,"rof":1.6,"acc":0.6,"eva":0.6,"armor":0}, //mg
                    {"fp":0.7,"rof":0.4,"acc":0.3,"eva":0.3,"armor":1}]; //sg

var GROWTH_FACTORS = {
  "mod": {
    "basic": {
      "armor": [13.979, 0.04],
      "eva": [5],
      "acc": [5],
      "fp": [16],
      "rof": [45],
    },
    "grow": {
      "eva": [0.075, 22.572],
      "acc": [0.075, 22.572],
      "fp": [0.06, 18.018],
      "rof": [0.022, 15.741]
    }
  },
  "normal": {
    "basic": {
      "armor": [2, 0.161],
      "eva": [5],
      "acc": [5],
      "fp": [16],
      "rof": [45],
    },
    "grow": {
      "eva": [0.303, 0],
      "acc": [0.303, 0],
      "fp": [0.242, 0],
      "rof": [0.181, 0]
    }
  }
}

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

  initEquipSelectModal();
  initDollSelectModal();

  for(var i = 1; i <= 5; i++) {
    $('#doll'+i+' .add-doll').click(i,selectDoll);
    $('#doll'+i+' .remove-doll').click(i,removeDoll);
    $('#doll'+i+' .doll-level-select').change(i-1,changeLevel);
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
  $('#enemy-armor').change(changeEnemyStats);
  $('#enemy-count').change(changeEnemyStats);

  $('[data-toggle="tooltip"]').tooltip();
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
    affection:2,
    fp:0,
    acc:0,
    eva:0,
    rof:0,
    crit:0,
    critdmg:0,
    rounds:0,
    armor:0,
    ap:0,
    tiles:{},
    equip1:-1,
    equip2:-1,
    equip3:-1,
    base:{},
    pre_battle:{},
    equip_bonus:{},
    tile_bonus:{
      fp:0,
      acc:0,
      eva:0,
      rof:0,
      crit:0,
      skillcd:0,
      armor:0
    }
  }

  return obj;
}

function changeEnemyStats() {
  enemyEva = parseInt($('#enemy-eva').val());
  enemyArmor = parseInt($('#enemy-armor').val());
  enemyCount = parseInt($('#enemy-count').val());

  //update dps for all dolls
  //update total dmg
  //update dps ui
}

function changeAffection(event) {
  var dollIndex = event.data;
  var doll = echelon[dollIndex];

  $('#doll'+(dollIndex+1)+' .affection').children().eq(doll.affection).prop('hidden', true);
  doll.affection++;
  doll.affection = doll.affection > 3 ? 0 : doll.affection;
  $('#doll'+(dollIndex+1)+' .affection').children().eq(doll.affection).prop('hidden', false);

  calculatePreBattleStatsForDoll(dollIndex);
  //update DPS for this doll
  //update total dps
  //update ui
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
  //update DPS for all dolls
  //update total dps
  //update ui
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

  //update DPS for all dolls
  //update total dps
  //update ui
}

function initDollSelectModal() {
  for(var i = 0; i < dollData.length; i++) {
    var doll = dollData[i];
    $('#doll-list-'+doll.type+' .stars'+doll.rarity).append('<button type="button" class="btn mb-1 mr-1" data-id="'+doll.id+'" data-toggle="tooltip" data-placement="top" data-html="true" data-original-title="'+doll.tooltip_tiles+'<br>'+doll.tooltip_skill1+'<br>'+doll.tooltip_skill2+'">'+doll.name+'</button>');
  }
}

function initEquipSelectModal() {
  for(var i = 0; i < equipData.length; i++) {
    var equip = equipData[i];
    $('#equip-select .stars'+equip.rarity).append('<button type="button" class="btn mb-1 mr-1" data-id="'+equip.id+'" data-type="'+equip.type+'" data-toggle="tooltip" data-placement="top" data-original-title="'+equip.tooltip+'"><img src="/static/girlsfrontline/sim/equips/'+equip.type+'.png" class="img-fluid"></img></button>');
  }
}

function selectEquipment(event) {
  event.preventDefault();
  $('#equip-select button').off('click');
  $('#equip-select button').click(event.data, changeEquipment);
  $('#remove-equip').off('click');
  $('#remove-equip').click(event.data, removeEquipment);

  //show buttons for only equips that can be worn by current doll in current slot
  $('#equip-select [data-id]').prop('hidden', true);
  var validTypes = getValidEquipTypes(event.data.doll, event.data.equip);
  for(var i = 0; i < validTypes.length; i++) {
    $('#equip-select [data-type='+validTypes[i]+']').prop('hidden', false);
  }

  $('#equip-select').modal('show');
}

function getValidEquipTypes(dollIndex, equipSlot) {
  if(echelon[dollIndex].id == -1) {
    return [-1];
  }
  var validTypes = VALID_EQUIPS[echelon[dollIndex].type-1][equipSlot-1];

  //special cases here

  return validTypes;
}

function changeEquipment(event) {
  $('#equip-select').modal('hide');

  var dollIndex = event.data.doll;
  var equipSlot = event.data.equip;

  echelon[dollIndex]['equip'+equipSlot] = parseInt($(event.target).attr('data-id'));
  $('#doll'+(dollIndex+1)+' .equip'+equipSlot+'-level-select').val(10);

  calculateEquipBonus(dollIndex);
  calculatePreBattleStatsForDoll(dollIndex);
  //update DPS for this doll
  //update total dps
  //update ui
  updateUIForDoll(dollIndex);
}

function removeEquipment(event) {
  $('#equip-select').modal('hide');
  var dollIndex = event.data.doll;
  var equipSlot = event.data.equip;

  echelon[dollIndex]['equip'+equipSlot] = -1;
  calculateEquipBonus(dollIndex);
  calculatePreBattleStatsForDoll(dollIndex);
  //update dps for this doll
  //update total dps
  //update ui
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

  echelon[index].name = selectedDoll.name;
  echelon[index].id = selectedDoll.id;
  echelon[index].type = selectedDoll.type;
  echelon[index].tiles = selectedDoll.tiles;
  echelon[index].tooltip_tiles = selectedDoll.tooltip_tiles;
  $('#pos'+echelon[index].pos).attr('data-index', index);
  $('#doll'+(index+1)+' .doll-level-select').val(100);

  calculateBaseStats(index);
  setDefaultEquips(index);
  calculateEquipBonus(index);
  calculateTileBonus();
  calculatePreBattleStatsAllDolls();
  //update dps for all dolls
  //update total dps
  //update ui for all
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

  //handle off tanks here
  //handle special cases and unique equipment here
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
    var dollIndex = $('#pos'+value).attr('data-index');
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

      if(echelon[dollIndex].tiles.target_type == 0 || echelon[dollIndex].tiles.target_type == echelon[targetIndex].type) {
        echelon[targetIndex].tile_bonus.fp += echelon[dollIndex].tiles.effect.fp;
        echelon[targetIndex].tile_bonus.acc += echelon[dollIndex].tiles.effect.acc;
        echelon[targetIndex].tile_bonus.eva += echelon[dollIndex].tiles.effect.eva;
        echelon[targetIndex].tile_bonus.rof += echelon[dollIndex].tiles.effect.rof;
        echelon[targetIndex].tile_bonus.crit += echelon[dollIndex].tiles.effect.crit;
        echelon[targetIndex].tile_bonus.skillcd += echelon[dollIndex].tiles.effect.skillcd;
        if(echelon[targetIndex].tile_bonus.skillcd > 30) {
          echelon[targetIndex].tile_bonus.skillcd = 30;
        }
        echelon[targetIndex].tile_bonus.armor += echelon[dollIndex].tiles.effect.armor;
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

function getAffectionBonus(affection) {
  if(affection == 0) {
    return -0.05;
  } else if(affection == 1) {
    return 0;
  } else if(affection == 2) {
    return 0.05;
  } else {
    return 0.10;
  }
}

function calculatePreBattleStatsForDoll(dollIndex) {
  var doll = echelon[dollIndex];

  if(doll.id == -1)
    return;

  var affection_bonus = getAffectionBonus(doll.affection);

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
  if(doll.type == 6) { //sg
    doll.pre_battle.rof = Math.min(60, doll.pre_battle.rof);
  } else if(doll.type != 5) { ////any other than sg and mg
    doll.pre_battle.rof = Math.min(120, doll.pre_battle.rof);
  }
  doll.pre_battle.crit = Math.min(100, doll.pre_battle.crit);
  if(isNight) {
    doll.pre_battle.acc = Math.floor(doll.pre_battle.acc * (1 - (.9 - .9 * doll.pre_battle.nightview / 100)));
  }
}

function calculatePreBattleStatsAllDolls() {
  for(var i = 0; i < 5; i++) {
    calculatePreBattleStatsForDoll(i);
  }
}

function changeLevel(event) {
  var doll = echelon[event.data];

  calculateBaseStats(event.data);
  if(doll.type == 1) { //hg
    calculateTileBonus();
    calculatePreBattleStatsAllDolls();
  } else {
    calculatePreBattleStatsForDoll(event.data);
  }
  //update dps for this doll
  //update dps for all dolls
  updateUIAllDolls();
}

function changeEquipLevel(event) {
  var doll = echelon[event.data];

  calculateEquipBonus(event.data);
  calculatePreBattleStatsForDoll(event.data);
  //update dps for this doll
  //update dmg for all dolls
  updateUIAllDolls();
}

function removeDoll(event) {
  event.preventDefault();

  var index = event.data-1;
  $('#pos'+echelon[index].pos).attr('data-index', index);
  echelon[index] = createDummyDoll(echelon[index].pos);
  $('#doll'+(index+1)+' .affection').children().prop('hidden', true);
  $('#doll'+(index+1)+' .affection').children().eq(echelon[index].affection).prop('hidden', false);

  calculateTileBonus();
  calculatePreBattleStatsAllDolls();
  //update dps for all dolls
  //update total dps
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
    $('#doll'+(index+1)+'-name').text('-');
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

    $('#pos'+doll.pos+' > img').attr('src', '/static/girlsfrontline/sim/dolls/'+doll.name+'.png');

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

function findDollIndexById(id) {
  if(id == -1) {
    return -1;
  }
  for(var i = 0; i < echelon.length; i++) {
    if(echelon[i].id == id) {
      return i;
    }
  }
  return -1;
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
  //update dps for all dolls
  //update total dps
  updateUIAllDolls();
}
