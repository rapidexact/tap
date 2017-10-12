const express = require('express');
const router = express.Router();
const config = require('config');
const dbConfig = config.get('dbConfig');
const Sequelize = require('sequelize');
const crypto = require('crypto');
const _ = require('underscore');

const sequelize = new Sequelize(dbConfig.connectUrl);

const Records = sequelize.import(__dirname + "/../models/records");

Records.sync().then(() => {
    console.log('records table created');
});

let creds = {
    protectedAppKey: 'hlMNxJzHmiICqB52tIAi',
    appId: 6214504,
};
let openApiCookieName = 'vk_app_' + creds.appId;

function isTokenValid(session, protectedAppKey) {
    let sessionArr = [];
    let sesstionStr = '';
    // sessionArr.push(session.expire);
    // sessionArr.push(session.mid);
    // sessionArr.push(session.secret);
    sesstionStr = `expire=${session.expire}mid=${session.mid}secret=${protectedAppKey}sid=${session.sid}`;
    // sesstionStr = sessionArr.join('') + protectedAppKey;
    let hash = crypto.createHash('md5').update(sesstionStr).digest('hex');
    console.log({
        sessionStr: sesstionStr,
        session: session,
        hash: hash
    });
    return session.sig === hash;
}
function parseOpenApiCookie(cookie) {
    let values = cookie.split('&');
    let result = {};
    _.map(values, (val, key) => {
        let hashArr = val.split('=');
        result[hashArr[0]] = hashArr[1];
    });
    return result;
}
router.use(function (req, res, next) {
    let vkApiCookie = req.cookies[openApiCookieName];
    let session = parseOpenApiCookie(req.cookies[openApiCookieName]);
    console.log(session);
    console.log(isTokenValid(session, creds.protectedAppKey) ? 'User token is valid' : 'User token is invalid');
});

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'TapGame.io'});
});

module.exports = router;
