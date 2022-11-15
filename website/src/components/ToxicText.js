// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React from "react";
import mic from "microphone-stream";
import API from "@aws-amplify/api";
import { Predictions } from "aws-amplify";

import { Scope, NoiseGate } from "./StreamFilters.js";
import Progress from "./Progress.js";
import TimerProgress from "./TimerProgress.js";
import StepInput from "./StepInput.js";

export default class ToxicText extends React.Component {
    static Name = "ToxicText";

    /**
     * Simple audio buffer 
     */
    AudioBuffer() {
        let buffer = [];
        function add(raw) {
            buffer = buffer.concat(...raw);
        }
        function newBuffer() {
            buffer = [];
        }
        return {
            // public interface
            reset: function () {
                newBuffer();
            },
            addData: function (raw) {
                add(raw);
            },
            getData: function () {
                return buffer;
            },
        };
    }

    /**
     * Constructor
     * @param    {Object} props  Our initial React object properties
     */
    constructor(props) {
        super(props);
        Predictions.configure(props.aws);
        this.state = {
            transcript: "",
            status: "",
            micStream: null,
            transmitting: false,
            talking: false,
            sampleRate: 44100,
            threshold: -50,
            bufferUsed: 0,
        };

        this.tsRef = props.display;
        this.audioBuffer = this.AudioBuffer();
        this.noiseGate = null;

        this.sweeper = React.createRef();

        this.startTransmitting = this.startTransmitting.bind(this);
        this.stopTransmitting = this.stopTransmitting.bind(this);
        this.gateCloses = this.gateCloses.bind(this);
        this.gateOpens = this.gateOpens.bind(this);
        this.sweeperTriggered = this.sweeperTriggered.bind(this);
    }

    /**
     * Function that updates our application state with out mic stream
     * @param    {mic} value  The current enabled mic stream
     */
    setMicStream(value) {
        this.setState({ micStream: value });
    }

    /**
     * Function that updates our transmitting flag state
     * @param    {Bool} value  The status of our transmission status
     */
    setTransmitting(value) {
        this.setState({ transmitting: value });
    }

    /**
     * Function that updates our transcription state
     * @param    {String} value  The latest Transcription message
     */
    setTranscript(value) {
        this.setState({ transcript: value });
    }

    /**
     * Function that consistently formats log messages and stores the state
     * @param    {String} message  The string we want to log out
     */
    logger(message) {
        console.log(ToxicText.Name + " - " + message);
        this.setState({ status: message });
    }

    /**
     * Function that fires when our React app has been instantiated
     */
    componentDidMount() {
        this.logger("App loaded, hit the button and start talking...");
    }

    /**
     * Function that handles changes on the trigger point for the noise gate threshold
     * @param    {RangeStepInput} e  Event source
     */
    noiseGateThresholdChange(e) {
        const newVal = parseInt(e.target.value);
        this.setState({ threshold: newVal });
        if (this.noiseGate) {
            this.logger("setting noise gate threshold to : " + newVal + " db");
            this.noiseGate.setThreshold(newVal);
        }
    }

    /**
     * Function that re-calculates the percentage of our 10 second Audio Buffer we have filled, based on number of bytes and bit rate
     * Updates our state.
     */
    calculateBufferUsed() {
        if (!this.audioBuffer) return;
        const len = this.audioBuffer.getData().length;
        const max = 10 * this.state.sampleRate;
        let percent = Math.floor((len / max) * 100);
        if (percent > 100) percent = 100;
        this.setState({ bufferUsed: percent });
    }

    /**
     * Function that handles the Sweepder timeout event
     * Sends the buffer with the firce flag set, bypassing size tests
     */
    sweeperTriggered() {
        this.logger("Sweeper function is sending what we have collected");
        this.send(true);
    }

    /**
     * Function that handles the Noise Gate closing event.
     * Toggles the talking flag, starts the sweep timer, updates the buffer display, sends the buffer
     */
    gateCloses() {
        //this.logger("Talking stopped");
        this.setState({ talking: false });
        this.sweeper.current.start();
        this.calculateBufferUsed();
        this.send(false);
    }

