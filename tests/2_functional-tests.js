/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       
*/

const chaiHttp = require('chai-http');
const chai = require('chai');
const { ObjectId } = require('mongodb');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {

  suiteSetup(function(done) {
    chai.request(server)
      .post('/api/books')
      .send({ title: 'Example Seed Book' })
      .end(function(err) {
        if (err) {
          console.error('Failed to seed example book', err);
        }
        done();
      });
  });

  let createdBookId;
  const testTitle = 'Functional Test Book';
  const testComment = 'Functional test comment';

  /*
  * ----[EXAMPLE TEST]----
  * Each test should completely test the response of the API end-point including response status code!
  */
  test('#example Test GET /api/books', function(done){
     chai.request(server)
      .get('/api/books')
      .end(function(err, res){
        assert.equal(res.status, 200);
        assert.isArray(res.body, 'response should be an array');
        assert.property(res.body[0], 'commentcount', 'Books in array should contain commentcount');
        assert.property(res.body[0], 'title', 'Books in array should contain title');
        assert.property(res.body[0], '_id', 'Books in array should contain _id');
        done();
      });
  });
  /*
  * ----[END of EXAMPLE TEST]----
  */

  suite('Routing tests', function() {


    suite('POST /api/books with title => create book object/expect book object', function() {
      
      test('Test POST /api/books with title', function(done) {
        chai.request(server)
          .post('/api/books')
          .send({ title: testTitle })
          .end(function(err, res) {
            assert.isNull(err);
            assert.equal(res.status, 200);
            assert.isObject(res.body);
            assert.property(res.body, '_id');
            assert.property(res.body, 'title');
            assert.equal(res.body.title, testTitle);
            createdBookId = res.body._id;
            done();
          });
      });
      
      test('Test POST /api/books with no title given', function(done) {
        chai.request(server)
          .post('/api/books')
          .send({})
          .end(function(err, res) {
            assert.isNull(err);
            assert.equal(res.status, 200);
            assert.equal(res.text, 'missing required field title');
            done();
          });
      });
      
    });


    suite('GET /api/books => array of books', function(){
      
      test('Test GET /api/books',  function(done){
        chai.request(server)
          .get('/api/books')
          .end(function(err, res) {
            assert.isNull(err);
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            if (res.body.length > 0) {
              const book = res.body[0];
              assert.property(book, '_id');
              assert.property(book, 'title');
              assert.property(book, 'commentcount');
            }
            done();
          });
      });      
      
    });


    suite('GET /api/books/[id] => book object with [id]', function(){
      
      test('Test GET /api/books/[id] with id not in db',  function(done){
        const fakeId = new ObjectId().toHexString();
        chai.request(server)
          .get('/api/books/' + fakeId)
          .end(function(err, res) {
            assert.isNull(err);
            assert.equal(res.status, 200);
            assert.equal(res.text, 'no book exists');
            done();
          });
      });
      
      test('Test GET /api/books/[id] with valid id in db',  function(done){
        chai.request(server)
          .get('/api/books/' + createdBookId)
          .end(function(err, res) {
            assert.isNull(err);
            assert.equal(res.status, 200);
            assert.isObject(res.body);
            assert.property(res.body, '_id');
            assert.property(res.body, 'title');
            assert.property(res.body, 'comments');
            assert.isArray(res.body.comments);
            assert.equal(res.body._id, createdBookId);
            done();
          });
      });
      
    });


    suite('POST /api/books/[id] => add comment/expect book object with id', function(){
      
      test('Test POST /api/books/[id] with comment', function(done){
        chai.request(server)
          .post('/api/books/' + createdBookId)
          .send({ comment: testComment })
          .end(function(err, res) {
            assert.isNull(err);
            assert.equal(res.status, 200);
            assert.isObject(res.body);
            assert.property(res.body, 'comments');
            assert.isArray(res.body.comments);
            assert.include(res.body.comments, testComment);
            assert.equal(res.body._id, createdBookId);
            done();
          });
      });

      test('Test POST /api/books/[id] without comment field', function(done){
        chai.request(server)
          .post('/api/books/' + createdBookId)
          .send({})
          .end(function(err, res) {
            assert.isNull(err);
            assert.equal(res.status, 200);
            assert.equal(res.text, 'missing required field comment');
            done();
          });
      });

      test('Test POST /api/books/[id] with comment, id not in db', function(done){
        const fakeId = new ObjectId().toHexString();
        chai.request(server)
          .post('/api/books/' + fakeId)
          .send({ comment: 'should fail' })
          .end(function(err, res) {
            assert.isNull(err);
            assert.equal(res.status, 200);
            assert.equal(res.text, 'no book exists');
            done();
          });
      });
      
    });


    suite('DELETE /api/books/[id] => delete book object id', function() {

      test('Test DELETE /api/books/[id] with valid id in db', function(done){
        chai.request(server)
          .delete('/api/books/' + createdBookId)
          .end(function(err, res) {
            assert.isNull(err);
            assert.equal(res.status, 200);
            assert.equal(res.text, 'delete successful');
            done();
          });
      });

      test('Test DELETE /api/books/[id] with  id not in db', function(done){
        chai.request(server)
          .delete('/api/books/' + createdBookId)
          .end(function(err, res) {
            assert.isNull(err);
            assert.equal(res.status, 200);
            assert.equal(res.text, 'no book exists');
            done();
          });
      });

    });

  });

});
