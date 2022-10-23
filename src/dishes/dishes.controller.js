const path = require("path");
const dishes = require(path.resolve("src/data/dishes-data"));
const nextId = require("../utils/nextId");

//const notFound = require("../errors/notFound");

// TODO: Implement the /dishes handlers needed to make the tests pass

// == Middleware Functions ==
// Make sure dish exists function, then make functions to cehck if properties are valid

const dishExists = (req, res, next) => {
  const dishId = req.params.dishId;
  res.locals.dishId = dishId;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (!foundDish) {
    return next({
      status: 404,
      message: `Dish not found: ${dishId}`,
    });
  }
  res.locals.dish = foundDish;
};

// response will have id, name, desc, price, and image_url.

// function bodyDataHas(propertyName) {
//   return function (req, res, next) {
//     const { data = {} } = req.body;
//     if (data[propertyName]) {
//       return next();
//     }
//     next({ status: 400, message: `must include a ${propertyName}` });
//   };
// }

// ensures dishes have valid name during entry
const dishValidName = (req, res, next) => {
  const { data = null } = req.body;
  res.locals.newD = data;
  const dishName = data.name;
  if (!dishName || dishName.length === 0) {
    return next({
      status: 400,
      message: "Dish must include a name",
    });
  }
};

// ensures dishes have a description
const dishHasValidDescription = (req, res, next) => {
  const dishDescription = res.locals.newD.description;
  if (!dishDescription || dishDescription.length === 0) {
    return next({
      status: 400,
      message: "Dish must include a description",
    });
  }
};

// new dish has a price
const dishHasValidPrice = (req, res, next) => {
  const dishPrice = res.locals.newD.price;
  if (!dishPrice || typeof dishPrice != "number" || dishPrice <= 0) {
    return next({
      status: 400,
      message: "Dish must have a price that is an integer greater than 0",
    });
  }
};

// makes sure dish has img with URL
const dishHasValidImage = (req, res, next) => {
  const dishImage = res.locals.newD.image_url;
  if (!dishImage || dishImage.length === 0) {
    return next({
      status: 400,
      message: "Dish must include an image_url",
    });
  }
};

const dishIdMatches = (req, res, next) => {
  const paramId = res.locals.dishId;
  const { id = null } = res.locals.newD;
  if (paramId != id && id) {
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${paramId}`,
    });
  }
};

// Middleware Functions to clean up module.exports.
const createValidation = (req, res, next) => {
  dishValidName(req, res, next);
  dishHasValidDescription(req, res, next);
  dishHasValidPrice(req, res, next);
  dishHasValidImage(req, res, next);
  next();
};

const readValidation = (req, res, next) => {
  dishExists(req, res, next);
  next();
};

const updateValidation = (req, res, next) => {
  dishExists(req, res, next);
  dishValidName(req, res, next);
  dishHasValidDescription(req, res, next);
  dishHasValidPrice(req, res, next);
  dishHasValidImage(req, res, next);
  dishIdMatches(req, res, next);
  next();
};

//CRUD Handlers:

// create function
function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name: name,
    description: description,
    price: price,
    image_url: image_url,
  };

  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

// read function
function read(req, res) {
  res.status(200).json({ data: res.locals.dish });
}

// update function
function update(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  res.locals.dish = {
    id: res.locals.dishId,
    name: name,
    description: description,
    price: price,
    image_url: image_url,
  };
  res.json({ data: res.locals.dish });
}

// list function
function list(req, res) {
  res.status(200).json({ data: dishes });
}

module.exports = {
  create: [createValidation, create],
  read: [readValidation, read],
  update: [updateValidation, update],
  list,
};
