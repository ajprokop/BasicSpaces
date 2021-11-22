// To create video connection to Spaces room:
//
// Entry point from html:  openSpacesConference()
// Create anonymous user -- obtain authentication token
// Join Space
// Create socket.io connection
// Subscribe to Space
// In Subscribe callback, send presence update event, start video connection
// Obtain MPaaS token
// Send Media Session Event -- connected, but no media
// Create AvayaClientServices client
// Create user
// Create call
// Start call
// In Call Established callback, send Media Session Event -- conneced with audio/video.  Update presence
// In Channels Updated callback, obtain remote video stream
//
// To end call:
//
// Unsubscribe from room
// Update presence
// End call
// Stop local and remote video displays

var token = null; // Token will be that of an anonymous user
var socketURL = "http://spacesapis-socket.avayacloud.com/chat";
var spaceId = null;
var connectionPayload = {
	query: "token=" + token + "&tokenType=jwt"
};
var socketConnection = "";
let conferenceCall = null;
let conferenceType = "";
let user = null;
var client;
var userName = "Anonymous User";
var videoUnmuted = true;
var audioUnmuted = true;
var onScreenShare = false;
var recording = false;
var inCall = false;
var recordingId = null;
var meetingId = null;
var password = null; // Thankfully, the Spaces APIs that use a password don't complain if you send null for a room that doesn't require one.
var collaborations;
var collaboration;
var remoteStream;
var localStream;
var mediaEngine;
var videoChannels;
var call;
var myStreamId;
var micDevices = ["junk"];
var cameraDevices = ["junk"];
var speakerDevices = ["junk"];
var contentSharingRenderer;
$(document).ready(init);

function init() {
	$('#connectSocket').prop("disabled", false);
	$('#muteAudio').prop("disabled", true);
	$('#muteVideo').prop("disabled", true);
	$('#startRecording').prop("disabled", true);
	$('#screenshare').prop("disabled", true);
	$('#sendMsg').prop("disabled", true);
	document.getElementById("deviceTable").style.display = "none";
	document.getElementById("muteVideo").innerHTML = '<img src="images/video@2.png" />';
	document.getElementById("muteAudio").innerHTML = '<img src="images/audio@2.png" />';
	document.getElementById("startRecording").innerHTML = '<img src="images/recording-off@2.png" />';
	document.getElementById("screenshare").innerHTML = '<img src="images/screenshare-on@2.png" />';
	document.getElementById("muteVideo").style.visibility = "hidden";
	document.getElementById("muteAudio").style.visibility = "hidden";
	document.getElementById("startRecording").style.visibility = "hidden";
	document.getElementById("screenshare").style.visibility = "hidden";
	document.getElementById("connectSocket").innerHTML = '<img src="images/voice@2.png" />';
	document.getElementById('roomNumber').style.display = 'block';
	document.getElementById('roomLabel').style.display = 'block';
	document.getElementById('password').style.display = 'block';
	document.getElementById('passwordLabel').style.display = 'block';
	document.getElementById('userName').style.display = 'block';
	document.getElementById('userLabel').style.display = 'block';
	videoUnmuted = true;
	audioUnmuted = true;
	onScreenShare = false;
	recording = false;
	inCall = false;
	initializeMicList();
	initializeCameraList();
	initializeSpeakersList();
}

function displayMicDevices() {
	var audioInterface = client.getMediaServices().getAudioInterface().getInputInterface();
	audioInterface.getAvailableDevices().forEach(function(device) {
		if((device._deviceId != "default") && (device._deviceId != "communications")) {
			addMicrophone(device._label, device._deviceId);
			micDevices.push(device);
		}
	});
};

function displayCameraDevices() {
	var videoInterface = client.getMediaServices().getVideoInterface();
	videoInterface.getAvailableDevices().forEach(function(device) {
		addCamera(device._label, device._deviceId);
		cameraDevices.push(device);
	});
};

