const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");

const dbPath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let db = null;
const initializeDBAnnServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAnnServer();

const convertDBTodoObj = (DBObject) => {
  return {
    id: DBObject.id,
    todo: DBObject.todo,
    priority: DBObject.priority,
    status: DBObject.status,
    category: DBObject.category,
    dueDate: DBObject.due_date,
  };
};

const statusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const categoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const priorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const searchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const statusAndCategory = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.category !== undefined
  );
};

const categoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const priorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodoQuery = "";
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    case statusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodoQuery = `
            SELECT * FROM todo
            WHERE status = '${status}';
            `;

        data = await db.all(getTodoQuery);

        response.send(data.map((eachData) => convertDBTodoObj(eachData)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }

      break;

    case priorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodoQuery = `
            SELECT * FROM todo 
            WHERE priority = '${priority}';
            `;

        data = await db.all(getTodoQuery);

        response.send(data.map((eachData) => convertDBTodoObj(eachData)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;

    case priorityAndStatus(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodoQuery = `
                  SELECT * FROM todo
                  WHERE status = '${status}'
                  AND priority = '${priority}';
                  `;

          data = await db.all(getTodoQuery);

          response.send(data.map((eachData) => convertDBTodoObj(eachData)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;

    case searchProperty(request.query):
      getTodoQuery = `
        SELECT * FROM todo
        WHERE todo LIKE '%${search_q}%';
        `;

      data = await db.all(getTodoQuery);

      response.send(data.map((eachData) => convertDBTodoObj(eachData)));

      break;

    case statusAndCategory(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        if (
          category === "WORK" ||
          category === "HOME" ||
          category === "LEARNING"
        ) {
          getTodoQuery = `
                SELECT * FROM todo
                WHERE category = '${category}'
                AND status = '${status}';
                `;

          data = await db.all(getTodoQuery);

          response.send(data.map((eachData) => convertDBTodoObj(eachData)));
        } else {
          response.status(400);
          response.send("Invalid Todo Category");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }

      break;

    case categoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodoQuery = `
            SELECT * FROM todo
            WHERE category = '${category}';
            `;

        data = await db.all(getTodoQuery);

        response.send(data.map((eachData) => convertDBTodoObj(eachData)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;

    case categoryAndPriority(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getTodoQuery = `
                SELECT * FROM todo
                WHERE priority = '${priority}'
                AND category = '${category}';
                `;

          data = await db.all(getTodoQuery);

          response.send(date.map((eachData) => convertDBTodoObj(eachData)));
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;

    default:
      getTodoQuery = `
        SELECT * FROM todo;
        `;

      data = await db.all(getTodoQuery);

      response.send(data.map((eachData) => convertDBTodoObj(eachData)));
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoIdData = `
    SELECT * FROM todo
    WHERE id = '${todoId}';
    `;

  const todoIdResult = await db.get(getTodoIdData);

  response.send(convertDBTodoObj(todoIdResult));

  console.log(todoIdResult);
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;

  console.log(isMatch(date, "yyyy-MM-dd"));

  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    console.log(newDate);

    const requestDateQuery = `
    SELECT * FROM todo
    WHERE due_date = '${newDate}';
    `;

    console.log(requestDateQuery);
    const data = await db.all(requestDateQuery);

    response.send(data.map((eachData) => convertDBTodoObj(eachData)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;

  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");

          const postNewDate = `
                    INSERT INTO todo(id,todo,priority,status,category,due_date)
                    VALUES (${id},'${todo}','${priority}','${status}','${category}','${newDueDate}');
                    `;

          await db.run(postNewDate);

          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const requestBody = request.body;
  console.log(requestBody);

  const updateByTodoId = `
  SELECT * FROM todo
  WHERE id = '${todoId}';
  `;

  const oldTodo = await db.get(updateByTodoId);

  const {
    todo = oldTodo.todo,
    priority = oldTodo.priority,
    status = oldTodo.status,
    category = oldTodo.category,
    dueDate = oldTodo.due_date,
  } = request.body;

  let updateNewTodo;

  switch (true) {
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        const updateNewTodo = `
            UPDATE todo SET
            status = '${status}'
            WHERE id = '${todoId}';
            `;

        await db.run(updateNewTodo);
        response.send(`Status Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }

      break;

    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        const updateNewTodo = `
            UPDATE todo SET
            priority = '${priority}'
            WHERE id = '${todoId}';
            `;

        await db.run(updateNewTodo);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;

    case requestBody.todo !== undefined:
      const updateNewTodo = `
        UPDATE todo SET
        todo = '${todo}'
        WHERE id = '${todoId}';
        `;

      await db.run(updateNewTodo);

      response.send(`Todo Updated`);

      break;

    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        const updateNewTodo = `
            UPDATE todo SET
            category = '${category}'
            WHERE id = '${todoId}';
            `;

        await db.run(updateNewTodo);

        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;

    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDateForm = format(new Date(dueDate), "yyyy-MM-dd");

        const updateNewTodo = `
            UPDATE todo SET
            due_date = '${newDateForm}'
            WHERE id = '${todoId}';
            `;

        await db.run(updateNewTodo);
        response.send(`Due Date Updated`);
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }

      break;
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const delTodo = `
    DELETE FROM todo
    WHERE id = '${todoId}';
    `;

  const delData = await db.run(delTodo);
  response.send("Todo Deleted");
});

module.exports = app;
