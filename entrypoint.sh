#!/bin/bash
set -e

if [ "$1" = 'resourcebot' ]; then
    /usr/bin/mongod &
    sleep 10
    echo "SLACK_TOKEN=${SLACK_TOKEN}" > .env
    echo "MONGO_URI=127.0.0.1" >> .env
    /usr/local/bin/node bot.js
fi

exec "$@"
