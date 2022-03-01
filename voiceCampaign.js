/*

This application uses Avaya CPaaS to make a call and launch an inboundXML script once the call has been answered.  It takes two parameters"

called	-- Required. The 10-digit called party
v		-- Optional.  Hangup if an answering machine answers the call.

For example:  node voiceCampaign --called=6512307765 -v

url webhook in this example contains:

<Response>
  	<Say language="en" voice="female">This is a robo call.  Please do not hangup on me.</Say>
</Response>

*/

const request = require('request-promise');

const CPAAS_URL = "https://api-us.cpaas.avayacloud.com/v2/Accounts/";
const CPAAS_MAKE_CALL = "/Calls.json"

// Set the following to match your environment
const CPAAS_USER = "<CPAAS Account SID>";
const CPAAS_TOKEN = "CPaaS Auth Token>";
const CPAAS_FROM = "<CPaaS Telephone Number in E.164 Format>";
const CPAAS_XML_URL = `https://us.cpaas.avayacloud.com/data/inboundxml/e23a1327b8a45db6804a8f8087d32cb940bfe9c1`;  // Replace with your own inboundXML URL

const ARGS = getArgs(); // Retrieve command line arguments

makeVoiceCall();

async function makeVoiceCall() {
	if (ARGS.hasOwnProperty("called")) {
		calledParty = "+1" + ARGS.called;
		const auth = "Basic " +  Buffer.from(CPAAS_USER + ":" + CPAAS_TOKEN, "utf-8").toString("base64");
		parameters = `From=${CPAAS_FROM}&To=${calledParty}&Url=${CPAAS_XML_URL}`;
		if (ARGS.hasOwnProperty("v")) {
			parameters += `&IfMachine=hangup`;
		}
		options = {
			url: CPAAS_URL + CPAAS_USER + CPAAS_MAKE_CALL,
			headers: {'Content-Type' : 'text/plain', 'Accept' : 'application/json', 'Authorization':auth},
			body: parameters,
			method: 'POST'				
		}
		var response = await request.post(options, function(e , r , body) {			
		});		
	}	
}

/* Get command line arguments and return them in a JSON object */

function getArgs () {
    const args = {};
	// The first two arguments are "node" and the node file
    process.argv
        .slice(2, process.argv.length)
        .forEach( arg => {
        // long arg
        if (arg.slice(0,2) === '--') {
            const longArg = arg.split('=');
            const longArgFlag = longArg[0].slice(2,longArg[0].length);
            const longArgValue = longArg.length > 1 ? longArg[1] : true;
            args[longArgFlag] = longArgValue;
        }
        // flags
        else if (arg[0] === '-') {
            const flags = arg.slice(1,arg.length).split('');
            flags.forEach(flag => {
            args[flag] = true;
            });
        }
    });
    return args;
}