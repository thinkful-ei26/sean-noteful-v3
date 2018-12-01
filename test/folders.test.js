'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const app = require('../server');
const {TEST_MONGODB_URI} = require('../config');
const Folder = require('../models/folder');
const {folders} = require('../db/seed/data');

const expect = chai.expect;
chai.use(chaiHttp);

describe('Folders API resource', function() {
  before(function() {
    return mongoose.connect(TEST_MONGODB_URI, {useNewUrlParser: true})
      .then(() => mongoose.connection.db.dropDatabase());
  });
  beforeEach(function() {
    return Promise.all([Folder.insertMany(folders), Folder.createIndexes()]);
  });
  afterEach(function() {
    return mongoose.connection.db.dropDatabase();
  });
  after(function() {
    return mongoose.disconnect();
  });

  describe('GET endpoint', function() {
    it('should return all existing folders', function() {
      let res;
      return chai.request(app).get('/api/folders')
        .then(function(_res) {
          res = _res;
          expect(res).to.have.status(200);
          expect(res.body).to.have.lengthOf.at.least(1);
          return Folder.countDocuments();
        })
        .then(function(count) {
          expect(res.body).to.have.lengthOf(count);
        });
    });
  });
  describe('GET id endpoint', function() {
    it('should return the correct note', function() {
      let resFolder;
      return Folder.findOne()
        .then(function(folder) {
          resFolder = folder;
          return chai.request(app).get(`/api/folders/${resFolder.id}`);
        })
        .then(function(res) {
          expect(resFolder.id).to.equal(res.body.id);
          expect(resFolder.name).to.equal(res.body.name);
        });
    });
  });
  describe('POST endpoint', function() {
    it('should add a new folder', function() {
      const newFolder = {name: 'new folder'};
      return chai.request(app).post('/api/folders').send(newFolder)
        .then(function(res) {
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.keys('id', 'name');
          expect(res.body.id).to.not.be.null;
          expect(res.body.name).to.equal(newFolder.name);
          return Folder.findById(res.body.id);
        })
        .then(function(folder) {
          expect(folder.name).to.equal(newFolder.name);
        });
    });
  });
  describe('PUT endpoint', function() {
    it('should update sent fields', function() {
      const updateData = {name: 'update name'};
      return Folder.findOne()
        .then(function(folder) {
          updateData.id = folder.id;
          return chai.request(app).put(`/api/folders/${updateData.id}`).send(updateData);
        })
        .then(function(res) {
          expect(res).to.have.status(204);
          return Folder.findById(updateData.id);
        })
        .then(function(folder) {
          expect(folder.name).to.equal(updateData.name);
        });
    });
  });
  describe('DELETE endpoint', function() {
    it('should delete a folder by id', function() {
      let folder;
      return Folder.findOne()
        .then(function(_folder) {
          folder = _folder;
          return chai.request(app).delete(`/api/folders/${folder.id}`);
        })
        .then(function(res) {
          expect(res).to.have.status(204);
          return Folder.findById(folder.id);
        })
        .then(function(_folder) {
          expect(_folder).to.be.null;
        });
    });
  });
});
