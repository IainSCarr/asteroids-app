var socket = io();
var gameModule = angular.module("asteroidsapp", ["ngRoute"]);

var arrow_keys_handler = function(e) {
  switch(e.keyCode){
      case 37: case 39: case 38:  case 40: // Arrow keys
      case 32:
        if (e.target == document.body) e.preventDefault(); break; // Space
      default: break; // do not block other keys
  }
};
window.addEventListener("keydown", arrow_keys_handler, false);

function createSoloGame(name) {
  console.log("Creating solo game as " + name);
}

function createMultiplayerGame(name) {
  console.log("Creating solo game as " + name);
}

function joinMultiplayerGame(name, code) {
  console.log("Joining multiplayer game as " + name + " at " + code);
}
