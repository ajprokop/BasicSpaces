/*

This program reads in a list of names, text numbers, and messages from an Excel file.  It then loops through the list to:
 - Send campaign message to text number.
 - After sending text, pause for one second.  This avoids hitting CPaaS SMS rate limit

*/

const xlsx = require('node-xlsx'); // npm install node-xlsx
var cpaas = require('@avaya/cpaas');  // npm install @avaya/cpaas
var enums = cpaas.enums;

const CPAAS_URL = "https://api-us.cpaas.avayacloud.com/v2";

// Set the following to match your environment
const EXCEL_FILE = "<Excel File>";
const CPAAS_USER = "<CPAAS Account SID>";
const CPAAS_TOKEN = "CPaaS Auth Token>";
const CPAAS_FROM = "<CPaaS Telephone Number in E.164 Format>";

// Parse the Excel file
const workSheetsFromFile = xlsx.parse(EXCEL_FILE);

/*

Excel file must be in form of: 

Name | 10-digit Number | Message
Name | 10-digit Number | Message
Name | 10-digit Number | Message
.
.
.

xlsx.parse will create a JSON object that looks like this:

[ { name: 'Sheet1', data: [ [name, number, message], [name, number, message], [name, number, message] ] } ]

*/

var connector = new cpaas.SmsConnector({
    accountSid: CPAAS_USER,
    authToken: CPAAS_TOKEN,
	baseUrl: CPAAS_URL
});

sendTextMessages(workSheetsFromFile[0].data);

async function sendTextMessages(data) {
	for (i = 0; i < data.length; i++) {			
		toName = data[i][0];
		toNumber = "+1" + data[i][1].toString(); // +1 for E.164 format
		campaignMessage = data[i][2];
		message = `Hello, ${toName}. ${campaignMessage}`;
		//send SMS message
		connector.sendSmsMessage({
			to: toNumber,
			from: CPAAS_FROM,
			body: message
		}).then(function (data) {
			console.log(data);
		}); 	
		// To avoid hitting CPaaS rate limit, pause for one second (the default minimum for SMS transmission) between new messages
		await new Promise(resolve => setTimeout(resolve, 1000));			
	}
}



   