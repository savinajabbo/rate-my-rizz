#!/bin/bash

# Start the ethnicity detection API server

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies if needed
if [ ! -f "venv/.installed" ]; then
    echo "Installing dependencies (this may take a few minutes)..."
    pip install -r requirements.txt
    touch venv/.installed
fi

# Set environment variables
export PORT=${PORT:-5001}
export FLASK_ENV=development

# Run the API
echo "Starting ethnicity detection API on port $PORT..."
python app.py

