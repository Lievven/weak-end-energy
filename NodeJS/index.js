const express = require('express');
const app = express();
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.resolve(__dirname, "data/constants.db");
const conDb = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, err => {
    if (err) console.error("Error while opeining database: " + err)
});
const cors = require("cors");

var conGeneral = {
    byPlayerCount : [
        //0 players
        {},
        //1 player
        {
            startEnergy: 10,
            maxEnergy: 10,
            groupTasksCompletionTarget: 2,
        },
        //2 players
        {
            startEnergy: 10,
            maxEnergy: 10,
            groupTasksCompletionTarget: 6,
        },
        //3 players
        {
            startEnergy: 10,
            maxEnergy: 10,
            groupTasksCompletionTarget: 8,
        },
        //4 players
        {
            startEnergy: 10,
            maxEnergy: 10,
            groupTasksCompletionTarget: 10,
        },
    ],
    numTurns: 12,
    numCardsOnHand: 4,
    maxPlayers: 4,
    numMaxSessions: 10,
    playerTimeoutMs: 25000,
}
conGeneral.cardStackSize = conGeneral.numTurns * conGeneral.maxPlayers + conGeneral.numCardsOnHand * conGeneral.maxPlayers;

let constants = {};

GenerateConstants();

const sessions = [];

app.use(cors({
    origin: ["https://jonasmumm.itch.io", "http://localhost:8081", "https://html.itch.zone", "https://lievven.itch.io", "*"]
}));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get("/poll", (req, res) => {
    var user = req.query.user

    if (user == null || user == "") {
        res.status(400);
        res.send("WHAT? No user set.");
        return;
    }

    var knownVersion = req.query.knownVersion;

    if (knownVersion == null || knownVersion == "" || knownVersion <= 0) {
        var session = GetOrCreateSession(user);
        res.send(JSON.stringify(session.gameState));
        return;
    }

    var session = GetExistingSession(user);

    if (session == null || session.version == knownVersion) {
        res.send("");
        return;
    }

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
        var session = GetExistingSession(user);

        if (session == null) {
            res.status(400);
            res.send("WHAT? Session does not exist for user " + user);
            return;
        }

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

    if (action == "ChooseActivity") {
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
            ChooseCard(session, user, cardId);
            res.send(JSON.stringify(session.gameState));
        } catch (exc) {
            res.status(400);
            res.send("ChooseActivity " + cardId + " failed w/ " + exc)
            throw exc;
        }
    }
});

app.get("/tools/generateConstants", async (req, res) => {
    await GenerateConstants();
    res.send("regenerated constants!\n"+JSON.stringify(constants));
});