    /**
     * Function that handles the Noise Gate opening event.
     * Toggles the talking flag, stops the sweep timer, updates the buffer display
     */
    gateOpens() {
        //this.logger("Talking started");
        this.setState({ talking: true });
        this.sweeper.current.stop();
        this.calculateBufferUsed();
    }

    /**
     * Function that acts as the entry point for the sending of audio for processing
     * and sends these for inference
     * @param    {Bool} force  Flag to force processingof small buffers, set by the Sweeper timer
     */
    send(force) {
        // grab the current buffer data
        const resultBuffer = this.audioBuffer.getData();
        if (force || resultBuffer.length > 10 * this.state.sampleRate) {
            this.logger("Sending data");
            // create a new buffer
            this.audioBuffer.reset();
            this.sweeper.current.reset();
            this.calculateBufferUsed();
            // send what we captured for processing
            this.processBuffer(resultBuffer);
        } else {
            this.logger("Waiting for more data");
        }
    }

    /**
     * Function for setting up our app for audio capture.
     * Attaches our stream processors to the mic audio stream, captures the bit rate, and sets up the data handler
     */
    startTransmitting() {
        this.logger("Transmission started");
        if (this.state.transmitting) return;
        window.navigator.mediaDevices
            .getUserMedia({ video: false, audio: true })
            .then((stream) => {
                const myMic = new mic();

                let myScope = new Scope({ id: "myScope" });
                myScope.connectTo(stream);
                this.noiseGate = new NoiseGate({
                    noiseGateClosesCallback: this.gateCloses,
                    noiseGateOpensCallback: this.gateOpens,
                    thresholdDb: this.state.threshold,
                });
                this.noiseGate.connectTo(stream);

                myMic.setStream(stream);
                myMic.on("data", (chunk) => {
                    // only increase the buffer if we're talking, to save ram and performance
                    if (this.state.talking) {
                        const raw = mic.toRaw(chunk);
                        if (raw == null) {
                            return;
                        }
                        this.audioBuffer.addData(raw);
                    }
                });
                myMic.on("format", (data) => {
                    this.setState({ sampleRate: data.sampleRate });
                    this.logger(
                        "Sample rate detected as " + this.state.sampleRate
                    );
                });
                this.setTransmitting(true);
                this.setMicStream(myMic);
            });
    }

    /**
     * Function to clean up when we stop capturing audio. Tears the stream down and flushes the buffer if there is anything in it
     * and sends these for inference
     */
    async stopTransmitting() {
        this.logger("Stopping transmission");
        this.state.micStream.stop();
        this.setMicStream(null);
        this.setTransmitting(false);

        // anything left in the buffer to send??
        const resultBuffer = this.audioBuffer.getData();
        this.processBuffer(resultBuffer);
        this.logger("Transmission stopped");
    }

    /**
     * Function that
     *   checks our buffer has enough content to be worth transcribing
     *   sends it to Transcribe via the Amplify Predictions helper,
     *   explodes the transcription into speech fragments
     * and sends these for inference
     * @param    {Byte Array} bytes  The audio buffer as a native JSON byte array
     */
    processBuffer(bytes) {
        const payloadSize = bytes.length;
        this.logger("Buffer size : " + payloadSize);
        if (payloadSize < this.state.sampleRate) {
            this.logger("Buffer too small to be worth sending");
        } else {
            this.logger("Converting audio to text...");
            Predictions.convert({
                transcription: {
                    source: { bytes },
                },
            })
                .then(({ transcription: { fullText } }) => {
                    this.logger("transcription complete");
                    if (!fullText) {
                        this.setTranscript("No words detected");
                        return;
                    }
                    this.logger(fullText);
                    // explode into sentence parts on punctuation boundaries, and send for inference
                    const bits = fullText
                        .replace(/([.?!])\s*(?=[A-Z])/g, "$1|")
                        .split("|");
                    this.getPredictions(bits);
                })
                .catch((err) =>
                    this.logger(
                        "Transcribe error: " + JSON.stringify(err, null, 2)
                    )
                );
        }
    }

