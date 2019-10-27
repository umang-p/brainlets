function changeDormCount() {
  var numDorms = $("#numDorms").val();
  var comfortFields = $("#comfort").children(":input");

  for(var i = 0; i < numDorms; i++) {
    if(comfortFields[i].hidden) {
      $(comfortFields[i]).prop("hidden", false);
    }
  }
  for(var i = numDorms; i < 10; i++) {
    $(comfortFields[i]).prop("hidden", true);
  }

  calculateBatteries();
}

function calculateBatteries() {
  var numDorms = $("#numDorms").val();
  var comfortFields = $("#comfort").children(":input");
  var totalComfort = 0;

  for(var i = 0; i < numDorms; i++) {
    let comfort = parseInt($(comfortFields[i]).val());
    if (comfort > 21000) {
      $(comfortFields[i]).val(21000);
    } else if (comfort < 0) {
      $(comfortFields[i]).val(0);
    }
    comfort = parseInt($(comfortFields[i]).val());

    totalComfort += comfort || 0;
  }

  var minBatteries = [50, 85, 95, 99, 101, 102, 102.5, 103, 103.5];
  var batteriesPerDay = minBatteries[numDorms-2] + totalComfort * .0011 - Math.pow(totalComfort, 2) * 0.000000001;

  $("#batteries").text(Math.round(batteriesPerDay));
}

$(function() {
  $("#numDorms").change(changeDormCount);
  $("#comfort input").on('input', calculateBatteries);
});
