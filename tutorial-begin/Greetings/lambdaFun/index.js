'use strict';
exports.handler = function (event, context) {
    // TODO implement
    //context.done(null, 'Hello from Lambda');
    try {
        var request = event.request;

        switch (request.type) {
            case 'LaunchRequest':
                let options = {
                    speechText: "Welcome to Greetings Skill. Using our skill you can greet your guests. Whom do you want to greet?",
                    repromptText: "You can say for example, say hello to John.",
                    endSession: false
                };
                context.succeed(buildResponse(options));
                break;

            case 'IntentRequest':
                if (request.intent.name === 'HelloIntent') {
                    let name = request.intent.slots.FirstName.value;
                    let options = {};
                    options.speechText = "Hello " + name + ".";
                    options.speechText += getGreeting();
                    context.succeed(buildResponse(options));
                } else {
                    throw "Unknown Intent : <<" + request.name + ">>" ;
                }
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

function getGreeting() {
    let currentDate = new Date();
    let hour = currentDate.getUTCHours - 8;
    if (hour < 0)
        hour = hour + 12.

    if (hour < 12)
        return "Good Morning";
    else
        return "Good Evening";


}

function buildResponse(options) {
    var response = {
        "version": "1.0",
        "response": {
            "outputSpeech": {
                "type": "PlainText",
                "text": options.speechText
            },
            "shouldEndSession": options.endSession
        }
    };

    //Check if there is a reprompt in options, and if yes, add to response.
    if (options.repromptText) {
        response.response.reprompt = {
            "outputSpeech": {
                "type": "PlainText",
                "text": options.repromptText
            }
        };
    }
    return response;

}