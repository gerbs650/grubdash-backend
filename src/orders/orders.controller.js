const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// const notFound = require("../errors/notFound"); -- not used, wrote errors within functions.

// TODO: Implement the /orders handlers needed to make the tests pass

// ensure order exists and ID matches to start
const orderExists = (req, res, next) => {
  const { orderId } = req.params;
  res.locals.orderId = orderId;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (!foundOrder) {
    return next({
      status: 404,
      message: `Order not found: ${orderId}`,
    });
  }
  res.locals.order = foundOrder;
};

// deliver to address is valid
const orderValidDeliverTo = (req, res, next) => {
  const { data = null } = req.body;
  res.locals.newOD = data;
  const orderdeliverTo = data.deliverTo;
  if (!orderdeliverTo || orderdeliverTo.length === 0) {
    return next({
      status: 400,
      message: "Order must include a deliverTo",
    });
  }
};

// order has valid phone number
const orderHasValidMobileNumber = (req, res, next) => {
  const orderMobileNumber = res.locals.newOD.mobileNumber;
  if (!orderMobileNumber || orderMobileNumber.length === 0) {
    return next({
      status: 400,
      message: "Order must include a mobileNumber",
    });
  }
};

// order has dishes before submitting
const orderHasDishes = (req, res, next) => {
  const orderDishes = res.locals.newOD.dishes;
  if (!orderDishes || !Array.isArray(orderDishes) || orderDishes.length <= 0) {
    return next({
      status: 400,
      message: "Order must include at least one dish",
    });
  }
  res.locals.dishes = orderDishes;
};

//order has a number of 1 dish
const orderHasValidDishes = (req, res, next) => {
  const orderDishes = res.locals.dishes;
  orderDishes.forEach((dish) => {
    const dishQuantity = dish.quantity;
    if (!dishQuantity || typeof dishQuantity != "number" || dishQuantity <= 0) {
      return next({
        status: 400,
        message: `Dish ${orderDishes.indexOf(
          dish
        )} must have a quantity that is an integer greater than 0`,
      });
    }
  });
};

// order id matches
const orderIdMatches = (req, res, next) => {
  const paramId = res.locals.orderId;
  const { id = null } = res.locals.newOD;
  if (!id || id === null) {
    res.locals.newOD.id = res.locals.orderId;
  } else if (paramId != id) {
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${paramId}`,
    });
  }
};

//

function validateStatus(req, res, next) {
  const { orderId } = req.params;
  const { data: { id, status } = {} } = req.body;

  let message;
  if (id && id !== orderId)
    message = `Order id does not match route id. Order: ${id}, Route: ${orderId}`;
  else if (
    !status ||
    status === "" ||
    (status !== "pending" &&
      status !== "preparing" &&
      status !== "out-for-delivery")
  )
    message =
      "Order must have a status of pending, preparing, out-for-delivery, delivered";
  else if (status === "delivered")
    message = "A delivered order cannot be changed";

  if (message) {
    return next({
      status: 400,
      message: message,
    });
  }

  next();
}
/*
const incomingStatusIsValid = (req, res, next) => {
  const { status = null } = res.locals.newOD;
  if (!status || status.length === 0 || status === "invalid") {
    return next({
      status: 400,
      message:
        "Order must have a status of pending, preparing, out-for-delivery, delivered",
    });
  }
};

const extantStatusIsValid = (req, res, next) => {
  const { status = null } = res.locals.order;
  if (status === "delivered") {
    return next({
      status: 400,
      message: "A delivered order cannot be changed",
    });
  }
};

const extantStatusIsPending = (req, res, next) => {
  const { status = null } = res.locals.order;
  if (status !== "pending") {
    return next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
  }
};
*/

//Combined Middleware Functions to make the exports more clean.
const createValidation = (req, res, next) => {
  orderValidDeliverTo(req, res, next);
  orderHasValidMobileNumber(req, res, next);
  orderHasDishes(req, res, next);
  orderHasValidDishes(req, res, next);
  next();
};

const readValidation = (req, res, next) => {
  orderExists(req, res, next);
  next();
};

const updateValidation = (req, res, next) => {
  orderExists(req, res, next);
  orderValidDeliverTo(req, res, next);
  orderHasValidMobileNumber(req, res, next);
  orderHasDishes(req, res, next);
  orderHasValidDishes(req, res, next);
  orderIdMatches(req, res, next);
  validateStatus(req, res, next);
  next();
};

const deleteValidation = (req, res, next) => {
  orderExists(req, res, next);
  validateDelete(req, res, next);
  next();
};

//CRUD Handlers:
// create handler has been updated - POST
function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    status: status ? status : "pending",
    dishes: dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

// read handler
function read(req, res) {
  res.status(200).json({ data: res.locals.order });
}

// update handler has been updated to have a id not overwritten.
function update(req, res) {
  const { data: { deliverTo, mobileNumber, dishes, status } = {} } = req.body;

  res.locals.order = {
    id: res.locals.order.id,
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    dishes: dishes,
    status: status,
  };

  res.json({ data: res.locals.order });
}

// list handler
function list(req, res) {
  res.status(200).json({ data: orders });
}

// delete handler
function destroy(req, res) {
  const index = orders.indexOf(res.locals.order);
  orders.splice(index, 1);
  res.sendStatus(204);
}

function validateDelete(req, res, next) {
  if (res.locals.order.status !== "pending") {
    return next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
  }

  next();
}

module.exports = {
  create: [createValidation, create],
  read: [readValidation, read],
  update: [updateValidation, update],
  delete: [deleteValidation, destroy],
  list,
};
