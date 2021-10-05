var test = require('tape');
var async = require('async');
var app = require('../offline');

const make_bot = (t, cb, pattern, desc) => ({
    identity: {id: 'bot'},
    reply: (_, msg) => {
        if (msg.startsWith(pattern)) {
            t.ok(true, desc);
            cb();
        } else {
            t.fail(msg);
            t.end();
            process.exit();
        }
    }
});

const add = {text: '<@bot> add resource_type rsc', type: 'message', channel: 'bot', user: 'me'};
const list = {text: '<@bot> list', type: 'message', channel: 'bot'};
const claim = {text: '<@bot> claim rsc for 1 hour', type: 'message', channel: 'bot', user: 'me'};
const release = {text: '<@bot> release rsc', type: 'message', channel: 'bot', user: 'me'};

test('resource_type is preserved across actions', function (t) {
    let bot;
    async.waterfall([
        cb => {
            bot = make_bot(t, cb, "Great", "add a new resource");
            app.controller.events['message_received'][0](bot, add);
        },
        cb => {
            bot = make_bot(t, cb, "Got it", "claim an existing resource");
            app.controller.events['message_received'][0](bot, claim);
        },
        cb => {
            bot = make_bot(t, cb, "Got it", "release a claimed resource");
            app.controller.events['message_received'][0](bot, release);
        },
        cb => {
            bot = make_bot(t, cb, "Resources:```resource_type", "list resources");
            app.controller.events['message_received'][0](bot, list);
        },
    ], (err, res) => {
        t.end();
        process.exit();
    });
})
