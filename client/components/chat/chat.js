gameModule.component("chat", {
    templateUrl: "components/chat/chat.template.html",
    controller: function GameController($scope, $http) {
        // Add functions to the scope here.
        $scope.initGame = function() {
          $('#chat-form').submit( function(e) {
            e.preventDefault();
            socket.emit('sendMessage', $('#chat-input').val());
            $('#chat-input').val('');
          });

           socket.on('addToChat', function(data) {
             $('#chat-text').append('<div>' + data + '</div>');
             console.log("Message recieved");
           });
        }
      }
});
