const mongoose = require('mongoose');

mongoose.connect('mongodb://0.0.0.0/resume-pro').then(() => {
    console.log("Connected to DB");
});

const userSchema = mongoose.Schema({
    name: String,
    username: String,
    email: String,
    password: String,
    posts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'post',
        },
    ]
});

const userModel = mongoose.model('user',userSchema);

module.exports = userModel;

 