const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

// ARRAY PARA ARMAZENAR OS USUÁRIOS CRIADOS
const users = [];

function checksExistsUserAccount(request, response, next) {
  
  const { username } = request.headers
  
  if (!username) {

    return response.status(400).json({ error: "Nenhum username foi informado no header!" })
  }
  
  const userFound = users.find( user => user.username === username )

  if (!userFound) {
    
    return response.status(404).json({error: "Usuário informado não foi encontrado!"})
  }

  request.user = userFound
  return next();
}

function findTodo(todos, id) {
  return todos.find( todo => todo.id === id )
}

function findTodoId(todos, id) {
  return todos.findIndex( todo => todo.id === id )
}

app.get('/users', (request, response) => {

  return response.status(200).json(users)
})

app.post('/users', (request, response) => {
  
  const { name, username } = request.body;

  if (((!name) || (name == '')) || ((!username) || (username == ''))) {

    return response.status(400).json({ error: "Alguns dados não foram enviados, verificar!" })
  }
  
  const userExist = users.some(
    (user) => user.username == username
  )
  
  if (userExist) {
    
    return response.status(400).json({error: "O usuário informado já existe, informe outros dados!"})
  }

  const user = {
    id: uuidv4(),
    name,
    username: username,
    todos: []
  }
  
  users.push(user)
  return response.status(201).json(user).send()

});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  return response.status(200, response.json(request.user.todos)).send()
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  
  const { title, deadline } = request.body;
  const errors = []

  if ((!title) || (title == '')) {
    errors.push("O valor de title não foi informado!")
  }

  if ((!deadline) || (deadline == '')) {
    errors.push("O valor de deadline não foi informado!")
  }

  if (errors[0]) {

    return response.status(400).json({ error: errors })
  }

  const todoExist = request.user.todos.some( todo => todo.title === title )

  if (todoExist) {

    return response.status(400).json({ error: "O todo informado já foi criado anteriormente!" })
  }

  const todo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  }
  
  request.user.todos.push(todo)
  return response.status(201).json(todo).send()
  
});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {

  const { title, deadline } = request.body
  const todo = findTodo(request.user.todos, request.params.id)

  if (!todo) {

    return response.status(404).json({ error: "O todo do id infomrado não foi encontrado!" })
  }

  todo.title = title
  todo.deadline = deadline

  return response.status(200).json(todo).send()
  
});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  
  const todo = findTodo(request.user.todos, request.params.id)

  if (!todo) {

    return response.status(404).json({ error: "O todo do id infomrado não foi encontrado!" })
  }

  todo.done = true

  return response.status(200).json(todo).send()
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {

  const index = findTodoId(request.user.todos, request.params.id)

  if (index == -1) {

    return response.status(404).json({ error: "O todo do id infomrado não foi encontrado!" })
  }

  request.user.todos.splice(index, 1)
  return response.status(204).json(request.user.todos).send();
});

module.exports = app;