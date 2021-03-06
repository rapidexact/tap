const express = require('express');
const router = express.Router();
const config = require('config');
const dbConfig = config.get('dbConfig');
const Sequelize = require('sequelize');
const crypto = require('crypto');
const _ = require('underscore');
const vk = require('vk-call').vk;

const sequelize = new Sequelize(dbConfig.connectUrl);

const Users_vk = sequelize.import(__dirname + "/../models/users_vk");
const Users = sequelize.import(__dirname + "/../models/users");

const BASE_OPEN_API_URL = 'https://api.vk.com/';

Users_vk.sync().then(() => {
    console.log('Users_vk table synced');
});

Users.sync().then(() => {
    console.log('Users table synced');
});

Users.belongsTo(Users_vk, {'foreignKey': 'user_vk'});


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
    if (!req.cookies[openApiCookieName]) {

        console.log('No cookies. Skipping...');
        next();
        return;
    }

    let session = parseOpenApiCookie(req.cookies[openApiCookieName]);
    console.log(isTokenValid(session, creds.protectedAppKey) ? 'User token is valid' : 'User token is invalid');
    if (!isTokenValid(session, creds.protectedAppKey)) {
        next();
        return;
    }


    try {
        let user = await Users.findOne({where: {user_vk: session.mid}});
        console.log(JSON.stringify(user));
        if (!user) {
            user = await Users.create({
                user_vk: session.mid,
                registeredAt: sequelize.fn('NOW'),
                played_games_count: 0,
                user_invited: 0,
                best_result: 0,
            });
        }

        req.user = user;
        req.user.session = session;

        let vkUser = await api.call('users.get', {
            user_id: session.mid,
            fields: 'nickname, domain, sex, bdate, city, country, timezone, has_mobile, contacts, education, online, relation, last_seen, photo_200, nickname, counters, first_name_nom, last_name_nom',
            access_token: session,
        });

        console.log(vkUser);

        vkUser = vkUser[0];

        let createdVkUser = await Users_vk.find({where: {user_id: session.mid}});
        if (!createdVkUser) {
            createdVkUser = await Users_vk.create({
                user_id: session.mid,
                nickname: vkUser.nickname,
                domain: vkUser.domain,
                sex: vkUser.sex,
                bdate: vkUser.bdate,
                city: vkUser.city ? vkUser.city.title || '' : '',
                country: vkUser.country ? vkUser.country.title : '',
                has_mobile: vkUser.has_mobile,
                first_name: vkUser.first_name_nom || '',
                last_name: vkUser.last_name_nom || '',
                photo: vkUser.photo_200,
                friends_count: vkUser.counters ? vkUser.counters.friends || null : null,
            });
        }

    } catch (err) {
        console.log(err);
        next();
    }
    next();
});

async function getFriendsGamers(req, res, next) {
    // let ids = req.query.
    // let vkMutualUsers = await api.call('friends.getMutual', {
    //     access_token: user.session,
    //     user_id: user.session.mid,
    //     session: user.session
    // });
    // console.log(vkMutualUsers);
    // let res = await Users.findAll({where: {user_vk: [413999592]}});
    // return {data: res, method: 'getFriendsGamers', mutual: ''};
}

function authUser(res) {
    res.writeHead(302, {
        'Location': 'https://oauth.vk.com/authorize?client_id=6214504&display=page&redirect_uri=http://tapgame.io/?method=vkAuth&scope=friends&response_type=code&v=5.69'
    });
    res.end();
}

function f(code, res, user) {
    let vkMutualUsers = api.call('friends.getMutual', {
        access_token: code,
        user_id: user.session.mid,
        session: code,
        code: code,
    }, res.json);

}

router.post('/getFriendsGamers', async function (req, res, next) {
    let ids = req.body.ids;
    console.log(req.body.ids);
    console.log('ids',ids);
    let result = await Users.findAll({attributes: ['best_result', 'user_vk'], where: {user_vk: ids}, include: [{model: Users_vk, attributes:['first_name', 'last_name', 'photo']}]});
    console.log(result);
    res.json({data: result});
});

/* GET home page. */
router.get(['/', '/:lang'], async function (req, res, next) {
    if (req.params.lang === 'ru') {
        // authUser(res);
        // return;
    }

    if (req.user) {
        if (req.query.method) {
            switch (req.query.method) {
                case 'getFriendsGamers':
                    console.log('getFriendsGamers');
                    getFriendsGamers(req, res, next);
                    return;
                    break;
                case 'vkAuth':
                    console.log('vkAuth');
                    f(req.query.code, res, req.user);
                    return;
                    break;
            }
        }
    }
    if (req.query.record && req.user) {
        if (+req.query.record > +req.user.best_result) {
            let result = await req.user.update({
                best_result: +req.query.record,
            });
            res.json(result);
        }
        console.error(req.query.record);
        return;
    }
    let lang = req.params.lang || 'en';
    res.render('index', {title: 'TapGame.io', lang: lang});
});

module.exports = router;
