/* *
 * This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
 * Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
 * session persistence, api calls, and more.
 * */

const Alexa = require('ask-sdk-core');
const axios = require('axios');
var postData = {
    //RequestBody to make a API call
};
const PostConfig = {
    headers: {
        'Content-Type': 'application/json',
        "APIKEY": "Your api-key",
        "SECRETKEY": "Your api-secret",
    }
};

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  async handle(handlerInput) {
    let accessToken = handlerInput.requestEnvelope.context.System.user.accessToken;

    if (accessToken === undefined) {
      var speechText = "Please use the Alexa companion app to authenticate with your Amazon account to start using this skill.";

      return handlerInput.responseBuilder
        .speak(speechText)
        .withLinkAccountCard()
        .getResponse();
    } else {
    //let accessToken = handlerInput.requestEnvelope.context.System.user.accessToken;
    let url = `https://api.amazon.com/user/profile?access_token=${accessToken}`;
    /*
    * data.user_id : "amzn1.account.xxxxxxxxxx"
    * data.email : "steve@dabblelab.com"
    * data.name : "Steve Tingiris"
    * data.postal_code : "33607"
    */
    let outputSpeech = 'This is the default message.';

    await getRemoteData(url)
      .then((response) => {
        const data = JSON.parse(response);
        outputSpeech = `Hi ${data.name}. I have yor email address as: ${data.email}.`;
      })
      .catch((err) => {
        //set an optional error message here
        outputSpeech = err.message;
      });

    return handlerInput.responseBuilder
      .speak(outputSpeech)
      .getResponse();
    }

  },
};

const MyNameIsIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'MyNameIsIntent';
  },
  handle(handlerInput) {

    const nameSlot = handlerInput.requestEnvelope.request.intent.slots.name.value;
    const speechText = `Hello ${nameSlot}. It's nice to meet you.`;

    return handlerInput.responseBuilder
      .speak(speechText)
      .getResponse();
  },
};
 const ManualReshopHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest'
      || (handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'ManualReshop');
  },
  async handle(handlerInput) {
    let outputSpeech = 'This is the default message.';
   
    var result = await makeGetRequest('API endpoint URL');
    //retrive the data required as per the response format eg:json
    var temp=result.data;
    outputSpeech = `The cheapest available rate for your booking is INR ${temp}. `;
   
   
    return handlerInput.responseBuilder
      .speak(outputSpeech)
      .reprompt(outputSpeech)
      .getResponse();
  },
};

// Method to make POST request to a external/third party API using Axios
function makeGetRequest(path) {
    return new Promise(function (resolve, reject) {
        axios.post(path, postData, PostConfig).then(
            (response) => {
                var result = response.data;
                console.log('Processing Request :');
                resolve(result);
            },
            (error) => {
                reject(error);
            } 
        );
    });   
}



const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speechText = 'You can introduce yourself by telling me your name';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speechText = 'Goodbye!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak(`Sorry I ran into an error. The error message was: ${error.message}`)
      .reprompt('Sorry, I can\'t understand the command. Please say again.')
      .getResponse();
  },
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    ManualReshopHandler,
    MyNameIsIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();


// Method to make Get request to external API using http/https library
  const getRemoteData = function (url) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? require('https') : require('http');
      const request = client.get(url, (response) => {
        if (response.statusCode < 200 || response.statusCode > 299) {
          reject(new Error('Failed with status code: ' + response.statusCode));
        }
        const body = [];
        response.on('data', (chunk) => body.push(chunk));
        response.on('end', () => resolve(body.join('')));
      });
      request.on('error', (err) => reject(err))
    })
  };