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
    console.log('Records table created');
});

Users_vk.sync().then(() => {
    console.log('Users_vk table created');
});

Users.sync().then(() => {
    console.log('Users table created');
});

let creds = {
    protectedAppKey: 'hlMNxJzHmiICqB52tIAi',
    API_TOKEN_KEY: '785b787c785b787c785b787c947805ab147785b785b787c2180ac8b63dc09f0341d6154',
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

router.use(function (req, res, next) {
    let api = new vk({
        token: creds.API_TOKEN_KEY,
        version: "5.50",
        timeout: 10000
    });
    if (req.cookies[openApiCookieName]) {
        let session = parseOpenApiCookie(req.cookies[openApiCookieName]);
        console.log(isTokenValid(session, creds.protectedAppKey) ? 'User token is valid' : 'User token is invalid');
        if (isTokenValid(session, creds.protectedAppKey)) {
            Users.findOne({where: {user_vk: session.mid}}).then(user => {
                if (user.length === 0 || !user) {
                    Users.create({
                        user_vk: session.mid,
                        registeredAt: sequelize.fn('NOW'),
                        played_games_count: 0,
                        user_invited: 0
                    }).then(user => {
                        api.call('users.get', {
                            user_id: session.mid,
                            fields: 'nickname, domain, sex, bdate, city, country, timezone, photo_50, photo_100, photo_200_orig, has_mobile, contacts, education, online, relation, last_seen, status, can_write_private_message, can_see_all_posts, can_post, universities'
                        }).then(response => {
                            Users_vk.create({
                                user_id: session.mid,
                                nickname: response.nickname,
                                domain: response.domain,
                                sex: response.sex,
                                bdate: response.bdate,
                                city: response.city,
                                country: response.country,
                                has_mobile: response.has_mobile,
                            }).then(userVk => {
                                req.user = user;
                                next();
                            }).catch(err => {
                                res.json({error: err, message: 'Не удалось добавить пользователя'});
                                throw 'Не удалось добавить пользователя';
                            });
                        });
                    });
                }
            });
        } else {
            next();
        }
    } else {
        next();
    }
});

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'TapGame.io'});
});

module.exports = router;
