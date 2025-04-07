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

    R_TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
    if [[ "$STATUS" == "OK" ]]; then
        echo -e "[\e[34m$R_TIMESTAMP\e[0m] Heart_Beat[\e[36m$SEQUENCE_NUMBER\e[0m]: \e[32mSTATUS: OK\e[0m"
    else
        echo -e "[\e[34m$R_TIMESTAMP\e[0m] Heart_Beat[\e[36m$SEQUENCE_NUMBER\e[0m]: \e[31mSTATUS: FAILED\e[0m"
    fi
}

progress_bar() {
    local total=$1
    local interval=1
    local elapsed=0
    local width=30

    # Hide the cursor
    tput civis

    while [ $elapsed -le $total ]; do
        percent=$(( (elapsed * 100) / total ))
        filled=$(( (elapsed * width) / total ))
        unfilled=$(( width - filled ))

        bar="\e[42m$(printf ' %.0s' $(seq 1 $filled))\e[0m$(printf ' %.0s' $(seq 1 $unfilled))"
        printf "\r[\e[1;32m%3d%%\e[0m] $bar" "$percent"

        sleep $interval
        ((elapsed+=interval))
    done

    # Clear line and restore cursor
    echo -ne "\r\033[K"
    tput cnorm
}


# Main Loop
while true; do
    pingServer
    progress_bar 600
done
