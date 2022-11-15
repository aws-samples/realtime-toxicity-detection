// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/**
 * Class that implements a *very* simple noise gate, with no ADSR
 */
class NoiseGate {
    static Name = "NoiseGate";

    analyser = null;
    dataArray = [];
    delayMS = 500;
    thresholdDB = -60;
    timeStamp = 0;
    closed = false;
    audioCtx = null;
    noiseGateClosesCallback = null;
    noiseGateOpensCallback = null;

    /**
     * Constructor
     * @param    {Object} props  Our initial React object properties
     */
    constructor(props) {
        this.noiseGateClosesCallback = props.noiseGateClosesCallback;
        this.noiseGateOpensCallback = props.noiseGateOpensCallback;
        this.thresholdDB = props.thresholdDb;
    }

    /**
     * Function that sets out noise gatw trigger threshold
     * @param    {int} value  The value our noise gate toggles behaviour at
     */
    setThreshold(value) {
        this.thresholdDb = value;
        this.analyser.minDecibels = value;
    }

    /**
     * Function to format our log messages consistently
     * @param    {String} message  Our initial React object properties
     */
    logger(message) {
        console.log(NoiseGate.Name + " - " + message);
    }

    /**
     * Function that acts as a game loop. 60 FPS
     */
    loop() {
        const ticks = performance.now();
        requestAnimationFrame(this.loop.bind(this));
        // grab any new data in the time frame
        this.analyser.getByteFrequencyData(this.dataArray);
        // if there is data we are above the DB level, and need to handle it
        if (this.dataArray.some((v) => v)) {
            // if we were closed state previously, flip and emit the state change
            if (this.closed) {
                this.closed = false;
                this.noiseGateOpens();
            }
            // update the timestamp
            this.timeStamp = ticks;
        }
        // check if we should go back to being closed based on our delay time
        if (!this.closed && ticks - this.timeStamp > this.delayMS) {
            this.noiseGateCloses();
            this.closed = true;
        }
    }

    /**
     * Function to connect our noise gate to an audio stream
     * @param    {Stream} stream  Audio stream we will connect to
     */
    connectTo(stream) {
        this.logger("Connecting to stream...");
        this.audioCtx = new AudioContext();
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.minDecibels = this.thresholdDB;
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

        // start in closed mode
        this.timeStamp = performance.now();
        this.closed = true;

        this.audioCtx.createMediaStreamSource(stream).connect(this.analyser);
        this.loop();
    }

    /**
     * Function to handle the state change to closed, invoking out callback
     */
    noiseGateCloses() {
        this.logger("Noise Gate closes");
        if (null != this.noiseGateClosesCallback)
            this.noiseGateClosesCallback();
    }

    /**
     * Function to handle the state change to open, invoking out callback
     */
    noiseGateOpens() {
        this.logger("Noise Gate opens");
        if (null != this.noiseGateOpensCallback) this.noiseGateOpensCallback();
    }
}

/**
 * Class that implements a *very* simple oscilloscope
 */
class Scope {
    static Name = "Scope";

    analyser = null;
    bufferLength = 0;
    dataArray = [];
    canvas = null;
    canvasCtx = null;
    audioCtx = null;

    /**
     * Constructor
     * @param    {Object} props  Our initial React object properties
     */
    constructor(props) {
        // Get a canvas defined with ID from props
        this.canvas = document.getElementById(props.id);
        this.canvasCtx = this.canvas.getContext("2d");
    }

    /**
     * Function to format our log messages consistently
     * @param    {String} message  Our initial React object properties
     */
    logger(message) {
        console.log(Scope.Name + " - " + message);
    }

    /**
     * Function that acts as a game loop. 60 FPS
     */
    draw() {
        requestAnimationFrame(this.draw.bind(this));
        this.analyser.getByteTimeDomainData(this.dataArray);

        this.canvasCtx.fillStyle = "steelblue";
        this.canvasCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.canvasCtx.lineWidth = 2;
        this.canvasCtx.strokeStyle = "rgb(0, 0, 0)";
        this.canvasCtx.beginPath();

        const sliceWidth = (this.canvas.width * 1.0) / this.bufferLength;
        let x = 0;
        for (let i = 0; i < this.bufferLength; i++) {
            const v = this.dataArray[i] / 128.0;
            const y = (v * this.canvas.height) / 2;

            if (i === 0) {
                this.canvasCtx.moveTo(x, y);
            } else {
                this.canvasCtx.lineTo(x, y);
            }
            x += sliceWidth;
        }
        this.canvasCtx.lineTo(this.canvas.width, this.canvas.height / 2);
        this.canvasCtx.stroke();
    }

    /**
     * Function to connect our noise gate to an audio stream
     * @param    {Stream} stream  Audio stream we will connect to
     */
    connectTo(stream) {
        this.logger("Connecting to stream...");
        // do a one time setup of an analyser
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext ||
                window.webkitAudioContext)();
            this.analyser = this.audioCtx.createAnalyser();
            this.analyser.fftSize = 2048;
            this.bufferLength = this.analyser.frequencyBinCount;
        }
        // add a buffer
        this.dataArray = new Uint8Array(this.bufferLength);
        this.analyser.getByteTimeDomainData(this.dataArray);
        // connect to the stream
        this.audioCtx.createMediaStreamSource(stream).connect(this.analyser);
        // kick off the render loop
        this.draw();
    }
}

export { Scope, NoiseGate };
