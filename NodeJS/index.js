const express = require('express');
const app = express();
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.resolve(__dirname, "data/constants.db");
const conDb = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, err => {
    if(err) console.error("Error while opeining database: "+err)
});

var cardConstants = conDb.all("SELECT * FROM cards INNER JOIN cardEffects on cards.name = cardEffects.cardname GROUP BY cardEffects.cardname",(err,rows)=>{
    if(err) console.error("Error while loading cards: "+err);

    console.log(JSON.stringify(rows))
});

var constants = null;

app.get("/poll",(req, res) => {
    res.send("Hello it me "+req.query.user);
});

app.use((req, res) => {
    console.log("Receive unhandled"+req.method+" at url:"+ JSON.stringify(req.url)+" query:"+JSON.stringify(req.query))
});

var port = process.env.port || 8081;

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
    console.log('Press Ctrl+C to quit.');
});