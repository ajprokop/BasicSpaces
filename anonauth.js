const request = require('request-promise');

getAuthToken();

async function getAuthToken() 
{
     var authData = {
         "displayname": "Chatty McChat",
         "username": "Anonymous"
     };
    var url = "https://spacesapis.avayacloud.com/api/anonymous/auth";
	var response = await request.post({url: url, body: JSON.stringify(authData), headers : {'Accept' : 'application/json', "Content-type": 'application/json'}}, function(e , r , body) {
		
    });	
	var json = JSON.parse(response);
	console.log("Token = " + json.token);	
}