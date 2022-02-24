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
	console.log("Inbound request: " + from + " " + to);
	
	var hangup = false;
	var prompt = "Say something";
	if ("SpeechResult" in req.body) { 
		console.log(req.body.SpeechResult);
		console.log("Digits: " + req.body.Digits);
		prompt = "I heard you say " + req.body.SpeechResult;
		if (req.body.SpeechResult == "goodbye") {
			hangup = true;
			prompt = "Goodbye";
		} else if (req.body.SpeechResult == "transfer") {
			processTransfer("You are about to be transfered.", req, res);
			return;
		} else if (req.body.SpeechResult == "redirect") {
			processRedirect(req, res);
			return;
		} else if (req.body.SpeechResult == "play") {
			processPlay(req, res);
			return;
		}
	}
	sendResponseToCPaaS(prompt, hangup, res);
});

//Entry point for redirect
app.post('/cpaas-redirect/', function (req, res) {
	sendResponseToCPaaS("This is the redirect XML web hook.  Goodbye!", true, res);
});

async function processRedirect(req, res) {
	var xml = "<Response>\r\n";
	xml += "<Redirect>" + REDIRECT_URL + "</Redirect>\r\n";
	xml += "</Response>";
	res.type('application/xml');
	res.send(xml);
}

async function processPlay(req, res) {	
	var xml = "<Response>\r\n";
	xml += "<Play loop='0'>" + "http://www.hochmuth.com/mp3/Haydn_Adagio.mp3" + "</Play>\r\n";
	xml += "</Response>";
	res.type('application/xml');
	res.send(xml);	
}

async function processTransfer(prompt, req, res)
{	
	var xml = "<Response>\r\n";
	xml += "<Say>" + prompt + "</Say>\r\n";
	xml += "<Dial>" + "{" + TRANSFER_NUMBER + "}" + "</Dial>\r\n";
	xml += "</Response>";
	res.type('application/xml');
	res.send(xml);
}

async function sendResponseToCPaaS(prompt, release, res)
{
	  var xmlDefinition = generateXMLSpeech(REQUEST_URL, prompt, release);
      var serverResponse = await buildCPaaSResponse(xmlDefinition);
      res.type('application/xml');
      res.send(serverResponse);
}

function generateXMLSpeech(request_url,  prompt, hangup )
{
	var xml_content = [];
	if (hangup == false) {
		var gather = ix.gather({
			action : request_url,
			method : "POST",
			input : "speech dtmf",
			timeout : "100",
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
        hangup = ix.hangup();
        xml_content.push(say);
        xml_content.push(hangup);
	}
	
    var xmlDefinition = ix.response({content: xml_content});
    return xmlDefinition;
}

async function buildCPaaSResponse(xmlDefinition)
{
      console.log("XML Def: " , xmlDefinition);
      var result = await ix.build(xmlDefinition).then(function(xml){
          console.log("The XML:" , xml);
          return xml;
      }).catch(function(err){
          console.log('The generated XML is not valid!', err);
      });

      return result;
}
