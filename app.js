const express = require("express");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({
  extended: true
}));

const port = process.env.PORT || 3000;

main().catch(err => console.log(err));
async function main() {
  await mongoose.connect(process.env.MONGO_ATLAS_URL);
}


// Setting schema and default values for items
const itemSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "In Home page, add tasks"
});
const item2 = new Item({
  name: "Or use pre existing tasks"
});
const item3 = new Item({
  name: "Click on task to open ToDo list"
});
const item4 = new Item({
  name: "Type and hit + to add item"
});
const item5 = new Item({
  name: "<-- Check this to delete an item"
});
const item6 = new Item({
  name: "Fact 1 : You can't delete these items"
});
const defaultItems = [item1, item2, item3, item4, item5, item6];


// Setting schema and default values for Lists
const taskSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema]
});

const Task = mongoose.model("Task", taskSchema);

const task1 = new Task({
  name: "Work",
  items: []
});
const task2 = new Task({
  name: "Home",
  items: []
});
const task3 = new Task({
  name: "Others",
  items: []
});

const defaultTasks = [task1, task2, task3];

app.get("/", (req, res) => {
  async function getTask() {
    const taskList = await Task.find({});
    if (taskList.length === 0) {
      await Task.insertMany(defaultTasks);
      res.redirect("/");
    }
    res.render("index", {
      taskList: taskList
    });
  }
  getTask().catch(err => console.log(err));
});

app.post("/addTask", (req, res) => {
  const newTask = req.body.newTask;

  Task.findOne({
    name: newTask
  }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        const task = new Task({
          name: newTask,
          items: []
        });
        task.save();
        res.redirect("/");
      } else res.redirect("/");
    } else console.log(err);
  });

});

app.post("/deleteTask", (req, res) => {
  const taskId = req.body.taskId;
  Task.deleteOne({
    _id: taskId
  }, err => {
    if (err) console.log(err);
  });
  res.redirect("/");
});

const today = date.getDate();

app.get("/help", (req, res) => {
  res.render("list", {
    listTitle: "How to use This?",
    today: today,
    itemList: defaultItems
  });
});

app.get("/:customListName", (req, res) => {
  const customListName = req.params.customListName;
  Task.findOne({
    name: customListName
  }, (err, taskList) => {
    if (!err) {
      try {
        res.render("list", {
          listTitle: customListName,
          today: today,
          itemList: taskList.items
        })
      } catch (err) {
        res.render("error");
        console.log(err);
      }
    } else console.log(err);
  })
});

app.post("/addItem", (req, res) => {
  const task = req.body.button;
  const newItem = req.body.newItem;
  if (newItem === "") {
    res.redirect("/" + task);
  } else {
    Task.findOneAndUpdate({
      name: task
    }, {
      $push: {
        items: {
          name: newItem
        }
      }
    }, err => {
      if (err) console.log(err);
    })
    res.redirect("/" + task);
  }
});

app.post("/deleteItem", (req, res) => {
  const task = req.body.task;
  const itemId = req.body.itemId;
  if (task === "How to use This?") res.redirect("/help");
  else {
    Task.findOneAndUpdate({
      name: task
    }, {
      $pull: {
        items: {
          _id: itemId
        }
      }
    }, err => {
      if (err) console.log(err);
    })
    res.redirect("/" + task);
  }
});

app.listen(port, () => console.log(`Server started at port ${port}`));