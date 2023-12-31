const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const {format} = require('date-fns')

const databasePath = path.join(__dirname, 'todoApplication.db')

const app = express()

app.use(express.json())

let database = null

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
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

initializeDbAndServer()

const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

const hasCategoryProperty = requestQuery => {
  return requestQuery.category !== undefined
}

const hasPriorityAndCategoryProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.category !== undefined
  )
}

const hasStatusAndCategoryProperties = requestQuery => {
  return (
    requestQuery.status !== undefined && requestQuery.category !== undefined
  )
}

// GET Todo with query API

app.get('/todos/', async (request, response) => {
  let data = null
  let getTodosQuery = ''
  const {search_q = '', priority, status, category} = request.query

  if (status !== 'TO DO' && status !== 'IN PROGRESS' && status !== 'DONE') {
    response.status = 400
    response.body = 'Invalid Todo Status'
  } else if (
    priority !== 'HIGH' &&
    priority !== 'MEDIUM' &&
    priority !== 'LOW'
  ) {
    response.status = 400
    response.body = 'Invalid Todo Priority'
  } else if (
    category !== 'WORK' &&
    category !== 'HOME' &&
    category !== 'LEARNING'
  ) {
    response.status = 400
    response.body = 'Invalid Todo Category'
  } else {
    switch (true) {
      case hasPriorityAndStatusProperties(request.query):
        getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`
        break
      case hasPriorityProperty(request.query):
        getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}';`
        break
      case hasStatusProperty(request.query):
        getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}';`
        break
      case hasCategoryProperty(request.query):
        getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND category = '${category}';`
        break
      case hasPriorityAndCategoryProperties(request.query):
        getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND category = '${category}'
        AND priority = '${priority}';`
        break
      case hasStatusAndCategoryProperties(request.query):
        getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND category = '${category}'
        AND status = '${status}';`
        break

      default:
        getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%';`
    }

    data = await database.all(getTodosQuery)
    response.send(data)
  }
})

// GET Todo API

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params

  const getTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};`
  const todo = await database.get(getTodoQuery)
  response.send(todo)
})

// POST Todo API

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request.body
  const updatedDate = format(new Date(dueDate), 'yyyy-MM-dd')
  const postTodoQuery = `
  INSERT INTO
    todo (id, todo, priority, status, category, due_date)
  VALUES
    (${id}, '${todo}', '${priority}', '${status}', "${category}", "${updatedDate});`
  await database.run(postTodoQuery)
  response.send('Todo Successfully Added')
})

// PUT Todo API

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  let updateColumn = ''
  const requestBody = request.body

  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = 'Status'
      break
    case requestBody.priority !== undefined:
      updateColumn = 'Priority'
      break
    case requestBody.todo !== undefined:
      updateColumn = 'Todo'
      break
    case requestBody.category !== undefined:
      updateColumn = 'Category'
      break
    case requestBody.dueDate !== undefined:
      updateColumn = 'Due Date'
      break
  }

  if (
    requestBody.status !== 'TO DO' &&
    requestBody.status !== 'IN PROGRESS' &&
    requestBody.status !== 'DONE'
  ) {
    response.status = 400
    response.body = 'Invalid Todo Status'
  } else if (
    requestBody.priority !== 'HIGH' &&
    requestBody.priority !== 'MEDIUM' &&
    requestBody.priority !== 'LOW'
  ) {
    response.status = 400
    response.body = 'Invalid Todo Priority'
  } else if (
    requestBody.category !== 'WORK' &&
    requestBody.category !== 'HOME' &&
    requestBody.category !== 'LEARNING'
  ) {
    response.status = 400
    response.body = 'Invalid Todo Category'
  } else {
    const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`
    const previousTodo = await database.get(previousTodoQuery)

    const {
      todo = previousTodo.todo,
      priority = previousTodo.priority,
      status = previousTodo.status,
      category = previousTodo.category,
      dueDate = previousTodo.due_date,
    } = request.body

    const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}',
      category="${category}",
      due_date="${dueDate}"
    WHERE
      id = ${todoId};`

    await database.run(updateTodoQuery)
    response.send(`${updateColumn} Updated`)
  }
})

// Delete Todo API

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`

  await database.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app