    /**
     * Function that orchestrates getting predictions from a list of sentences, and scoring them
     * @param    {String Array} list     Array of strings containing sentences or logical speech fragments
     */
    async getPredictions(list) {
        this.logger("Batch inference started");
        for (let item of list) {
            await new Promise((resolve) => {
                this.logger("Querying toxicity endpoint");
                let apiName = "myToxicityAPI";
                let path =
                    "?k=4&q=" +
                    encodeURIComponent(item.replace(/\r?\n|\r/g, " "));
                API.get(apiName, path, { Accept: "application/json" })
                    .then((response) => {
                        let toxicScore = 0;
                        let labels = response[0];
                        let values = response[1];
                        for (let x = 0; x < labels.length; x++) {
                            switch (labels[x]) {
                                case "__label__none":
                                    // skip none value
                                    break;
                                default:
                                    toxicScore += parseInt(values[x] * 100, 10);
                            }
                        }
                        this.setTranscript(
                            "[ " + toxicScore + "% ] ... '" + item + "'"
                        );
                        if (this.tsRef && this.tsRef.current) {
                            this.tsRef.current.processor.addData(toxicScore);
                        }
                    })
                    .catch((err) =>
                        this.logger(
                            "Inference error: " + JSON.stringify(err, null, 2)
                        )
                    );

                // add a slow down here to space the data for our time series
                setTimeout(function () {
                    resolve();
                }, 1500);
            });
        }
        this.logger("Batch inference completed");
    }

    /**
     * Function to render our UI
     */
    render() {
        let buttons = <div className="audioRecorder row2"></div>;
        let talkingText = this.state.talking ? "Yes" : "No";
        if (true || this.state.micStream) {
            buttons = (
                <div className="audioRecorder">
                    <div>
                        {this.state.transmitting && (
                            <button onClick={this.stopTransmitting}>
                                Stop capturing
                            </button>
                        )}
                        {!this.state.transmitting && (
                            <button onClick={this.startTransmitting}>
                                Start capturing
                            </button>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div>
                <div className="Container">
                    <div>
                        <div className="scopeContainer">
                            <div className="talkingPanel">
                                <span>Talking: {talkingText}</span>
                                <span>Sweep timer</span>
                                <span>
                                    <TimerProgress
                                        key="progTimer"
                                        size="30"
                                        triggered={this.sweeperTriggered}
                                        ref={this.sweeper}
                                    />
                                </span>
                                <span>Buffer used %</span>
                                <span>
                                    <Progress
                                        key="progBbuffer"
                                        value={this.state.bufferUsed}
                                    />
                                </span>
                            </div>
                            <div className="scopePanel">
                                <canvas
                                    id="myScope"
                                    width="600"
                                    height="250"></canvas>
                                <div className="thresholdPanel">
                                    <span>Noise gate threshold (db) :</span>
                                    <span>
                                        <StepInput
                                            min={-100}
                                            max={-31}
                                            value={this.state.threshold}
                                            step={1}
                                            onChange={this.noiseGateThresholdChange.bind(
                                                this
                                            )}
                                            className="stepInputSlider"
                                        />
                                    </span>
                                    <span className="rawThreshold">
                                        {this.state.threshold}
                                    </span>
                                </div>
                            </div>
                            <div className="logoPanel">
                                <span>&nbsp;</span>
                            </div>
                        </div>
                        <div className="infoPanel">
                            <div className="row3cols flexRow">
                                <div>Status</div>
                                <div>{buttons}</div>
                                <div>Transcript</div>
                            </div>

                            <div className="row3cols flexRow">
                                <div>
                                    <div id="status">
                                        <p>{this.state.status}</p>
                                    </div>
                                </div>
                                <div></div>
                                <div>
                                    <div id="transcript">
                                        <p>{this.state.transcript}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
