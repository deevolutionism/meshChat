var bodyParser = require('body-parser');
var express = require("express");
var app = express();
var port = 8000;
var url='localhost'
var server = app.listen(port);
var io = require("socket.io").listen(server);
var redis = require('redis');
var client = redis.createClient();
var HOST = '127.0.0.1';
var PORT = '6379';
var client = redis.createClient(PORT, HOST);


var currentUser;
var chatHistory;


client.on('connect', function (err) {
  console.log('connected with redis database');
});


app.use(express.static(__dirname + '/'));//serve diectory this file is in
console.log('Simple static server listening at '+url+':'+port);

//socket.io stuff
io.sockets.on('connection', function (socket) {//open io connection
  
  socket.on('sendToRedis', function (data) { //put new registration into database
    client.hmset(data.userName, 'firstName', data.firstName, 'lastName', data.lastName, 'userName', data.userName, 'password', data.password);

  });

  socket.on('login', function (data) { //retrieve user from database to determine if they can login
    client.exists(data.userName, function (err, reply){
      if(reply === 1){ //log user in
        socket.emit('proceed', 1);
        client.hgetall(data.userName, function (err, object){
          console.log(object.firstName)
          currentUser = object.firstName;
        });
      } else { //doesn't exist, try again
        socket.emit('proceed', 0);
      }
    });
  });


  socket.on('getUserName', function (data) {
    socket.emit('userName', {userName: currentUser, message: data});
  });


  socket.on('toChatHistory', function (data){
    //commit message to redis database
    client.rpush('chatHistory', 'userName', data.userName, 'message', data.message );
    console.log('pushing message to chat history');


  });



  socket.on('requestChatHistory', function (data) {
    //pull chat history from redis database
    client.hgetall('chatHistory', function (err, object){
      console.log(object);
      chatHistory = object;
    })
    //sent chat history to client
    socket.emit('loadChatHistory', chatHistory);
    console.log('sending chatHistory data to client');
  });














});