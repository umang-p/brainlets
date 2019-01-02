var dolls;

$(function () {
  dolls = [{affection:2},{},{},{},{}];
  $('[data-toggle="tooltip"]').tooltip();

  $(".affection").click(cycleAffection);
});

// $(".modal").modal();
// $(".modal").modal('show');

// $("#HGlist .stars5").append('<button type="button" class="btn mb-1" data-toggle="tooltip" data-placement="top" data-original-title="not grizzly">Welrod</button>');

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
