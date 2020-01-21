gameModule.component("scores", {
    templateUrl: "components/scores/scores.template.html",
    controller: function ScoresController($scope, $http) {
        $scope.initGame = function() { // when component is created
          $http.get("/highscores").then(function(response) { // get highscores from database
            $("#highscores").empty().append("<thead><tr><th scope='col'>#</th><th scope='col'>Name</th><th scope='col'>Score</th><th scope='col'>Date</th></tr></thead><tbody>");
            // for all scores returned
            for (var i = 0; i < response.data.length; i++) {
              var d = new Date(response.data[i].date).toLocaleString(); // convert date format
              $("#highscores").append("<tr><th scope='row'>" + (i+1) + "</th><td>" + response.data[i].name + "</td><td>" + response.data[i].score + "</td><td>" + d + "</td></tr>"); // add score to table
            }
            $("#highscores").append("</tbody>");
          });

          socket.on('updateHighscores',function(data){ // when a player has set a new highscore
            $http.get("/highscores").then(function(response) {
              $("#highscores").empty().append("<thead><tr><th scope='col'>#</th><th scope='col'>Name</th><th scope='col'>Score</th><th scope='col'>Date</th></tr></thead><tbody>");
              for (var i = 0; i < response.data.length; i++) {
                var d = new Date(response.data[i].date).toLocaleString();
                $("#highscores").append("<tr><th scope='row'>" + (i+1) + "</th><td>" + response.data[i].name + "</td><td>" + response.data[i].score + "</td><td>" + d + "</td></tr>");
              }
              $("#highscores").append("</tbody>");
          });
        });
      }
    }
});