app.get("/", async (req, res) => {
    res.send("thats the index");
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
            cardInstance.id = "C" + cardId;
            cardId+=1;
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
    var existingSession = GetExistingSession(user);
    if (existingSession != null) {
        return existingSession;
    }

    // check if the last existing session is still unstarted:

    if (sessions.length > 0) {
        var lastSession = sessions[sessions.length - 1];

        if (lastSession.gameState == null || lastSession.gameState.turnIndex < 0) {
            var allPlayersInSession = lastSession.gameState.players;

            if (allPlayersInSession.length == 0 || allPlayersInSession.every(v => (Date.now() - v.dtLastPing) < conGeneral.playerTimeoutMs)) {
                AddPlayerToSession(lastSession, user);
                return lastSession;
            }
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
        won : false,
        version: 1,
        cardStack: GenerateCardStack(conGeneral.cardStackSize),
        conGeneral : conGeneral
    }

    AddPlayerToSession(newSession, user);
    sessions.push(newSession);
    return newSession
}

function GetExistingSession(user) {
    for (let sessionIndex = sessions.length - 1; sessionIndex >= 0; sessionIndex--) {
        const session = sessions[sessionIndex];
        for (let playerIndex = 0; playerIndex < session.gameState.players.length; playerIndex++) {
            const player = session.gameState.players[playerIndex];
            if (player.name == user) {
                player.dtLastPing = Date.now();
                return session;
            }
        }
    }

    return null;
}

function AddPlayerToSession(session, user) {
    session.gameState.players.push({
        name: user,
        energy: 0,
        hand: [],
        lastDiceResult: 0,
        lastStagedCard: null,
        completedPersonalTasks: 0,
        stagedCard: null,
        chosenCard: null,
        lastChosenCard: null,
        dtLastPing: Date.now()
    });

    console.log("AddPlayerToSession ("+user+"), playeryount now "+session.gameState.players.length)

    session.gameState.version+=1;

    if (session.gameState.players.length == conGeneral.maxPlayers) {
        StartGame(session);
    }
}

function StartGame(session) {
    console.log("Start Game with " + session.gameState.players.length + " players.");

    session.gameState.turnIndex = 0;

    session.gameState.players.forEach(player => {
        player.hand = session.gameState.cardStack.splice(0, conGeneral.numCardsOnHand);
        player.energy = conGeneral.byPlayerCount[session.gameState.players.length].startEnergy;
    });

    session.gameState.version += 1;
}

function StageCard(session, user, cardId) {
    console.log("Stage Card " + cardId + " for player " + user);
    var gameState = session.gameState;

    if (gameState.ended) {
        throw new Error("game has ended");
    }

    if (gameState.phaseIndex != 0) {
        throw new Error("phaseIndex must be 0");
    }

    var player = gameState.players.find(v => v.name == user);

    if (player == null) {
        throw new Error("player " + user + " not found");
    }

    var cardIndex = player.hand.findIndex(v => v.id == cardId)

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

function ChooseCard(session, user, cardId) {
    console.log("ChooseCard " + cardId + " for player " + user);
    var gameState = session.gameState;

    if (gameState.ended) {
        throw new Error("game has ended");
    }

    if (gameState.phaseIndex != 1) {
        throw new Error("phaseIndex must be 1, is " + gameState.phaseIndex);
    }

    var player = gameState.players.find(v => v.name == user);

    if (player == null) {
        throw new Error("player " + user + " not found");
    }

    var cardOwner = gameState.players.find(v => v.stagedCard.id == cardId);

    if (cardOwner == null) {
        throw new Error("noone staged card id " + cardId)
    }

    var currentChosenCardId = player.chosenCardId;

    if (currentChosenCardId == cardId) return

    player.chosenCard = cardOwner.stagedCard;
    player.lastChosenCard = cardOwner.stagedCard;

    gameState.version += 1;

    MaybeEndChoosingPhase(session);
}

function MaybeEndChoosingPhase(session) {
    var gameState = session.gameState;
    
    if (gameState.phaseIndex != 1) {
        throw new Error("PhaseIndex must be 1, is " + gameState.phaseIndex);
    }

    for (let i = 0; i < gameState.players.length; i++) {
        const player = gameState.players[i];

        if (player.chosenCard == null) return;
    }

    for (let i = 0; i < gameState.players.length; i++) {
        const player = gameState.players[i];
        const stagedCard = player.stagedCard;

        ApplyCardEffects(player, stagedCard, gameState.players.filter(v => v.chosenCard.id == stagedCard.id), gameState);
    }

    for (let i = 0; i < gameState.players.length; i++) {
        const player = gameState.players[i];
        player.chosenCard = null;
        player.stagedCard = null;
    }

    gameState.version += 1;
    gameState.turnIndex += 1;
    gameState.phaseIndex = 0;

    if(gameState.completedGroupTasks >= conGeneral.byPlayerCount[gameState.players.length].groupTasksCompletionTarget)
    {
        gameState.ended = true;
        won = true;
        return;
    }

    for (let i = 0; i < gameState.players.length; i++) {
        const player = gameState.players[i];

        if (player.energy <= 0) {
            gameState.ended = true;
            won = false;
            return;
        }
    }

    if (gameState.turnIndex == conGeneral.numTurns) {
        gameState.ended = true;
        won = false;
        return;
    }

    for (let playerIndex = 0; playerIndex < gameState.players.length; playerIndex++) {
        const player = gameState.players[playerIndex];
        while(player.hand.length < conGeneral.numCardsOnHand)
        {
            player.hand = player.hand.concat(gameState.cardStack.splice(0,1));
        }
    }
}

function ApplyCardEffects(owner, card, playerTargets, gameState) {
    if (playerTargets.length == 0) {
        owner.hand.push(card);
        return;
    }

    var evaluateIndividually = card.type == "personal";

    if (evaluateIndividually) {
        var anyDiscard = false;
        for (let playerIndex = 0; playerIndex < playerTargets.length; playerIndex++) {
            const player = playerTargets[playerIndex];
            player.lastDiceResult = throwDice(1, 6);
            var cardEffect = card.effects.find(v => v.diceResultMin <= player.lastDiceResult && v.diceResultMax >= player.lastDiceResult);

            if (cardEffect == null) {
                throw new Error("No effect for result " + player.lastDiceResult + " for card " + card.name);
            }

            player.energy = Math.min(player.energy + cardEffect.energyChange, gameState.conGeneral.byPlayerCount[gameState.players.length].maxEnergy);
            if (cardEffect.discardCard) {
                anyDiscard = true;
            }
        }

        if (!anyDiscard) {
            owner.hand.push(card);
        }
    }
    else {
        let diceSum = 0;
        for (let playerIndex = 0; playerIndex < playerTargets.length; playerIndex++) {
            const player = playerTargets[playerIndex];
            player.lastDiceResult = throwDice(1, 6);
            diceSum += player.lastDiceResult;
        }

        var cardEffect = card.effects.find(v => v.diceResultMin <= diceSum && v.diceResultMax >= diceSum);

        if (cardEffect == null) {
            throw new Error("No effect for result " + player.lastDiceResult + " for card " + card.name);
        }

        for (let playerIndex = 0; playerIndex < playerTargets.length; playerIndex++) {
            const player = playerTargets[playerIndex];
            player.energy += cardEffect.energyChange;
        }

        if (!cardEffect.discardCard) {
            owner.hand.push(card);
        }
        else
        {
            if(card.type == "group")
            {
                gameState.completedGroupTasks += 1
            }
        }
    }
}

function throwDice(minInclusive, maxInclusive) {
    return minInclusive + Math.floor(Math.random() * (maxInclusive - minInclusive + 1));
}

function GenerateConstants() {
    var promise = new Promise((resolve, reject) => {

        conDb.all("SELECT * FROM cards", (err, rows) => {

            var allCards = rows;
            conDb.all("SELECT * FROM cardEffects", (err, rows) => {

                var allCardEffects = rows;

                allCards.forEach(card => {
                    card.effects = allCardEffects.filter((e) => e.cardName == card.name);
                    card.effects.forEach(e=>{
                        //cardName field no longer required
                        delete e.cardName;
                    });
                });

                constants = {};
                constants.cards = allCards;
                resolve();
            });
        });
    });

    return promise;
}