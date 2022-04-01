/*

This program reads in a list of names, text numbers, and messages from an Excel file.  It then loops through the list to:
 - Send campaign message to text number.
 - After sending text, pause for one second.  This avoids hitting CPaaS SMS rate limit

*/

const xlsx = require('node-xlsx'); // npm install node-xlsx
const request = require('request-promise');

const CPAAS_URL = "https://api-us.cpaas.avayacloud.com/v2/Accounts/";
const CPAAS_SEND_SMS = "/SMS/Messages.json"

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

sendTextMessages(workSheetsFromFile[0].data);
	
async function sendTextMessages(data) {
	const auth = "Basic " +  Buffer.from(`${CPAAS_USER }:${CPAAS_TOKEN}`, "utf-8").toString("base64");
	for (let i in data) {			
		toName = data[i][0];
		toNumber = `+1${data[i][1].toString()}`; // +1 for E.164 format
		campaignMessage = data[i][2];
		message = `Hello, ${toName}. ${campaignMessage}`;
		options = {
			url: `${CPAAS_URL}${CPAAS_USER}${CPAAS_SEND_SMS}`,
			body: `From=${CPAAS_FROM}&To=${toNumber}&Body=${message}`,
			headers: {'Content-Type' : 'text/plain', 'Accept' : 'application/json', 'Authorization' : auth},
			method: 'POST'
		}				
		var response = await request.post(options, function(e , r , body) {			
		});	
		// To avoid hitting CPaaS rate limit, pause for one second (the default minimum for SMS transmission) between new messages
		await new Promise(resolve => setTimeout(resolve, 1000));	
	}
}