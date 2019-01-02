function filterDolls() {
  var hours = parseInt($("#hours").val()) || 0;
  var minutes = parseInt($("#minutes").val()) || 0;
  var dolls = $("tbody").children();

  for(var i = 0; i < dolls.length; i++) {
    var time = $($(dolls[i]).children()[0]).text().split(":");
    if(time[0] == hours && time[1] == minutes) {
      $(dolls[i]).prop("hidden", false);
    } else {
      $(dolls[i]).prop("hidden", true);
    }
  }

  if(hours == 0 && minutes == 0) {
    for(var i = 0; i < dolls.length; i++) {
      $(dolls[i]).prop("hidden", false);
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
  $("#hours").on('input', filterDolls);
  $("#hours").keyup(focusMinutes);
  $("#minutes").on('input', filterDolls);
  $("#hours").focus();
});
