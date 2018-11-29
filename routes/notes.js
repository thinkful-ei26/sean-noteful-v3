'use strict';

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Note = require('../models/note');
const Folder = require('../models/folder');

/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {
  const {searchTerm, folderId} = req.query;
  const re = new RegExp(searchTerm, 'i');
  let filter = {$or: [{title: re}, {content: re}]};
  if (folderId) filter.folderId = folderId;

  Note.find(filter).sort({updatedAt: 'desc'})
    .then(Notes => {
      if (Notes) res.json(Notes);
      else next();
    })
    .catch(err => next(err));
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {
  Note.findById(req.params.id)
    .then(note => {
      if (note) res.json(note);
      else next();
    })
    .catch(err => next(err));
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {
  const requiredFields = ['title']; // requiredFields is an array to make it easier to change if I ever want to add more
  requiredFields.forEach(field => {
    if (!(field in req.body)) return res.status(400).send(`Missing \`${field}\` in request body`);
  });
  if (req.body.folderId && !(mongoose.Types.ObjectId.isValid(req.body.folderId))) {
    return res.status(400).send('Invalid folderId');
  } else if (req.body.folderId && !(Folder.findById(req.body.folderId))) {
    return res.status(400).send(`No folder exists with id \`${req.body.folderId}\``);
  }

  Note.create({title: req.body.title, content: req.body.content, folderId: req.body.folderId})
    .then(note => {
      if (note) res.status(201).json(note);
      else next();
    })
    .catch(err => next(err));
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {
  // if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
  //   return res.status(400).json({message: `Request path id (${req.params.id}) and request body id (${req.body.id}) must match`});
  // }
  if (req.body.folderId && !(mongoose.Types.ObjectId.isValid(req.body.folderId))) {
    return res.status(400).send('Invalid folderId');
  } else if (req.body.folderId && !(Folder.findById(req.body.folderId))) {
    return res.status(400).send(`No folder exists with id \`${req.body.folderId}\``);
  }
  const toUpdate = {};
  const updateableFields = ['title', 'content', 'folderId'];
  updateableFields.forEach(field => {if (field in req.body) toUpdate[field] = req.body[field];});

  Note.findByIdAndUpdate(req.params.id, {$set: toUpdate})
    .then(() => res.status(204).end())
    .catch(err => next(err));
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {
  Note.findByIdAndRemove(req.params.id)
    .then(() => res.status(204).end())
    .catch(err => next(err));
});

module.exports = router;