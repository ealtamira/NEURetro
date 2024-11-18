const express = require('express');
const session = require('express-session');

const { DAL } = require('./mongo-dal') 

const bcrypt = require('bcrypt');
const path = require('path');
const { MongoClient } = require('mongodb');
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
    console.log("LOGIN REQUEST",  req.session.username);
    
    if (req.session.username != undefined) {
        res.redirect('/');
    } else {
        let model = {
            username: '',
            password: '',
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
                    password: ''
                }

                res.render('login', model)
            }
        })
    } else {
        let model = {
            username: '',
            password: ''
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
        age: ''
    }

    res.render('register', model);
    }
});

app.post('/register', async (req, res) => {
    let model = req.body;

    if (model.username != '' && model.password != '') {

        data = await DAL.getUserByUsername(model.username);
        
        if (data != null || data != undefined) {
            console.log("USER ALREADY EXISTS");
            res.render('register', model)
        } else {
            password = await bcrypt.hash(model.password, saltRounds);
        
            model.password = password;

            DAL.createUser(model);

            console.log("REGISTER POSTED", model, req.session.username);

            res.redirect('/login')
        }

    } else {
        console.log("COULDN'T REGISTER USER");
        res.render('register', model)
    }
});

app.get('/resetpassword', async (req, res) => {
    console.log("RESET PASSWORD REQUEST", req.session.username);

    let model = {
        username: ''
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
                username: username
            }

            res.render('resetpassword', model)
        }
    } else {
        console.log("NO USER EXISTS.")

        let model = {
            username: ''
        }

        res.render('resetpassword')
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

    res.render('leaderboard')
});

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