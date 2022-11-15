// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React from "react";

export default class Progress extends React.Component {
    /**
     * Static function that lets us select what props we want to comapre and accept
     * @param    {Object} props     The new props collection
     * @param    {Object} state     The current component state
     */
    static getDerivedStateFromProps(props, state) {
        if (state.value !== props.value) {
            return {
                value: props.value,
            };
        }
        return null;
    }

    /**
     * Constructor
     * @param    {Object} props  Our initial React object properties
     */
    constructor(props) {
        super(props);
        let display = props.display;
        if (display) {
            if (display.toLowerCase() === "false") {
                display = false;
            } else display = true;
        } else display = true;
        this.state = {
            value: props.value,
            display: display,
        };
    }

    /**
     * Function to render our UI
     */
    render() {
        const displayValue = this.state.display ? this.state.value + "%" : " ";
        const progressStyles = { width: `${this.state.value}%` };
        return (
            <div className="progressOuterContainer">
                <div className="progressInnerContainer" style={progressStyles}>
                    <span className="progressText">{displayValue}</span>
                </div>
            </div>
        );
    }
}
