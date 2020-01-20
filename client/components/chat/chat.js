var isDarker = false;

gameModule.component("chat", {
    templateUrl: "components/chat/chat.template.html",
    controller: function ChatController($scope, $http) {
        $scope.initGame = function() {
          $('#chat-form').submit( function(e) {
            e.preventDefault();
            socket.emit('sendMessage', $('#chat-input').val()); // send message to server
            $('#chat-input').val(''); // reset input
          });

           socket.on('addToChat', function(data) {
             if (isDarker) {
               $('#chat-text').append("<div class='chat-message dark'>" + data + '</div>');
             }
             else {
               $('#chat-text').append("<div class='chat-message'>" + data + '</div>');
             }
             isDarker = !isDarker; // alternate look

             var element = document.getElementById('#chat-text');
             element.scrollTop = element.scrollHeight; // scroll chat window to bottom to view new message
           });
        }
      }
});
