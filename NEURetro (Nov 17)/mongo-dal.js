const {json} = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const uri = "mongodb+srv://OASIS:admin@neuretro.y19ds.mongodb.net/?retryWrites=true&w=majority&appName=NEURetro";

const client = new MongoClient(uri);

exports.DAL = {
    createUser: async function(data) {
        await client.connect();

        const database = client.db("NEURetroDB");
        const collection = database.collection("UsersCollection");

        const result = await collection.insertOne(data);

        console.log(result)
        
        await client.close();
    },
    getUserByUsername: async function(username) {
        await client.connect();

        const database = client.db("NEURetroDB");
        const collection = database.collection("UsersCollection");

        console.log(username);
        const result = await collection.findOne({username: username});
        console.log(result);

        console.log("Result: ", result);

        await client.close;
        
        return result;
    },
    resetUserPassword: async function(username, password) {
        await client.connect();

        const database = client.db("NEURetroDB");
        const collection = database.collection("UsersCollection");

        const result = await collection.updateOne({username: username},
            {
                $set: {
                    password: password
                }
            }
        );

        console.log("POST UPDATE", result);

        await client.close();
    },
    getProfileByUserID: async function(userID) {
        await client.connect();

        const database = client.db("NEURetroDB");
        const collection = database.collection("UsersCollection");

        let id = Object.createFromHexString(userID);

        const result = await collection.findOne({_id: id});

        console.log("Result: ", result);

        await client.close();
        
        return result;
    },
    setProfileStats: async function(username, reqUsername, reqAge) {
        await client.connect();

        const database = client.db("NEURetroDB");
        const collection = database.collection("UsersCollection");

        var newUser;
        var newAge;

        let data = await collection.findOne({username: username});

        if (reqUsername == "") {
            newUser = data.username;
        } else {
            let userCheck = await collection.findOne({username: reqUsername})

            if (userCheck == null || userCheck == undefined) {
            newUser = reqUsername
            } else {
                console.log(userCheck)
                newUser = data.username
            }
        }

        if (reqAge == "") {
            newAge = data.username;
        } else {
            newAge = reqAge
        }

        const result = await collection.updateOne({username: username},
            {
                $set: {
                    username: newUser,
                    age: newAge
                }
            }
        )

        returnData = await collection.findOne({username: newUser})

        await client.close();

        return returnData;
    }
}