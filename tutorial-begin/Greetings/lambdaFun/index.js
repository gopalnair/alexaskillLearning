'use strict';
var http = require('http');
var debug_enabled = true;
exports.handler = function (event, context) {
    if(process.env.NODE_DEBUG)
        console.log("Debug Enabled");

    try {
        var request = event.request;
        var session = event.session;
        if (!event.session.attributes) {
            event.session.attributes = {};
        }

        switch (request.type) {
            case 'LaunchRequest':
                handleLaunchRequest(context);
                break;

            case 'IntentRequest':
                switch (request.intent.name) {
                    case 'HelloIntent':
                        handleHelloIntent(request, context);
                        break;
                    case 'QuoteIntent':
                        handleQuoteIntent(request,context,session);
                        break;

                    case 'NextQuoteIntent':                        
                       
                        handleNextQuoteIntent(request,context,session);
                        break;
                    case 'AMAZON.CancelIntent':
                    case 'AMAZON.StopIntent':
                        context.succeed(buildResponse({
                            speechText:'Good Bye. ',
                            endSession: true
                        }));
                    default:
                        throw "Unknown Intent : <<" + request.name + ">>";
                        
                }
                /*if (request.intent.name === 'HelloIntent') {
                    handleHelloIntent(request, context);
                
                } else {
                    throw "Unknown Intent : <<" + request.name + ">>";
                }*/
                break;

            case 'SessionEndedRequest':

                break;

            default:
                throw "Unknown Intent Type";
        }
    } catch (error) {
        context.fail("Exception " + error);
    }
    return context;
};

/* Get a random quote from Internet */
function getQuote(callback) {
    var url = "http://api.forismatic.com/api/1.0/json?method=getQuote&lang=en&format=json";
    var req = http.get(url, function (response) {
        var body = "";

        response.on('data', function (chunk) {
            body += chunk;
        });

        response.on('end', function () {
            body.replace(/\\/g, '');
            var responseObject = JSON.parse(body);
            callback(responseObject.quoteText, '');

        });
    });

    req.on('error', function (err) {
        callback('', err);
    });
}

function getGreeting() {
    let currentDate = new Date();
    let hour = currentDate.getUTCHours - 8;
    if (hour < 0)
        hour = hour + 12;

    if (hour < 12)
        return "Good Morning. ";
    else
        return "Good Evening. ";


}

function buildResponse(options) {
    var response = {
        "version": "1.0",
        "response": {
            "outputSpeech": {
                "type": "SSML",
                ssml: "<speak>" + options.speechText + "</speak>"
            },
            "shouldEndSession": options.endSession
        }
    };

    //Check if there is a reprompt in options, and if yes, add to response.
    if (options.repromptText) {
        response.response.reprompt = {
            "outputSpeech": {
                "type": "SSML",
                "text": "<speak>"+options.repromptText+"</speak>"
            }
        };
    }

    if (options.cardTitle){
        response.response.card={
            type:"Simple",
            title: options.cardTitle
        };

        if(options.imageUrl){
            response.response.card.type = "Standard";
            response.response.card.text = options.cardContent;
            response.response.card.image = {
                smallImageUrl: options.imageUrl,
                largeImageUrl: options.imageUrl
            };
        }
    }


    if (options.session && options.session.attributes){
        response.sessionAttributes = options.session.attributes;
    }

    return response;

}

/* Function to handle Launch Request from Alexa*/
function handleLaunchRequest(context) {
    let options = {
        speechText: "Welcome to Greetings Skill. Using our skill you can greet your guests. Whom do you want to greet?",
        repromptText: "You can say for example, say hello to John.",
        endSession: false
    };
    context.succeed(buildResponse(options));
}

function handleHelloIntent(request, context) {
    let name = request.intent.slots.FirstName.value;
    let options = {};
    options.speechText = `Hello <say-as interpret-as = "spell-out">${name}</say-as> ${name}. `;
    options.speechText += getGreeting();
    
    getQuote(function (quote, err) {
        if (err) {
            context.fail(err);
        } else {
            options.speechText += quote;
            options.cardContent = quote;
            options.imageUrl = "https://commons.wikimedia.org/wiki/File:Hello_smile.png";            
        }
        context.succeed(buildResponse(options));
        return context;
    });
}

function handleQuoteIntent(request,context,session){
    let options = {};
    options.session = session;

    getQuote(function (quote, err) {
        if (err) {
            context.fail(err);
        } else {
            options.speechText = quote;
            options.speechText += ' Do you want to listen to another quote? ';
            options.repromptText = 'You can say yes or one more.';
            options.session.attributes.quoteIntent = true;
            options.endSession = false;
            context.succeed(buildResponse(options));
        }        
    });
}

function handleNextQuoteIntent(request, context, session){
    let options = {};
    options.session = session;
    /*console.log("About to process handleNextQuoteIntent");
    console.log('========== REQUEST=========');
    console.log(JSON.stringify(request));
    console.log('========== CONTEXT =========');
    console.log(JSON.stringify(context));
    console.log('========== SESSION =========');
    console.log(JSON.stringify(session)); */

    //Check if the execution came here from Previous Quote Intent.
    if(session.attributes.quoteIntent){
        getQuote(function (quote, err) {
            if (err) {
                context.fail(err);
            } else {                                
                options.speechText = quote;
                options.speechText += ' Do you want to listen to another quote? ';
                options.repromptText = 'You can say yes or one more.';
                options.session.attributes.quoteIntent = true;
                options.endSession = false;               
                context.succeed(buildResponse(options));
            }        
        });
    }else{
        //console.log('Wrong invocation of NextQuoteIntent');
        options.speechText = "Wrong Invocation of this Intent";
        options.endSession = true;
        context.succeed(buildResponse(options));
    }
}