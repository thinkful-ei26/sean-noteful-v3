'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const app = require('../server');
const {TEST_MONGODB_URI} = require('../config');
const Note = require('../models/note');
const {notes} = require('../db/seed/data');

const expect = chai.expect;
chai.use(chaiHttp);

describe('Notes API resource', function() {
  before(function() {
    return mongoose.connect(TEST_MONGODB_URI, {useNewUrlParser: true})
      .then(() => mongoose.connection.db.dropDatabase());
  });
  beforeEach(function() {
    return Note.insertMany(notes);
  });
  afterEach(function() {
    return mongoose.connection.db.dropDatabase();
  });
  after(function() {
    return mongoose.disconnect();
  });

  describe('GET endpoint', function() {
    it('should return all existing notes', function() {
      let res;
      return chai.request(app).get('/api/notes')
        .then(function(_res) {
          res = _res;
          expect(res).to.have.status(200);
          expect(res.body).to.have.lengthOf.at.least(1);
          return Note.countDocuments(); // collection.count is depricated and will be removed in a future version. Use
          // collection.countDocuments instead 
        })
        .then(function(count) {
          expect(res.body).to.have.lengthOf(count);
        });
    });
  });
  describe('GET id endpoint', function() {
    it('should return note with correct fields', function() {
      let resNote;
      return Note.findOne()
        .then(function(note) {
          resNote = note;
          return chai.request(app).get(`/api/notes/${resNote.id}`);
        })
        .then(function(res) {
          // console.log(res.body)
          expect(resNote.id).to.equal(res.body.id);
          expect(resNote.title).to.equal(res.body.title);
          expect(resNote.content).to.equal(res.body.content);
        });
    });
  });
  describe('POST endpoint', function() {
    it('should add a new note', function() {
      const newNote = {title: 'new title', content: 'new content'};
      return chai.request(app).post('/api/notes').send(newNote)
        .then(function(res) {
          // console.log(res.body);
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.keys('id', 'title', 'content');
          expect(res.body.id).to.not.be.null;
          expect(res.body.title).to.equal(newNote.title);
          expect(res.body.content).to.equal(newNote.content);
          return Note.findById(res.body.id);
        })
        .then(function(note) {
          expect(note.title).to.equal(newNote.title);
          expect(note.content).to.equal(newNote.content);
        });
    });
  });
  describe('PUT endpoint', function() {
    it('should update sent fields', function() {
      const updateData = {title: 'update title', content: 'update content'};
      return Note.findOne()
        .then(function(note) {
          updateData.id = note.id;
          return chai.request(app).put(`/api/notes/${updateData.id}`).send(updateData);
        })
        .then(function(res) {
          expect(res).to.have.status(204);
          return Note.findById(updateData.id);
        })
        .then(function(note) {
          expect(note.title).to.equal(updateData.title);
          expect(note.content).to.equal(updateData.content);
        });
    });
  });
  describe('DELETE endpoint', function() {
    it('should delete a note by id', function() {
      let note;
      return Note.findOne()
        .then(function(_note) {
          note = _note;
          return chai.request(app).delete(`/api/notes/${note.id}`);
        })
        .then(function(res) {
          expect(res).to.have.status(204);
          return Note.findById(note.id);
        })
        .then(function(_note) {
          expect(_note).to.be.null;
        });
    });
  });
});
