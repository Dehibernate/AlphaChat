var util = require('util');
var emptyFN = function () {
};

//Default time to live 6 hours
var ttl = 6 * 60 * 60 * 10000;

function getExpiresValue(sess) {
    if (sess && sess.cookie && sess.cookie.expires) {
        return new Date(sess.cookie.expires);
    } else {
        return new Date(Date.now() + ttl);
    }
}

module.exports = function (session) {
    function DataStore(options) {
        if (!(this instanceof DataStore)) {
            throw new TypeError('Cannot call DataStore constructor as a function');
        }

        options = options || {};
        session.Store.call(this, options);

        if (options.client) {
            this.client = options.client;
        }

        this.timer = setInterval(() => {
            this.destroyExpiredSessions();
        }, 10000)
    }

    util.inherits(DataStore, session.Store);

    var store = {};
    DataStore.prototype.get = function (sid, fn) {
        if (!fn) fn = emptyFN;
        var obj = store[sid] && store[sid].data ? JSON.parse(store[sid].data) : null;
        fn(null, obj);
    };

    DataStore.prototype.set = function (sid, sess, fn) {
        if (!fn) fn = emptyFN;
        console.log(sid, "set");

        var expires = getExpiresValue(sess);

        store[sid] = {data: JSON.stringify(sess), expires: expires};
        fn(null);
    };

    DataStore.prototype.destroy = function (sid, fn) {
        console.log(sid, "deleted");
        delete store[sid];
        if (fn) fn(null);
    };

    DataStore.prototype.touch = function (sid, sess, fn) {
        //Update the expires value of the session
        store[sid].expires = getExpiresValue(sess);
        fn(null);
    };


    DataStore.prototype.destroyExpiredSessions = function () {
        for (var a in store) {
            if (store.hasOwnProperty(a)) {
                if (store[a].expires == null || store[a].expires < new Date()) {
                    this.destroy(a);
                    console.log("CLEANUP");
                }
            }
        }
    };

    return DataStore;
};