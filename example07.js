var http = require("http").createServer(handler);
var fs = require("fs"); // variable for file system
var firmata = require("firmata");
const WebSocket = require('ws');

const wss = new WebSocket.Server({port: 8888});

var board = new firmata.Board("/dev/ttyACM0", function(){ // ACM Abstract Control Model for serial communication with Arduino (could be USB)
    console.log("Connecting to Arduino");
    console.log("Activation of Pin 13");
    board.pinMode(13, board.MODES.OUTPUT); // Configures the specified pin to behave either as an input or an output.
    console.log("Enabling pin 2 for button");
    board.pinMode(2, board.MODES.INPUT);
});

function handler(req, res) {
    fs.readFile(__dirname + "/example07.html",
    function (err, data) {
        if (err) {
            res.writeHead(500, {"Content-Type": "text/plain"});
            return res.end("Error loading html page.");
        }
    res.writeHead(200);
    res.end(data);
    });
}

http.listen(8080); // server will listen on port 8080 to serve html page

var sendValueViaWebSocket = function(){};

board.on("ready", function() {

wss.on('connection', function (ws) {
    ws.send("Server connected.");
 
  sendValueViaWebSocket = function(value) {
        ws.send(value);
    }
}); // end of wss code

    board.digitalRead(2, function(value) {
        if (value == 0) {
            console.log("LED off");
            board.digitalWrite(13, board.LOW);
            sendValueViaWebSocket("0");
        }
        if (value == 1) {
            console.log("LED on");
            board.digitalWrite(13, board.HIGH);
            sendValueViaWebSocket("1");
        }
   
    }); // end of board digital read
});  // end of board.on "ready"