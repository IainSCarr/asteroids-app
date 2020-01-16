gameModule.component("login", {
    templateUrl: "components/login/login.template.html",
    controller: function GameController($scope, $http) {
        $scope.init = function() {
          $('#joinForm').submit( function(e) {
            socket.emit('joinGame', $('#username').val());
            joinGame();
          });
        }
    }
});
