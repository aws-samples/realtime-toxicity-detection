// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React from "react";

import Amplify, { Auth } from "aws-amplify";
import { AmazonAIPredictionsProvider } from "@aws-amplify/predictions";
import API from "@aws-amplify/api";
import { withAuthenticator, Button } from "@aws-amplify/ui-react";

import MyTimeSeries from "./components/MyTimeSeries.js";
import ToxicText from "./components/ToxicText.js";

import awsconfig from "./aws-exports";
import configSettings from "./toxicity-settings.json";

import "./App.css";
import "@aws-amplify/ui-react/styles.css";

Amplify.configure(awsconfig);
Auth.configure(awsconfig);
Amplify.addPluggable(new AmazonAIPredictionsProvider());

API.configure({
    endpoints: [
        {
            name: "myToxicityAPI",
            endpoint: configSettings.API_URL,
            service: "lambda",
        },
    ],
});

/**
 * Function that orchestrates getting predictions from a list of sentences, and scoring them
 * @param    {Object} Anonymous     Cognito integration
 */
function App({ signOut, user }) {
    const tsRef = React.createRef();
    return (
        <div className="App">
            <h2 className="App-header">Detecting Toxicity in near real time</h2>
            <ToxicText display={tsRef} />
            <div className="tsGraphContainer">
                <div className="Graph">
                    <MyTimeSeries
                        ref={tsRef}
                        name="myToxicityGraph"
                        title="Detecting Toxicity in near real time"
                        aws={awsconfig}
                    />
                </div>
            </div>
            <Button onClick={signOut}>Sign out</Button>
        </div>
    );
}

export default withAuthenticator(App);
