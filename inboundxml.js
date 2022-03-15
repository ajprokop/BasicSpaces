const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cpaas = require('@avaya/cpaas'); //Avaya cloud
var enums = cpaas.enums;
var ix = cpaas.inboundXml;

// Replace the following with your own values
const HOST = "xx.xx.xx.xx";  // Application IP address
const URL_PORT = xxxx; // Application port
const TRANSFER_NUMBER = "+1xxxxxxxxxx";  // Ten digit tranfser telephone number

const REQUEST_URL = "http://" + HOST + ":" + URL_PORT.toString() + "/cpaas-request/";
const REDIRECT_URL = "http://" + HOST + ":" + URL_PORT.toString() + "/cpaas-redirect/";

var app = express();

// Middleware to parse JSON
app.use(bodyParser.urlencoded({
    extended : true
}));
app.use(bodyParser.json());
app.use(cors());

// Tell server to listen on port
var server = app.listen(URL_PORT, function () 
{
   var host = server.address().address;
   var port = server.address().port;
   console.log(`The transfer agent is listening at http://%s:%s`, HOST, URL_PORT)
});

// Entry point for a GET from a web browser
app.get('/', function (req, res) 
{
   res.send("The CPaaS virtual agent is running.");
});

//Entry point for voice
app.post('/cpaas-request/', function (req, res) {
    //CPaaS Inbound XML Parameters	
    var from = req.body.From;
    var to = req.body.To;
	
	var hangup = false;
	var prompt = "Say something";
	if ("SpeechResult" in req.body) { 
		prompt = "I heard you say " + req.body.SpeechResult;
		if (req.body.SpeechResult == "goodbye") {
			hangup = true;
			prompt = "Goodbye";
		} else if (req.body.SpeechResult == "transfer") {
			processTransfer("You are about to be transfered.", res);
			return;
		} else if (req.body.SpeechResult == "redirect") {
			processRedirect(res);
			return;
		} else if (req.body.SpeechResult == "play") {
			processPlay(res);
			return;
		} else if (req.body.SpeechResult == "dial tone") {
			processDialTone(res);
			return;
		}
	}
	sendResponseToCPaaS(prompt, hangup, res);
});

//Entry point for redirect
app.post('/cpaas-redirect/', function (req, res) {
	sendResponseToCPaaS("This is the redirect XML web hook.  Goodbye!", true, res);
});

async function processRedirect(res) {
	var xmlDefinition = generateXMLRedirect();
    var serverResponse = await buildCPaaSResponse(xmlDefinition);
    res.type('application/xml');
    res.send(serverResponse);
}

function generateXMLRedirect() {
	var xml_content = [];
	var redirect = ix.redirect({
		url: REDIRECT_URL
	});
	xml_content.push(redirect);	
    var xmlDefinition = ix.response({content: xml_content});
    return xmlDefinition;	
}

async function processDialTone(res) {	
	var xmlDefinition = generateDialTone();
    var serverResponse = await buildCPaaSResponse(xmlDefinition);
    res.type('application/xml');
    res.send(serverResponse);
}

function generateDialTone() {
	var xml_content = [];
	var gather = ix.gather({
		action : REQUEST_URL,
		method : "POST",
		input : "speech",
		timeout : "20",
		content : [
			ix.play({
				loop: 1,
				url: "tone_stream://%(2000,0,350,440)"
			}),
			ix.say({
				language: enums.Language.EN,
				text: "Say something",
				voice : enums.Voice.FEMALE
			})
		]
	});
	xml_content.push(gather);
    var xmlDefinition = ix.response({content: xml_content});
    return xmlDefinition;	
}

async function processPlay(res) {	
	var xmlDefinition = generateXMLPlay();
    var serverResponse = await buildCPaaSResponse(xmlDefinition);
    res.type('application/xml');
    res.send(serverResponse);
}

function generateXMLPlay() {
	var xml_content = [];
	var play = ix.play({
		loop : 0,
		url: "http://www.hochmuth.com/mp3/Haydn_Adagio.mp3"
	});
	xml_content.push(play);	
    var xmlDefinition = ix.response({content: xml_content});
    return xmlDefinition;	
}

async function processTransfer(prompt, res) {	
	var xmlDefinition = generateXMLTransfer(prompt);
    var serverResponse = await buildCPaaSResponse(xmlDefinition);
    res.type('application/xml');
    res.send(serverResponse);
}

function generateXMLTransfer(prompt) {
	var responseXML = ix.response({content: [
		ix.say({
			language: enums.Language.EN,
			text: prompt,
			voice : enums.Voice.FEMALE
		}),
		ix.dial({
			content : [
				ix.number({
					number: TRANSFER_NUMBER
				})
			]
		})		
	]});	
    return responseXML;	
}

async function sendResponseToCPaaS(prompt, release, res) {
	  var xmlDefinition = generateXMLSpeech(REQUEST_URL, prompt, release);
      var serverResponse = await buildCPaaSResponse(xmlDefinition);
      res.type('application/xml');
      res.send(serverResponse);
}

function generateXMLSpeech(request_url,  prompt, hangup ) {
	var xml_content = [];
	if (hangup == false) {
		var gather = ix.gather({
			action : request_url,
			method : "POST",
			input : "speech",
			timeout : "20",
			content : [
				ix.say({
					language: enums.Language.EN,
					text: prompt,
					voice : enums.Voice.FEMALE
				})
			]
		});
		xml_content.push(gather);
	} else {
        var say = ix.say({
            language: enums.Language.EN,
            text: prompt ,
            voice : enums.Voice.FEMALE
        });
        var hangup = ix.hangup();
        xml_content.push(say);
        xml_content.push(hangup);
	}	
    var xmlDefinition = ix.response({content: xml_content});
    return xmlDefinition;
}

async function buildCPaaSResponse(xmlDefinition) {
      var result = await ix.build(xmlDefinition).then(function(xml){
          return xml;
      }).catch(function(err){
          console.log('The generated XML is not valid!', err);
      });
      return result;
}