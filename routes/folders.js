'use strict';

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Folder = require('../models/folder');
const Note = require('../models/note');

router.get('/', (req, res, next) => {
  Folder.find().sort({name: 'asc'})
    .then(Folders => {
      if (Folders) res.json(Folders);
      else next();
    })
    .catch(err => next(err));
});

router.get('/:id', (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).send('Invalid folderId');
  Folder.findById(req.params.id)
    .then(folder => {
      if (folder) res.json(folder);
      else next();
    })
    .catch(err => next(err));
});

router.post('/', (req, res, next) => {
  const requiredFields = ['name'];
  requiredFields.forEach(field => {
    if (!(field in req.body)) return res.status(400).send(`Missing \`${field}\` in request body`);
  });

  Folder.create({name: req.body.name})
    .then(folder => {
      if (folder) res.status(201).json(folder);
      else next();
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The folder name already exists');
        err.status = 400;
      }
      next(err);
    });
});

router.put('/:id', (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).send('Invalid folderId');
  const toUpdate = {};
  const updatableFields = ['name'];
  updatableFields.forEach(field => {if (field in req.body) toUpdate[field] = req.body[field];});

  Folder.findByIdAndUpdate(req.params.id, {$set: toUpdate})
    .then(() => res.status(204).end())
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The folder name already exists');
        err.status = 400;
      }
      next(err);
    });
});

router.delete('/:id', (req, res, next) => {
  const id = req.params.id;

  Note.deleteMany({folderId: id})
    .then(() => Folder.findByIdAndRemove(id))
    .then(() => res.status(204).end())
    .catch(err => next(err));
});

module.exports = router;
