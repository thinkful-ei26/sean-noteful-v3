'use strict';

const mongoose = require('mongoose');
const {MONGODB_URI} = require('../config');
const Note = require('../models/note');
const Folder = require('../models/folder');
const Tag = require('../models/tag');
const {notes, folders, tags} = require('../db/seed/data');

mongoose.connect(MONGODB_URI, {useNewUrlParser: true})
  .then(() => mongoose.connection.db.dropDatabase())
  .then(() => Promise.all([
    Note.insertMany(notes),
    Folder.insertMany(folders),
    Tag.insertMany(tags),
    Folder.createIndexes(),
    Tag.createIndexes()
  ]))
  .then(() => mongoose.disconnect())
  .catch(err => console.error(err));
  