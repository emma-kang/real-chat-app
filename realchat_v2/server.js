// RealChat v2.0.0
// Date: 2018-07-18 ~ 2018-07-29
// Writer: Sungjun Hong, Yuseon Kang
// Server.js 

var express = require('express');
var app = express();
const port = process.env.PORT || 8080;
var bodyParser = require('body-parser');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var alert = require('alert-node'); // in order to use alert
var session = require('express-session');
var mysql = require('mysql');

// var sha256 = require('sha256');
// var salt = 'fEWFGEG#3543fdfweq#$R@#';
// var fs = require('fs');
// var ejs = require('ejs');

// clearmysql information in heroku 
// To connect database (mySQL)
var conn = mysql.createConnection({
    host : 'host',
    user : 'user',
    password : 'password',
    database : 'database'
});

conn.connect();

app.use(express.static('./sub')); // In order to use CSS file

// app.use('/script', express.static(__dirname + "./sub/html"));

app.use(bodyParser.urlencoded({extended: false})); // POST method 
app.use(session({
    secret : 'defWgw#$@$fadd1123',
    resave : false,
    saveUninitialized : true
}));

// app.set('view engine', 'html');
// app.set('views', './sub/html');
// app.engine('html', ejs.renderFile);

app.set('view engine', 'jade'); // in order to use jade, I need to install jade npm. Do not need to require npm
app.set('views', './sub/jade');

//////////////////////////////////////////////////////
// Router

app.get('/', (req, res) => {
    res.render('main'); 
});

app.get('/login', (req, res) => {
    delete req.session.userid;
    res.render('login');
});

app.get('/login/success', (req, res) => {
    res.render('loginSuccess', {userid : loginid});
});

app.post('/login/success', (req, res) => {
    global.loginid = req.body.id; // loginid -> unique
    var pwd = req.body.pwd;

    var Selectsql = 'SELECT *FROM USER';
    conn.query(Selectsql, (err, rows, fields) => {
        if(err){
            throw err;
            res.status(404).send('Error Occured in /login/success');
        }
        else{
            // delete req.session.nickname; // initialize!! necessary!!

            for(var i=0; i<rows.length; i++){
                // if(id === rows[i].ID && sha256(pwd+salt) === rows[i].PWD){
                //     req.session.nickname = rows[i].NICKNAME;
                //     res.redirect('/welcome');
                // }
                // else if(id === rows[i].ID || sha256(pwd+salt) === rows[i].PWD){
                //     res.redirect('/welcome');
                if(loginid === rows[i].USERID){
                    if(pwd === rows[i].PWD){
                        req.session.userid = rows[i].USERID;
                        res.render('loginSuccess', {userid : req.session.userid});
                        break;
                    }
                    else if(pwd !== rows[i].PWD){
                        res.render('nomatch');
                        break;
                    }
                }
                else if(loginid !== rows[i].USERID){
                    if(i == rows.length-1){
                        res.render('nomatch');
                    }
                }
            }
        }
    })
});


app.get('/signup', (req, res) => {
    res.render('signup');
});

app.post('/signup/success', (req, res) => {
    var id = req.body.id;
    var pwd = req.body.pwd;
    var fname = req.body.fname;
    var lname = req.body.lname;
    var email = req.body.email;
    
    var Selectsql = 'SELECT *FROM USER';
    conn.query(Selectsql, (err, rows, fields) => {
        if(err){
            throw err;
            res.status(404).send('Error Occured in /signup/success');
        }
        else{ // if there is same ID with input ID 
            for(var i=0; i<rows.length; i++){
                if(id === rows[i].USERID){
                    alert("There is already existing ID");
                    break;
                    // res.render('existID');
                    // break;
                }
            }
            if(i == rows.length){ // if there is no same ID with input ID
                var Insertsql = 'INSERT INTO USER (USERID, PWD, FIRSTNAME, LASTNAME, EMAIL) VALUES (?, ?, ?, ?, ?)';
                var params = [id, pwd, fname, lname, email];
                
                conn.query(Insertsql, params, (err, rows, fields) => {
                    if(err){
                        throw err;
                        res.status(404).send('Error Occured in /signup/success');
                    }
                    else{
                        res.render('signupSuccess');
                    }
                })
            }
        }
    })
});

