/*
*
*
*       Complete the API routing below
*       
*       
*/

'use strict';

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = process.env.DB;

let booksCollectionPromise;

function getBooksCollection() {
  if (!booksCollectionPromise) {
    if (!MONGO_URI) {
      return Promise.reject(new Error('Database connection string not set in environment'));
    }

    booksCollectionPromise = MongoClient.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
      .then((client) => client.db().collection('books'))
      .catch((error) => {
        console.error('Failed to connect to database', error);
        throw error;
      });
  }

  return booksCollectionPromise;
}

function buildListItem(doc) {
  const comments = Array.isArray(doc.comments) ? doc.comments : [];
  return {
    _id: doc._id.toString(),
    title: doc.title,
    commentcount: comments.length
  };
}

function buildBook(doc) {
  const comments = Array.isArray(doc.comments) ? doc.comments : [];
  return {
    _id: doc._id.toString(),
    title: doc.title,
    comments
  };
}

module.exports = function (app) {

  app.route('/api/books')
    .get(async function (req, res) {
      try {
        const collection = await getBooksCollection();
        const books = await collection
          .find({}, { projection: { title: 1, comments: 1 } })
          .toArray();

        res.json(books.map(buildListItem));
      } catch (error) {
        console.error('GET /api/books error', error);
        res.status(500).type('text').send('internal server error');
      }
    })

    .post(async function (req, res) {
      const title = req.body.title;

      if (!title) {
        return res.type('text').send('missing required field title');
      }

      try {
        const collection = await getBooksCollection();
        const insertResult = await collection.insertOne({ title, comments: [] });
        res.json({ _id: insertResult.insertedId.toString(), title });
      } catch (error) {
        console.error('POST /api/books error', error);
        res.status(500).type('text').send('internal server error');
      }
    })

    .delete(async function (req, res) {
      try {
        const collection = await getBooksCollection();
        await collection.deleteMany({});
        res.type('text').send('complete delete successful');
      } catch (error) {
        console.error('DELETE /api/books error', error);
        res.status(500).type('text').send('internal server error');
      }
    });



  app.route('/api/books/:id')
    .get(async function (req, res) {
      const bookId = req.params.id;

      if (!ObjectId.isValid(bookId)) {
        return res.type('text').send('no book exists');
      }

      try {
        const collection = await getBooksCollection();
        const book = await collection.findOne({ _id: new ObjectId(bookId) });

        if (!book) {
          return res.type('text').send('no book exists');
        }

        res.json(buildBook(book));
      } catch (error) {
        console.error('GET /api/books/:id error', error);
        res.status(500).type('text').send('internal server error');
      }
    })

    .post(async function (req, res) {
      const bookId = req.params.id;
      const comment = req.body.comment;

      if (!ObjectId.isValid(bookId)) {
        return res.type('text').send('no book exists');
      }

      if (!comment) {
        return res.type('text').send('missing required field comment');
      }

      try {
        const collection = await getBooksCollection();
        const result = await collection.findOneAndUpdate(
          { _id: new ObjectId(bookId) },
          { $push: { comments: comment } },
          { returnOriginal: false }
        );

        if (!result.value) {
          return res.type('text').send('no book exists');
        }

        res.json(buildBook(result.value));
      } catch (error) {
        console.error('POST /api/books/:id error', error);
        res.status(500).type('text').send('internal server error');
      }
    })

    .delete(async function (req, res) {
      const bookId = req.params.id;

      if (!ObjectId.isValid(bookId)) {
        return res.type('text').send('no book exists');
      }

      try {
        const collection = await getBooksCollection();
        const result = await collection.deleteOne({ _id: new ObjectId(bookId) });

        if (result.deletedCount === 0) {
          return res.type('text').send('no book exists');
        }

        res.type('text').send('delete successful');
      } catch (error) {
        console.error('DELETE /api/books/:id error', error);
        res.status(500).type('text').send('internal server error');
      }
    });
  
};
