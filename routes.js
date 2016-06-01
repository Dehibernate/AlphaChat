module.exports = function (app, passport, express, storage) {
    app.get('/login', function (req, res) {
        //If the user is already logged in, redirect them to main page
        if (req.session.passport && req.session.passport.user) {
            console.log(req.session.passport.user.firstName);
            res.redirect('/');
        } else {
            res.sendFile(__dirname + '/public/log.html')
        }
    });

    //Register user and login automatically
    app.post('/register',
        function (req, res, next) {
            console.log("registering");
            if (req.body.password == req.body.confirm_password) {
                var user = {
                    firstName: req.body.firstName,
                    username: req.body.username,
                    password: req.body.password,
                    email: req.body.email
                };

                storage.dbClient.insertEntity(['User', user.username], user, function (err) {
                    if (err) res.send(err.message);
                    else {
                        console.log("here");
                        next();
                    }
                });
            } else {
                res.redirect('/login');
                //res.send(err)
            }
        },
        passport.authenticate('local', {successRedirect: '/', failureRedirect: '/login'})
    );

    //Authenticate using PassportJS and redirect to main page
    app.post('/login', passport.authenticate('local', {successRedirect: '/', failureRedirect: '/login'}));


    var METADATA_NETWORK_INTERFACE_URL = 'http://metadata/computeMetadata/v1/' +
        '/instance/network-interfaces/0/access-configs/0/external-ip';

    function getExternalIp(cb) {
        var options = {
            url: METADATA_NETWORK_INTERFACE_URL,
            headers: {
                'Metadata-Flavor': 'Google'
            }
        };

        require('request')(options, function (err, resp, body) {
            if (err || resp.statusCode !== 200) {
                console.log('Error while talking to metadata server, assuming localhost');
                return cb('localhost');
            }
            return cb(body);
        });
    }


    app.get('/', require('connect-ensure-login').ensureLoggedIn(), function (req, res) {
        var userdata = {
            user: req.session.passport.user,
            sid: req.session.id
        };

        getExternalIp(function (ip) {
            res.render('../public/index.html', {externalip: ip, userdata: JSON.stringify(userdata)});
        });
    });

    //Serve css files from the css folder
    app.use('/css', express.static(__dirname + '/public/css'));
    app.use('/js', express.static(__dirname + '/public/js'));
    app.use('/favicon.ico', express.static(__dirname + '/public/favicon.ico'));

    app.get('/logout', function (req, res) {
        req.logOut();
        req.session.destroy(function (err) {
            res.redirect('/login');
        });
    });
};