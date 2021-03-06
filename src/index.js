const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

// Middleware
function checksExistsUserAccount(request, response, next) {
  
  // pega os parametros passados por header
  const { username } = request.headers;

  // busca, na lista, um usuário com o username informado
  const user = users.find((user) =>  
    user.username === username
  );

  // verfica se o usuário solicitado existe
  if(!user) { 
    return response.status(404).json({
      error: 'informed username not exists' 
    });
  }

  // adiciona o usuario encontrado a requisição
  request.user = user;

  // avança para a próxima função do fluxo
  next();

}

function checkExistsTodo(request, response, next) { 

  // pega os parametros salvos pelos middlewares no request
  const user = request.user;

  // pega os parametros presentes na rota
  const { id } = request.params;

  // busca o recurso solicitado na lista
  const todo = user.todos.find(todo => todo.id === id);

  // valida se o recurso foi encontrado
  if(!todo) { 
    return response.status(404).json({error: "Todo not found"});
  }

  // adiciona o recurso a requisição
  request.todo = todo;

  // avança para a próxima função do fluxo
  next();

}

// Users Routes 
app.post('/users', (request, response) => {
  
  // pege os parametros passados no corpo da requisição
  const {name, username} = request.body;

  // verifica se o usuario já existe
  const userExists = users.some((user) =>  
    user.username === username
  )

  if(userExists) { 
    return response.status(400).json({
      error: 'Another user already used informed username' 
    });
  }

  // cria um objeto para o novo usuario
  const user = { 
    id: uuidv4(), 
    name, 
    username, 
    todos: []
  };

  // adiciona o usuario a lista a base de usuarios
  users.push(user);

  // retorna o usuário criado junto a um status de secesso
  return response.status(201).json(user);

});

// ToDos Routes 
app.get('/todos', checksExistsUserAccount, (request, response) => {
  
  // pega os parametros salvos pelos middlewares no request
  const user = request.user;

  // retorna a lista de ToDos 
  return response.json(user.todos);

});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  
  // pega os parametros salvos pelos middlewares no request
  const user = request.user; 

  // pega os parametros no corpo da requisição
  const { title, deadline} = request.body;

  // cria o objeto para a todo
  const todo = { 
    id: uuidv4(), 
    title, 
    done: false, 
    deadline: new Date(deadline), 
    created_at: new Date()
  };

  // adiciona o todo a lista do usuário
  user.todos.push(todo);

  // retorna o objeto criado
  return response.status(201).json(todo);

});

app.put('/todos/:id', checksExistsUserAccount, checkExistsTodo, 
  (request, response) => {

    // pega os parametros salvos pelos middlewares no request
    const { todo } = request;
    
    // pega os parametros no corpo da requisição
    const { title, deadline} = request.body;

    // atualiza os dados
    todo.title = title; 
    todo.deadline = new Date(deadline);

    // retorna o recurso já atualizado
    return response.json(todo);

  }
);

app.patch('/todos/:id/done', checksExistsUserAccount, checkExistsTodo, 
  (request, response) => {
    
    // pega os parametros salvos pelos middlewares no request
    const { todo } = request;

    // atualiza os dados
    todo.done = true;

    // retorna o recurso já atualizado
    return response.json(todo);

  }
);

app.delete('/todos/:id', checksExistsUserAccount, checkExistsTodo, 
  (request, response) => {
    
    // pega os parametros salvos pelos middlewares no request
    const { user, todo } = request;

    // deleta o recurso solicitado
    user.todos.splice(todo, 1);

    // retorna uma confirmação de que a deleção foi efetuada
    return response.status(204).send();

  }
);

module.exports = app;