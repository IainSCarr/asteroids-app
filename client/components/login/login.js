gameModule.component("login", {
    templateUrl: "components/login/login.template.html",
    controller: function LoginController($scope, $http) {
        $scope.init = function() {
          $('#joinForm').submit( function() { // on form submission
            socket.emit('joinGame', { username: $('#username').val(), pin: ("" + $('#pin').val())}); // send name and pin to server
            joinGame();
          });
      }
    }
});
