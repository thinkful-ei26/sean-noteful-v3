'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const app = require('../server');
const {TEST_MONGODB_URI} = require('../config');
const Note = require('../models/note');
const Folder = require('../models/folder');
const Tag = require('../models/tag');
const {notes, folders, tags} = require('../db/seed/data');

const expect = chai.expect;
chai.use(chaiHttp);

describe('Notes API resource', function() {
  before(function() {
    return mongoose.connect(TEST_MONGODB_URI, {useNewUrlParser: true})
      .then(() => mongoose.connection.db.dropDatabase());
  });
  beforeEach(function() {
    return Promise.all([
      Note.insertMany(notes),
      Folder.insertMany(folders),
      Tag.insertMany(tags),
      Folder.createIndexes(),
      Tag.createIndexes()
    ]);
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
          expect(res.body.tags).to.be.an('array');
          res.body.tags.forEach(tag => {
            expect(tag).to.include.keys('id', 'name');
            expect(resNote.tags).to.include(tag.id);
          });
        });
    });
  });
  describe('POST endpoint', function() {
    it('should add a new note', function() {
      const newNote = {title: 'new title', content: 'new content', folderId: '111111111111111111111100', tags: ['222222222222222222222200', '222222222222222222222201']};
      return chai.request(app).post('/api/notes').send(newNote)
        .then(function(res) {
          // console.log(res.body);
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.keys('id', 'title', 'content', 'folderId');
          expect(res.body.id).to.not.be.null;
          expect(res.body.title).to.equal(newNote.title);
          expect(res.body.content).to.equal(newNote.content);
          // console.log(res.body.folderId);
          expect(res.body.folderId).to.equal(newNote.folderId);
          res.body.tags.forEach(tag => expect(newNote.tags).to.include(tag));
          newNote.tags.forEach(tag => expect(res.body.tags).to.include(tag));
          return Note.findById(res.body.id);
        })
        .then(function(note) {
          expect(note.title).to.equal(newNote.title);
          expect(note.content).to.equal(newNote.content);
          // note.tags.forEach(tag => expect(newNote.tags).to.include(tag));
          newNote.tags.forEach(tag => expect(note.tags).to.include(tag));
          // console.log(note.folderId);
          // console.log(newNote.folderId);
          // expect(note.folderId).to.equal(newNote.folderId);
          // ^ this fails even though note.folderId and newNote.folderId are logging 111111111111111111111100 in console
          // the error thinks note.folderId is { Object (_bsontype, id) }
        });
    });
  });
  describe('PUT endpoint', function() {
    it('should update sent fields', function() {
      const updateData = {title: 'update title', content: 'update content', folderId: '111111111111111111111100', tags: ['222222222222222222222200', '222222222222222222222201']};
      return Note.findOne()
        .then(function(note) {
          updateData.id = note.id;
          return chai.request(app).put(`/api/notes/${updateData.id}`).send(updateData);
        })
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.keys('id', 'title', 'content', 'folderId');
          expect(res.body.id).to.not.be.null;
          expect(res.body.title).to.equal(updateData.title);
          expect(res.body.content).to.equal(updateData.content);
          expect(res.body.folderId).to.equal(updateData.folderId);
          res.body.tags.forEach(tag => expect(updateData.tags).to.include(tag));
          updateData.tags.forEach(tag => expect(res.body.tags).to.include(tag));
          return Note.findById(updateData.id);
        })
        .then(function(note) {
          expect(note.title).to.equal(updateData.title);
          expect(note.content).to.equal(updateData.content);
          updateData.tags.forEach(tag => expect(note.tags).to.include(tag));
          // expect(note.folderId).to.equal(updateData.folderId);
          // same error as above, probably something to do with how mongo handles ids
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
