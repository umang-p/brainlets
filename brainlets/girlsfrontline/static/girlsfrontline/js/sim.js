var dolls;
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

  dolls = [{affection:2},{},{},{},{}];

  $('.affection').click(cycleAffection);

  isNight = false;
  $('#day-btn').click(toggleDayNight);
  $('#night-btn').click(toggleDayNight);

  isBoss = false;
  $('#boss-toggle').click(toggleBoss);

  initEquipSelectModal();
  initDollSelectModal();

  $('[data-toggle="tooltip"]').tooltip();
});

// $('.modal').modal();
// $('.modal').modal('show');

// $('#HGlist .stars5').append('<button type="button" class="btn mb-1" data-toggle="tooltip" data-placement="top" data-original-title="not grizzly">Welrod</button>');

function cycleAffection(event) {
  var affectionImage = $(event.target);

  var dollIndex = parseInt(affectionImage.parent().parent().parent().attr('id').slice(-1)) - 1;

  dolls[dollIndex].affection++;
  if(dolls[dollIndex].affection > 3) {
    dolls[dollIndex].affection = 0;
  }

  affectionImage.prop('hidden', true);
  affectionImage.parent().children().eq(dolls[dollIndex].affection).prop('hidden', false);
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
}

function toggleBoss() {
  if(isBoss) {
    $('#boss-toggle').removeClass('btn-success');
    isBoss = false;
  } else {
    $('#boss-toggle').addClass('btn-success');
    isBoss = true;
  }
}

function initDollSelectModal() {
  for(var i = 0; i < dollData.length; i++) {
    var doll = dollData[i];
    $('#doll-list-'+doll.type+' .stars'+doll.rarity).append('<button type="button" class="btn mb-1" data-id="'+doll.id+'" data-toggle="tooltip" data-placement="top" data-html="true" data-original-title="'+doll.tooltip_tiles+'<br>'+doll.tooltip_skill1+'<br>'+doll.tooltip_skill2+'">'+doll.name+'</button>');
  }

  $('#doll-select button').click(changeDoll);
}

function initEquipSelectModal() {
  for(var i = 0; i < equipData.length; i++) {
    var equip = equipData[i];
    $('#equip-select .stars'+equip.rarity).append('<button type="button" class="btn mb-1" data-id="'+equip.id+'" data-toggle="tooltip" data-placement="top" data-original-title="'+equip.tooltip+'"><img src="/static/girlsfrontline/sim/equips/'+equip.type+'.png" class="img-fluid"></img></button>');
  }

  $('#equip-select button').click(changeEquipment);
}

function changeEquipment(event) {

}

function changeDoll(event) {

}
