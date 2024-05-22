const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const schema = require('./schema');

const app = express();
app.use(express.json()); 

const productProtoPath = '../product-service/protos/products.proto';
const userProtoPath = '../user-service/protos/users.proto';

const productPackageDef = protoLoader.loadSync(productProtoPath);
const userPackageDef = protoLoader.loadSync(userProtoPath);

const productGrpcObject = grpc.loadPackageDefinition(productPackageDef).products;
const userGrpcObject = grpc.loadPackageDefinition(userPackageDef).users;

const productClient = new productGrpcObject.ProductService('localhost:50051', grpc.credentials.createInsecure());
const userClient = new userGrpcObject.UserService('localhost:50052', grpc.credentials.createInsecure());

const root = {
  products: () => {
    return new Promise((resolve, reject) => {
      productClient.GetProducts({}, (error, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(response.products);
        }
      });
    });
  },
  product: (args) => {
    return new Promise((resolve, reject) => {
      productClient.GetProductById({ id: args.id }, (error, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  },
  addProduct: ({ name, category, price }) => {
    return new Promise((resolve, reject) => {
      productClient.AddProduct({ name, category, price }, (error, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  },
  updateProduct: ({ id, name, category, price }) => {
    return new Promise((resolve, reject) => {
      productClient.UpdateProduct({ id, name, category, price }, (error, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  },
  deleteProduct: ({ id }) => {
    return new Promise((resolve, reject) => {
      productClient.DeleteProduct({ id }, (error, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(response.success);
        }
      });
    });
  },

  getProductsRest: (req, res) => {
    productClient.GetProducts({}, (error, response) => {
      if (error) {
        res.status(500).send(error);
      } else {
        res.status(200).send(response.products);
      }
    });
  },
  addProductRest: (req, res) => {
    const { name, category, price } = req.body;
    productClient.AddProduct({ name, category, price }, (error, response) => {
      if (error) {
        res.status(500).send(error);
      } else {
        res.status(201).send(response);
      }
    });
  },
  updateProductRest: (req, res) => {
    const { id } = req.params;
    const { name, category, price } = req.body;
    productClient.UpdateProduct({ id, name, category, price }, (error, response) => {
      if (error) {
        res.status(500).send(error);
      } else {
        res.status(200).send(response);
      }
    });
  },
  deleteProductRest: (req, res) => {
    const { id } = req.params;
    productClient.DeleteProduct({ id }, (error, response) => {
      if (error) {
        res.status(500).send(error);
      } else {
        res.status(204).send();
      }
    });
  },

  getUsersRest: (req, res) => {
    userClient.GetUsers({}, (error, response) => {
      if (error) {
        res.status(500).send(error);
      } else {
        res.status(200).send(response.users);
      }
    });
  },
  addUserRest: (req, res) => {
    const { name, email, age } = req.body;
    userClient.AddUser({ name, email, age }, (error, response) => {
      if (error) {
        res.status(500).send(error);
      } else {
        res.status(201).send(response);
      }
    });
  },
  updateUserRest: (req, res) => {
    const { id } = req.params;
    const { name, email, age } = req.body;
    userClient.UpdateUser({ id, name, email, age }, (error, response) => {
      if (error) {
        res.status(500).send(error);
      } else {
        res.status(200).send(response);
      }
    });
  },
  deleteUserRest: (req, res) => {
    const { id } = req.params;
    userClient.DeleteUser({ id }, (error, response) => {
      if (error) {
        res.status(500).send(error);
      } else {
        res.status(204).send();
      }
    });
  },
};

app.get('/products', root.getProductsRest);
app.post('/products', root.addProductRest);
app.put('/products/:id', root.updateProductRest);
app.delete('/products/:id', root.deleteProductRest);

app.get('/users', root.getUsersRest);
app.post('/users', root.addUserRest);
app.put('/users/:id', root.updateUserRest);
app.delete('/users/:id', root.deleteUserRest);

app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true
}));

app.listen(4000, '0.0.0.0', () => {
  console.log('API Gateway running at http://0.0.0.0:4000/graphql');
});
