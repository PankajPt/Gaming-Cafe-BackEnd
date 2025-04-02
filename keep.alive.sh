#!/bin/bash

BACKEND_URI="https://madgearapi.onrender.com/api/v1/users/heartbeat/"

generate_sequence_number() {
    local len=$1
    local alphaNum="0123456789ABCDEFGHJKLMNOPQRSTUVWXYZ"
    local sequenceNumber=""

    for ((i = 0; i < len; i++)); do
        randomIndex=$(( RANDOM % ${#alphaNum} ))
        sequenceNumber+="${alphaNum:randomIndex:1}"
    done

    echo "$sequenceNumber"
}

pingServer() {
    SEQUENCE_NUMBER=$(generate_sequence_number 8)
    TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

    echo -e "[\e[34m$TIMESTAMP\e[0m] Heart_Beat[\e[36m$SEQUENCE_NUMBER\e[0m]: SENT"

    RESPONSE=$(curl -s -X GET "${BACKEND_URI}${SEQUENCE_NUMBER}")
    STATUS=$(echo "$RESPONSE" | grep -o '"status":"[^"]*' | cut -d'"' -f4)

    if [[ -z "$STATUS" ]]; then
        STATUS="FAILED"
    fi

    # Print status with color
    if [[ "$STATUS" == "OK" ]]; then
		R_TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
        echo -e "[\e[34m$R_TIMESTAMP\e[0m] Heart_Beat[\e[36m$SEQUENCE_NUMBER\e[0m]: \e[32mSTATUS: OK\e[0m"
    else
		R_TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
        echo -e "[\e[34m$R_TIMESTAMP\e[0m] Heart_Beat[\e[36m$SEQUENCE_NUMBER\e[0m]: \e[31mSTATUS: FAILED\e[0m"
    fi
}

while true; do
    pingServer
    sleep 600
done
