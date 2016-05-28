
var crypto = require('crypto');
var _ = require('underscore');
var cryptojs = require('crypto-js');
var jwt = require('jsonwebtoken');

module.exports = function(sequelize,Datatypes){
    var user = sequelize.define('user',{
       email: {
           type: Datatypes.STRING,
           allowNull: false,
           unique: true,
           validate: {
               isEmail: true
           }
       },
       salt: {
           type: Datatypes.STRING
       },
       password_hash: {
           type: Datatypes.STRING  
       },
       password: {
        type:Datatypes.VIRTUAL,
        allowNull: false,
        validate: {
            min: 7
        },
        set: function(value){
            var salt = crypto.randomBytes(128).toString('base64');
            var hash = crypto.createHmac('sha256', salt)
                   .update(value)
                   .digest('hex');
           
           this.setDataValue('password',value);
           this.setDataValue('salt',salt);
           this.setDataValue('password_hash',hash);
        }              
       } 
    },{
        hooks: {
            beforeValidate: function(user, options){
                if(typeof user.email === 'string'){
                    user.email = user.email.toLowerCase();
                }
            }
        },classMethods: {
            authenticate: function(body){
                return new Promise(function(resolve,reject){
                    if(typeof body.email !== 'string' || typeof body.password !== 'string'){
                        return reject();
                    } 
                    
                    user.findOne({
                        where: {
                            email: body.email
                        }
                    }).then(function (user){
                            if(!user){
                                return reject();
                            }
                            var login_hash = crypto.createHmac('sha256', user.salt).update(body.password).digest('hex');
                            if(user.password_hash !== login_hash){
                                return reject();
                            }
                            resolve(user);
                    },function(e){
                        reject();
                    });
                });
            }
        },
        instanceMethods: {
            toPublicJSON: function (){
                var json = this.toJSON();
                return _.pick(json,'id','email','createdAt','updatedAt');
            },
            generateToken: function(type){
                if(!_.isString(type)){
                    return undefined;
                }
                
                try{
                    var stringData = JSON.stringify({id: this.get('id'),type: type});
                    var encryptedData = cryptojs.AES.encrypt(stringData,'abc123!@#!').toString();
                    var token = jwt.sign({
                       token: encryptedData 
                    },'qwerty@98');
                    
                    return token;
                }catch(e){
                    return undefined;
                }
            }
        }
    });
    return user;
}