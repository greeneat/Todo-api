var express = require('express');
var bodyParser = require('body-parser');
var crypto = require('crypto');
var _ = require('underscore');
var db = require('./db.js');
var middleware = require('./middleware.js')(db);

var app = express();
var PORT = process.env.PORT || 3000;
var todos = [];
var todoNextId = 1;

app.use(bodyParser.json());

app.get('/',function(req,res){
    res.send('Todo API Root');
});

app.get('/todos',middleware.requireAuthentication,function(req,res){
    var queryParams = req.query;
    var where = {};
    
    if(queryParams.hasOwnProperty('completed') && queryParams.completed === 'true'){
        where.completed = true;
    } else if (queryParams.hasOwnProperty('completed') && queryParams.completed === 'false'){
        where.completed = false;
    }
    
    if(queryParams.hasOwnProperty('q') && queryParams.q.length > 0){
        where.description = {
            $like:'%'+ queryParams.q +'%'
        };
    }
    
    db.todo.findAll({where: where}).then(function(todos){
        res.json(todos);
    },function(e){
        res.status(500).send();
    })
});

app.get('/todos/:id',middleware.requireAuthentication,function(req,res){
   var todoId = parseInt(req.params.id);
   
   db.todo.findById(todoId).then(function(todo){
       if(!!todo){
           res.json(todo.toJSON());    
       }else{
           res.status(404).send();
       }
   },function(e){
      res.status(500).send(); 
   });
});

app.post('/todos',middleware.requireAuthentication,function(req,res){
   var body = _.pick(req.body,'description','completed');
   db.todo.create(body).then(function(todo){
       console.log('Finish!');
       res.json(todo.toJSON());
   },function(e) {
       res.status(404).json(e);    
   });
});

app.delete('/todos/:id',middleware.requireAuthentication,function(req,res){
    var todoId = parseInt(req.params.id);
    db.todo.destroy({
        where:{
            id: todoId
        }
    }).then(function(rowDeleted){
        if(rowDeleted === 0){
            res.status(404).json({
                error: 'No todo with Id'
            });
        }else{
            res.status('204').send();
        }
    },function(){
        res.status(500).send();
    });
});

app.put('/todos/:id',middleware.requireAuthentication,function(req,res){
    var todoId = parseInt(req.params.id,10);
    var body = _.pick(req.body,'description','completed');
    var attributes = {};
    
    if(body.hasOwnProperty('completed')){
        attributes.completed = body.completed;
    }
    
    if(body.hasOwnProperty('description')){
        attributes.description = body.description;
    }        
    
    db.todo.findById(todoId).then(function(todo){
        if(todo){
            todo.update(attributes).then(function (todo){
                res.json(todo.toJSON());
            },function (e){
                res.status(400).json(e);
            });
        }else{
            res.status(404).send();
        }
    },function (){
       res.status(500).send(); 
    });
});

app.post('/users',function(req,res){
   var body = _.pick(req.body,'email','password');
   
   db.user.create(body).then(function(user){
       res.json(user.toPublicJSON());
   },function(e){
       res.status('400').json(e); 
   }); 
});

app.post('/users/login', function (req,res){
   var body = _.pick(req.body,'email','password');
   
   db.user.authenticate(body).then(function (user){
       var token = user.generateToken('authentication');
       if(token){
           res.header('Auth',user.generateToken('authentication')).json(user.toPublicJSON());
       }else{
           res.status('401').send();
       } 
   }, function (){
       res.status('401').send();
   });
});

db.sequelize.sync().then(function(){
   app.listen(PORT,function(){
        console.log('Express Listening on port '+PORT);
    }) 
});