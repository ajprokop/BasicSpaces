// To run on my PC I used:  npm i socket.io-client@2.4.0
const io = require('socket.io-client')
const request = require('request-promise');

var token;
var myRoom = "Replace with your Spaces room";
var socket;

async function getAuthToken(callback) {
    var authData = {
        "displayname": "Chatty McChat",
        "username": "Anonymous"
    };
    var url = "https://spacesapis.avayacloud.com/api/anonymous/auth";
    var response = await request.post({
        url: url,
        body: JSON.stringify(authData),
        headers: {
            'Accept': 'application/json',
            "Content-type": 'application/json'
        }
    }, function(e, r, body) {

    });
    var json = JSON.parse(response);
    token = json.token;
    console.log("Token = " + json.token);
	callback(token);
}

getAuthToken(function(token) {
    const query = "token=" + token + "=jwt";
    socket = io('https://spacesapis-socket.avayacloud.com/chat', {
        query: query,
        transports: ["websocket"],
        path: "/socket.io",
        hostname: "spacesapis-socket.avayacloud.com",
        secure: true,
        port: "443"
    });
    socket.on('connect', function() {
        console.log("Socket connection success!");
        subscribe(myRoom);
    });

    socket.on('connect_error', function(error) {
        console.log('Socket connection error: ' + error);
    });

    socket.on('error', function(error) {
        console.log('Socket error: ' + error);
    });

    socket.on('disconnect', function() {
        console.log('Socket disconnected.');
    });

    socket.on('disconnect', function() {
        console.log('Socket disconnected.');
    });

    socket.on('SEND_MESSAGE_FAILED', function(error) {
        console.log('SEND_MESSAGE_FAILED' + error);
    });

    socket.on('MESSAGE_SENT', function(msg) {
        console.log('MESSAGE_SENT');
        var category = msg.category;
        if (category == "chat") {
            console.log("Message = " + msg.content.bodyText);
        }
    });

    socket.on('SUBSCRIBE_CHANNEL_FAILED', function(error) {
        console.log('SUBSCRIBE_CHANNEL_FAILED' + error);
    });

    socket.on('CHANNEL_SUBSCRIBED', function() {
        console.log('CHANNEL_SUBSCRIBED');
        // Once channel is sucessfully subscribed to, chats can be sent
		sent(myRoom, "Room subscribed");
    });

    socket.on('SEND_MEDIA_SESSION_EVENTS', function() {
        console.log('SEND_MEDIA_SESSION_EVENTS');
    });

    socket.on('MEDIA_SESSION_RESPONSE', function(msg) {
        console.log('MEDIA_SESSION_RESPONSE');
        console.log("Category = " + msg.category);
    });

});

function subscribe(room) {
    // _id = space
    var payload2 = {
        channel: {
            type: 'topic',
            _id: room
        }
    };

    console.log(JSON.stringify(payload2));
    socket.emit('SUBSCRIBE_CHANNEL', payload2);
}

function send(room, message) {
    // topicId = space
    var payload1 = {
        category: 'chat',
        content: {
            bodyText: 'this is a message'
        },
        topicId: room,
        loopbackMetadata: 'meta data'
    };

    console.log(JSON.stringify(payload1));
    socket.emit('SEND_MESSAGE', payload1);
}