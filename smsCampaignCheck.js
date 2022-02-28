/*

SMS Campaign Application

This program reads in a list of names, text numbers, and messages from an Excel file.  It then loops through the list to:
 - Determine if number has been assigned to a mobile device.
 - If mobile device, send campaign message to that device.
 - After sending text, pause for one second.  This avoids hitting CPaaS SMS rate limit

*/

const xlsx = require('node-xlsx');  // npm install node-xlsx --save
const request = require('request-promise');

const CPAAS_SEND_SMS = "/SMS/Messages.json"
const CPAAS_CARRIER_LOOKUP = "/Lookups/Carrier.json";
const CPAAS_URL = "https://api-us.cpaas.avayacloud.com/v2/Accounts/";

// Set the following to match your environment
const EXCEL_FILE = "<Excel File>";
const CPAAS_USER = "<CPAAS Account SID";
const CPAAS_TOKEN = "CPaaS Auth Token>";
const CPAAS_FROM = "<CPaaS Telephone Number in E.164 Format";

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
	const auth = "Basic " +  Buffer.from(CPAAS_USER + ":" + CPAAS_TOKEN, "utf-8").toString("base64");
	for (i = 0; i < data.length; i++) {	
		// Check to see that we have a mobile number
		toNumber = "+1" + data[i][1].toString();			
		options = {
			url: CPAAS_URL + CPAAS_USER + CPAAS_CARRIER_LOOKUP,
			body: `PhoneNumber=${toNumber}`,
			headers: {'Content-Type' : 'text/plain', 'Accept' : 'application/json', 'Authorization':auth},
			method: 'POST'
		}				
		var response = await request.post(options, function(e , r , body) {				
		});	
		json = JSON.parse(response);
		// Check to see if mobile is set to true
		if (json.carrier_lookups[0].hasOwnProperty("mobile")) {
			if (json.carrier_lookups[0].mobile) {
				// We have a mobile device -- send text message
				toName = data[i][0];
				campaignMessage = data[i][2];
				message = `Hello, ${toName}. ${campaignMessage}`;				
				options = {
					url: CPAAS_URL + CPAAS_USER + CPAAS_SEND_SMS,
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
	}
}	