function displaySpeakerDevices() {
	var speakersInterface = client.getMediaServices().getAudioInterface().getOutputInterface();
	speakersInterface.getAvailableDevices().forEach(function(device) {
		if((device._deviceId != "default") && (device._deviceId != "communications")) {
			addSpeaker(device._label, device);
			speakerDevices.push(device);
		}
	});
};

function setMicrophone(device) {
	var audioInterface = client.getMediaServices().getAudioInterface().getInputInterface();
	audioInterface.setSelectedDevice(device);
}

function setCamera(device) {
	var videoInterface = client.getMediaServices().getVideoInterface();
	videoInterface.setSelectedDevice(device);
}

function setSpeakers(device) {
	var speakersInterface = client.getMediaServices().getAudioInterface().getOutputInterface();
	speakersInterface.setSelectedDevice(device);
}

function addMicrophone(label, deviceId) {
	var list1 = document.getElementById('micList');
	list1.options[list1.length] = new Option(label, deviceId);
}

function addCamera(label, deviceId) {
	var list1 = document.getElementById('cameraList');
	list1.options[list1.length] = new Option(label, deviceId);
}

function addSpeaker(label, deviceId) {
	var list1 = document.getElementById('speakersList');
	list1.options[list1.length] = new Option(label, deviceId);
}

function selectMic() {
	var list1 = document.getElementById('micList');
	mic = list1.options[list1.selectedIndex].value;
	if(list1.selectedIndex != 0) {
		setMicrophone(micDevices[list1.selectedIndex]);
	}
}

function selectCamera() {
	var list1 = document.getElementById('cameraList');
	camera = list1.options[list1.selectedIndex].value;
	if(list1.selectedIndex != 0) {
		setCamera(cameraDevices[list1.selectedIndex]);
	}
}

function selectSpeakers() {
	var list1 = document.getElementById('speakersList');
	speaker = list1.options[list1.selectedIndex].value;
	if(list1.selectedIndex != 0) {
		setSpeakers(speakerDevices[list1.selectedIndex]);
	}
}

function initializeMicList() {
	micDevices = ["junk"];
	var list1 = document.getElementById('micList');
	list1.innerHTML = "";
	list1.options[0] = new Option('--Select--', '123456');
}

function initializeCameraList() {
	cameraDevices = ["junk"];
	var list1 = document.getElementById('cameraList');
	list1.innerHTML = "";
	list1.options[0] = new Option('--Select--', '123456');
}

function initializeSpeakersList() {
	speakerDevices = ["junk"];
	var list1 = document.getElementById('speakersList');
	list1.innerHTML = "";
	list1.options[0] = new Option('--Select--', '123456');
}

function devicePicker() {
	newwindow = window.open("devicepicker.html", 'name', 'height=400,width=200');
	if(window.focus) {
		newwindow.focus()
	}
	initializeMicList();
	initializeCameraList();
	initializeSpeakersList();
	displayMicDevices();
	displayCameraDevices();
	displaySpeakerDevices();
}
window.onbeforeunload = function() {
	return "Do you really want to close?";
}

function chatSpace() {
	var chatData = {
		content: {
			bodyText: $('#message').val()
		}
	};
	$.ajax({
		headers: {
			'Authorization': 'jwt ' + token,
			'Accept': 'application/json',
			'Content-type': 'application/json',
			'spaces-x-space-password': password
		},
		url: 'https://spacesapis.avayacloud.com/api/spaces/' + spaceId + '/chats',
		type: "post",
		dataType: "json",
		contentType: 'application/json',
		data: JSON.stringify(chatData),
		success: function(data) {
			document.getElementById('message').value = "";
		},
		error: function(error) {
			console.log(`Error ${error}`);
		}
	});
}

function trace(text) {
	text = text.trim();
	var consoleTxt = $('#console-log').val();
	$('#console-log').val(consoleTxt + "\n" + text);
}

