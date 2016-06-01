var emptyFN = function () {
};

//Default time to live 6 hours
var ttl = 6 * 60 * 60 * 1000;

//Every 15 mins expired sessions are cleared from Cloud Datastore
var sessionCleanupInterval = 15 * 60 * 1000;

//Calculates the expiry date/time for the given session
function getExpiresValue(sess) {
    if (sess && sess.cookie && sess.cookie.expires) {
        return new Date(sess.cookie.expires);
    } else {
        return new Date(Date.now() + ttl);
    }
}

//This is a custom implementation of a session store client for express-session
//Since there aren't any session storage clients for Google Cloud Datastore, we had to implement it ourselves
//The implementation was developed according to the guidelines of the official express-session API
//It can be found at the following link: https://github.com/expressjs/session
//connect-redis was used as a reference for an example implementation, as instructed by the express-session guidelines

module.exports = function (session) {
    //Constructor
    function DataStore(options) {
        if (!(this instanceof DataStore)) {
            throw new TypeError('Cannot call DataStore constructor as a function');
        }

        options = options || {};
        session.Store.call(this, options);

        //Preconfigured client for Google Cloud Datastore
        if (options.client) {
            this.client = options.client;
        }

        //Timer for cleaning up expired sessions
        this.timer = setInterval(() => {
            this.destroyExpiredSessions();
        }, sessionCleanupInterval)
    }

    //express-session requires store objects to inherit from Store
    require('util').inherits(DataStore, session.Store);

    //Gets the session matching the session id (sid)
    DataStore.prototype.get = function (sid, fn) {
        if (!fn) fn = emptyFN;
        return this.client.getEntity(['Session', sid], function (err, value) {
            if (err) return fn(err);
            if (!value) return fn();
            return fn(null, value.data ? JSON.parse(value.data) : null);
        });
    };

    //Stores the given session (overwrites existing entries)
    DataStore.prototype.set = function (sid, sess, fn) {
        if (!fn) fn = emptyFN;
        console.log(sid, "set");
        var expires = getExpiresValue(sess);
        this.client.upsertEntity(['Session', sid], {data: JSON.stringify(sess), expires: expires}, fn);
    };

    //Deletes the specified session
    DataStore.prototype.destroy = function (sid, fn) {
        console.log(sid, "deleted");
        if (!fn) fn = emptyFN;
        return this.client.deleteEntity(['Session', sid], fn);
    };

    //Destroys all sessions which have already expired (for db housekeeping)
    DataStore.prototype.destroyExpiredSessions = function () {
        this.client.filteredBulkDelete('Session',
            (err, arg) => console.log(err, arg),
            ['expires', '<', new Date()]
        );
    };

    return DataStore;
};