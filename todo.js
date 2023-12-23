const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'todoApplication.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server Running at http://localhost:3000/'),
    )
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

// GET Todo API -1

app.get('/todos/', async (request, response) => {
  const {search_q = ''} = request.query
  const getTodoQuery = `
    SELECT
    *
    FROM 
    todo
    WHERE 
    todo LIKE "%${search_q}%";`

  const todoArray = await db.all(getTodoQuery)
  response.send(todoArray)
})
// GET Todo API -2

app.get('/todos/', async (request, response) => {
  const {priority = ''} = request.query
  const getTodoQuery = `
    SELECT
    *
    FROM 
    todo
    WHERE 
    priority LIKE "%${priority}%";`

  const todoArray = await db.all(getTodoQuery)
  response.send(todoArray)
})

// GET Todo API -3

app.get('/todos/', async (request, response) => {
  const {status = ''} = request.query
  let newStatus = null
  if (status === 'TO%20DO') {
    newStatus = 'TO DO'
  }
  const getTodoQuery = `
    SELECT
    *
    FROM 
    todo
    WHERE 
    status = "${newStatus}";`

  const todoArray = await db.all(getTodoQuery)
  response.send(todoArray)
})

// GET Todo API -4

app.get('/todos/', async (request, response) => {
  const {priority = '', status = ''} = request.query
  let newStatus = null
  if (status === 'IN%20PROGRESS') {
    newStatus = 'IN PROGRESS'
  }
  const getTodoQuery = `
    SELECT
    *
    FROM 
    todo
    WHERE 
    priority = ${priority} AND
    status = ${newStatus};`

  const todoArray = await db.all(getTodoQuery)
  response.send(todoArray)
})

// GET todo with ID API

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodoQuery = `
    SELECT 
    * 
    FROM 
    todo
    WHERE 
    id = ${todoId};`
  const newTodo = await db.get(getTodoQuery)
  response.send(newTodo)
})

// POST todo API

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body

  const postTodoQuery = `
  
  INSERT INTO 
  todo (id, todo, priority, status)
  VALUES
  (${id}, "${todo}", "${priority}", "${status}");`

  const addTodo = await db.run(postTodoQuery)
  response.send('Todo Successfully Added')
  console.log(addTodo)
})

// Delete movie API

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`
  await db.run(deleteTodoQuery)
  response.send('Todo Removed')
})
module.exports = app;
