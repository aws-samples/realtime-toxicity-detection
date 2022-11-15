// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { render, screen } from '@testing-library/react';
import MyTimeSeries from "../components/MyTimeSeries.js";

test('MyTimeSeries renders without crashing', () => {
    const { container } = render(<MyTimeSeries name="myToxicityGraph" title="Detecting Toxicity in near real time" />);
    expect(container).not.toBeNull();
});

test('raw buffer test', () => {
    let ts = new MyTimeSeries();
    ts.processor.addData(15);
    expect(15).toBe(ts.processor.rawData[0]);
});
