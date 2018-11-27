'use strict';

const express = require('express');

const router = express.Router();
const mongoose = require('mongoose');
const Note = require('../models/note');

/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {
  const searchTerm = req.query.searchTerm;
  // let filter = {};
  const re = new RegExp(searchTerm, 'i');
  // if (searchTerm) filter.title = {$regex: searchTerm, $options: 'i'};

  Note.find({$or: [{title: re}, {content: re}]}).sort({updatedAt: 'desc'})
    .then(Notes => res.json(Notes))
    .catch(err => next(err));
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {
  Note.findById(req.params.id)
    .then(note => res.json(note))
    .catch(err => next(err));
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {
  const requiredFields = ['title']; // requiredFields is an array to make it easier to change if I ever want to add more
  requiredFields.forEach(field => {
    if (!(field in req.body)) return res.status(400).send(`Missing \`${field}\` in request body`);
  });

  Note.create({title: req.body.title, content: req.body.content})
    .then(note => res.status(201).json(note))
    .catch(err => next(err));
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {
  // if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
  //   return res.status(400).json({message: `Request path id (${req.params.id}) and request body id (${req.body.id}) must match`});
  // }
  const toUpdate = {};
  const updateableFields = ['title', 'content'];
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