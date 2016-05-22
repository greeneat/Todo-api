var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');

var app = express();
var PORT = process.env.PORT || 3000;
var todos = [];
var todoNextId = 1;

app.use(bodyParser.json());

app.get('/',function(req,res){
    res.send('Todo API Root');
});

app.get('/todos',function(req,res){
    var queryParams = req.query;
    var filtersTodos = todos;
    if(queryParams.hasOwnProperty('completed') && queryParams.completed === 'true'){
        filtersTodos = _.where(filtersTodos,{completed: true});
    } else if (queryParams.hasOwnProperty('completed') && queryParams.completed === 'false'){
        filtersTodos = _.where(filtersTodos,{completed: false});
    }
    
    if(queryParams.hasOwnProperty('q') && queryParams.q.length > 0){
        filtersTodos = _.filter(filtersTodos,function(todo){
           return todo.description.toLowerCase().indexOf(queryParams.q.toLowerCase()) > -1; 
        });
    }
    res.json(filtersTodos); 
});

app.get('/todos/:id',function(req,res){
   var todoId = parseInt(req.params.id);
   var matchedTodo;
   
   todos.forEach(function(todo){
      if(todoId === todo.id){
        matchedTodo = todo;   
      } 
   });
   
   if(matchedTodo){
    res.json(matchedTodo);
   }else{
    res.status(404).send(); 
   }
});

app.post('/todos',function(req,res){
   var body = req.body;
   
   body.id = todoNextId;
   todoNextId++;
   
   todos.push(body);
   console.log('description ' + body.description);
   res.json(body); 
});

app.delete('/todos/:id',function(req,res){
    var todoId = parseInt(req.params.id);
    var matchedTodo = _.findWhere(todos,{id: todoId});
    
    if(!matchedTodo){
        res.status(404).json({"error":"no todo fund with that id"});
    } else {
        todos = _.without(todos,matchedTodo);
        res.json(matchedTodo);
    }
});

app.put('/todos/:id',function(req,res){
    var todoId = parseInt(req.params.id,10);
    var matchedTodo = _.findWhere(todos,{id: todoId});
    var body = _.pick(req.body,'description','completed');
    var validAttributes = {};
    
    if(body.hasOwnProperty('completed') && _.isBoolean(body.completed)){
        validAttributes.completed = body.completed;
    }else if(body.hasOwnProperty('completed')){
        return res.status('400').send();
    }
    
    if(body.hasOwnProperty('description') && _.isString(body.description) && body.description.trim().length > 0){
        validAttributes.description = body.description;
    }else if(body.hasOwnProperty('description')){
        return res.status('400').send();
    }        
    
    _.extend(matchedTodo,validAttributes);
    res.json(matchedTodo);
});

app.listen(PORT,function(){
    console.log('Express Listening on port '+PORT);
})