var echelon;
var isNight;
var isBoss;
var equipData;
var dollData;
var VALID_EQUIPS = [[[4,13],[6],[10,12]], //hg
                    [[10,12],[6],[1,2,3,4,13]],//smg
                    [[5],[1,2,3,13],[15]],//rf
                    [[1,2,3,4,13],[8],[10,12]],//ar
                    [[5],[1,2,3],[14]],//mg
                    [[11],[7,9],[1,2,3,4]]]; //sg

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
    $('#doll'+i+' .remove-doll').click(i,removeDoll);
    for(var j = 1; j <= 3; j++) {
      $('#doll'+i+' .equip'+j).click({doll:i-1, equip:j}, selectEquipment);
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

  calculateEquipBonus(dollIndex);
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
  echelon[index].tooltip_tiles = selectedDoll.tooltip_tiles;
  $('#pos'+echelon[index].pos).attr('data-index', index);

  setDefaultEquips(index);
  calculateTileBonus();

  //update dps for all dolls
  //update total dps
  //update ui for all
  updateUIAllDolls();
}

function setDefaultEquips(dollIndex) {
  var doll = echelon[dollIndex];

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
    echelon[dollIndex].equip_bonus.fp += equip.fp;
    echelon[dollIndex].equip_bonus.acc += equip.acc;
    echelon[dollIndex].equip_bonus.eva += equip.eva;
    echelon[dollIndex].equip_bonus.rof += equip.rof;
    echelon[dollIndex].equip_bonus.critdmg += equip.critdmg;
    echelon[dollIndex].equip_bonus.crit += equip.crit;
    echelon[dollIndex].equip_bonus.ap += equip.ap;
    echelon[dollIndex].equip_bonus.armor += equip.armor;
    echelon[dollIndex].equip_bonus.nightview += equip.nightview;
    echelon[dollIndex].equip_bonus.rounds += equip.rounds;
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

function removeDoll(event) {
  event.preventDefault();

  var index = event.data-1;
  $('#pos'+echelon[index].pos).attr('data-index', index);
  echelon[index] = createDummyDoll(echelon[index].pos);
  $('#doll'+(index+1)+' .affection').children().prop('hidden', true);
  $('#doll'+(index+1)+' .affection').children().eq(echelon[index].affection).prop('hidden', false);

  calculateTileBonus();
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
    $('#doll'+(index+1)+' .fp span').text(doll.fp);
    $('#doll'+(index+1)+' .acc span').text(doll.acc);
    $('#doll'+(index+1)+' .eva span').text(doll.eva);
    $('#doll'+(index+1)+' .rof span').text(doll.rof);
    $('#doll'+(index+1)+' .crit span').text(doll.crit);
    $('#doll'+(index+1)+' .critdmg span').text(doll.fp);
    if(doll.rounds != 0) {
      $('#doll'+(index+1)+' .rounds span').text(doll.rounds);
    }
    $('#doll'+(index+1)+' .armor span').text(doll.armor);
    $('#doll'+(index+1)+' .ap span').text(doll.ap);

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
  //update dps for all dolls
  //update total dps
  updateUIAllDolls();
}
