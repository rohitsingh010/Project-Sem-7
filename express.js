const express = require('express');
const app = express();
const axios = require('axios');
const CryptoJS = require('crypto-js');
const AES = CryptoJS.AES;
const enc = CryptoJS.enc;

const Participant = require('./src/participant');
const Liner = require('./liner');

var Shuaib = new Participant('Shuaib'),
    Rohit = new Participant('Rohit');

var participants = {
    Shuaib: Shuaib,
    Rohit: Rohit
}

console.log("Shuaib public: " + participants.Shuaib.keyPair.public);
console.log("Shuaib private: " + participants.Shuaib.keyPair.private);
console.log("Rohit public: " + participants.Rohit.keyPair.public);
console.log("Rohit private: " + participants.Rohit.keyPair.private);

app.get('/send-public-key/:from/:to', function(req, res) {
    sender = participants[req.params.from];
    receiver = participants[req.params.to];
    receiver.receivedKey = sender.keyPair.public;
    receiver.generateSecret();

    var liner = new Liner;
    liner.add(receiver.name + " has received a public key: " + receiver.receivedKey);
    liner.add(receiver.name + " has generated a secret password: " + receiver.secret);
    console.log(liner.get());

    res.send(liner.get());
});

app.get('/send-message/:from/:to/:message', function(req, res) {
    sender = participants[req.params.from];
    receiver = participants[req.params.to];
    message = req.params.message;
    encryptedMessage = AES.encrypt(message, sender.secret.toString());

    receiver.receiveMessage(encryptedMessage);

    let liner = new Liner;
    liner.add("Message to " + receiver.name + " has been delivered: " + message);
    liner.add("Message to " + receiver.name + " has been encrypted: " + encryptedMessage);
    console.log(liner.get());

    res.send(liner.get());
});

app.get('/inbox/:whose', function(req, res) {
    owner = participants[req.params.whose];
    encryptedInbox = owner.inbox;
    decryptedInbox = encryptedInbox.map(function(message) {
        return AES.decrypt(message, owner.secret.toString()).toString(enc.Utf8);
    });

    let liner = new Liner;
    liner.add(owner.name + "'s inbox is looking like this:");
    liner.add(decryptedInbox.join('\n'));
    console.log(liner.get());

    res.send(liner.get());
});

const port = 3002;

app.listen(port, function() {
    console.log('listening ' + port);

    axios.defaults.baseURL = 'http://localhost:' + port;
    axios.get('/send-public-key/Shuaib/Rohit');
    axios.get('/send-public-key/Rohit/Shuaib');
    axios.get('/send-message/Rohit/Shuaib/kya_haal_bhai');
    axios.get('/send-message/Shuaib/Rohit/badiya');

    axios.get('/inbox/Shuaib');
    axios.get('/inbox/Rohit');
});