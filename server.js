const express = require('express');
const path = require('path');
const http = require('http');
const Helper = require('./server/helper');
const fs = require('fs');
const bodyParser = require("body-parser");
const pull = require('./db/pull.json');
const io = require("socket.io");
const json = require('./db/field.json')


const cardService = new Helper();

const app = express();

app.use((req, res, next) => {
    console.log(req.url);
    if (req.header('Authorization')) {
        next();        
    } else {
        res.statusCode = 403;
        res.send('None shall pass');
    }
});

app.use( bodyParser.json() );  

app.post('/get-all', (req, res) => {
    if (!req.body) {
        res.statusCode = 400;
        return res.send('None shall pass');
    }
    res.json(pull[req.body.user]);
});

app.post('/save-hand', (req, res) => {
    if (!req.body) {
        res.statusCode = 400;
        return res.send('None shall pass');
    }
    json[req.body.user].gamePull = req.body.pull
    fs.writeFile('./db/field.json', JSON.stringify(json), (err) => {
        console.log(err);
    });
    res.send('done');
})

const port = '4500';
app.set('port', port);

const server = http.createServer(app);

const ios = io.listen(server);
const socketHelper = (socket, id, userId, item) => {
    if (item.elm) {
        cardService.addCards(item.elm, userId);
    }
    ios.to(id).emit('add', {
        cards: cardService.cards(userId),
        hand: cardService.hand(userId)
    });
    socket.to('new room').emit('enemy', cardService.cards(userId));
}

ios.sockets.on('connection', (socket) => {
    console.log('new connection');

    socket.on('user', (message) => {
        if (!cardService.cards(message.user)) {
            cardService.addNewUsers(message.user, socket.id);
        }
        socket.nickname = message.user;
        socket.join('new room');
        ios.to(socket.id).emit('add', {
            cards: cardService.cards(message.user),
            hand: cardService.hand(message.user)
        });
    });
    socket.on('addSpecial', item => {
        cardService.addCards(item.elm, item.user);
        ios.to(socket.id).emit('add', {
            cards: cardService.cards(item.user),
            hand: cardService.hand(item.user)
        });
        socket.to('new room').emit('enemy', cardService.cards(item.user));
    });
    socket.on('add', item => {
        if (cardService.usersTurn.value === socket.nickname) return;

        if (item.elm.nonPlayer) {
            ios.of('/').in('new room').clients((error,clients) => {
                clients.forEach(ele => {
                    const user = ios.sockets.connected[ele].nickname;
                    socketHelper(ios.sockets.connected[ele], ele, user, item);
                })
            });
        } else {
            socketHelper(socket, socket.id, item.user, item);
        }
        cardService.userMove()
    })
});

server.listen(port, () => console.log(`API running on localhost:${port}`));