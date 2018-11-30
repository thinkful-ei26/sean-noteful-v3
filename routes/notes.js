'use strict';

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Note = require('../models/note');
const Folder = require('../models/folder');

/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {
  const {searchTerm, folderId, tagId} = req.query;
  const re = new RegExp(searchTerm, 'i');
  let filter = {$or: [{title: re}, {content: re}]};
  if (folderId) filter.folderId = folderId;
  if (tagId) filter.tags = tagId;

  Note.find(filter).sort({updatedAt: 'desc'})
    .populate('tags')
    .then(notes => {
      if (notes) res.json(notes);
      else next();
    })
    .catch(err => next(err));
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {
  Note.findById(req.params.id)
    .populate('tags')
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
  const {title, content, folderId, tags} = req.body;
  const newNote = {title, content, tags};
  if (folderId) {
    if (!mongoose.Types.ObjectId.isValid(req.body.folderId)) {
      return res.status(400).send('Invalid folderId');
    } else if (!(Folder.findById(req.body.folderId))) {
      return res.status(400).send(`No folder exists with id \`${req.body.folderId}\``);
    } else newNote.folderId = folderId;
  }
  if (tags) tags.forEach(tag => {if (!mongoose.Types.ObjectId.isValid(tag)) return res.status(400).send('Invalid tagId');});

  Note.create(newNote)
    .then(note => {
      if (note) res.location(`${req.originalUrl}/${note.id}`).status(201).json(note);
      else next();
    })
    .catch(err => next(err));
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {
  const toUpdate = {};
  const updateableFields = ['title', 'content'];
  updateableFields.forEach(field => {if (field in req.body) toUpdate[field] = req.body[field];});
  if (req.body.folderId === '') {
    toUpdate.$unset = {folderId: ''};
  } else if (req.body.folderId) {
    if (!mongoose.Types.ObjectId.isValid(req.body.folderId)) return res.status(400).send('Invalid folderId');
    else if (!Folder.findById(req.body.folderId)) return res.status(400.).send(`No folder exists with id \`${req.body.folderId}\``);
    else toUpdate.folderId = req.body.folderId;
  }
  if (req.body.tags) {
    req.body.tags.forEach(tag => {if (!mongoose.Types.ObjectId.isValid(tag)) return res.status(400).send('Invalid tagId');});
    toUpdate.tags = req.body.tags;
  }

  Note.findByIdAndUpdate(req.params.id, toUpdate, {new: true})
    .then(note => {
      if (note) res.json(note);
      else next();
    })
    .catch(err => next(err));
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {
  Note.findByIdAndRemove(req.params.id)
    .then(() => res.status(204).end())
    .catch(err => next(err));
});

module.exports = router;