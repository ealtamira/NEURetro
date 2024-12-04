const express = require('express');
const session = require('express-session');

const { DAL } = require('./mongo-dal') 

const bcrypt = require('bcrypt');
const path = require('path');
const { MongoClient } = require('mongodb');
const { register } = require('module');
const saltRounds = 10;

const app = express();
const PORT = 7777;

let sessionOptions = {
    secret: 'MokuleleCostcoPizza',
    cookie: {}
}

app.use(session(sessionOptions));

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded());

app.post('/submitscore/:score', (req, res) => {
    let username = req.session.username;

    let score = Number(req.params.score);

    console.log("Test Score", score)

    if (username != undefined || username != null) {
        DAL.submitScore(username, score);
    } else {
        console.log("unable to submit, user is a guest")
    }
});

app.get('/', errorWrap((req, res) => {
    let username = req.session.username;
    let userID = req.session.userID;

    console.log("HOME REQUEST", username);

    let model = {
        username: username,
        userID: userID,
        header: './partials/header.ejs'
    }

    res.render('home', model);
}))

app.get('/login', (req, res) => {
    let username = req.session.username;
    let userID = req.session.userID;

    console.log("LOGIN REQUEST",  req.session.username);
    
    if (req.session.username != undefined) {
        res.redirect('/');
    } else {
        let model = {
            username: '',
            password: '',
            username: username,
            userID: userID,
            header: './partials/header.ejs',
            errorText: ''
        }

        res.render('login', model);
    }
});

app.post('/login', async (req, res) => {
    console.log("LOGIN POSTED", req.body, req.session.username);
    
    let username = req.body.username;
    let password = req.body.password;

    let data = await DAL.getUserByUsername(username);

    console.log(data)

    if (data != null || data != undefined) {
        let userID = data._id;
        let userMatch = data.username;

        let hash = data.password;

        bcrypt.compare(password, hash, function(err, result) {
            if(err) {
                throw err;
            }

            if (result && username == userMatch) {
                console.log("Passed the login screen.");

                req.session.username = username
                req.session.userID = userID;

                res.redirect("/")
            } else {
                console.log("LOGIN FAILED. Back to the login screen for you!");

                let model = {
                    username: username,
                    userID: req.session.userID,
                    password: '',
                    header: './partials/header.ejs',
                    errorText: 'Incorrect username or password.'
                }

                res.render('login', model)
            }
        })
    } else {

        let model = {
            username: '',
            userID: req.session.userID,
            password: '',
            header: './partials/header.ejs',
            errorText: 'Incorrect username or password.'
        }

        res.render('login', model)
    }

    // try {
    //     const users = await DAL.getUsers();
    //     const user = users.find(user => user.username === username);

    //     if (user && await bcrypt.compare(password, user.password)) {
    //         // Valid response
    //         console.log("Login successful");
    //         req.session.username = user.username;
    //         res.redirect("/homelogin");
    //     } else {
    //         // Invalid response
    //         console.log("Login failed");
    //         res.render("login");
    //     }
    // } catch (error) {
    //     console.error('Error during login:', error);
    //     res.status(500).send('Internal Server Error');
    // }
});

app.get('/register', (req, res) => {
    console.log("REGISTER REQUEST", req.session.username);
    
    if (req.session.username != undefined) {
        res.redirect('/');
    } else {

    let model = {
        username: '',
        password: '',
        email: '',
        age: '',
        errorText: '',
        userID: req.session.userID,
        header: './partials/header.ejs'
    }

    res.render('register', model);
    }
});

app.post('/register', async (req, res) => {
    let model = {
        username: req.body.username,
        password: req.body.password,
        email: req.body.email,
        age: req.body.age,
        userID: req.session.userID,
        errorText: '',
        header: './partials/header.ejs'
    };


    let userData = {
        username: req.body.username,
        password: req.body.password,
        email: req.body.email,
        age: req.body.age,
        userID: req.session.userID,
        question1: req.body.question1,
        question2: req.body.question2,
        question3: req.body.question3,
        highScore: 0
    }
    

    if (model.username != '' && model.password != '') {

        data = await DAL.getUserByUsername(model.username);
        
        if (data != null || data != undefined) {
            console.log("USER ALREADY EXISTS");

            model.errorText = "User Already Exists.";

            res.render('register', model);

        } else {
            password = await bcrypt.hash(model.password, saltRounds);
        
            model.password = password;
            userData.password = password;

            DAL.createUser(userData);

            console.log("REGISTER POSTED", model, req.session.username);

            res.redirect('/login')
        }

    } else {
        model.errorText = "Couldn't Register User."

        console.log("COULDN'T REGISTER USER");
        res.render('register', model)
    }
});

