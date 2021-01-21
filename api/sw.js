const { Router } = require('express');
const rdfstore = require("rdfstore");
const fs = require("fs");
const path = require("path");
const wee_db = require('wee-db');
const db = wee_db('static/sw_score.json');

const router = Router();

router.get("/sw/questions", function (req, res, next) {
  rdfstore.create(function (err, store) {
    const rdf = fs.readFileSync(path.resolve(__dirname, "../static/sw.ttl")).toString();
    store.load("text/turtle", rdf, function(err, results) {
      const randomNumber = Math.floor(Math.random() * (139 + 1));
      store.execute(
        'SELECT ?character ?name WHERE { ?character <neo4j://vocabulary#description> "Star Wars character" . ?character <neo4j://vocabulary#name> ?name . } OFFSET ' + randomNumber + ' LIMIT 10',
        function (success, results) {
          res.json({results: results, length: results.length});
        }
      );
    });
  });
});

router.get("/sw/clues", function (req, res, next) {
  rdfstore.create(function (err, store) {
    const rdf = fs.readFileSync(path.resolve(__dirname, "../static/sw.ttl")).toString();
    store.load("text/turtle", rdf, function(err, results) {
      const mainNode = req.query.node;
      store.execute(
        'SELECT ?p ?o WHERE { <'+ mainNode +'> ?p ?o . }',
        function (success, results) {
          res.json({results: results, length: results.length});
        }
      );
    });
  });
});

router.get("/sw/name", function (req, res, next) {
  rdfstore.create(function (err, store) {
    const rdf = fs.readFileSync(path.resolve(__dirname, "../static/sw.ttl")).toString();
    store.load("text/turtle", rdf, function(err, results) {
      const mainNode = req.query.node;
      store.execute(
        'SELECT ?name WHERE { <'+ mainNode +'> <neo4j://vocabulary#name> ?name . }',
        function (success, results) {
          res.json({results: results, length: results.length});
        }
      );
    });
  });
});

router.get("/sw/answers", function (req, res, next) {
  rdfstore.create(function (err, store) {
    const rdf = fs.readFileSync(path.resolve(__dirname, "../static/sw.ttl")).toString();
    store.load("text/turtle", rdf, function(err, results) {
      const mainNode = req.query.node;
      const randomNumber = Math.floor(Math.random() * (146 + 1));
      store.execute(
        'SELECT ?character ?name WHERE { ?character <neo4j://vocabulary#description> "Star Wars character" . ?character <neo4j://vocabulary#name> ?name . FILTER (?character != <'+ mainNode +'>) } OFFSET ' + randomNumber + ' LIMIT 3',
        function (success, results) {
          res.json({results: results, length: results.length});
        }
      );
    });
  });
});

router.post("/sw/score", async function (req, res, next) {
  db.insert('players', req.body);

  await res.json({});
});

module.exports = router;
