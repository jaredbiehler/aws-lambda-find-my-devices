# Find My Devices
This project allows the use of the native iCloud "find my Apple device" functionality directly from Alexa. As an added bonus, creating custom skills in the Alexa dashboard allows the utterance "find my phone" and "find my watch" to be asked directly of Alexa, rather than a more unnatural "ask [app] to find my device".  

As Apple does not provide any kind of OAuth access to their iCloud API, these skills must remain in development for perpetuity as they will need to contain an iCloud username and password.  

Two Alexa skills means that will there will need to be two lambdas. These must be created and linked to the Alexa skills - there are copious tutorials available for this part. 

### Assumptions

This project assumes the two lambdas are named `findMyPhone` and `findMyWatch`. The build scripts in `package.json` will need to be updated if these names change. 

This project also assumes that `aws-cli` has already been installed and configured.

An iCloud username and password are needed to trigger the messages via the iCloud API. 

### Config

The `node-config` library is used for configuration. When developing locally, consider adding a `local.json` file to the `config` directory. Two values are needed:
```json
{
  "user": "iCloud username",
  "password": "base-64 encoded iCloud password"
}
```
The file `local.json` has already be excluded from from Git. As always, take care not to commit / push user credentials to GitHub.

The same username and password will need to be added to the environment variables of the Lambda under the same names as the JSON above. As well, a third value will need to be added `"device": "phone|watch"`. 
### Test

The `local-lambda` library provides a wonderful testing environment to test the lambda logic locally.

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