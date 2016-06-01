var externalIp = $('body').data('external-ip');
var userdata = $('body').data('userdata');

var socket = io.connect('ws://' + externalIp + ':65080/', {query: "userdata=" + JSON.stringify(userdata)});
$('form').submit(function () {
    socket.emit('chat message', $('#m').val());
    $('#m').val('');
    return false;
});

socket.on('chat message', function (msg) {
    $('#messages').append($('<li>').text(msg));
    window.scrollTo(0, document.body.scrollHeight);
});

//new stuff here
socket.on('notice', function (msg) {
    $('#messages').append($('<li id=notice>').text(msg));
});


socket.on('updaterooms', function (rooms, current_room) {
    $('#rooms').empty();
    $.each(rooms, function (key, value) {
        if (value == current_room) {
            $('#rooms').append('<div>' + value + '</div>');
        }
        else {
            $('#rooms').append('<div><a href="#" onclick="switchRoom(\'' + value + '\')">' + value + '</a></div>');
        }
    });
});


function switchRoom(room) {
    $('#messages').empty();
    socket.emit('switchRoom', room);
}

function createRoom(name) {
    socket.emit('createRoom', name);
}

function leaveRoom() {
    socket.emit('leaveRoom');
}