function clearTrace() {
	var consoleTxt = $('#console-log').val();
	$('#console-log').val("");
}

function getMeetingIdAndRecord() {
	$.ajax({
		headers: {
			'Authorization': 'jwt ' + token,
			'Accept': 'application/json',
			'Content-type': 'application/json',
			'spaces-x-space-password': password
		},
		url: 'https://spacesapis.avayacloud.com/api/spaces/' + spaceId + '/activemeeting',
		type: "GET",
		dataType: "json",
		success: function(data) {
			meetingId = data["_id"];
			startRecordingFunction();
		},
		error: function(error) {
			console.log("Get Meeting ID Error");
			console.log(`Error ${error}`);
		},
		complete: function() {}
	});
}

function startRecordingFunction() {
	$.ajax({
		headers: {
			'Authorization': 'jwt ' + token,
			'Accept': 'application/json',
			'Content-type': 'application/json',
			'spaces-x-space-password': password
		},
		url: 'https://spacesapis.avayacloud.com/api/spaces/' + spaceId + '/meetings/' + meetingId + '/recordings',
		type: "POST",
		dataType: "json",
		contentType: 'application/json',
		success: function(data) {
			document.getElementById("startRecording").innerHTML = '<img src="images/recording-on@2.png" />';
			recording = true;
		},
		error: function(error) {
			console.log("Start Recording Error");
			console.log(`Error ${error}`);
		}
	});
}

function updateScreensharePresence(state) {
	onScreenShare = state;
	let presencePayload = {
		"category": "app.event.presence.party.online",
		"content": {
			"desktop": false,
			"idle": false,
			"mediaSession": {
				"audio": audioUnmuted,
				"connected": true,
				"phone": false,
				"screenshare": state,
				"selfMuted": false,
				"video": videoUnmuted
			},
			"offline": false,
			"role": "guest"
		},
		"topicId": spaceId
	};
	if(socketConnection != null) {
		socketConnection.emit('SEND_PRESENCE_EVENT', presencePayload);
	}
}

function startSreenshare() {
	if(onScreenShare == false) {
		collaboration.getContentSharing().startScreenSharing();
	} else {
		updateScreensharePresence(false);
		collaboration.getContentSharing().end();
		document.getElementById("screenshare").innerHTML = '<img src="images/screenshare-on@2.png" />';
		startLocalVideo(localStream);
	}
}

function startRecording() {
	if(recording) {
		stopRecording();
		return;
	}
	getMeetingIdAndRecord();
}

function stopRecording() {
	$.ajax({
		headers: {
			'Authorization': 'jwt ' + token,
			'Accept': 'application/json',
			'spaces-x-space-password': password
		},
		url: 'https://spacesapis.avayacloud.com/api/spaces/' + spaceId + '/meetings/' + meetingId + '/recordings/' + recordingId + '/stop',
		type: "POST",
		dataType: "json",
		success: function(data) {
			document.getElementById("startRecording").innerHTML = '<img src="images/recording-off@2.png" />';
			recording = false;
		},
		error: function(error) {
			console.log(`Error ${error}`);
			console.dir(error);
		}
	});
}

function openSpacesConference() {
	if(inCall) {
		closeSpacesConference();
		return;
	}
	var input = document.getElementById("roomNumber").value;
	if(input.trim() != '') {
		spaceId = document.getElementById("roomNumber").value;
	} else {
		window.alert("No Room");
		return;
	}
	if(token == null) {
		getSpacesToken().then(function() {
			joinSpace();
		}, function() {
			console.log("token failure");
		});
	} else {
		joinSpace();
	}
}

