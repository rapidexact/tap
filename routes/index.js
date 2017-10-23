const express = require('express');
const router = express.Router();
const config = require('config');
const dbConfig = config.get('dbConfig');
const Sequelize = require('sequelize');
const crypto = require('crypto');
const _ = require('underscore');
const vk = require('vk-call').vk;

const sequelize = new Sequelize(dbConfig.connectUrl);

const Records = sequelize.import(__dirname + "/../models/records");
const Users_vk = sequelize.import(__dirname + "/../models/users_vk");
const Users = sequelize.import(__dirname + "/../models/users");

const BASE_OPEN_API_URL = 'https://api.vk.com/';

Records.sync().then(() => {
    console.log('Records table synced');
});

Users_vk.sync().then(() => {
    console.log('Users_vk table synced');
});

Users.sync().then(() => {
    console.log('Users table synced');
});

let creds = {
    protectedAppKey: 'hlMNxJzHmiICqB52tIAi',
    API_TOKEN_KEY: '785b787c785b787c785b787c947805ab147785b785b787c2180ac8b63dc09f0341d6154',
    appId: 6214504,
};
let openApiCookieName = 'vk_app_' + creds.appId;

let api = new vk({
    token: creds.API_TOKEN_KEY,
    version: "5.50",
    timeout: 10000
});

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

router.use(async function (req, res, next) {
    let session = parseOpenApiCookie(req.cookies[openApiCookieName]);
    console.log(isTokenValid(session, creds.protectedAppKey) ? 'User token is valid' : 'User token is invalid');
    if (!req.cookies[openApiCookieName] || !isTokenValid(session, creds.protectedAppKey)) {
        next();
        return;
    }

    try {
        let user = await Users.findOne({where: {user_vk: session.mid}});
        console.log(JSON.stringify(user));
        if (!user) {
            let createdUser = await Users.create({
                user_vk: session.mid,
                registeredAt: sequelize.fn('NOW'),
                played_games_count: 0,
                user_invited: 0
            });
            let vkUser = await api.call('users.get', {
                user_id: session.mid,
                fields: 'nickname, domain, sex, bdate, city, country, timezone, has_mobile, contacts, education, online, relation, last_seen'
            });
            console.log(vkUser);
            let createdVkUser = await Users_vk.create({
                user_id: session.mid,
                nickname: response.nickname,
                domain: vkUser.domain,
                sex: response.sex,
                bdate: (Date.parse(response.bdate)).toISOString(),
                city: response.city,
                country: response.country,
                has_mobile: response.has_mobile,
            });
        }
    } catch (err) {
        console.log(err);
    }
    next();
});

/* GET home page. */
router.get(['/', '/:lang'], function (req, res, next) {
    let lang = req.params.lang || 'en';
    res.render('index', {title: 'TapGame.io', lang: lang});
});

module.exports = router;
