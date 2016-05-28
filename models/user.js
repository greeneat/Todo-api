
var crypto = require('crypto');
var _ = require('underscore');

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
                            var login_hash = crypto.createHmac('sha256', user.salt).update(body.password).digest('hex');
                            if(!user || user.password_hash !== login_hash){
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
            }
        }
    });
    return user;
}