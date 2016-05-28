
var crypto = require('crypto');
var _ = require('underscore');

module.exports = function(sequelize,Datatypes){
    return sequelize.define('user',{
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
        },
        instanceMethods: {
            toPublicJSON: function (){
                var json = this.toJSON();
                return _.pick(json,'id','email','createdAt','updatedAt');
            }
        }
    });
}