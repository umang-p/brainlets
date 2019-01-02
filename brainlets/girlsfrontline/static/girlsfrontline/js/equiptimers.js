function filterEquips() {
  var hours = parseInt($("#hours").val()) || 0;
  var minutes = parseInt($("#minutes").val()) || 0;
  var equips = $("tbody").children();

  for(var i = 0; i < equips.length; i++) {
    var time = $($(equips[i]).children()[0]).text().split(":");
    if(time[0] == hours && time[1] == minutes) {
      $(equips[i]).prop("hidden", false);
    } else {
      $(equips[i]).prop("hidden", true);
    }
  }

  if(hours == 0 && minutes == 0) {
    for(var i = 0; i < equips.length; i++) {
      $(equips[i]).prop("hidden", false);
    }
  }
}

function focusMinutes() {
  if(event.keyCode == 16 || event.keyCode == 9)
    return;
  if($.isNumeric($("#hours").val()))
    $("#minutes").focus().select();
}

$(function() {
  $("#hours").on('input', filterEquips);
  $("#hours").keyup(focusMinutes);
  $("#minutes").on('input', filterEquips);
  $("#hours").focus();
});
