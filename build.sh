#!/bin/bash
echo "Building service: $RENDER_SERVICE_NAME"

# Skip build for worker service
if [[ "$RENDER_SERVICE_NAME" == "my-worker-service" ]]; then
    echo "Skipping build for worker service..."
    exit 0 
fi

echo "Running build for web service..."
npm install
