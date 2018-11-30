'use strict';

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Tag = require('../models/tag');
const Note = require('../models/note');

router.get('/', (req, res, next) => {
  Tag.find().sort({name: 'asc'})
    .then(tags => {
      if (tags) res.json(tags);
      else next();
    })
    .catch(err => next(err));
});

router.get('/:id', (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).send('Invalid ID');

  Tag.findById(req.params.id)
    .then(tag => {
      if (tag) res.json(tag);
      else next();
    })
    .catch(err => next(err));
});

router.post('/', (req, res, next) => {
  const requiredFields = ['name'];
  requiredFields.forEach(field => {
    if (!(field in req.body)) return res.status(400).send(`Missing \`${field}\` in request body`);
  });

  Tag.create({name: req.body.name})
    .then(tag => {
      if (tag) res.location(`${req.originalUrl}/${tag.id}`).status(201).json(tag);
      else next();
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The tag name already exists');
        err.status = 400;
      }
      next(err);
    });
});

router.put('/:id', (req, res, next) => {
  const requiredFields = ['name'];
  requiredFields.forEach(field => {
    if (!(field in req.body)) return res.status(400).send(`Missing \`${field}\` in request body`);
  });
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).send('Invalid ID');
  const toUpdate = {};
  const updatableFields = ['name'];
  updatableFields.forEach(field => {if (field in req.body) toUpdate[field] = req.body[field];});

  Tag.findByIdAndUpdate(req.params.id, toUpdate, {new: true})
    .then(tag => {
      if (tag) res.json(tag);
      else next();
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The tag name already exists');
        err.status = 400;
      }
      next(err);
    });
});

router.delete('/:id', (req, res, next) => {
  Note.updateMany({}, {$pull: {tags: req.params.id}})
    .then(() => Tag.findByIdAndRemove(req.params.id))
    .then(() => res.status(204).end())
    .catch(err => next(err));
});

module.exports = router;
