const mongoose = require('mongoose');

function connectToDb(){
    mongoose.connect(process.env.MONGODB_URI).then(() => {
        console.log("Connected to DB");
        
    })
}

module.exports = connectToDb;