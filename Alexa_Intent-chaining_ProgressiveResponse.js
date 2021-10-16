/* *
 * This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
 * Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
 * session persistence, api calls, and more.
 * */
const Alexa = require('ask-sdk-core');
const axios = require('axios');
const querystring = require('querystring');
let rate;
let Flag=false;

const messages = {  
  NOTIFY_MISSING_PERMISSIONS: 'Please enable profile permissions in the Amazon Alexa app.',  
  ERROR: 'Uh Oh. Looks like something went wrong.'  
};  
  
const EMAIL_PERMISSION = "alexa::profile:email:read";  

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
	    //Use of speech synthesis in output-speech
        const speakOutput = 'Welcome to <phoneme alphabet="ipa" ph="hotelhʌb">HotelHub</phoneme>!';
        
        const reprompt = `say: what's my email address.`; 

        return handlerInput.responseBuilder   // Proccess to make Intent-Chaining mechanism
            .addDelegateDirective({
                name: 'EnquiryIntent',
                confirmationStatus: 'NONE',
                slots: {}
            })
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const EnquiryIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest'
      || (handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'EnquiryIntent');
  },
  async handle(handlerInput) {
    let outputSpeech = 'Please wait while we fetch your booking summary.';
    let arg1 = Alexa.getSlotValue(handlerInput.requestEnvelope, 'bookingrefno');

    //Handling of input slot value to filter it as per our need
	arg1= arg1.toUpperCase();
    arg1=arg1.replace(/\s/g, "");
    arg1=arg1.replace("DASH","-");
	
     const { serviceClientFactory, responseBuilder } = handlerInput; 
      const upsServiceClient = serviceClientFactory.getUpsServiceClient();  
      const profileEmail = await upsServiceClient.getProfileEmail();  
      
    var postData = {
       //Request body
    };

	let axiosConfig = {
		headers: {
			'Content-Type': 'application/json',
			"APIKEY": "Api-key",
			"SECRETKEY": "Api-SecretKey"
		}
    };

   await axios.post('your API endpoint url', postData, axiosConfig)
    .then((res) => {
        const temp = res.data;
        const temp1 = temp.response.reservation.bookerProfile.email[0];
        
        if (temp1 === profileEmail)
        {
            Flag=true;
            //outputSpeech = `Email ID is matching. Authentication successful! Your email ID is ${str}. Would you like to proceed with reshop? To check for better deals for your booking, please say, get me optimized rates`;
            
			//Extract the Data Required as per response received
            
			bookingrate = parseFloat(bookingrate).toFixed(2);
            
            outputSpeech = `Hello ${title} ${fname} ${lname}. You have a booking for ${hotelname}, ${hcity} from ${arrivaldate} to ${depdate}. You made this booking for ${currency} ${bookingrate}. To proceed with reshop and to check for better deals, please say, fetch better rates`;
    
        }
        else
        {
            Flag=false;
            outputSpeech = `Authentication failed!`;
            
        }
        //console.log(temp1)
        //outputSpeech = `Email id is ${temp1} `;
        
       }).catch(error => {
        console.log(error);});

    

    const attributesManager = handlerInput.attributesManager;

    const attributes = await attributesManager.getSessionAttributes() || {};
    attributes.slot = arg1;
    attributesManager.setSessionAttributes(attributes);
    
    return handlerInput.responseBuilder
      .speak(outputSpeech)
      .withShouldEndSession(false)
      .addDelegateDirective({
                name: 'ManualReshopIntent',
                confirmationStatus: 'NONE',
                slots: {}
            })
         .getResponse();
       },
    };

const ManualReshopIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest'
      || (handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'ManualReshopIntent');
  },
  
  async handle(handlerInput) {
    
    const attributesManager = handlerInput.attributesManager;
    const attributes = await attributesManager.getSessionAttributes() || {};

    const slot = attributes.slot;
    
    if(!slot)
     {  
        const nullslot = ` You cannot proceed with reshop unless your email ID is authenticated with HotelHub account.`  
        return handlerInput.responseBuilder  //Intent Chaining
                      .speak(nullslot)  
                      .addDelegateDirective({
                        name: 'EnquiryIntent'
                        })
                      .getResponse();  
      }
      
      else if(Flag===true)
      {
    
        try {
          //Call the progressive response service
          await callDirectiveService(handlerInput);
    
        } catch (err) {
          // if it failed we can continue, just the user will wait longer for first response
            console.log("error : " + err);
        }

    let value="Say get me total rate to get the best rate. ";
    var postData = {
           // Request Body
    };
    let axiosConfig = {
        timeout:7000 ,
        headers: {
            'Content-Type': 'application/json',
            "APIKEY": "Your APIKEY,
            "SECRETKEY": "Your SecretKey",
            "accept":"application/json"
        }
    };

    axios.post('API endpoint', postData, axiosConfig)
        .then((res) => {
            const temp = res.data;
             if (res.statusCode < 200 || res.statusCode > 299) {
                 value=`we have encountered an issue , please try after sometime`
   
                setrate(value);
            }

            if (temp.error === null) {

              value="We have sent you a Notification with better deals for your booking, kindly check your registered email. ";
              setrate(value)
              setrate(rate)
            }
            else {
              value=temp.error.userErrorMessage;
              setrate(value)  
            }
        })
		.catch(error => {
			value="  We have sent you a Notification with better deals for your booking, kindly check your registered email. ";
			setrate(value)
		});
    
		  return handlerInput.responseBuilder
		  .speak(value)
		  .withShouldEndSession(false)
		  .getResponse();
    }
    else
       { 
          let  outputSpeech='Email mismatch. You cannot proceed with reshop.';
          return handlerInput.responseBuilder
          .speak(outputSpeech)
          .withShouldEndSession(true)
          .getResponse();
        }
    }
};

function callDirectiveService(handlerInput) {
  // Call Alexa Directive Service.
  const requestEnvelope = handlerInput.requestEnvelope;
  const directiveServiceClient = handlerInput.serviceClientFactory.getDirectiveServiceClient();

  const requestId = requestEnvelope.request.requestId;
  const endpoint = requestEnvelope.context.System.apiEndpoint;
  const token = requestEnvelope.context.System.apiAccessToken;

  // build the progressive response directive
  const directive = {
    header: {
      requestId,
    },
    directive: {
      type: "VoicePlayer.Speak",
      speech: "<speak>hi i am reshop ,please wait while we fetch you the best rate <break time='3s'/>we are working to find the best deal for you <break time='3s'/> thank you for waiting we are almost ready with your result</speak>"
    //"we are fetching the best rate Please wait !!!"
    },
  };
  // send directive
  return directiveServiceClient.enqueue(directive, endpoint, token);
}



function sleep(milliseconds) {
  return new Promise(resolve => setTimeout(resolve(), milliseconds));
}

function setrate(cost)
{
   rate=cost;
}
  


const GetMeTotalRateIntent = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetMeTotalRateIntent';
    },
    handle(handlerInput) {
        const speakOutput= ` ${rate}. `;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can say hello to me! How can I help?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ingnored in locales that do not support it yet 
 * */
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Sorry, I don\'t know about that. Please try again.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
    }
};
/* *
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents 
 * by defining them above, then also adding them to the request handler chain below 
 * */
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};
/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'Sorry, I had trouble doing what you asked. Please try again.';
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        EnquiryIntentHandler,
        ManualReshopIntentHandler,
        GetMeTotalRateIntent,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .addErrorHandlers(
        ErrorHandler)
    .withApiClient(new Alexa.DefaultApiClient())
    .withCustomUserAgent('sample/hello-world/v1.2')
    .lambda();