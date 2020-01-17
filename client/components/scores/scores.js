gameModule.component("scores", {
    templateUrl: "components/scores/scores.template.html",
    controller: function GameController($scope, $http) {
        $scope.initGame = function() {
          $http.get("/highscores").then(function(response) {
            $("#highscores").empty().append("<thead><tr><th scope='col'>#</th><th scope='col'>Name</th><th scope='col'>Score</th><th scope='col'>Date</th></tr></thead><tbody>");
            for (var i = 0; i < response.data.length; i++) {
              var d = new Date(response.data[i].date);
              $("#highscores").append("<tr><th scope='row'>" + (i+1) + "</th><td>" + response.data[i].name + "</td><td>" + response.data[i].score + "</td><td>" + d.toDateString() + "</td></tr>");
            }
            $("#highscores").append("</tbody>");
          });

          socket.on('updateHighscores',function(data){
            console.log("updating highscores");
            $http.get("/highscores").then(function(response) {
              $("#highscores").empty().append("<thead><tr><th scope='col'>#</th><th scope='col'>Name</th><th scope='col'>Score</th><th scope='col'>Date</th></tr></thead><tbody>");
              for (var i = 0; i < response.data.length; i++) {
                var d = new Date(response.data[i].date);
                $("#highscores").append("<tr><th scope='row'>" + (i+1) + "</th><td>" + response.data[i].name + "</td><td>" + response.data[i].score + "</td><td>" + d.toDateString() + "</td></tr>");
              }
              $("#highscores").append("</tbody>");
          });
        });
      }
    }
});
