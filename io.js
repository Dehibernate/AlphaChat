module.exports = function (io, storage) {
    var updateRooms = function(callback){
    	var dataset = storage.dbClient.dataset;
		var query = dataset.createQuery('RoomUser')
			.select('roomName')
			.groupBy('roomName');
		
		var rooms = [];

		dataset.runQuery(query, function(err, tasks) {
			if (err) {
				// An error occurred while running the query.
				console.log('query error',err);
				callback(err);
				return;
			}
			
			tasks.forEach(function(task) {
				rooms.push(task.data.roomName);
			});

			callback(null,rooms);
		});
    }
    
    io.on('connection', function (socket) {
        console.log(socket.handshake.query.userdata);

        //If no user and session parameters passed, refuse connection
        if (!socket.handshake.query.userdata) return socket.disconnect();

        //Verify that user and matching session exist
        var userdata = JSON.parse(socket.handshake.query.userdata);
        storage.dbClient.getEntity(['Session', userdata.sid], function (err, res) {
            if (err || !res || !res.data) return socket.disconnect();

            try {
                var session = JSON.parse(res.data);
            } catch (e) {
                return socket.disconnect();
            }

            //If the session doesn't have the username, or the username doesn't match, refuse connection
            if (!session.passport && !session.passport.user && session.passport.user != userdata.user)
                return socket.disconnect();

            //Find user in Cloud Datastore. If found, setup connection
            storage.dbClient.getEntity(['User', session.passport.user], function (err, user) {
                if (err || !user) return socket.disconnect();
                handleSocketConnection(user, socket);
            });

        });
    });

    function handleSocketConnection(user, socket) {
        console.log(user.firstName, "connected");
        socket.user = user.firstName;

        socket.emit('notice', 'NOTICE: ' + user.firstName + ' has joined');

        var room = 'room2';

		updateRooms(function(err, rooms){
            if(!err){
            	socket.emit('updaterooms', rooms);
            }
        });

		var roomData = {
			roomName: socket.room,
			userName: socket.user
		}
		
		if(socket.room){
			storage.dbClient.upsertEntity(['RoomUser', socket.room + ':' + socket.user], roomData, function (err) {
				if (err) console.log(err.message);
			});
		}

       socket.on('chat message', function (msg) {
			if(socket.room){
				//send message to current room
				if (msg) io.in(socket.room).emit('chat message', socket.user + ": " + msg);
				//store message
				var data = {
					channel: socket.room,
					created: new Date().toJSON(),
					message: msg,
					user: socket.user
				};
				storage.dbClient.saveEntity('Chat', data, function (err) {
					if (err) console.log(err.message);             
				});
			}
		});

        socket.on('switchRoom', function (newroom) {
            //leave current room
            console.log('old room: ' + socket.room);
            socket.leave(socket.room);
            socket.join(newroom);
            console.log('current room: ' + newroom);
            socket.emit('notice', 'NOTICE: you have connected to ' + newroom);
            socket.broadcast.to(socket.room).emit('notice', 'NOTICE: ' + socket.user + ' has left');
            socket.room = newroom;
            socket.broadcast.to(newroom).emit('notice', 'NOTICE: ' + socket.user + ' has joined');
            
            updateRooms(function(err, rooms){
            	if(!err){
            		socket.emit('updaterooms', rooms, newroom);
            	}
            });
        });

        socket.on('disconnect', function () {
            io.emit('notice', 'NOTICE: ' + socket.user + ' has left');
        });
    }
};