var echelon;
var isNight;
var isBoss;
var equipData;
var dollData;

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

  $('.affection').click(cycleAffection);

  isNight = false;
  $('#day-btn').click(toggleDayNight);
  $('#night-btn').click(toggleDayNight);

  isBoss = false;
  $('#boss-toggle').click(toggleBoss);

  initEquipSelectModal();
  initDollSelectModal();

  for(var i = 1; i <= 5; i++) {
    $('#doll'+i+' .add-doll').click(i,selectDoll);
    for(var j = 1; j <= 3; j++) {
      $('#doll'+i+' .equip'+j).click({doll:i, equip:j}, selectEquipment);
    }
  }

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
    pos:p,
    affection:2,
    tiles:{},
    base:{},
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

function cycleAffection(event) {
  var affectionImage = $(event.target);

  var dollIndex = parseInt(affectionImage.parent().parent().parent().attr('id').slice(-1)) - 1;

  echelon[dollIndex].affection++;
  if(echelon[dollIndex].affection > 3) {
    echelon[dollIndex].affection = 0;
  }

  affectionImage.prop('hidden', true);
  affectionImage.parent().children().eq(echelon[dollIndex].affection).prop('hidden', false);

  //update DPS for this doll
  //update total dps
  //update ui
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

  //update DPS for all dolls
  //update total dps
  //update ui
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
    $('#equip-select .stars'+equip.rarity).append('<button type="button" class="btn mb-1 mr-1" data-id="'+equip.id+'" data-toggle="tooltip" data-placement="top" data-original-title="'+equip.tooltip+'"><img src="/static/girlsfrontline/sim/equips/'+equip.type+'.png" class="img-fluid"></img></button>');
  }
}

function selectEquipment(event) {
  event.preventDefault();
  $('#equip-select button').off('click');
  $('#equip-select button').click(event.data, changeEquipment);


  //disable unequipables here

  $('#equip-select').modal('show');
}

function changeEquipment(event) {
  $('#equip-select').modal('hide');

  var selectedEquip = equipData[$(event.target).attr('data-id')-1];
  var dollIndex = event.data.doll;
  var equipIndex = event.data.equip;

  echelon[dollIndex].equip_bonus.fp = selectedEquip.fp;
  echelon[dollIndex].equip_bonus.acc = selectedEquip.acc;
  echelon[dollIndex].equip_bonus.eva = selectedEquip.eva;
  echelon[dollIndex].equip_bonus.rof = selectedEquip.rof;
  echelon[dollIndex].equip_bonus.critdmg = selectedEquip.critdmg;
  echelon[dollIndex].equip_bonus.crit = selectedEquip.crit;
  echelon[dollIndex].equip_bonus.ap = selectedEquip.ap;
  echelon[dollIndex].equip_bonus.armor = selectedEquip.armor;
  echelon[dollIndex].equip_bonus.nightview = selectedEquip.nightview;
  echelon[dollIndex].equip_bonus.rounds = selectedEquip.rounds;

  //update DPS for this doll
  //update total dps
  //update ui

  console.log('in change e'+event.data.doll+event.data.equip+'i'+$(event.target).attr('data-id'));
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
  echelon[index].base.fp = selectedDoll.fp;
  echelon[index].base.acc = selectedDoll.acc;
  echelon[index].base.eva = selectedDoll.eva;
  echelon[index].base.rof = selectedDoll.rof;
  echelon[index].base.crit = selectedDoll.crit;
  echelon[index].base.critdmg = selectedDoll.critdmg;
  echelon[index].base.ap = selectedDoll.ap;
  echelon[index].base.rounds = selectedDoll.rounds;
  echelon[index].base.armor = selectedDoll.armor;
  echelon[index].tiles = selectedDoll.tiles;
  $('#pos'+echelon[index].pos).attr('data-id', selectedDoll.id);

  //set default equips

  calculateTileBonus();

  //update dps for all dolls
  //update total dps
  //update ui for all

  console.log('in change d'+event.data+'i'+$(event.target).attr('data-id'));
}

function calculateTileBonus() {
  for(var i = 0; i < echelon.length; i++) {
    echelon[i].tile_bonus = {fp:0,acc:0,eva:0,rof:0,crit:0,skillcd:0,armor:0};
  }

  var validSquares = [12,13,14,22,23,24,32,33,34];
  $.each(validSquares, function(index, value) {
    var id = $('#pos'+value).attr('data-id');
    if(id == -1) {
      return true;
    }

    var doll = findDollIndexById(id);
    var targetSquares = echelon[doll].tiles.target.split(",");

    for(i = 0; i < targetSquares.length; i++) {
      var targetSquare = value + parseInt(targetSquares[i]);
      if($.inArray(targetSquare, validSquares) == -1) {
        continue;
      }

      var target = findDollIndexById($('#pos'+targetSquare).attr('data-id'));
      if(target == -1) {
        continue;
      }

      if(echelon[doll].tiles.target_type == 0 || echelon[doll].tiles.target_type == echelon[target].type) {
        echelon[target].tile_bonus.fp += echelon[doll].tiles.effect.fp;
        echelon[target].tile_bonus.acc += echelon[doll].tiles.effect.acc;
        echelon[target].tile_bonus.eva += echelon[doll].tiles.effect.eva;
        echelon[target].tile_bonus.rof += echelon[doll].tiles.effect.rof;
        echelon[target].tile_bonus.crit += echelon[doll].tiles.effect.crit;
        echelon[target].tile_bonus.skillcd += echelon[doll].tiles.effect.skillcd;
        if(echelon[target].tile_bonus.skillcd > 30) {
          echelon[target].tile_bonus.skillcd = 30;
        }
        echelon[target].tile_bonus.armor += echelon[doll].tiles.effect.armor;
      }
    }
  });
}

function findDollIndexById(id) {
  for(var i = 0; i < echelon.length; i++) {
    if(echelon[i].id == id) {
      return i;
    }
  }
  return -1;
}
