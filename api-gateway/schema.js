const { buildSchema } = require('graphql');

const schema = buildSchema(`
  type Product {
    id: String
    name: String
    category: String
    price: Int
  }

  type User {
    id: String
    name: String
    email: String
    age: Int
  }

  type Query {
    products: [Product]
    product(id: String!): Product
    users: [User]
    user(id: String!): User
  }

  type Mutation {
    addProduct(name: String!, category: String!, price: Int!): Product
    deleteProduct(id: String!): Boolean
    updateProduct(id: String!, name: String!, category: String!, price: Int!): Product
    addUser(name: String!, email: String!, age: Int!): User 
    updateUser(id: String!, name: String!, email: String!, age: Int!): User
    deleteUser(id: String!): Boolean
  }
`);

module.exports = schema;
