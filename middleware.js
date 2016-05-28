module.exports = function(db){
    return {
        requireAuthentication: function(req,res,next){
            var token = req.get('Auth');
            
            db.user.findByToken(token).then(function (user){
               res.user = user;
               next();
            },function (e){
               res.status(401).send(); 
            });
        }
    }
};