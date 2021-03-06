# Alexa, Find My [iOS Device]
This project allows the use of the native iCloud "find my Apple device" functionality directly from Alexa. As an added bonus, creating custom skills in the Alexa dashboard allows the utterance "find my phone" and "find my watch" to be asked directly of Alexa, rather than a more unnatural "ask [app] to find my device".  

As Apple does not provide any kind of OAuth access to their iCloud API, these skills must remain in development for perpetuity as they will need to contain an iCloud username and password.  

Two Alexa skills means that will there will need to be two lambdas. These must be created and linked to the Alexa skills - there are copious tutorials available for this part. 

### Assumptions

This project assumes the two lambdas are named `findMyPhone` and `findMyWatch` - more device types can be added or removed, but each will need its own Lambda. The build scripts in `package.json` will need to be updated if these names change. 

This project also assumes that `aws-cli` has already been installed and configured.

An iCloud username and password are needed to trigger the messages via the iCloud API. 

### Config

The `node-config` library is used for configuration. 

##### &#x1F534; Lambda IMPORTANT &#x1F534;

Three environment variables must be added to each lambda:
```
ICLOUD_USER: "username"
ICLOUD_PASSWORD: "base64 password"
ICLOUD_MODEL_DISPLAY_NAME: "iPhone|Apple Watch|..."
```

To find the `modelDisplayName` value for your devices, POST to https://fmipmobile.icloud.com/fmipservice/device/{username}/initClient with `Authorization: Basic [base64 username:password]` (if using Postman, make sure SSL certificate verification is turned off). Search for `modelDisplayName` in the result to find all devices associated to the account. Most likely they will just be simple like `iPhone`, `iPad` or `Apple Watch`. 

##### Local

When developing locally, consider adding a `local.json` file to the `config` directory. Two values are needed:

```json
{
  "iCloud": {
    "user": "iCloud username",
    "password": "base-64 encoded iCloud password"
  }
}
```
The file `local.json` has already be excluded (via .gitignore) from from Git. As always, take care not to commit / push user credentials to GitHub. The `modelDisplayName` value has been baked into the npm scripts for `test:phone` and `test:watch` - this could probably stand to be refactored and passed in as an argument rather than hardcoded. As you'll likely be forking this repo, consider changing them to whatever you need. 



### Test

The `local-lambda` library provides a wonderful testing environment to test the lambda logic locally. These scripts have the `modelDisplayName` baked in to them via the `package.json` scripts section - consider modifying them if needed. 

```bash
npm run test:phone
npm run test:watch
```

### Build

There are two `npm` scripts available to build the two separate lambdas:
```bash
npm run build:phone
npm run build:watch
```
Each builds, zips and deploys the necessary code to AWS Lambda.

If you're like me and have multiple AWS profiles, a profile can be specified via:
```bash
npm run build:phone -- [profile]
``` 
