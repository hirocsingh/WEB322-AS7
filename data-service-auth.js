const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
let Schema = mongoose.Schema;
const saltRounds = 10;

var userSchema = new Schema({
    "user": {
        "type": String,
        "unique": true
    },
    "password": String
});

let User;



module.exports.initialize = function() {
    return new Promise(function(resolve, reject) {
        let db = mongoose.createConnection("mongodb://asingh:azertyuiop1234@ds133876.mlab.com:33876/web322_week8");
        db.on('error', (err) => {
            reject(err);
        });
        db.once('open', () => {
            User = db.model("users", userSchema);

            resolve();
        });
    });
};



module.exports.registerUser = function(userData) {
    return new Promise((resolve, reject) => {
        if (userData.password != userData.password2) {
            reject("Passwords don't match");
        } else {
            bcrypt.genSalt(saltRounds, function(err, salt) {
                bcrypt.hash(userData.password, salt, function(err, hash) {
                    if (err) {
                        reject("There was an error encrypting the password")
                    } else {

                        userData.password = hash;
                        var newUser = new User(userData);
                        newUser.save((err) => {
                            if (err) {
                                if (err.code == 11000) {
                                    reject("Username already taken");
                                } else {
                                    reject("Cannot create a new user: " + err.message);
                                }
                            } else {
                                resolve();
                            }
                        });
                    }
                });
            });
        }
    });
}

module.exports.checkUser = function(userData) {
    return new Promise((resolve, reject) => {
        User.find({ "user": userData.user })
            .exec()
            .then((users) => {
                bcrypt.compare(userData.password, users[0].password)
                    .then((res) => {
                        if (res) {
                            resolve();
                        } else {
                            if (users.length == 0) {
                                reject(userData.user + " not found");
                            } else if (userData.password != users[0].password) {
                                reject("Incorrect Password for: " + userData.user);
                            }
                        }
                    })
                    .catch((err) => {
                        reject("Unable to find " + userData.user);
                    });
            });
    });
}