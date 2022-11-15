// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import TimerProgress from '../../src/components/TimerProgress.js';

test('progress test', () => {
    let tp = new TimerProgress( { "size": 50 } );
    tp.start();
    console.log(tp.state.value)
    expect(0).toBe(tp.state.value);
});

