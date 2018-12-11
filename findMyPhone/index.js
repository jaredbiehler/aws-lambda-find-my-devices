const request = require('request-promise-native');
const config = require('config');

const host = 'https://fmipmobile.icloud.com';
const user = {
    "name": config.get('user'),
    "stuff": Buffer.from(`${config.get('stuff')}`, 'base64').toString('ascii')
};

const paths = {
    'initClient': '/fmipservice/device/PH/initClient',
    'playSound': '/fmipservice/device/PH/playSound'
};

const options = {
    method: 'POST',
    headers: {
        "Authorization": `Basic  ${Buffer.from(user.name + ":" + user.stuff).toString('base64')}`
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

exports.handler = async (event, context, callback) => {
    switch (event.request.type) {
        case "LaunchRequest":
            await playSound('phone', 'Amazon Echo is looking for you!');
            context.succeed(generateResponse(buildSpeechletResponse('I have played a sound on your phone', false)));
            break;
    }
    callback();
};