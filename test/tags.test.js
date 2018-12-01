'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const app = require('../server');
const {TEST_MONGODB_URI} = require('../config');
const Tag = require('../models/tag');
const {tags} = require('../db/seed/data');

const expect = chai.expect;
chai.use(chaiHttp);

describe('Tags API resource', function() {
  before(function () {
    return mongoose.connect(TEST_MONGODB_URI, {useNewUrlParser: true})
      .then(() => mongoose.connection.db.dropDatabase());
  });
  beforeEach(function() {
    return Promise.all([Tag.insertMany(tags), Tag.createIndexes()]);
  });
  afterEach(function() {
    return mongoose.connection.db.dropDatabase();
  });
  after(function() {
    return mongoose.disconnect();
  });

  describe('GET endpoint', function() {
    it('should reteurn all existing tags', function() {
      let res;
      return chai.request(app).get('/api/tags')
        .then(function(_res) {
          res = _res;
          expect(res).to.have.status(200);
          expect(res.body).to.have.lengthOf.at.least(1);
          return Tag.countDocuments();
        })
        .then(function(count) {
          expect(res.body).to.have.lengthOf(count);
        });
    });
  });
  describe('GET id endpoint', function() {
    it('should return the correct tag', function() {
      let resTag;
      return Tag.findOne()
        .then(function(tag) {
          resTag = tag;
          return chai.request(app).get(`/api/tags/${resTag.id}`);
        })
        .then(function(res) {
          expect(resTag.id).to.equal(res.body.id);
          expect(resTag.name).to.equal(res.body.name);
        });
    });
  });
  describe('POST endpoint', function() {
    it('should add a new tag', function() {
      const newTag = {name: 'new tag'};
      return chai.request(app).post('/api/tags').send(newTag)
        .then(function(res) {
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.keys('id', 'name');
          expect(res.body.id).to.not.be.null;
          expect(res.body.name).to.equal(newTag.name);
          return Tag.findById(res.body.id);
        })
        .then(function(tag) {
          expect(tag.name).to.equal(newTag.name);
        });
    });
  });
  describe('PUT endpoint', function() {
    it('should update sent fields', function() {
      const updateData = {name: 'update name'};
      return Tag.findOne()
        .then(function(tag) {
          updateData.id = tag.id;
          return chai.request(app).put(`/api/tags/${updateData.id}`).send(updateData);
        })
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.keys('id', 'name');
          expect(res.body.id).to.not.be.null;
          expect(res.body.name).to.equal(updateData.name);
          return Tag.findById(res.body.id);
        })
        .then(function(tag) {
          expect(tag.name).to.equal(updateData.name);
        });
    });
  });
  describe('DELETE endpoint', function() {
    it('should delete a tag by id', function() {
      let tag;
      return Tag.findOne()
        .then(function(_tag) {
          tag = _tag;
          return chai.request(app).delete(`/api/tags/${tag.id}`);
        })
        .then(function(res) {
          expect(res).to.have.status(204);
          return Tag.findById(tag.id);
        })
        .then(function(_tag) {
          expect(_tag).to.be.null;
        });
    });
  });
});
