const express = require('express');
const router = express.Router();
const config = require('config');
const dbConfig = config.get('dbConfig');
const Sequelize = require('sequelize');

const sequelize = new Sequelize(dbConfig.connectUrl);

const Records = sequelize.import(__dirname + "/../models/records");

Records.sync().then(() => {
  console.log('records table created');
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'TapGame.io' });
});

module.exports = router;
