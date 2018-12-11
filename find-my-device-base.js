process.env.NODE_CONFIG_DIR = process.env["LAMBDA_TASK_ROOT"]+'/config';

const request = require('request-promise-native');
const config = require('config');
const Alexa = require('ask-sdk-core');

// 'phone' or 'watch', set in environment variable
const deviceType = config.get('device');

const host = 'https://fmipmobile.icloud.com';
const user = {
    name: config.get('user'),
    password: Buffer.from(`${config.get('password')}`, 'base64').toString('ascii')
};

const paths = {
    'initClient': '/fmipservice/device/PH/initClient',
    'playSound': '/fmipservice/device/PH/playSound'
};

const options = {
    method: 'POST',
    headers: {
        "Authorization": `Basic  ${Buffer.from(user.name + ":" + user.password).toString('base64')}`
    },
    rejectUnauthorized: false
};

/**
 * @return {Promise<Object>}
 */
async function initDevices() {
    console.log('Starting init devices...');

    const devices = {};

    const initResult = await request(Object.assign({
            uri: `${host}${paths.initClient.replace(/PH/, user.name)}`
        }, options)
    );

    //console.log("Data:", data);
    const data = JSON.parse(initResult);

    if (!data.content || !Array.isArray(data.content)) {
        console.error('Invalid data from iCloud initClient', initResult);
        throw new Error('Invalid data from iCloud initClient');
    }

    for (let i = 0; i < data.content.length; i++) {
        if (data.content[i].modelDisplayName === 'Apple Watch') {
            devices.watchId = data.content[i].id;
        }
        if (data.content[i].modelDisplayName === 'iPhone') {
            devices.iPhoneId = data.content[i].id;
        }
    }

    console.log('iPhone ID: ', devices.iPhoneId, ', watch ID: ', devices.watchId);

    return devices;
}

/**
 * @param {string} device
 * @param {string} message
 * @return {Promise<void>}
 */
async function playSound(device, message) {
    console.log('Starting play sound for ' + device + ' with message ' + message + '...');

    const devices = await initDevices();

    const deviceId = device === 'phone' ? devices.iPhoneId : devices.watchId;

    const psOptions = Object.assign({
        uri: `${host}${paths.playSound.replace(/PH/, user.name)}`,
        json: true,
        body: { device: deviceId, subject: message }
    }, options);

    console.log('Playing sound on ' + device + ', ID: ' + deviceId + '...');

    const result = await request(psOptions);

    console.log(`Result: ${result}`);
}

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    async handle(handlerInput) {
        await playSound(deviceType, 'Amazon Echo is looking for you!');

        const speechText = `I have played a sound on your ${deviceType}`;

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .withSimpleCard(`Find ${deviceType} Triggered`, speechText)
            .getResponse();
    }
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`Error handled: ${error.message}`);

        return handlerInput.responseBuilder
            .speak('Sorry, I can\'t understand the command. Please say again.')
            .reprompt('Sorry, I can\'t understand the command. Please say again.')
            .getResponse();
    },
};

exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(LaunchRequestHandler)
    .addErrorHandlers(ErrorHandler)
    .lambda();