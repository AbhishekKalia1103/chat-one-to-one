var express = require("express");
var app = express();

app.set('view engine', 'ejs');

app.get('/home', (req, res) => {
    res.render('home');
});

var http = require("http").createServer(app);

var io = require("socket.io")(http);

var mysql = require("mysql");

var bodyParser = require("body-parser");

app.use(bodyParser.urlencoded());

var connection = mysql.createConnection({
    "host": "localhost",
    "user": "root",
    "password": "",
    "database": "web_chat"
});

connection.connect(function (error) {
    //show error
});

app.use(function (request, result, next) {
    result.setHeader("Access-Control-Allow-Origin", "*");
    next();
});

app.post("/get_messages", function (request, result) {
    connection.query("SELECT * FROM messages WHERE (sender = '" + request.body.sender + "' AND reciever = '" + request.body.reciever + "') OR (sender = '" + request.body.reciever + "' AND reciever = '" + request.body.sender + "')", function (error, messages) {
        // response will be in JSON
        result.end(JSON.stringify(messages));
    });
});
var users = [];

io.on("connection", function (socket) {
    console.log("User connected", socket.id);

    socket.on("user_connected", function (username) {
        users[username] = socket.id;

        io.emit("user_connected", username)
    });

    socket.on("send_message", function (data) {
        // send event to reciever
        var socketId = users[data.reciever];

        io.to(socketId).emit("new_message", data);

        connection.query("INSERT INTO messages (sender, reciever, message) VALUES ('" + data.sender + "', '" + data.reciever + "', '" + data.message + "')", function (error, result) {
            //
        });
    })
});

http.listen(3000, function () {
    console.log("Server started");
});