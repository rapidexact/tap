const express = require('express');
const router = express.Router();
const config = require('config');
const dbConfig = config.get('dbConfig');
const Sequelize = require('sequelize');
const crypto = require('crypto');
const request = require('request');
const _ = require('underscore');
const vk = require('vk-call').vk;

const sequelize = new Sequelize(dbConfig.connectUrl);

const Records = sequelize.import(__dirname + "/../models/records");

const BASE_OPEN_API_URL = 'https://api.vk.com/';

Records.sync().then(() => {
    console.log('records table created');
});

let creds = {
    protectedAppKey: 'hlMNxJzHmiICqB52tIAi',
    appId: 6214504,
};
let openApiCookieName = 'vk_app_' + creds.appId;

function isTokenValid(session, protectedAppKey) {
    let sessionStr = `expire=${session.expire}mid=${session.mid}secret=${session.secret}sid=${session.sid}${protectedAppKey}`;
    let hash = crypto.createHash('md5').update(sessionStr).digest('hex');
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
function openApiCall(methodName, options, token, apiVersion) {
    request.get({url:BASE_OPEN_API_URL + `method/${methodName}`,
    qs: {
        user_id: 413999592,
        access_token: token,
        v: apiVersion
    }}).on('response', function (response) {
        return response;
    });

}
router.use(function (req, res, next) {
    if (req.cookies[openApiCookieName]) {
        let session = parseOpenApiCookie(req.cookies[openApiCookieName]);
        console.log(isTokenValid(session, creds.protectedAppKey) ? 'User token is valid' : 'User token is invalid');
        req.user = isTokenValid(session, creds.protectedAppKey);
    }


    var api = new vk({
        token: '785b787c785b787c785b787c947805ab147785b785b787c2180ac8b63dc09f0341d6154',
        version: "5.50",
        timeout: 10000
    });

    api.call('users.get', {user_id: 413999592}).then(response=>{
        res.json(response);
    });
    // next();
});

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'TapGame.io'});
});

module.exports = router;
