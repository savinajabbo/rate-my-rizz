#!/bin/bash
# Build script for Render - Forces Python 3.11

# Install Python 3.11 if not available
if ! command -v python3.11 &> /dev/null; then
    echo "Python 3.11 not found, using available Python version"
    PYTHON_CMD=python3
else
    PYTHON_CMD=python3.11
fi

# Upgrade pip and install dependencies
$PYTHON_CMD -m pip install --upgrade pip setuptools wheel
$PYTHON_CMD -m pip install -r requirements.txt