function startVideoForSpaces() {
	var mpaasToken = null;
	// Ask Spaces for the MPaaS token for this room
	$.ajax("https://spacesapis.avayacloud.com/api/mediasessions/mpaas/token/" + spaceId, {
		type: 'GET',
		headers: {
			Authorization: "jwt " + token,
			'spaces-x-space-password': password
		},
		success: (mpaasInfo) => {
			mpaasToken = mpaasInfo.token;
			if(socketConnection) {
				let mediaSessionPayload = {
					"category": "trackstatus",
					"content": {
						"mediaSession": {
							"audio": false,
							"connected": true,
							"screenshare": false,
							"selfMuted": true,
							"video": false
						}
					},
					"topicId": spaceId,
				};
				socketConnection.emit('SEND_MEDIA_SESSION_EVENTS', mediaSessionPayload);
				// Create configuration with the media service context passed in.
				const userConfiguration = {
					mediaServiceContext: mpaasToken, // <- Set the MPaaS token here as the service context
					callUserConfiguration: {
						videoEnabled: true,
						incomingCall: true,
						retrieveDeviceLabelsEnabled: false
					},
					wcsConfiguration: {
						enabled: true
					},
					collaborationConfiguration: {
						contentSharingWorkerPath: "./js/lib/AvayaClientServicesWorker.min.js"
					}
				};
				// Create client object
				client = new AvayaClientServices();
				// Create user object
				user = client.createUser(userConfiguration);
				// start() method will asynchronously set up connection to the MPaaS web user agent.
				// Asynchronous callback information is omitted here for simplicity.
				user.start().then(function() {
					initiateSpacesCall();
				}, function() {
					console.log("user.start failure");
				});
			}
		}
	});
}

