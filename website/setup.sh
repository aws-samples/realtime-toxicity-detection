#!/bin/bash

mydir=$(pwd)
settingsFile="src/toxicity-settings.json"

echo "Looking for Amplify..."
which amplify
if [ ! $? -eq 0 ]; then
    echo "We need to install and configure Amplify..."
    npm install -g @aws-amplify/cli
    amplify -configure
    if [ ! $? -eq 0 ]; then
        echo "Couldn't install Amplify"
        exit 2
    fi
fi
echo "Amplify installed"

if [ ! -f ${settingsFile} ]; then
    echo "Creating settings..."
    read -p "Lambda function URL : " inferenceUrl
    echo "Saving settings to file : '${settingsFile}'"
    echo "{ \"API_URL\": \"${inferenceUrl}\" }" > ${settingsFile}
fi

if [ ! -d "amplify" ]; then
 
    echo "Installing node packages..."
    npm ci

    echo "Setting up : Amplify"
    echo "Accept all the default options"
    amplify init

    echo "Setting up : Amplify - Auth"
    echo "Accept all the default options : Default Configuration, Username as authentication, no advanced settings"
    amplify add auth

    echo "Setting up : Amplify Hosting"
    echo "Select : Hosting with Amplify Console, and then manual deployment (the defaults)"
    amplify add hosting

    echo "Setting up : Amplify - Predictions - Transcribe"
    echo "Select : Convert -> Transcribe text from audio -> accept name suggestion -> British English -> Auth users only"
    amplify add predictions

    echo "Pushing your application"
    amplify push

fi

echo "Publishing the front end ..."
amplify publish
echo "To run locally, issue : npm start"
