var ctx;

var engineoff = new Image();
engineoff.src = '/client/resources/ship-engineoff.png';
var engineon = new Image();
engineon.src = '/client/resources/ship-engineon.png';
var bullet = new Image();
bullet.src = '/client/resources/bullet.png';

document.onkeydown = function(event) {
  if (event.keyCode === 39) // right arrow
    socket.emit('keyPress', {inputId:'right', state:true});
  else if(event.keyCode === 37) // left arrow
    socket.emit('keyPress', {inputId:'left', state:true});
  else if(event.keyCode === 38) // up arrow
    socket.emit('keyPress', {inputId:'up', state:true});
  else if(event.keyCode === 32) // spacebar
    if (document.body == document.activeElement) // if focus is on game
      socket.emit('keyPress', {inputId:'shoot', state:true});
}

document.onkeyup = function(event) {
  if (event.keyCode === 39) // right arrow
    socket.emit('keyPress', {inputId:'right', state:false});
  else if(event.keyCode === 37) // left arrow
    socket.emit('keyPress', {inputId:'left', state:false});
  else if(event.keyCode === 38) // up arrow
    socket.emit('keyPress', {inputId:'up', state:false});
  else if(event.keyCode === 32) // spacebar
    if (document.body == document.activeElement) // if focus is on game
      socket.emit('keyPress', {inputId:'shoot', state:false});
}

gameModule.component("game", {
    templateUrl: "components/game/game.template.html",
    controller: function GameController($scope, $http) {
        $scope.initGame = function() {
          ctx = $('#ctx')[0].getContext('2d');
          socket.on('newPositions',function(data){
            ctx.clearRect(0,0,700,700);

            // draw all players
            for (var i = 0; i < data.player.length; i++) {
              if (data.player[i].lives > 0) { // if player is alive
                ctx.save();
                ctx.beginPath();
                ctx.translate(data.player[i].x, data.player[i].y);
                ctx.rotate(data.player[i].angle * Math.PI/180);
                if (data.player[i].engine)
                  ctx.drawImage(engineon, -10, -10, 20 ,20);
                else
                  ctx.drawImage(engineoff, -10, -10, 20 ,20);
                ctx.closePath();
                ctx.restore();
              }
            }

            // draw all bullets
            for (var i = 0; i < data.bullet.length; i++) {
              ctx.save();
              ctx.beginPath();
              ctx.translate(data.bullet[i].x, data.bullet[i].y);
              ctx.drawImage(bullet, -0.5, -0.5, 1, 1);
              ctx.closePath();
              ctx.restore();
            }
          });

          socket.on('updateInformation', function(data) {
            let playerInfo = $('#playerInfo');
            playerInfo.empty();
            // draw all player information
            for (var i = 0; i < data.player.length; i++) {
              let info = "<div style='display:inline-block;margin: 0 auto;'><div style='display:inline-block;text-align:left;'><strong>" + data.player[i].name + "</strong></div><div style='display:inline-block;margin-left:20px;margin-right:40px;'>";
              for (var j = 0; j < data.player[i].lives; j++) {
                info += "<img src='/client/resources/ship-engineoff.png' style='width:10px;height:10px;'>";
              }
              for (var j = data.player[i].lives; j <= 3; j++) {
                info += "<img src='/client/resources/ship-engineoff.png' style='width:10px;height:10px;visibility:hidden;'>";
              }
              info += "</div><div style='text-align:left;'><strong>" + data.player[i].score + "</strong></div></div>";
              playerInfo.append(info);
            }
          });
        }
      }
});
