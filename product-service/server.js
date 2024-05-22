const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const mysql = require('mysql');

const packageDefinition = protoLoader.loadSync('./protos/products.proto');
const grpcObject = grpc.loadPackageDefinition(packageDefinition);
const productPackage = grpcObject.products;

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'micro_azza'
});

const server = new grpc.Server();

server.addService(productPackage.ProductService.service, {
  GetProducts: (_, callback) => {
    connection.query('SELECT * FROM products', (error, results) => {
      if (error) {
        console.error('Error retrieving products from database:', error);
        callback({
          code: grpc.status.INTERNAL,
          details: 'Error retrieving products from database'
        });
        return;
      }
      callback(null, { products: results });
    });
  },
  GetProductById: (call, callback) => {
    const id = call.request.id;
    connection.query('SELECT * FROM products WHERE id = ?', [id], (error, results) => {
      if (error) {
        console.error('Error retrieving product from database:', error);
        callback({
          code: grpc.status.INTERNAL,
          details: 'Error retrieving product from database'
        });
        return;
      }
      if (results.length === 0) {
        callback({
          code: grpc.status.NOT_FOUND,
          details: 'Product not found'
        });
        return;
      }
      callback(null, results[0]);
    });
  },
  AddProduct: (call, callback) => {
    const { name, price, category } = call.request;
    connection.query('INSERT INTO products (name, price, category) VALUES (?, ?, ?)', [name, price, category], (error, results) => {
      if (error) {
        console.error('Error adding product to database:', error);
        callback({
          code: grpc.status.INTERNAL,
          details: 'Error adding product to database'
        });
        return;
      }
      const id = results.insertId;
      const product = { id, name, price, category };
      callback(null, product);
    });
  },
  DeleteProduct: (call, callback) => {
    const id = call.request.id;
    connection.query('DELETE FROM products WHERE id = ?', [id], (error, results) => {
      if (error || results.affectedRows === 0) {
        console.error('Error deleting product from database:', error);
        callback({
          code: grpc.status.NOT_FOUND,
          details: 'Product not found'
        });
        return;
      }
      callback(null, { success: true });
    });
  },
  UpdateProduct: (call, callback) => {
    const { id, name, price, category } = call.request;
    connection.query('UPDATE products SET name = ?, price = ?, category = ? WHERE id = ?', [name, price, category, id], (error, results) => {
      if (error || results.affectedRows === 0) {
        console.error('Error updating product in database:', error);
        callback({
          code: grpc.status.NOT_FOUND,
          details: 'Product not found'
        });
        return;
      }
      callback(null, { id, name, price, category });
    });
  }
});

server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), (err, port) => {
  if (err) {
    console.error(`Failed to bind server. Error: ${err}`);
    return;
  }
  console.log(`Products Service running at http://0.0.0.0:${port}`);
  server.start();
});
