import express from "express";
import bodyParser from "body-parser";
import { getDate, getDay } from "./date.js";
import mongoose from "mongoose";
import _ from "lodash";
import "dotenv/config";

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const NAME = process.env.N_KEY;
const SECRET = process.env.N_SECRET;

mongoose.connect("mongodb+srv://"+ NAME + ":" + SECRET + "@cluster0.xkaadtv.mongodb.net/todolistDB");

const itemsSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to Your todoList!"
});
const item2 = new Item({
  name: "Hit the + button to aff a new item."
});
const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

const List = mongoose.model("List", listSchema); 


app.get("/", async function(req, res) {
  const day = getDate();

  let items = await Item.find({});
  
  try {
    if (items.length === 0) {
      items = await Item.insertMany(defaultItems);
    } 
  } catch (err) {
    console.log(err);
  }

  res.render("list.ejs", {listTitle: day, newListItems: items});

});

app.get("/:customListName", async function(req, res) {
  const customListName = _.capitalize(req.params.customListName);
  
  let foundList = await List.findOne({name: customListName}).exec();

  if (!foundList) {
    // Create a new list
    const list = new List({
      name: customListName,
      items: defaultItems,
    });
  
    await list.save();

    res.redirect("/" + customListName);
  } else {
    // Show an existing list
    res.render("list.ejs", {listTitle: foundList.name, newListItems: foundList.items});
  }

  
});

app.post("/", async function(req, res){
  const day = getDate();

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === day) {
    await item.save();
    res.redirect("/");
  } else {
    let foundList = await List.findOne({name: listName}).exec();
    foundList.items.push(item);
    await foundList.save();
    res.redirect("/" + listName);
  }
});


app.post("/delete", async function(req, res) {
  const day = getDate();

  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === day) {
    await Item.findByIdAndRemove(checkedItemId);
    res.redirect("/");
  } else {
    await List.findOneAndUpdate(
      {name: listName}, 
      {$pull: {items: {_id: checkedItemId}}}
    );
    res.redirect("/" + listName);
  }

});

app.get("/work", function(req,res){
  res.render("list.ejs", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about.ejs");
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});

