#!/bin/bash

BACKEND_URI=(
    "https://madgearapi.onrender.com/api/v1/users/heartbeat/"
    "https://secure-android.onrender.com/api/v1/users/heartbeat/"
)

generate_sequence_number() {
    local len=$1
    local alphaNum="0123456789ABCDEFGHJKLMNOPQRSTUVWXYZ-"
    local sequenceNumber=""

    for ((i = 0; i < len; i++)); do
        randomIndex=$(( RANDOM % ${#alphaNum} ))
        sequenceNumber+="${alphaNum:randomIndex:1}"
    done

    echo "$sequenceNumber"
}

ping_single_server() {
    local url=$1
    local label=$2
    local seq=$3

    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    echo -e "[\e[34m$timestamp\e[0m] Heart_Beat[\e[36m$seq\e[0m] to \e[35m$label\e[0m: SENT"

    local response=$(curl -s -X GET "${url}${seq}")
    local status=$(echo "$response" | grep -o '"status":"[^"]*' | cut -d'"' -f4)

    [[ -z "$status" ]] && status="FAILED"
    local r_timestamp=$(date +"%Y-%m-%d %H:%M:%S")

    if [[ "$status" == "OK" ]]; then
        echo -e "[\e[34m$r_timestamp\e[0m] Heart_Beat[\e[36m$seq\e[0m] to \e[35m$label\e[0m: \e[32mSTATUS: OK\e[0m"
    else
        echo -e "[\e[34m$r_timestamp\e[0m] Heart_Beat[\e[36m$seq\e[0m] to \e[35m$label\e[0m: \e[31mSTATUS: FAILED\e[0m"
        echo -ne "\a"
    fi
}

pingServer() {
    SEQUENCE_NUMBER=$(generate_sequence_number 8)

    for i in "${!BACKEND_URI[@]}"; do
        label="Service $((i + 1))"
        ping_single_server "${BACKEND_URI[$i]}" "$label" "$SEQUENCE_NUMBER" &
    done

    wait  # Wait for all background jobs to finish
}

progress_bar() {
    local total=$1
    local interval=1
    local elapsed=0
    local width=30

    tput civis 2>/dev/null

    while [ $elapsed -lt $total ]; do
        local remaining=$((total - elapsed))
        local minutes=$(printf "%02d" $((remaining / 60)))
        local seconds=$(printf "%02d" $((remaining % 60)))

        local filled=$(( (elapsed * width) / total ))
        local blinking_index=$((filled + 1))
        local bar=""

        for ((i = 1; i <= width; i++)); do
            if [[ $i -le $filled ]]; then
                bar+="\e[42m \e[0m"
            elif [[ $i -eq $blinking_index ]]; then
                if ((elapsed % 2 == 0)); then
                    bar+="\e[102m \e[0m"
                else
                    bar+=" "
                fi
            else
                bar+=" "
            fi
        done

        echo -ne "\rNext heartbeat in \e[1;33m${minutes}:${seconds}\e[0m ${bar}"
        sleep $interval
        ((elapsed += interval))
    done

    echo -ne "\r\033[K"
    tput cnorm 2>/dev/null
}

# Main Loop
while true; do
    pingServer
    progress_bar 600
done
