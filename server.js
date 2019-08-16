const express = require('express');
const path = require('path');
const http = require('http');
const fs = require('fs');
const Helper = require('./server/helper');
const bodyParser = require("body-parser");
const io = require("socket.io");


const cardService = new Helper();

const app = express();

app.use((req, res, next) => {
    if (req.header('Authorization')) {
        next();        
    } else {
        res.statusCode = 403;
        res.send('None shall pass');
    }
});

app.use( bodyParser.json() );  

// app.post('/newUser', (req, res) => {
//     if (!req.body) {
//         res.statusCode = 400;
//         return res.send('None shall pass');
//     }
//     cardService.addNewUsers(req.body.user);
//     res.json('{Good: boy}');
// });

app.get('/get-pull', () => {

})

const port = '4500';
app.set('port', port);

const server = http.createServer(app);

const ios = io.listen(server);
const socketHelper = (socket, id, userId, item) => {
    cardService.userMove();
    if (item.elm) {
        cardService.addCards(item.elm, userId);
    }
    ios.to(id).emit('add', {
        cards: cardService.cards(userId),
        hand: cardService.hand(userId)
    });
    socket.to('new room').emit('enemy', cardService.cards(userId));
    ios.in('new room').emit('currentUser', cardService.usersTurn);
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
        ios.in('new room').emit('currentUser', cardService.usersTurn);
    });
    socket.on('addSpecial', item => {
        
        cardService.addCards(item.elm, item.user);
        ios.to(socket.id).emit('add', {
            cards: cardService.cards(item.user),
            hand: cardService.hand(item.user)
        });
        cardService.userMove();
        ios.in('new room').emit('currentUser', cardService.usersTurn);
        socket.to('new room').emit('enemy', cardService.cards(item.user));
    });
    socket.on('add', item => {
        if (cardService.usersTurn.value !== socket.nickname) return;

        if (item.elm.nonPlayer && item.elm.cardName === "weather") {
            ios.of('/').in('new room').clients((error,clients) => {
                clients.forEach(ele => {
                    const user = ios.sockets.connected[ele].nickname;
                    socketHelper(ios.sockets.connected[ele], ele, user, item);
                })
            });
        } else {
            socketHelper(socket, socket.id, item.user, item);
        }
        
    })
});

server.listen(port, () => console.log(`API running on localhost:${port}`));
