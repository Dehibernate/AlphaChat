var gcloud = require('gcloud');

//MAKE SURE YOU AMEND THE FOLLOWING CONFIGURATION WITH YOUR PROJECT ID AND API KEY FILENAME
var dataset = gcloud.datastore.dataset({
    projectId: 'XXXXX',
    keyFilename: './XXXXXX-XXXXXXX.json'
});

exports.upsertEntity = function (kind, data, callback) {
    var key = dataset.key(kind);

    dataset.upsert({
        key: key,
        data: data
    }, function (err) {
        if (err) {
            callback(err);
            return;
        }
        callback(null, key);
    });
};

exports.insertEntity = function (kind, data, callback) {
    var key = dataset.key(kind);

    dataset.insert({
        key: key,
        data: data
    }, function (err) {
        if (err) {
            callback(err);
            return;
        }
        callback(null, key);
    });
};

exports.saveEntity = function (kind, data, callback) {
    var key = dataset.key(kind);

    dataset.save({
        key: key,
        data: data
    }, function (err) {
        if (err) {
            callback(err);
            return;
        }
        callback(null, key);
    });
};

exports.getEntity = function (name, callback) {
    var key = dataset.key(name);

    dataset.get(key, function (err, entity) {
        if (err) {
            callback(err);
            return;
        }
        callback(null, entity ? entity.data : null);
    });
};

exports.updateEntity = function (kind, data, callback) {
    var key = dataset.key(kind);

    dataset.update({
        key: key,
        data: data
    }, function (err) {
        if (err) {
            callback(err);
            return;
        }
        callback(null, key);
    });
};

exports.deleteEntity = function (kind, callback) {
    var key = dataset.key(kind);
    dataset.delete(key, function (err) {
        callback(err || null);
    });
};

exports.dataset = dataset;

exports.filteredBulkDelete = function (kind, callback, filterArgs) {
    var error;
    var deletedCount;

    dataset.runInTransaction(function (transaction, done) {
        var query = dataset.createQuery(kind)
            .filter(filterArgs[0], filterArgs[1], filterArgs[2]);

        dataset.runQuery(query, function (err, entities) {
            if (err) {
                error = err;
                transaction.rollback(done);
                return;
            }

            var keys = [];
            for (var i = 0; i < entities.length; i++)
                keys.push(entities[i].key);

            deletedCount = keys.length;
            if (keys.length > 0) {
                dataset.delete(keys, function (err) {
                    if (err) {
                        error = err;
                        transaction.rollback(done);
                        return;
                    }

                    done();
                });
            } else {
                done()
            }

        });

    }, function (transactionError) {
        if (transactionError || error) {
            callback(transactionError || error);
        } else {
            // The transaction completed successfully.
            callback(null,deletedCount);
        }
    });
};