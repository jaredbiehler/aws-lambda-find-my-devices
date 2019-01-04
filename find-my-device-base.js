// needed for node-config within Lambda
process.env.NODE_CONFIG_DIR = `${process.env["LAMBDA_TASK_ROOT"]}/config`;

const request = require('request-promise-native');
const config = require('config');
const Alexa = require('ask-sdk-core');

/**
 * iCloud API description of the device, e.g. 'Apple Watch' or 'iPhone'.
 * This value may collide if the account has multiple devices of the same
 * type - consider using a separate API field in that case.
 * 
 * To find this value, POST to https://fmipmobile.icloud.com/fmipservice/device/{user}/initClient
 * with Authorization: Basic [base64 username:password] (if using Postman, make sure SSL certificate
 * verification is turned off). Search for 'modelDisplayName' to find all devices named on the account. 
 *
 * @type {string}
 */
const modelDisplayName = `${config.get('iCloud.modelDisplayName')}`;

const iCloud = {
    host: 'https://fmipmobile.icloud.com',
    paths: {
        initClient: '/fmipservice/device/PH/initClient',
        playSound: '/fmipservice/device/PH/playSound'
    },
    user: {
        name: `${config.get('iCloud.user')}`,
        password: Buffer.from(`${config.get('iCloud.password')}`, 'base64').toString('ascii')
    }
};

/**
 * iCloud POST request options helper method.
 *
 * @param {string} path
 * @param {Object} [body]
 * @return {Object}
 */
function getRequestOptions(path, body = null) {
    const auth = Buffer.from(`${iCloud.user.name}:${iCloud.user.password}`).toString('base64');
    const options = {
        method: 'POST',
        uri: `${iCloud.host}${path}`,
        headers: {
            Authorization: `Basic ${auth}`
        },
        rejectUnauthorized: false
    };

    if (body) {
        options.json = true;
        options.body = body;
        options.headers['Content-Type'] = 'application/json';
    }

    return options;
}

/**
 * Requests all device info and attempts to find the specific device ID based on the
 * modelDisplayName.
 *
 * @return {Promise<string>}
 */
async function fetchDeviceId() {
    console.log('Starting fetch for device ID via initDevices');

    const initResult = await request(
        getRequestOptions(iCloud.paths.initClient.replace(/PH/, iCloud.user.name))
    );

    const data = JSON.parse(initResult);

    if (!data.content || !Array.isArray(data.content)) {
        console.error('Invalid data from iCloud initClient', initResult);
        throw new Error('Invalid data from iCloud initClient');
    }

    const content = data.content.find(c => c && c.modelDisplayName === modelDisplayName);

    if (!content) {
        throw new Error(`Unable to determine ID for ${modelDisplayName}`);
    }

    return content.id;
}

/**
 * Launching point.
 *
 * @param {string} message
 * @return {Promise<void>}
 */
async function playSound(message) {
    console.log(`Starting play sound for ${modelDisplayName} with message ${message}`);

    const deviceId = await fetchDeviceId();

    if (!deviceId) {
        throw new Error(`Unable to determine ID for ${modelDisplayName}`);
    }

    console.log(`Playing sound on ${modelDisplayName}, ID: ${deviceId}`);

    const result = await request(
        getRequestOptions(
            iCloud.paths.playSound.replace(/PH/, iCloud.user.name),
            { device: deviceId, subject: message }
        )
    );

    console.log(`Result: ${result}`);
}

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    async handle(handlerInput) {
        let speechText = `I have played a sound on your ${modelDisplayName}.`;
        try {
            await playSound('Alexa is looking for you!');
        } catch (error) {
            speechText = `Sorry, an error occurred while looking for your ${modelDisplayName}.`;
            console.error(error);
        }

        return handlerInput.responseBuilder
            .speak(speechText)
            .withSimpleCard(`Find ${modelDisplayName} Triggered`, speechText)
            .withShouldEndSession(true)
            .getResponse();
    }
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.error(`Error handled: ${error.message}`);

        const speechText = `Sorry, I can't understand the command. Please say again.`;

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    },
};

exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(LaunchRequestHandler)
    .addErrorHandlers(ErrorHandler)
    .lambda();
