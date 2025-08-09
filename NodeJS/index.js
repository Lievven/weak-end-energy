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
    cardStackSize : 12 * 4,
    groupTasksCompletionTarget : 8,
    numMaxSessions : 10,
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

    if(user == null || user == "")
    {
        res.status(400);
        res.send("WHAT? No user set.");
        return;
    }

    var session = GetOrCreateSession();
    res.send(JSON.stringify(session.gameState));
});

app.use((req, res) => {
    console.log("Receive unhandled" + req.method + " at url:" + JSON.stringify(req.url) + " query:" + JSON.stringify(req.query))
});

var port = process.env.port || 8081;

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
    console.log('Press Ctrl+C to quit.');
});

function GenerateCardStack(targetSize)
{
    var cardStack = [];

    while(cardStack.length < targetSize)
    {
        var oneStack = GenerateFullStack(cardStack.length + 1);
        cardStack = cardStack.concat(oneStack);
    }

    console.log("MAKE CARD STACK, size is "+cardStack.length)
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

function GetOrCreateSession(user)
{
    sessions.forEach(session => {
        session.gameState.players.forEach(player => {
            if ( player.name == user)
            {
                return session;
            }
        });
    });

    // check if the last existing session is still unstarted:

    if(sessions.length > 0)
    {
        var lastSession = sessions[sessions.length-1];

        if(lastSession.gameState == null || lastSession.gameState.turnIndex < 0)
        {
            AddPlayerToSession(lastSession,user);
            return lastSession;
        }
    }

    //no suitable session found, create new session

    //delete oldest session if capacity reached
    if(sessions.length>conGeneral.numMaxSessions)
    {
        sessions.splice(0,1);
    }

    var newSession = []
    newSession.gameState = {
        turnIndex: -1,
        phaseIndex: 0,
        players: [],
        completedGroupTasks : 0,
        ended : false,
        version : 1,
        cardStack: GenerateCardStack(conGeneral.cardStackSize)
    }

    AddPlayerToSession(newSession, user);
    sessions.push(newSession);
    return newSession
}

function AddPlayerToSession(session, user)
{
    session.gameState.players.push({
        name: user,
        energy: conGeneral.startEnergy,
        hand: [],
        lastDiceResult: 0,
        lastCardIdSelected: null,
        completedPersonalTasks: 0,
        stagedCard : null,
        joinDate : Date.now()
    });

    if(session.gameState.players.length == conGeneral.maxPlayers)
    {
        StartGame(session);
    }
}

function StartGame(session)
{
    console.log("START SESSION ")
    session.gameState.turnIndex = 1;

    session.gameState.players.forEach(player =>{
        player.card = session.gameState.cardStack.splice(0,conGeneral.numCardsOnHand);
    });
}