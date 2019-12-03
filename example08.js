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
    fs.readFile(__dirname + "/example08.html",
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
        var timeout = false;
        
var last_sent = null;
var last_value = null;
board.digitalRead(2, function(value) { // this happens many times on digital input change of state 0->1 or 1->0
    if (timeout !== false) { // if timeout below has been started (on unstable input 0 1 0 1) clear it
     clearTimeout(timeout); // clears timeout until digital input is not stable i.e. timeout = false
    }
    timeout = setTimeout(function() { // this part of code will be run after 50 ms;
                                      // if in-between input changes above code clears it
        console.log("Timeout set to false");
        timeout = false;
        if (last_value != last_sent) { // to send only on value change
         if (value == 0) {
                console.log("LED OFF");
                board.digitalWrite(13, board.LOW);
                console.log("value = 0, LED OFF");
            }
            else if (value == 1) {
                console.log("LED ON");
                board.digitalWrite(13, board.HIGH);
                console.log("value = 1, LED lit");
            }
            sendValueViaWebSocket(value.toString()); // ws transfers only string
        }
        last_sent = last_value;
        }, 50); // execute after 50ms
    last_value = value; // this is read from pin 2 many times per s
}); // end board.digitalRead on pin 2
   
    }); // end of board digital read
});  // end of board.on "ready"