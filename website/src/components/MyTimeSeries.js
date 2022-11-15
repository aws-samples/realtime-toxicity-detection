// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React from "react";
import SmoothieComponent, { TimeSeries } from "react-smoothie";
import percentile from "stats-percentile";

/**
 * Class to calculate the percentiles on a raw time series data stream
 */
class MyTimeSeriesProcessor {
    // public fields initializer
    /*
    tsInference;
    tsP75;
    tsP90;
*/
    /**
     * Constructor
     * @param    {Int} maxLength  Number of data points to keep for sliding window
     */
    constructor(maxLength = 30) {
        this.rawData = [];
        this.maxBufferLength = maxLength;
        this.tsInference = new TimeSeries({
            resetBounds: false,
            tooltipLabel: "Inference",
        });
        this.tsP75 = new TimeSeries({
            resetBounds: false,
            tooltipLabel: "75th Percentile",
        });
        this.tsP90 = new TimeSeries({
            resetBounds: false,
            tooltipLabel: "90th Percentile",
        });
        this.addData = this.addData.bind(this);
    }

    /**
     * Function to handle the addition of a new data point.
     * Adds a timestamp, and calculates the p90 and p75
     * @param    {int} data  A single integer based data point
     */
    addData(data) {
        this.rawData.push(data);
        var time = new Date().getTime();

        this.tsInference.append(time, data);
        const bufferItems = this.rawData.length;
        if (bufferItems > this.maxBufferLength) {
            console.log(
                "truncating percentile buffer to most recent " +
                    this.maxBufferLength
            );
            this.rawData = this.rawData.slice(
                bufferItems - this.maxBufferLength
            );
            console.log("percentile buffer is now " + this.rawData.length);
        }
        this.tsP75.append(time, percentile(this.rawData, 75));
        this.tsP90.append(time, percentile(this.rawData, 90));
    }
}

/**
 * Class to implement a custom TimeSeries graph, based on smoothie and react-smoothie
 */

export default class MyTimeSeries extends React.Component {
    static Name = "MyTimeSeries";
    processor;

    /**
     * Constructor
     * @param    {Object} props  Our initial React object properties
     */
    constructor(props) {
        super(props);
        this.props = props;
        this.processor = new MyTimeSeriesProcessor();
    }

    /**
     * Function to draw our UI.
     * - Sets up the smoothie graph props,
     * - binds the time series processor data streams
     */
    render() {
        return (
            <div className="MyTimeSeriesContainer">
                <div className="Legend">
                    <div className="row">
                        <div className="toxicityScore"></div>
                        <div className="value">Toxicity %</div>
                    </div>
                    <div className="row">
                        <div className="p90Score"></div>
                        <div className="value">p90 %</div>
                    </div>
                    <div className="row">
                        <div className="p75Score"></div>
                        <div className="value">p75 %</div>
                    </div>
                </div>
                <SmoothieComponent
                    title={{ text: this.props.title }}
                    minValue={0}
                    maxValue={100}
                    height={250}
                    width={800}
                    responsive
                    millisPerPixel={60}
                    series={[
                        {
                            data: this.processor.tsInference,
                            strokeStyle: { g: 255 },
                            fillStyle: { g: 255 },
                            lineWidth: 4,
                        },
                        {
                            data: this.processor.tsP90,
                            strokeStyle: { r: 255 },
                            fillStyle: { r: 255 },
                            lineWidth: 4,
                        },
                        {
                            data: this.processor.tsP75,
                            strokeStyle: { r: 100, b: 155 },
                            lineWidth: 4,
                        },
                    ]}
                />
            </div>
        );
    }
}
