var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,

  checkPassword: function(pass) {
    // check this user's password
    var saltedPass = pass + model.get('salt');
    var hash = bcrypt.hashSync(saltedPass);
    return (hash === model.get('password'));
  },

  hashPassword: function(model){
    var pass = model.get('password');
    var salt = Math.random().toString().substring(2);
    model.set('salt', salt);

    var saltedPass = pass + salt;
    var hash = bcrypt.hashSync(saltedPass);
    model.set('password', hash);
  },

  initialize: function(){
    this.on('creating', function(model, attrs, options){
      this.hashPassword(model);
    });
  }

});

module.exports = User;