function initiateSpacesCall() {
	call = user.getCalls().createDefaultCall();
	call.setVideoMode(AvayaClientServices.Services.Call.VideoMode.SEND_RECEIVE);
	call.setWebCollaboration(true); // Set to true if you want to enable web collaboration
	call.addOnCallIncomingVideoAddRequestDeniedCallback(function(call) {
		console.error("IncomingVideoAddRequestDenied");
	});
	call.addOnCallFailedCallback(function(call, callException) {
		console.error("call failed", callException);
	});
	call.addOnCallEndedCallback(function(call, event) {
		//console.log("call ended");
		//console.log(event);
	});
	call.addOnCallEstablishingCallback(function(call) {
		//console.log("call establishing...");
	});
	call.addOnCallVideoChannelsUpdatedCallback(function(call) {
		var mediaEngine = client.getMediaServices();
		var videoChannels = call.getVideoChannels();
		if(videoChannels[0]) {
			switch(videoChannels[0].getNegotiatedDirection()) {
				case AvayaClientServices.Services.Call.MediaDirection.RECV_ONLY:
					if(AvayaClientServices.Base.Utils.isDefined(remoteStream)) {
						startRemoteVideo(remoteStream);
					} else {
						remoteStream = null;
					}
					break;
				case AvayaClientServices.Services.Call.MediaDirection.SEND_ONLY:
					if(AvayaClientServices.Base.Utils.isDefined(localStream)) {
						startLocalVideo(localStream);
					} else {
						localStream = null;
					}
					break;
				case AvayaClientServices.Services.Call.MediaDirection.SEND_RECV:
					remoteStream = mediaEngine.getVideoInterface().getRemoteMediaStream(videoChannels[0].getChannelId());
					myStreamId = remoteStream.id;
					localStream = mediaEngine.getVideoInterface().getLocalMediaStream(videoChannels[0].getChannelId());
					if(AvayaClientServices.Base.Utils.isDefined(localStream)) {
						startLocalVideo(localStream);
					} else {
						localStream = null;
					}
					if(AvayaClientServices.Base.Utils.isDefined(remoteStream)) {
						startRemoteVideo(remoteStream);
					} else {
						remoteStream = null;
					}
					// Display buttons
					document.getElementById("connectSocket").innerHTML = '<img src="images/end-call@2.png" />';
					$('#muteVideo').prop("disabled", false);
					$('#muteAudio').prop("disabled", false);
					$('#startRecording').prop("disabled", false);
					$('#screenshare').prop("disabled", false);
					$('#sendMsg').prop("disabled", false);
					document.getElementById("muteVideo").style.visibility = "visible";
					document.getElementById("muteAudio").style.visibility = "visible";
					document.getElementById("startRecording").style.visibility = "visible";
					document.getElementById("screenshare").style.visibility = "visible";
					// Hide labels and input fields
					document.getElementById('roomNumber').style.display = 'none';
					document.getElementById('roomLabel').style.display = 'none';
					document.getElementById('password').style.display = 'none';
					document.getElementById('passwordLabel').style.display = 'none';
					document.getElementById('userName').style.display = 'none';
					document.getElementById('userLabel').style.display = 'none';
					break;
				case AvayaClientServices.Services.Call.MediaDirection.INACTIVE:
				case AvayaClientServices.Services.Call.MediaDirection.DISABLE:
				default:
					break;
			}
		}
	});
	call.addOnCallConferenceStatusChangedCallback(function(call) {
		collaboration.addOnCollaborationServiceAvailableCallback(() => {
			collaboration.getContentSharing().addOnContentSharingStartedCallback((contentShareing, ctx) => {
				// A screenshare has begun.  Figure out who launched it -- local or remote
				var isMe = false;
				if(contentShareing._collaboration._selfParticipant._participantId == ctx._participantId) {
					isMe = true;
					document.getElementById("screenshare").innerHTML = '<img src="images/screenshare-off@2.png" />';
					updateScreensharePresence(true);
				}
				contentSharingRenderer = new AvayaClientServices.Renderer.Konva.KonvaContentSharingRenderer();
				if(isMe) {
					// We have initiated a screenshare
					document.querySelector("#localVideoElement").srcObject = collaboration.getContentSharing().getOutgoingScreenSharingStream();
				} else {
					// We are receiving a screenshare
					contentSharingRenderer.init(collaboration.getContentSharing(), 'screenReceiveFrame');
				}
			});
			collaboration.getContentSharing().addOnContentSharingEndedCallback(() => {
				startLocalVideo(localStream);
			});
		});
		collaboration.addOnCollaborationServiceUnavailableCallback(() => {});
		collaboration.start().catch((e) => {
			console.log("Error starting collaboration: " + e);
		});
	});
	call.addOnCallEstablishedCallback(function(call) {
		conferenceCall = call;
		let mediaSessionPayload = {
			"category": "trackstatus",
			"content": {
				"mediaSession": {
					"audio": true,
					"connected": true,
					"screenshare": false,
					"selfMuted": false,
					"video": true
				}
			},
			"topicId": spaceId
		};
		socketConnection.emit('SEND_MEDIA_SESSION_EVENTS', mediaSessionPayload);
		let presencePayload = {
			"category": "app.event.presence.party.online",
			"content": {
				"desktop": false,
				"idle": false,
				"mediaSession": {
					"audio": true,
					"connected": true,
					"phone": false,
					"screenshare": false,
					"selfMuted": false,
					"video": true
				},
				"offline": false,
				"role": "guest"
			},
			"topicId": spaceId
		};
		socketConnection.emit('SEND_PRESENCE_EVENT', presencePayload);
		displayMicDevices();
		displayCameraDevices();
		displaySpeakerDevices();
		inCall = true;
		try {
			collaborations = user.getCollaborations();
			collaboration = collaborations.getCollaborationForCall(call.getCallId());
			collaboration.addOnCollaborationStartedCallback(() => {});
			collaboration.addOnCollaborationInitializedCallback(() => {});
			collaboration.addOnCollaborationServiceAvailableCallback(() => {});
			collaboration.getContentSharing().addOnContentSharingEndedCallback(() => {
				document.getElementById("screenshare").innerHTML = '<img src="images/screenshare-on@2.png" />';
				updateScreensharePresence(false);
			});
		} catch(err) {
			console.log("Error: " + err.message);
		}
	});
	call.start();
	document.getElementById("deviceTable").style.display = "block";
}

