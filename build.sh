#!/usr/bin/env bash

if [ "$#" -lt 1 ]; then
  echo "Usage : ./build.sh lambdaName [profile]";
  exit 1;
fi

lambda=${1%/}; # Removes trailing slashes
profile=${2:-default};
echo "Deploying $lambda for AWS profile $profile";

# cleanup old build
rm -rf $lambda

# create workspace
mkdir $lambda

cd $lambda;
if [ $? -eq 0 ]; then
  echo "...."
else
  echo "Couldn't cd to directory $lambda. You may have misspelled the lambda/directory name";
  exit 1
fi

echo "Checking that aws-cli is installed"
which aws
if [ $? -eq 0 ]; then
  echo "aws-cli is installed, continuing..."
else
  echo "You need aws-cli to deploy this lambda. Google 'aws-cli install'"
  exit 1
fi

cp ../find-my-device-base.js index.js
cp ../package.json .

echo "npm installing...";
npm install --only=prod --quiet --silent
if [ $? -eq 0 ]; then
  echo "done";
else
  echo "npm install failed";
  exit 1;
fi

rm package.json
rm package-lock.json
mkdir config
cp ../config/default.js config/

echo "removing old zip"
rm archive.zip;

echo "creating a new zip file"
zip archive.zip * -qq -r -x .git/\* \*.sh tests/\* node_modules/aws-sdk/\* \*.zip

echo "Uploading $lambda to AWS...";

aws lambda update-function-code --profile $profile --function-name $lambda --zip-file fileb://archive.zip --publish

if [ $? -eq 0 ]; then
  echo "!! Upload successful !!"
else
  echo "Upload failed"
  echo "If the error was a 400, check that there are no slashes in your lambda name"
  echo "Lambda name = $lambda"
  exit 1;
fi

# delete workspace
cd ..
rm -rf $lambda