require('dotenv/config');
const express = require('express');

const db = require('./database');
const ClientError = require('./client-error');
const staticMiddleware = require('./static-middleware');
const sessionMiddleware = require('./session-middleware');

const app = express();

app.use(staticMiddleware);
app.use(sessionMiddleware);

app.use(express.json());

app.get('/api/health-check', (req, res, next) => {
  db.query('select \'successfully connected\' as "message"')
    .then(result => res.json(result.rows[0]))
    .catch(err => next(err));
});

app.get('/api/products', (req, res, next) => {
  const sql = `
    select "image",
           "name",
           "price",
           "productId",
           "shortDescription"
      from "products"
  `;

  db.query(sql)
    .then(result => {
      const products = result.rows;
      res.status(200).json(products);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({
        error: 'An unexpected error occured.'
      });
    });
});

app.get('/api/products/:productId', (req, res, next) => {
  const id = parseInt(req.params.productId, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      error: '"id" must be a positive integer'
    });
  }

  const sql = `
  select *
      from products
      where "productId" = $1
  `;

  const params = [id];

  db.query(sql, params)
    .then(result => {
      const product = result.rows[0];
      if (!product) {
        next(new ClientError(`Cannot find product with id of ${id}`, 404));
      } else {
        res.status(200).json(product);
      }
    })
    .catch(err => next(err));
});

app.get('/api/cart', (req, res, next) => {
  const sql = `
  select *
  from carts`;

  db.query(sql)
    .then(result => {
      const cart = result.rows;
      res.status(200).json(cart);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({
        error: 'An unexpected error occured.'
      });
    });
});

app.post('/api/cart', (req, res, next) => {
  const productId = parseInt(req.body.productId, 10);

  if (NaN(productId) || productId <= 0) {
    return res.status(400).json({
      error: 'productId must be a positive integer'
    });
  }

  const sql = `
  select "price"
  from "products"
  where "productId" = $1
  `;

  const params = [productId];

  db.query(sql, params)
    .then()
    .then()
    .then()
    .catch(err => next(err));
});

app.use('/api', (req, res, next) => {
  next(new ClientError(`cannot ${req.method} ${req.originalUrl}`, 404));
});

app.use((err, req, res, next) => {
  if (err instanceof ClientError) {
    res.status(err.status).json({ error: err.message });
  } else {
    console.error(err);
    res.status(500).json({
      error: 'an unexpected error occurred'
    });
  }
});

app.listen(process.env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log('Listening on port', process.env.PORT);
});
