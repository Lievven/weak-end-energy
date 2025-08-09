const express = require('express');
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
    maxPlayers: 4,
    groupTasksCompletionTarget: 8,
    numMaxSessions: 10,
}
conGeneral.cardStackSize = conGeneral.numTurns * conGeneral.maxPlayers + conGeneral.numCardsOnHand * conGeneral.maxPlayers;

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

    if (user == null || user == "") {
        res.status(400);
        res.send("WHAT? No user set.");
        return;
    }

    var session = GetOrCreateSession(user);
    res.send(JSON.stringify(session.gameState));
});

app.get("/action", (req, res) => {
    var user = req.query.user

    if (user == null || user == "") {
        res.status(400);
        res.send("WHAT? No user set.");
        return;
    }

    var action = req.query.action;

    if (action == null || action == "") {
        res.status(400);
        res.send("WHAT? No action set.");
        return;
    }

    if (action == "StartGame") {
        var session = GetOrCreateSession(user);

        if (session.gameState.turnIndex >= 0) {
            res.status(400);
            res.send("WHAT? Session has already started.");
            return;
        }

        StartGame(session);
        res.send(JSON.stringify(session.gameState));
        return;
    }

    if (action == "StageCard") {
        var cardId = req.query.cardId;

        if (cardId == null || cardId == "") {
            res.status(400);
            res.send("WHAT? No cardId set.");
            return;
        }

        var session = GetExistingSession(user);

        if (session == null) {
            res.status(400);
            res.send("WHAT? No Session found.");
            return;
        }

        try {
            StageCard(session, user, cardId);
            res.send(JSON.stringify(session.gameState));
        } catch (exc) {
            res.status(400);
            res.send("StageCard " + cardId + " failed w/ " + exc)
            throw exc;
        }
    }
});

app.use((req, res) => {
    console.log("Receive unhandled" + req.method + " at url:" + JSON.stringify(req.url) + " query:" + JSON.stringify(req.query))
});

var port = process.env.port || 8081;

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
    console.log('Press Ctrl+C to quit.');
});

function GenerateCardStack(targetSize) {
    var cardStack = [];

    while (cardStack.length < targetSize) {
        var oneStack = GenerateFullStack(cardStack.length + 1);
        cardStack = cardStack.concat(oneStack);
    }

    return cardStack;
}

function GenerateFullStack(cardId) {
    var cards = [];

    constants.cards.forEach(card => {

        for (let i = 0; i < card.deckCount; i++) {

            var cardInstance = structuredClone(card);
            cardInstance.id = cardId;
            cards.push(cardInstance);
        }
    });

    shuffle(cards);
    return cards;
}

function shuffle(array) {
    let currentIndex = array.length;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {

        // Pick a remaining element...
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
}

function GetOrCreateSession(user) {
    var existingSession = GetExistingSession();
    if (existingSession != null) {
        return existingSession;
    }

    // check if the last existing session is still unstarted:

    if (sessions.length > 0) {
        var lastSession = sessions[sessions.length - 1];

        if (lastSession.gameState == null || lastSession.gameState.turnIndex < 0) {
            AddPlayerToSession(lastSession, user);
            return lastSession;
        }
    }

    //no suitable session found, create new session

    //delete oldest session if capacity reached
    if (sessions.length > conGeneral.numMaxSessions) {
        sessions.splice(0, 1);
    }

    var newSession = []
    newSession.gameState = {
        turnIndex: -1,
        phaseIndex: 0,
        players: [],
        completedGroupTasks: 0,
        ended: false,
        version: 1,
        cardStack: GenerateCardStack(conGeneral.cardStackSize)
    }

    AddPlayerToSession(newSession, user);
    sessions.push(newSession);
    return newSession
}

function GetExistingSession(user) {
    for (let sessionIndex = 0; sessionIndex < sessions.length; sessionIndex++) {
        const session = sessions[sessionIndex];
        for (let playerIndex = 0; playerIndex < session.gameState.players.length; playerIndex++) {
            const player = session.gameState.players[playerIndex];
            if (player.name == user) {
                return session;
            }
        }
    }

    return null;
}

function AddPlayerToSession(session, user) {
    session.gameState.players.push({
        name: user,
        energy: conGeneral.startEnergy,
        hand: [],
        lastDiceResult: 0,
        lastStagedCard: null,
        completedPersonalTasks: 0,
        stagedCard: null,
        joinDate: Date.now()
    });

    if (session.gameState.players.length == conGeneral.maxPlayers) {
        StartGame(session);
    }
}

function StartGame(session) {
    console.log("Start Game with " + session.gameState.players.length + " players.");

    session.gameState.turnIndex = 0;

    session.gameState.players.forEach(player => {
        player.hand = session.gameState.cardStack.splice(0, conGeneral.numCardsOnHand);
    });

    session.gameState.version += 1;
}

function StageCard(session, user, cardId) {
    console.log("Stage Card " + cardId + " for player " + user);
    var gameState = session.gameState;

    if (gameState.phaseIndex != 0) {
        throw new Error("phaseIndex must be 0");
    }

    var player = gameState.players.find(v => v.name == user);

    if (player == null) {
        throw new Error("player " + user + " not found");
    }

    var cardIndex = player.hand.findIndex(v => v.cardId == id)

    if (cardIndex == -1) {
        throw new Error("card " + cardId + " not found in user hand " + user);
    }

    var prevStagedCard = player.stagedCard;

    var card = player.hand[cardIndex];
    player.stagedCard = card;
    player.lastStagedCard = card;
    player.hand.splice(cardIndex, 1);

    if (prevStagedCard != null) {
        player.hand.push(prevStagedCard);
    }

    gameState.version += 1;

    MaybeEndStagingPhase(session);
}

function MaybeEndStagingPhase(session) {
    var gameState = session.gameState;

    if (gameState.phaseIndex != 0) {
        throw new Error("PhaseIndex must be 0, is " + gameState.phaseIndex);
    }

    for (let i = 0; i < gameState.players.length; i++) {
        const player = gameState.players[i];
        if (player.stagedCard == null) {
            return;
        }
    }

    gameState.phaseIndex += 1;
    gameState.version += 1;
}