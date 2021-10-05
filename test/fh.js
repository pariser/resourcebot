var test = require('tape')
var app = require('../offline');

test('add', function (t) {
    const bot = {identity: {id: 'bot'}};
    const message = {text: '<@bot> add resource_type resource_name', type: 'message', channel: 'bot'};
    app.controller.events['message_received'][0](bot, message)
})
