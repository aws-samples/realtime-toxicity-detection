// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React from "react";
import Progress from "./Progress.js";

export default class TimerProgress extends React.Component {
    /**
     * Constructor
     * @param    {Object} props  Our initial React object properties
     */
    constructor(props) {
        super(props);
        this.state = {
            ticks: 0,
            value: 0,
        };
        this.timer = 0;
        this.tick = this.tick.bind(this);
    }

    /**
     * Function to  check if our timer has hit its trigger level, and raise an event if it has
     */
    tick() {
        this.setState({ ticks: this.state.ticks + 1 });
        if (this.state.ticks > this.props.size) {
            this.reset();
            this.props.triggered();
        }
        this.calculatePercent();
    }

    /**
     * Function to handle our start event, creating a new 1 second callback timer
     */
    start() {
        if (!this.timer) {
            this.timer = setInterval(this.tick, 1000);
        }
    }

    /**
     * Function to handle our stop event─ clears the timer and resets it
     */
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = 0;
        }
    }

    /**
     * Function to reset our internal tick count
     */
    reset() {
        this.setState({ ticks: 0 });
    }

    /**
     * Function to update our percentage of progress to the timeout stage
     */
    calculatePercent() {
        let percent = parseInt((this.state.ticks / this.props.size) * 100);
        this.setState({ value: percent });
    }

    /**
     * Function to render our UI
     */
    render() {
        return (
            <Progress key={this.key} display="False" value={this.state.value} />
        );
    }
}
