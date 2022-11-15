# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

import os
import boto3
import json

# grab environment variables
ENDPOINT_NAME = os.environ['ENDPOINT_NAME']
runtime = boto3.client('runtime.sagemaker')


def lambda_handler(event, context):
    # print("Received event: " + json.dumps(event, indent = 2))
    try:
        data = json.loads(json.dumps(event))
        # k = number of categories to return, defaulted to 2
        # q = the string to make the inference on, required
        qs = data['queryStringParameters']
        q = qs['q']
        # update k only if set, or take the default of 2
        k = 2
        if ('k' in qs):
            k = qs['k']

        # the format that fastText expects our request to be in
        # https://docs.aws.amazon.com/sagemaker/latest/dg/blazingtext.html
        template = {
            "instances": [q],
            "configuration": {"k": k}
        }

        payload = json.dumps(template)
        content = 'application/json'
        response = runtime.invoke_endpoint(
            EndpointName=ENDPOINT_NAME,
            ContentType=content,
            Body=payload
        )
        
        body = json.loads(response['Body'].read().decode("utf-8"))
        
        labels = body[0][0]
        values = body[1][0]
        
        print("split results = ", labels, values)
        #return json.loads(labels, values)
        return labels, values
        #result = response['Body'].read().decode()
        #return json.loads(result)
    except Exception as err:
        print(err)
        return 400
