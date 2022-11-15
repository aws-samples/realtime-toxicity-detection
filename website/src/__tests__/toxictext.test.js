// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { render, screen } from '@testing-library/react';
import ToxicText from "../components/ToxicText.js";

test('ToxicText renders without crashing', () => {
    const { container } = render(<ToxicText />);
    expect(container).not.toBeNull();
});
