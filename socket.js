const io = require('socket.io-client')
const request = require('request-promise');
const dialogflow = require('dialogflow');
const uuid = require('uuid');

// Create a new Dialogflow sessionClient.  projectId and keyFileName are dependent on the Dialogflow agent.
var projectId = 'serviceagent-qthcga';
//var sessionClient = new dialogflow.SessionsClient({keyFilename:"/home/ajprokop/test-frvaci.json"});  // Authenticate application using service's JSON credentials (Non Beta features)
var sessionClient = new dialogflow.v2beta1.SessionsClient({
	keyFilename: "/home/ajprokop/service.json"
}); // Authenticate application using service's JSON credentials
var sessionId = uuid.v4(); // Create random session ID
var sessionPath = sessionClient.sessionPath(projectId, sessionId);

const MY_ROOM = "5f1f2f794758efceeeeb90a8";
var token;
var socket;
var query;

initializeApp();

async function initializeApp() {
	token = await getAnonymousToken(MY_ROOM);
	query = "token=" + token + "=jwt";
	socket = io('https://spacesapis-socket.avayacloud.com/chat', {
		query: query,
		transports: ["websocket"],
		path: "/socket.io",
		hostname: "spacesapis-socket.avayacloud.com",
		secure: true,
		port: "443"
	});

	socket.on('connect', function () {
		console.log("Socket connection success!");
		subscribe(MY_ROOM);
	});

	socket.on('connect_error', function (error) {
		console.log('Socket connection error: ' + error);
	});

	socket.on('error', function (error) {
		console.log('Socket error: ' + error);
	});

	socket.on('disconnect', function () {
		console.log('Socket disconnected.');
	});

	socket.on('disconnect', function () {
		console.log('Socket disconnected.');
	});

	socket.on('SEND_MESSAGE_FAILED', function (error) {
		console.log('SEND_MESSAGE_FAILED' + error);
	});

	socket.on('MESSAGE_SENT', function (msg) {
		console.log('MESSAGE_SENT');
		var category = msg.category;
		if (category == "chat") {
			if (msg.content.bodyText.includes("<p>@abc") || msg.content.bodyText.includes("<p>@ABC")) {
				// Messages we care about will arrive in the form:  <p>@abc A bunch of text<p>
				var strLength = msg.content.bodyText.length;
				var message = msg.content.bodyText.substring(7, strLength - 4);
				console.log("Message = " + msg.content.bodyText.substring(7, strLength - 4));
				processMessage(message);
			}
		} else {
			console.log("Category = " + category);
		}
	});

	socket.on('SUBSCRIBE_CHANNEL_FAILED', function (error) {
		console.log('SUBSCRIBE_CHANNEL_FAILED' + error);
	});

	socket.on('CHANNEL_SUBSCRIBED', function () {
		console.log('CHANNEL_SUBSCRIBED');
	});

	socket.on('SEND_MEDIA_SESSION_EVENTS', function () {
		console.log('SEND_MEDIA_SESSION_EVENTS');
	});

	socket.on('MEDIA_SESSION_RESPONSE', function (msg) {
		console.log('MEDIA_SESSION_RESPONSE');
		console.log("Category = " + msg.category);
	});

	socket.on('PRESENCE_EVENT_RESPONSE', function (msg) {
		console.log('PRESENCE_EVENT_RESPONSE');
		if (msg.category == "app.event.presence.party.online") {
			console.log(" Category = " + msg.category + " Sender = " + msg.sender.displayname + " Offline = " + msg.content.offline + " Media Session vacs = " + msg.content.mediaSession.video + " " + msg.content.mediaSession.audio + " " + msg.content.mediaSession.connected + " " + msg.content.mediaSession.screenshare);
		}
	});
}

async function processMessage(msg) {
	result = await callGoogleIntent(msg, sessionPath);
	prompt = result.fulfillmentText;
	intent = result.intent.displayName;
	if (intent == "OpenTicket") {
		if (result.allRequiredParamsPresent) {
			sendTask(MY_ROOM, "Service Request: " + result.parameters.fields['ticketTitle'].stringValue, result.parameters.fields['ticketIssue'].stringValue, ANDREW);
		}
	}
	sendChat(MY_ROOM, prompt);
}

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

function sendChat(room, msg) {

	// topicId = space
	var payload1 = {
		category: 'chat',
		content: {
			bodyText: msg
		},
		topicId: room,
		loopbackMetadata: 'Created by API'
	};

	console.log(JSON.stringify(payload1));
	socket.emit('SEND_MESSAGE', payload1);
}

function sendTask(room, msg, msgDescription, assignee) {

	// topicId = space
	var payload1 = {
		category: 'task',
		content: {
			bodyText: msg,
			description: msgDescription
		},
		assignees: [{
			_id: assignee
		}],
		topicId: room,
		loopbackMetadata: 'Created by API'
	};

	console.log(JSON.stringify(payload1));
	socket.emit('SEND_MESSAGE', payload1);
}

//-----------  Google Dialogflow functions

async function callGoogleIntent(speech, sessionPath) {
	// The text query request.
	const request = {
		session: sessionPath,
		queryInput: {
			text: {
				// The query to send to the Dialogflow agent
				text: speech,
				// The language used by the client (en-US)
				languageCode: 'en-US',
			},
		},
	};

	// Send request
	const responses = await sessionClient.detectIntent(request);
	const result = responses[0].queryResult;
	console.log('Detected intent');
	console.log(`  Query: ${result.queryText}`);
	console.log(`  Response: ${result.fulfillmentText}`);
	console.log(` Required params: ${result.allRequiredParamsPresent}`);

	var intent = "Nothing";
	if (result.intent) {
		intent = result.intent.displayName;
		console.log(`  Intent: ${result.intent.displayName}`);
	} else {
		console.log(`  No intent matched.`);
	}
	return result;
}

//----------- Spaces REST API functions

async function getAnonymousToken(room) {
	var url = "https://spacesapis.zang.io/api/anonymous/auth";
	console.log("Connect URL: " + url);
	var postData = {
		displayname: "ABC Bot",
		username: "ABC Bot"
	};
	var response = await request.post({
		url: url,
		body: JSON.stringify(postData),
		headers: {
			'Accept': 'application/json',
			'content-type': 'application/json'
		}
	}, function (e, r, body) {});
	var json = JSON.parse(response);
	console.log("Token " + json.token);
	return json.token;
}