app.get('/login/logout', (req, res) => {
    delete req.session.userid;
    res.redirect('/login');
});

app.get('/account', (req, res) => {
    var accountID, accountPWD, accountFNAME, accountLNAME, accountEMAIL;

    var Selectsql = "SELECT *FROM USER";
    conn.query(Selectsql, (err, rows, fields) => {
        if(err){
            throw err;
            res.status(404).send('Error Occured in /account');
        }
        else{
            for(var i=0; i<rows.length; i++){
                if(loginid === rows[i].USERID){
                    accountID = rows[i].USERID;
                    accountPWD = rows[i].PWD;
                    accountFNAME = rows[i].FIRSTNAME;
                    accountLNAME = rows[i].LASTNAME;
                    accountEMAIL = rows[i].EMAIL;
                    res.render('account', {ID : accountID, PWD : accountPWD, FNAME : accountFNAME, 
                        LNAME : accountLNAME, EMAIL : accountEMAIL});
                }
            }
        }
    })
});

app.get('/accountupdate', (req, res) => {
    res.render('accountUpdate', {ID : loginid});
});

app.post('/myaccountupdatereflect', (req, res) => {
    var pwd = req.body.pwd;
    var fname = req.body.fname;
    var lname = req.body.lname;
    var email = req.body.email;

    var Selectsql = 'SELECT *FROM USER';
    conn.query(Selectsql, (err, rows, fields) => {
        if(err){
            throw err;
            res.status(404).send('Error Occured in /myaccountupdatereflect');
        }
        else{
            for(var i=0; i<rows.length; i++){
                if(loginid === rows[i].USERID){
                    var Updatesql = 'UPDATE USER SET PWD = ?, FIRSTNAME = ?, LASTNAME = ?, EMAIL = ? WHERE USERID = ?';
                    var params = [pwd, fname, lname, email, loginid];
                    conn.query(Updatesql, params, (err, rows, fields) => {
                        if(err){
                            throw err;
                            res.status(404).send('Error occured in /myaccountupdatereflect');
                        }
                        else{
                            res.render('updateSuccess', {ID : loginid, PWD : pwd, FNAME : fname, LNAME : lname, EMAIL : email});
                        }
                    })
                }
            }
        }
    })
});

app.get('/accountdelete', (req, res) => {
    res.render('accountDel', {ID : loginid});
});

app.get('/accountdelsuccess', (req, res) => {
    var Selectsql = 'SELECT *FROM USER';
    conn.query(Selectsql, (err, rows, fields) => {
        if(err){
            throw err;
            res.status(404).send('Error Occured in /accountdelsuccess');
        }
        else{
            for(var i=0; i<rows.length; i++){
                if(loginid === rows[i].USERID){
                    var Deletesql = 'DELETE FROM USER WHERE USERID = ?';
                    conn.query(Deletesql, loginid, (err, rows, fields) => {
                        if(err){
                            throw err;
                            res.status(404).send('Error occured in /accountdelsuccess');
                        }
                        else{
                            res.render('delSuccess');
                        }
                    })
                }
            }
        }
    })
});

app.get('/startchat', (req, res) => { // In the case of startchat.html -> can not be changed as jade (Need to use sendFile)
    res.sendFile(__dirname + '/sub/html/startchat.html'); // do not put ./
});

var nicknames = [];
// 'connection' event
io.on('connection', function(socket){
    socket.on('new user', function(data, callback){
      if(nicknames.indexOf(data) != -1){ // if there's data in nicknames array 
        callback(false);
      }
      else{ 
        callback(true);
        socket.nickname = data;
        nicknames.push(socket.nickname);
        updateNicknames();
      }
    })
    function updateNicknames(){
        // send message to client 
        io.emit('usernames', nicknames);
    }
    // get message from client 'send message' event 
    socket.on('send message', function(data){
      io.emit('new message', {msg:data, nick:socket.nickname});
    })
    // 'disconnect' event 
    socket.on('disconnect', function(data){
      if(!socket.nickname) return;
      // when the user went out from the nickname array
      nicknames.splice(nicknames.indexOf(socket.nickname), 1); 
      updateNicknames();
    })
});

// conn.end();

server.listen(port, () => { // never app.listen
    console.log(`Express http server listening on ${port}`);
});
