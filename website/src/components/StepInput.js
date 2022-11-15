// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React from "react";

export default class StepInput extends React.Component {
    /**
     * Constructor
     * @param    {Object} props  Our initial React object properties
     */
    constructor(props) {
        super(props);
        this.state = {
            mouseDown: false,
            dragging: false,
        };
        // set up our handlers
        this.onInput = this.onInput.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
    }

    /**
     * Function to render our UI
     */
    render() {
        return (
            <input
                type="range"
                className={this.props.className}
                min={this.props.min}
                max={this.props.max}
                step={this.props.step}
                value={this.props.value}
                onChange={this.props.onChange}
                onMouseDown={this.onMouseDown}
                onMouseUp={this.onMouseUp}
                onMouseMove={this.onMouseMove}
                onClick={this.onClick}
                onInput={this.onInput}
            />
        );
    }

    /**
     * Function to handle our mouse down event, updating mouse down state
     */
    onMouseDown() {
        this.setState({ mouseDown: true });
    }

    /**
     * Function to handle our mouse up event, updating dragginf and down states
     */
    onMouseUp() {
        this.setState({
            mouseDown: false,
            dragging: false,
        });
    }

    /**
     * Function to handle our mouse move event, checks mouse down value and sets dragging if true
     */
    onMouseMove() {
        if (this.state.mouseDown) {
            this.setState({ dragging: true });
        }
    }

    /**
     * Function to handle our input event, with a guard to only emit the new value when we've finished dragging
     * @param    {Object} e  Our input object event source
     */
    onInput(e) {
        const oldVal = this.props.value;
        // check if we are dragging or not, so we don't send a flood of events
        if (!(this.state.mouseDown && this.state.dragging) && oldVal) {
            const step = parseInt(e.target.step, 10) || 0;
            const newVal = parseInt(e.target.value, 10) || 0;
            e.target.value = newVal > oldVal ? oldVal + step : oldVal - step;
        }
    }
}
