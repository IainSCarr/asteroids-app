var isDarker = false;

gameModule.component("chat", {
    templateUrl: "components/chat/chat.template.html",
    controller: function GameController($scope, $http) {
        $scope.initGame = function() {
          $('#chat-form').submit( function(e) {
            e.preventDefault();
            socket.emit('sendMessage', $('#chat-input').val());
            $('#chat-input').val('');
          });


          // $(window).scroll($.debounce( 250, true, function(){
          //   $('#scrollMsg').html('SCROLLING!');
          // }));
          // $(window).scroll($.debounce( 250, function(){
          //   $('#scrollMsg').html('DONE!');
          // }));

           socket.on('addToChat', function(data) {
             if (isDarker) {
               $('#chat-text').append("<div class='chat-message dark'>" + data + '</div>');
             }
             else {
               $('#chat-text').append("<div class='chat-message'>" + data + '</div>');
             }
             isDarker = !isDarker;

             // var scroll = $('#chat-text');
             // scroll.scrollTop(scroll.scrollHeight);
             var element = document.getElementById('chat-text');
             element.scrollTop = element.scrollHeight;
           });
        }
      }
});