app.get('/resetpassword', async (req, res) => {
    console.log("RESET PASSWORD REQUEST", req.session.username);

    let model = {
        username: '',
        userID: req.session.userID,
        header: './partials/header.ejs',
        errorText: ''
    }

    res.render('resetpassword', model)
});

app.post('/resetpassword', async (req, res) => {
    let username = req.body.username;
    let pwd = req.body.password;

    let data = await DAL.getUserByUsername(username);

    if (data != null | data != undefined) {
        if (req.body.question1 == data.question1 && req.body.question2 == data.question2 && req.body.question3 == data.question3) {
            console.log("Correct Information, resetting password..")

            password = await bcrypt.hash(pwd, saltRounds);
            
            await DAL.resetUserPassword(username, password);

            res.redirect('/login')
        } else {
            console.log("INCORRECT SECURITY QUESTIONS.")

            let model = {
                username: username,
                errorText: 'Incorrect Security Questions.',
                userID: req.session.userID,
                header: './partials/header.ejs'
            }

            res.render('resetpassword', model)
        }
    } else {
        console.log("NO USER EXISTS.")

        let model = {
            username: username,
            errorText: 'Incorrect Security Questions.',
            userID: req.session.userID,
            header: './partials/header.ejs'
        }

        res.render('resetpassword', model)
    }
});

app.get('/profile/:userName', errorWrap(async (req, res) => {
    let searchRes = req.query.search;
    console.log("Search Box:", searchRes);

    var params;
 
    if (searchRes == "") {
        params = req.session.username;
        console.log("Set to  " + params)
    } else if ( !searchRes || searchRes == "{}") {
        params = req.params["userName"];
    } else {
        let info = await DAL.getUserByUsername(searchRes);
        if (!info)  {
            console.log("Invalid");
            res.redirect('/');
            return;
        } else {
        params = info._id;
        res.redirect(`/profile/${params}`);
        return;
        }
    }

    let username = req.session.username;

    var data = {}

    if (params.length > 0) {
        data = await DAL.getUserByUsername(params);
    } else {
        data = {
            username: "",
            _id: ""
        }
    }

    //console.log(data);

    let UName = data.username;
    let UID = data._id;
    let age = data.age;
    
    let model = {
        username: UName,
        userID: UID,
        sUName: username,
        age: age,
        header: './partials/header.ejs'
    }
    
    res.render(`profile`, model);
}));

app.post('/profile', errorWrap(async (req, res) => {
    let username = req.session.username;
    let newUsername = req.body.username;
    let newAge = req.body.age;

    data = await DAL.setProfileStats(username, newUsername, newAge);

    req.session.username = newUsername;

    let model = {
        username: data.username,
        userID: data._id,
        sUName: req.session.username,
        age: data.age,
        header: './partials/header.ejs'
    }

    res.render(`profile`, model);
}));

app.get('/logout', (req, res) => {
    console.log("LOGOUT REQUEST", req.session.username);

    req.session.destroy();

    res.redirect('/');
});

app.get('/leaderboard', async (req, res) => {
    console.log("LEADERBOARD REQUEST", req.session.username);

    let data = await DAL.getScores();

    for (var i = 0; i < data.length; i++) {
        console.log(data[i].username)
        console.log(data[i].highScore)
    }

    let model = {
        username: req.session.username,
        userID: req.session.userID,
        header: "./partials/header.ejs",
        data: data
    }

    res.render('leaderboard', model)
});

app.get('/game', async (req, res) => {
    let model = {
        username: req.session.username,
        userID: req.session.userID,
        header: './partials/header.ejs'
    }

    res.render('game', model)
})

app.listen(PORT, (req, res) => {
    console.log(`Express is now listening on http://localhost:${PORT}`);
});

function errorWrap(innerFunction) {
    return async function(req, res) {
        try { await innerFunction(req, res); }
        catch (e) {
            console.error(e);
            res.status(500);
            res.end("Internal error. Check console.");
        }
    }
}