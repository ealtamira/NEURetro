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
    }
}