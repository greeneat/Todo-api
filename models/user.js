
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
            },
            findByToken: function(token){
                return new Promise(function(resolve,reject){
                    try{
                        var decodeJWT = jwt.verify(token,'qwerty@98');
                        var bytes = cryptojs.AES.decrypt(decodeJWT.token,'abc123!@#!');
                        var tokenData = JSON.parse(bytes.toString(cryptojs.enc.Utf8));
                        user.findById(tokenData.id).then(function(user){
                            if(user){
                                resolve(user);
                            }else{
                                reject();
                            }
                        },function(e){
                           reject(e); 
                        });
                            
                    }catch(e){
                        reject(e);
                    }
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