function joinSpace() {
	input = document.getElementById("password").value;
	if(input.trim() != '') {
		password = document.getElementById("password").value;
	} else {
		password = null;
	}
	// Join the space
	$.ajax({
		headers: {
			'Authorization': 'jwt ' + token,
			'Accept': 'application/json',
			'spaces-x-space-password': password
		},
		url: 'https://spacesapis.avayacloud.com/api/spaces/' + spaceId + '/join',
		type: "GET",
		success: function(data) {
			var socketURL = "https://spacesapis-socket.zang.io/chat";
			var connectionPayload = {
				query: "token=" + token + "&tokenType=jwt",
				transports: ['websocket']
			};
			socketConnection = io.connect(socketURL, connectionPayload);
			socketConnection.on('connect', function() {
				var spaceToSubscribe = {
					channel: {
						_id: spaceId,
						type: 'topic',
						password: password
					}
				};
				socketConnection.emit('SUBSCRIBE_CHANNEL', spaceToSubscribe);
			});
			socketConnection.on("CHANNEL_SUBSCRIBED", (channelInfo) => {
				let presencePayload = {
					"category": "app.event.presence.party.online",
					"content": {
						"desktop": false,
						"idle": false,
						"mediaSession": {
							"audio": false,
							"connected": false,
							"phone": false,
							"screenshare": false,
							"selfMuted": true,
							"video": false
						},
						"offline": false,
						"role": "guest"
					},
					"topicId": spaceId,
					"loopbackMetadata": "some metadata"
				};
				socketConnection.emit('SEND_PRESENCE_EVENT', presencePayload);
				startVideoForSpaces();
			});
			socketConnection.on('MESSAGE_SENT', function(msg) {
				var category = msg.category;
				if(category == "chat") {
					var message = msg.content.bodyText;
					// Chat messages from Spaces on a web browswer come in the form <p>chat text<p>
					if(message.includes("<p>")) {
						var strLength = msg.content.bodyText.length;
						// Decode ' and " characters
						message = msg.sender.displayname + ": " + msg.content.bodyText.substring(3, strLength - 4).replace(new RegExp("&" + "#" + "x27;", "g"), "'").replace(/&quot;/g, '"');
					} else {
						message = msg.sender.displayname + ": " + message.replace(new RegExp("&" + "#" + "x27;", "g"), "'").replace(/&quot;/g, '"');
					}
					trace(message);
				}
			});
			socketConnection.on('connect_error', function(error) {
				console.log('Socket connection error: ' + error);
			});
			socketConnection.on('CHANNEL_UNSUBSCRIBED', function(error) {
				socketConnection.disconnect();
			});
			socketConnection.on('error', function(error) {
				console.log('Socket error: ' + error);
			});
			socketConnection.on('disconnect', function() {
				console.log('Socket disconnected.');
			});
			socketConnection.on('PRESENCE_EVENT_RESPONSE', function(msg) {
				if(msg.category == "app.event.presence.party.online") {} else if(msg.category == "app.event.presence.party.leaves") {} else if(msg.category == "app.event.presence.request.parties") {
					// We are being requested to send our current presence status.
					let presencePayload = {
						"category": "app.event.presence.party.online",
						"content": {
							"desktop": false,
							"idle": false,
							"mediaSession": {
								"audio": audioUnmuted,
								"connected": true,
								"phone": false,
								"screenshare": onScreenShare,
								"selfMuted": false,
								"video": videoUnmuted
							},
							"offline": false,
							"role": "guest"
						},
						"topicId": spaceId
					};
					socketConnection.emit('SEND_PRESENCE_EVENT', presencePayload);
				}
			});
			socketConnection.on('MEDIA_SESSION_RESPONSE', (msr) => {
				if(msr.category == "app.event.recording.started") {
					recordingId = msr.content.recordings[0]._id;
				}
			});
			socketConnection.on('SEND_MESSAGE_FAILED', function(error) {
				//console.log('SEND_MESSAGE_FAILED' + error);
			});
		},
		error: function(error) {
			window.alert("The room could not be joined.");
		}
	});
}

