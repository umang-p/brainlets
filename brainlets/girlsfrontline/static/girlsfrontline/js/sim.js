var dolls;
var isNight;
var isBoss;

$(function () {
  dolls = [{affection:2},{},{},{},{}];
  $('[data-toggle="tooltip"]').tooltip();

  $('.affection').click(cycleAffection);

  isNight = false;
  $('#day-btn').click(toggleDayNight);
  $('#night-btn').click(toggleDayNight);

  isBoss = false;
  $('#boss-toggle').click(toggleBoss);
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
    return;
  }
  if(!isNight && $(event.target).attr('id').startsWith('night')) {
    $('#day-btn').removeClass('btn-success');
    $('#night-btn').addClass('btn-success');
    isNight = true;
    return;
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
