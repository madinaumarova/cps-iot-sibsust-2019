var http = require("http").createServer(handler); // on req - hand
var fs = require("fs"); // variable for file system for providing html
var firmata = require("firmata");
const WebSocket = require('ws'); // for permanent connection between server and client

const wss = new WebSocket.Server({port: 8888}); // websocket port is 8888

wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
    client.send(data);
      }
  });
};

wss.sendToLastWs = function sendToLastWs(data) {
    if (wss.clients[wss.clients.length-1] !== undefined) { // if websocket exist
        if (wss.clients[wss.clients.length-1].readyState === WebSocket.OPEN) { // if it is connected
            wss.clients[wss.clients.length-1].send(data); // send to the last connected client - to only one client's websocket
        }
    }
};

var messageJSON;

console.log("Starting the code");

var board = new firmata.Board("/dev/ttyACM0", function(){
    console.log("Connecting to Arduino");
    console.log("Enabling analog Pin 0");
    board.pinMode(0, board.MODES.ANALOG); // analog pin 0
    board.pinMode(1, board.MODES.ANALOG); // analog pin 1
    board.pinMode(2, board.MODES.OUTPUT); // direction of DC motor
    board.pinMode(3, board.MODES.PWM); // PWM of motor i.e. speed of rotation
    board.pinMode(4, board.MODES.OUTPUT); // direction DC motor
});

function handler(req, res) {
    fs.readFile(__dirname + "/example13.html",
    function (err, data) {
        if (err) {
            res.writeHead(500, {"Content-Type": "text/plain"});
            return res.end("Error loading html page.");
        }
    res.writeHead(200);
    res.end(data);
    })
}

var desiredValue = 0; // desired value var
var actualValue = 0; // variable for actual value (output value)

var pwm;
var factor = 0.15; // proportional factor that determines the speed of aproaching toward desired value

http.listen(8080); // server will listen on port 8080

board.on("ready", function() {
    
    board.analogRead(0, function(value){
        desiredValue = value; // continuous read of analog pin 0
    });
    board.analogRead(1, function(value) {
        actualValue = value; // continuous read of pin A1
    });
    
    startControlAlgorithm(); // to start control alg.
    
    wss.on('connection', function (ws, req) { // start of wss code
        messageJSON = {"type": "message", "content": "Srv connected, board OK"};
        ws.send(JSON.stringify(messageJSON));
        setInterval(sendValues, 40); // on 40ms we send message to client
    }); // end of sockets.on connection

}); // end of board.on(ready)

function startControlAlgorithm () {
    setInterval(function() {controlAlgorithm(); }, 30); // na 30ms call
    console.log("Control algorithm started")
};

function controlAlgorithm () {
    pwm = factor*(desiredValue-actualValue);
    if(pwm > 255) {pwm = 255}; // to limit the value for pwm / positive
    if(pwm < -255) {pwm = -255}; // to limit the value for pwm / negative
    if (pwm > 0) {board.digitalWrite(2,1); board.digitalWrite(4,0);}; // določimo smer če je > 0
    if (pwm < 0) {board.digitalWrite(2,0); board.digitalWrite(4,1);}; // določimo smer če je < 0
    board.analogWrite(3, Math.abs(pwm));
};

function sendValues () {
    //wss.sendToLastWs(JSON.stringify({"type": "clientReadValues", "desiredValue": desiredValue}));
    wss.broadcast(JSON.stringify({"type": "clientReadValues", "desiredValue": desiredValue, "actualValue": actualValue}));
};