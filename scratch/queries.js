'use strict';

const mongoose = require('mongoose');
const {MONGODB_URI} = require('../config');
const Note = require('../models/note');

// find / search for notes using Note.find
mongoose.connect(MONGODB_URI, {useNewUrlParser: true})
  .then(() => {
    const searchTerm = 'lady gaga'; // hardcoded, change in routes, req.query[?]
    let filter = {};
    if (searchTerm) filter.title = {$regex: searchTerm, $options: 'i'};

    return Note.find(filter).sort({updatedAt: 'desc'});
  })
  .then(results => console.log(results))
  .then(() => mongoose.disconnect())
  .catch(err => {
    console.error(`ERROR: ${err.message}`);
    console.error(err);
  });

// find note by id using Note.findById
mongoose.connect(MONGODB_URI, {useNewUrlParser: true})
  .then(() => {
    const id = '000000000000000000000000'; // hardcoded, change in routes, req.params.id

    return Note.findById(id);
  })
  .then(results => console.log(results))
  .then(() => mongoose.disconnect())
  .catch(err => {
    console.error(`ERROR: ${err.message}`);
    console.error(err);
  });

// create a new note using Note.create
mongoose.connect(MONGODB_URI, {useNewUrlParser: true})
  .then(() => {
    const newObj = {title: 'new title', content: 'new content'}; // hardcoded, change in routes, req.body
    const requiredFields = ['title']; // requiredFields is an array to make it easier to change if I ever want to add more
    requiredFields.forEach(field => {
      if (!(field in newObj)) {
        const message = `Missing \`${field}\` in request body`;
        console.error(message);
        return;
      }
    });

    return Note.create(newObj);
  })
  .then(results => console.log(results))
  .then(() => mongoose.disconnect())
  .catch(err => {
    console.error(`ERROR: ${err.message}`);
    console.error(err);
  });

// update a note using Note.findByIdAndUpdate
mongoose.connect(MONGODB_URI, {useNewUrlParser: true})
  .then(() => {
    const id = '000000000000000000000000'; // hardcoded, change in routes, req.params.id
    const updateObj = {}; // hardcoded, change in routes, req.body
    if (!(id && updateObj.id && id === updateObj.id)) {
      const message = `Request path id (${id}) and request body id (${updateObj.id}) must match`;
      console.error(message);
      return;
    }
    const toUpdate = {};
    const updateableFields = ['title', 'content'];
    updateableFields.forEach(field => {if (field in updateObj) toUpdate[field] = updateObj[field];});

    return Note.findByIdAndUpdate(id, {$set: toUpdate});
  })
  .then(results => console.log(results))
  .then(() => mongoose.disconnect())
  .catch(err => {
    console.error(`ERROR: ${err.message}`);
    console.error(err);
  });

// delete a note by id using Note.findByIdAndRemove
mongoose.connect(MONGODB_URI, {useNewUrlParser: true})
  .then(() => {
    const id = '000000000000000000000000'; // hardcoded, change in routes, req.params.id

    return Note.findByIdAndRemove(id);
  })
  .then(results => console.log(results))
  .then(() => mongoose.disconnect())
  .catch(err => {
    console.error(`ERROR: ${err.message}`);
    console.error(err);
  });