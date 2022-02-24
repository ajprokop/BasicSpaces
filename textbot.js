/*

This Avaya CPaaS application accepts incoming SMS text messages and sends the received message back to the sender.

It can be easly enhanced to provide some form of bot processing.

*/

const express = require('express');
const bodyParser = require('body-parser');
const cpaas = require('@avaya/cpaas'); //Avaya cloud
var enums = cpaas.enums;
var ix = cpaas.inboundXml;

const URL_PORT = 5055;

var app = express();

// Middleware to parse JSON
app.use(bodyParser.urlencoded({
    extended : true
}));
app.use(bodyParser.json());

// Tell server to listen on port
var server = app.listen(URL_PORT, function () {
   var host = server.address().address;
   var port = server.address().port;
   console.log("SMS Virtual Agent is listening on port %s", port)
});

// Entry point for sms text
app.post('/cpaas-sms/', function (req, res) {
    processText(req.body.From, req.body.To, req.body.Body, res);
});

async function processText(from, to, body, res) {
              
    var prompt = body;
    // Do something with the incoming message body and set prompt to the response text message body
	// For example, call Google Dialogflow to process messsage and set prompt to Intent Response
	
	console.log(body);
              
    returnTextResponse(prompt, from, to, res);
}

async function returnTextResponse(prompt, from, to, res) {
	var xmlDefinition = generateXMLText(from, to, prompt)
    var serverResponse = await buildCPaaSResponse(xmlDefinition);

    res.type('application/xml');
    res.send(serverResponse);
}

function generateXMLText(customer , cpaas , body) {
    var sms = ix.sms({
        text : body ,
        to : customer ,
        from : cpaas
    });

    var xml_content = [];
    xml_content.push(sms);
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
