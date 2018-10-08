"use strict";
exports.__esModule = true;
var Botkit = require('botkit');
var node_fetch_1 = require("node-fetch");
if (!process.env.token || !process.env.wolfram || !process.env.lista) {
    console.log('Error: Token or API Key missing!');
    process.exit(1);
}
console.log(process.env.token);
console.log(process.env.wolfram);
console.log(process.env.lista);
var wolframApiKey = process.env.wolfram;
var kursnaListaApiKey = process.env.lista;
var controller = Botkit.slackbot({
    debug: true
});
var bot = controller.spawn({
    token: process.env.token
}).startRTM();
controller.hears(['schedule'], 'direct_message', function (bot, message) {
    controller.storage.users.get(message.user, function (err, user) {
        if (user && user["answer1"] && user["answer2"] && user["answer3"] && user["answer4"]) {
            var message_to_send = 'Your daily activity plan is:\n';
            if (user["answer1"] != 'nothing')
                message_to_send += '9-12h: ' + user["answer1"] + '\n';
            if (user["answer2"] != 'nothing')
                message_to_send += '12-15h: ' + user["answer2"] + '\n';
            if (user["answer3"] != 'nothing')
                message_to_send += '15-18h: ' + user["answer3"] + '\n';
            if (user["answer4"] != 'nothing')
                message_to_send += '18-21h: ' + user["answer4"] + '\n';
            bot.reply(message, message_to_send);
        }
        else {
            bot.reply(message, 'Hi. I need some informations about your daily activity...');
            bot.startConversation(message, function (err, convo) {
                convo.ask('What are you doing between 9-12h?', function (response, convo) {
                    convo.next();
                }, { 'key': 'answer1' });
                convo.ask('What are you doing between 12-15h?', function (response, convo) {
                    convo.next();
                }, { 'key': 'answer2' });
                convo.ask('What are you doing between 15-18h?', function (response, convo) {
                    convo.next();
                }, { 'key': 'answer3' });
                convo.ask('What are you doing between 18-21h?', function (response, convo) {
                    convo.next();
                }, { 'key': 'answer4' });
                convo.on('end', function (convo) {
                    controller.storage.users.get(message.user, function (err, user) {
                        if (!user) {
                            user = {
                                id: message.user
                            };
                        }
                        user["answer1"] = convo.extractResponse('answer1'),
                            user["answer2"] = convo.extractResponse('answer2'),
                            user["answer3"] = convo.extractResponse('answer3'),
                            user["answer4"] = convo.extractResponse('answer4'),
                            controller.storage.users.save(user, function (err, id) {
                                var message_to_send = 'Your daily activity plan is: \n';
                                if (user["answer1"] != 'nothing')
                                    message_to_send += '9-12h: ' + user["answer1"] + ' \n';
                                if (user["answer2"] != 'nothing')
                                    message_to_send += '12-15h: ' + user["answer2"] + ' \n';
                                if (user["answer3"] != 'nothing')
                                    message_to_send += '15-18h: ' + user["answer3"] + ' \n';
                                if (user["answer4"] != 'nothing')
                                    message_to_send += '18-21h: ' + user["answer4"] + ' \n';
                                bot.reply(message, message_to_send);
                            });
                    });
                });
            });
        }
    });
});
controller.hears(['find (.*) using wolframalfa'], 'direct_message', function (bot, message) {
    var match = message.match[1];
    var found = false;
    var url = 'https://api.wolframalpha.com/v1/result?i=' + encodeURIComponent(match) + '&appid=' + encodeURIComponent(wolframApiKey);
    var fetchNow = function () {
        bot.reply(message, "Please wait while we are looking for results!");
        node_fetch_1["default"](url)
            .then(function (response) {
            return (response.status === 200) ? response.text() : null;
        })
            .then(function (response) {
            if (response !== null) {
                bot.startConversation(message, function (err, convo) {
                    found = true;
                    convo.say(response);
                });
            }
            else {
                bot.startConversation(message, function (err, convo) {
                    convo.say("Sorry! We didn't find anything!");
                    convo.ask('Do you want to try another query?', [
                        {
                            pattern: 'yes',
                            callback: function (response, convo) {
                                convo.next();
                            }
                        },
                        {
                            pattern: 'no',
                            callback: function (response, convo) {
                                convo.stop();
                            }
                        },
                        {
                            "default": true,
                            callback: function (response, convo) {
                                convo.stop();
                            }
                        }
                    ]);
                    convo.ask('What is new query?', function (response, convo) {
                        convo.next();
                    }, { 'key': 'new_query' });
                    convo.on('end', function (convo) {
                        if (convo.status == 'completed' && found == false) {
                            var new_query = convo.extractResponse('new_query');
                            url = 'https://api.wolframalpha.com/v1/result?i=' + encodeURIComponent(new_query) + '&appid=' + encodeURIComponent(wolframApiKey);
                            fetchNow();
                        }
                    });
                });
            }
        });
    };
    fetchNow();
});
controller.hears(['convert'], 'direct_message', function (bot, message) {
    bot.startConversation(message, function (err, convo) {
        convo.ask('From which currency?', function (response, convo) {
            convo.next();
        }, { 'key': 'from' });
        convo.ask('To which currency?', function (response, convo) {
            convo.next();
        }, { 'key': 'to' });
        convo.ask('How much do you want to convert?', function (response, convo) {
            convo.next();
        }, { 'key': 'howmuch' });
        convo.ask('On which date? dd.mm.gggg', function (response, convo) {
            convo.next();
        }, { 'key': 'date' });
        convo.on('end', function (convo) {
            if (convo.status == 'completed') {
                var from = convo.extractResponse('from');
                var to = convo.extractResponse('to');
                var howmuch = convo.extractResponse('howmuch');
                var date = convo.extractResponse('date');
                var url = 'https://api.kursna-lista.info/' + encodeURIComponent(kursnaListaApiKey) + '/konvertor/' + encodeURIComponent(from) + '/' + encodeURIComponent(to) + '/' + encodeURIComponent(howmuch) + '/' + encodeURIComponent(date);
                node_fetch_1["default"](url)
                    .then(function (response) {
                    return response.json();
                })
                    .then(function (json) {
                    if (json['code'] == 0) {
                        bot.reply(message, howmuch + " " + from + " = " + json['result']['value'] + " " + to);
                    }
                    else {
                        bot.reply(message, "Something went wrong: " + json['code'] + " - " + json['msg']);
                    }
                });
            }
        });
    });
});
