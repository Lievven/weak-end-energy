const express = require('express');
const { version } = require('os');
const app = express();
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.resolve(__dirname, "data/constants.db");
const conDb = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, err => {
    if (err) console.error("Error while opeining database: " + err)
});

var conGeneral = {
    numTurns: 12,
    startEnergy: 10,
    numCardsOnHand: 4,
    maxPlayers: 1
}

var constants = {};

conDb.all("SELECT * FROM cards", (err, rows) => {

    var allCards = rows;
    conDb.all("SELECT * FROM cardEffects", (err, rows) => {

        var allCardEffects = rows;

        allCards.forEach(card => {
            card.effects = allCardEffects.filter((e) => e.cardName == card.name);
        });

        constants.cards = allCards;
    });
});

const sessions = [];

app.get("/poll", (req, res) => {
    var user = req.query.user
    //var session = GetOrCreateSession();

    var dummyState = {
        turnIndex: 0,
        phaseIndex: 0,
        players: [
            GenerateRandomPlayer(0, 1 + 0 * conGeneral.numCardsOnHand),
            GenerateRandomPlayer(1, 1 + 1 * conGeneral.numCardsOnHand),
            GenerateRandomPlayer(2, 1 + 2 * conGeneral.numCardsOnHand),
            GenerateRandomPlayer(3, 1 + 3 * conGeneral.numCardsOnHand),
        ],
        completedGroupTasks : 0,
        ended : false,
        version : 1,
        cardStack: [
            GenerateRandomCard(1 + 4* conGeneral.numCardsOnHand)
        ]
    }

    res.send(JSON.stringify(dummyState));
});

app.use((req, res) => {
    console.log("Receive unhandled" + req.method + " at url:" + JSON.stringify(req.url) + " query:" + JSON.stringify(req.query))
});

var port = process.env.port || 8081;

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
    console.log('Press Ctrl+C to quit.');
});

function GenerateRandomCard(cardId) {
    var cardInstance = structuredClone(constants.cards[0]);
    cardInstance.id = cardId
    return cardInstance;
}

function GenerateRandomPlayer(number, cardId) {
    var playerCards = [];
    for (let index = 0; index < conGeneral.numCardsOnHand; index++) {
        playerCards.push(GenerateRandomCard(cardId));
        cardId+=1
    }

    return {
        name: "Player" + number,
        energy: conGeneral.startEnergy,
        hand: playerCards,
        lastDiceResult: 0,
        lastCardIdSelected: null,
        completedPersonalTasks: 0,
        stagedCard : null,
        joinDate : Date.now()
    }
}