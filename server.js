let express = require('express')
let app = express();

let path = require('path');
app.use(express.static(__dirname + '/dist/chatApp'));
app.get('/*', (req, res) => res.sendFile(path.join(__dirname)));

let http = require('http');
let server = http.Server(app);

let socketIO = require('socket.io');
let io = socketIO(server);

const port = process.env.PORT || 3000;
var clients = [];
var busyUsers = [];
var numUsers = 0;
io.on('connection', (socket) => {
    var addedUser = false;
    console.log('user connected');

    // when the client emits 'new message', this listens and executes
    // socket.on('new-message', (data) => {
    //     // we tell the client to execute 'new message'
    //     socket.broadcast.emit('new-message', {
    //         username: socket.username,
    //         message: data
    //     });
    // });
    socket.on('new-message', (data) => {
        socket.broadcast.to(data.toid).emit('new-message', data);
    });

    socket.on('add user', (username) => {
        if (addedUser) return;
        clients.push({
            id: socket.id,
            username: username,
            busy: false
        });
        // we store the username in the socket session for this client
        socket.username = username;
        ++numUsers;
        addedUser = true;
        socket.emit('login-user-count', {
            numUsers: numUsers
        });
        socket.emit('logged-user', {
            username: socket.username,
            numUsers: numUsers
        });
        // echo globally (all clients) that a person has connected
        socket.broadcast.emit('user joined', {
            username: socket.username,
            numUsers: numUsers
        });

        setInterval(() => {
            socket.broadcast.emit('client-list', clients);
        }, 3000);
    });

    // when the client emits 'typing', we broadcast it to others
    socket.on('typing', () => {
        socket.broadcast.emit('typing', {
            username: socket.username
        });
    });

    // when the client emits 'stop typing', we broadcast it to others
    socket.on('stop typing', () => {
        socket.broadcast.emit('stop typing', {
            username: socket.username
        });
    });

    // when the user disconnects.. perform this
    socket.on('disconnect', () => {
        if (addedUser) {
            --numUsers;
            if (clients.length > 0) {
                var i = 0;
                clients.forEach(a => {
                    if (a.username == socket.username) {
                        clients.splice(i, 1);
                    }
                    i++;
                });
            }
            // var index = clients.indexOf(socket.username);
            // if (index !== -1) {
            //     clients.splice(index, 1);
            // }

            if (busyUsers.length > 0) {
                var i = 0;
                busyUsers.forEach(a => {
                    if (a.username == socket.username) {
                        busyUsers.splice(i, 1);
                    }
                    i++;
                });
            }
            // echo globally that this client has left
            socket.broadcast.emit('user-left', socket.username);
        }
    });

    /***
     * Section Video call
     * following requests are used for video call
     */
    socket.on('video-call', (data) => {
        socket.broadcast.to(data.toid).emit('video-call', data);
    });
    socket.on('video-call-accept', (data) => {
        socket.broadcast.to(data.toid).emit('video-call-accept', data);
    });
    socket.on('video-call-reject', (data) => {
        socket.broadcast.to(data.toid).emit('video-call-reject', data);
    });
    socket.on('get-busy-user', () => {
        socket.broadcast.emit('get-busy-user', busyUsers);
    });
    socket.on('busy-user', () => {
        busyUsers.push({
            id: socket.id,
            username: socket.username
        });
        socket.broadcast.emit('get-busy-user', busyUsers);
    });
    socket.on('end-video-call', (data) => {
        if (busyUsers.length > 0) {
            var usr1 = busyUsers.find(a => a.username == socket.username);
            var index1 = busyUsers.indexOf(usr1);
            busyUsers.splice(index1, 1);

            var usr2 = busyUsers.find(a => a.username == data.toname);
            var index2 = busyUsers.indexOf(usr2);
            busyUsers.splice(index2, 1);
        }
        socket.broadcast.to(data.toid).emit('video-call-ended', data);
        socket.broadcast.emit('get-busy-user', busyUsers);
    });
    // when the caller emits 'call-request', this listens and executes
    socket.on('call-request', (data) => {
        // we tell the client to execute 'call-request'
        socket.broadcast.to(data.toid).emit('call-request', {
            username: socket.username,
            data: data
        });
    });
});

server.listen(port, () => {
    console.log(`started on port: ${port}`);
});