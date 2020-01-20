gameModule.component("login", {
    templateUrl: "components/login/login.template.html",
    controller: function GameController($scope, $http) {
        $scope.init = function() {
          $('#joinForm').submit( function() {
            socket.emit('joinGame', { username: $('#username').val(), pin: ("" + $('#pin').val())});
            joinGame();
          });

          socket.on('connectToRoom',function(data) {
            console.log(data);
          });
      }
    }
});