function sendMessage(messageToSend) {
	var message = {
		content: {
			bodyText: messageToSend
		},
		category: 'chat',
		topicId: spaceId
	};
	socketConnection.emit('SEND_MESSAGE', message);
}

function getSpacesToken() {
	var input = document.getElementById("userName").value;
	if(input.trim() != '') {
		userName = document.getElementById("userName").value;
	}
	// Get Spaces token for anonymous user
	return new Promise(function(resolve, reject) {
		$.ajax("https://spacesapis.zang.io/api/anonymous/auth", {
			data: JSON.stringify({
				"displayname": userName,
				"username": "Anonymous"
			}),
			contentType: 'application/json',
			type: 'POST',
			success: (data) => {
				token = data.token;
				resolve(data);
			},
			error: () => {
				reject(null)
			}
		})
	})
}

function closeSpacesConference() {
	if(onScreenShare) {
		startSreenshare();
	}
	if(socketConnection) {
		let payload = {
			"channel": {
				"type": "topic",
				"_id": spaceId
			}
		};
		socketConnection.emit('UNSUBSCRIBE_CHANNEL', payload);
		let presencePayload = {
			"category": "app.event.presence.party.leaves",
			"content": {
				"desktop": false,
				"idle": true,
				"mediaSession": {
					"audio": false,
					"connected": false,
					"phone": false,
					"screenshare": false,
					"selfMuted": true,
					"video": false
				},
				"offline": true,
				"role": "guest"
			},
			"topicId": spaceId,
			"loopbackMetadata": "some metadata"
		};
		socketConnection.emit('SEND_PRESENCE_EVENT', presencePayload);
		if(conferenceCall) {
			conferenceCall.end();
			stopLocalVideo();
			stopRemoteVideo()
		}
	}
	init();
	token = null;
	clearTrace();
	var spaceToUnsubscribe = {
		channel: {
			_id: spaceId,
			type: 'topic',
			password: password
		}
	};
	socketConnection.emit('UNSUBSCRIBE_CHANNEL', spaceToUnsubscribe);
}

function muteVideo() {
	if(socketConnection) {
		if(videoUnmuted == false) {
			unmuteVideo();
			return;
		}
		videoUnmuted = false;
		let presencePayload = {
			"category": "app.event.presence.party.online",
			"content": {
				"desktop": false,
				"idle": false,
				"mediaSession": {
					"audio": audioUnmuted,
					"connected": true,
					"phone": false,
					"screenshare": onScreenShare,
					"selfMuted": false,
					"video": videoUnmuted
				},
				"offline": false,
				"role": "guest"
			},
			"topicId": spaceId,
			"loopbackMetadata": "some metadata"
		};
		socketConnection.emit('SEND_PRESENCE_EVENT', presencePayload);
		conferenceCall.muteVideo().then(function() {
			let mediaSessionPayload = {
				"category": "trackstatus",
				"content": {
					"mediaSession": {
						"audio": audioUnmuted,
						"connected": true,
						"screenshare": onScreenShare,
						"selfMuted": false,
						"video": videoUnmuted
					},
					"streamId": myStreamId
				},
				"topicId": spaceId
			};
			socketConnection.emit('SEND_MEDIA_SESSION_EVENTS', mediaSessionPayload);
		}, function() {
			console.log("mute video failure");
		});
		document.getElementById("muteVideo").innerHTML = '<img src="images/video-off@2.png" />';
	}
}

