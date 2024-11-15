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
    
    let model = {
        username: '',
        password: '',
    }

    res.render('login', model);
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
        res.render('login')
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
    
    let model = {
        username: '',
        password: '',
        email: '',
        age: ''
    }

    res.render('register', model);
});

app.post('/register', async (req, res) => {
    let model = req.body;

    let pwd = model.password

    if (model.username != '' && model.password != '') {

    bcrypt.hash(pwd, saltRounds, function(err, password) {
        console.log(password);
        req.body.password = password;
    })

    DAL.createUser(model);

    console.log("REGISTER POSTED", model, req.session.username);

    res.redirect('/login')
    } else {
        console.log("COULDN'T REGISTER USER");
        res.render('register', model)
    }

    // try {
    //     if (!model.username || !model.password) {
    //         throw new Error('Username and password are required.');
    //     }
    //     await DAL.createUser(body);
    //     console.log("User registered successfully:", model.username);
    //     res.redirect('/login');
    // } catch (error) {
    //     console.error('Error registering user:', error);
    //     res.render('register');
    // }
});

app.get('/profile', async (req, res) => {
    console.log("PROFILE REQUEST", req.session.username);

    try {
        const userProfile = await DAL.getUserProfile(req.session.username);

        if (!userProfile) {
            return res.status(404).send('User not found');
        }

        res.render('profile', userProfile);
    } catch (error) {
        console.error('Error retrieving user information:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/profile/:username', async (req, res) => {
    console.log("PROFILE REQUEST", req.params.username);
    const username = req.params.username;
    try {
        const users = await DAL.getUsers();
        const user = users.find(user => user.username === username);

        if (!user) {
            return res.status(404).send('User not found');
        }

        res.render('profile', { user: user });
    } catch (error) {
        console.error('Error retrieving user information:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/profile', (req, res) => {
    let username = req.session.username;
    const newUsername = req.body.username;
    const newEmail = req.body.email;
    const newAge = req.body.age;

    DAL.UpdateUser(username, newUsername, newEmail, newAge)

    res.redirect('/profile');
});

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