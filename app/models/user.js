var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,

  checkPassword: function(pass) {
    var salt = this.get('salt');
    var hash = bcrypt.hashSync(pass, salt);
    return (hash === this.get('password'));
  },

  hashPassword: function(){
    var pass = this.get('password');
    var salt = bcrypt.genSaltSync();
    this.set('salt', salt);
    var hash = bcrypt.hashSync(pass, salt);
    this.set('password', hash);
  },

  initialize: function(){
    this.on('creating', function(model, attrs, options){
      this.hashPassword();
    });
  }

});

module.exports = User;