function unmuteVideo() {
	if(socketConnection) {
		videoUnmuted = true;
		let presencePayload = {
			"category": "app.event.presence.party.online",
			"content": {
				"desktop": false,
				"idle": false,
				"mediaSession": {
					"audio": audioUnmuted,
					"connected": true,
					"phone": false,
					"screenshare": onScreenShare,
					"selfMuted": false,
					"video": videoUnmuted
				},
				"offline": false,
				"role": "guest"
			},
			"topicId": spaceId,
			"loopbackMetadata": "some metadata"
		};
		socketConnection.emit('SEND_PRESENCE_EVENT', presencePayload);
		let mediaSessionPayload = {
			"category": "trackstatus",
			"content": {
				"mediaSession": {
					"audio": audioUnmuted,
					"connected": true,
					"screenshare": onScreenShare,
					"selfMuted": false,
					"video": videoUnmuted
				},
				"streamId": myStreamId
			},
			"topicId": spaceId
		};
		socketConnection.emit('SEND_MEDIA_SESSION_EVENTS', mediaSessionPayload);
		conferenceCall.unmuteVideo().then(function() {}, function() {
			console.log("unmute video failure");
		});
		document.getElementById("muteVideo").innerHTML = '<img src="images/video@2.png" />';
	}
}

function muteAudio() {
	if(socketConnection) {
		if(audioUnmuted == false) {
			unmuteAudio();
			return;
		}
		audioUnmuted = false;
		let presencePayload = {
			"category": "app.event.presence.party.online",
			"content": {
				"desktop": false,
				"idle": false,
				"mediaSession": {
					"audio": false,
					"connected": true,
					"screenshare": onScreenShare,
					"video": videoUnmuted
				},
				"offline": false,
				"role": "guest"
			},
			"topicId": spaceId
		};
		socketConnection.emit('SEND_PRESENCE_EVENT', presencePayload);
		let mediaSessionPayload = {
			"category": "trackstatus",
			"content": {
				"mediaSession": {
					"audio": false,
					"connected": true,
					"screenshare": onScreenShare,
					"selfMuted": true,
					"video": videoUnmuted
				},
				"streamId": myStreamId
			},
			"topicId": spaceId
		};
		socketConnection.emit('SEND_MEDIA_SESSION_EVENTS', mediaSessionPayload);
		conferenceCall.muteAudio().then(function() {}, function() {});
		document.getElementById("muteAudio").innerHTML = '<img src="images/audio-off@2.png" />';
	}
}

function unmuteAudio() {
	if(socketConnection) {
		audioUnmuted = true;
		let presencePayload = {
			"category": "app.event.presence.party.online",
			"content": {
				"desktop": false,
				"idle": false,
				"mediaSession": {
					"audio": true,
					"connected": true,
					"screenshare": onScreenShare,
					"video": videoUnmuted
				},
				"offline": false,
				"role": "guest"
			},
			"topicId": spaceId
		};
		socketConnection.emit('SEND_PRESENCE_EVENT', presencePayload);
		let mediaSessionPayload = {
			"category": "trackstatus",
			"content": {
				"mediaSession": {
					"audio": true,
					"connected": true,
					"screenshare": onScreenShare,
					"video": videoUnmuted
				},
				"streamId": myStreamId
			},
			"topicId": spaceId
		};
		socketConnection.emit('SEND_MEDIA_SESSION_EVENTS', mediaSessionPayload);
		conferenceCall.unmuteAudio().then(function() {}, function() {
			console.log("unmute audio failure");
		});
		document.getElementById("muteAudio").innerHTML = '<img src="images/audio@2.png" />';
	}
}

function startRemoteVideo(stream) {
	var video = document.querySelector("#remoteVideoElement");
	video.srcObject = stream;
}

function stopRemoteVideo() {
	var video = document.querySelector("#remoteVideoElement");
	video.srcObject = null;
}

function startLocalVideo(stream) {
	var video = document.querySelector("#localVideoElement");
	video.srcObject = stream;
}

function stopLocalVideo() {
	var video = document.querySelector("#localVideoElement")
	video.srcObject = null;
}