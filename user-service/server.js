const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const mysql = require('mysql');

const packageDefinition = protoLoader.loadSync('./protos/users.proto');
const grpcObject = grpc.loadPackageDefinition(packageDefinition);
const userPackage = grpcObject.users;

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'micro_azza'
});

const server = new grpc.Server();

server.addService(userPackage.UserService.service, {
  GetUsers: (_, callback) => {
    connection.query('SELECT * FROM users', (error, results) => {
      if (error) {
        callback({
          code: grpc.status.INTERNAL,
          details: 'Error retrieving users from database'
        });
        return;
      }
      callback(null, { users: results });
    });
  },
  GetUserById: (call, callback) => {
    const id = call.request.id;
    connection.query('SELECT * FROM users WHERE id = ?', [id], (error, results) => {
      if (error) {
        callback({
          code: grpc.status.INTERNAL,
          details: 'Error retrieving user from database'
        });
        return;
      }
      if (results.length === 0) {
        callback({
          code: grpc.status.NOT_FOUND,
          details: 'User not found'
        });
        return;
      }
      callback(null, results[0]);
    });
  },
  AddUser: (call, callback) => {
    const { name, email, age } = call.request;
    connection.query('INSERT INTO users (name, email, age) VALUES (?, ?, ?)', [name, email, age], (error, results) => {
      if (error) {
        callback({
          code: grpc.status.INTERNAL,
          details: 'Error adding user to database'
        });
        return;
      }
      const id = results.insertId;
      const newUser = { id, name, email, age };
      callback(null, newUser);
    });
  },
  UpdateUser: (call, callback) => {
    const { id, name, email, age } = call.request;
    connection.query('UPDATE users SET name = ?, email = ?, age = ? WHERE id = ?', [name, email, age, id], (error, results) => {
      if (error || results.affectedRows === 0) {
        callback({
          code: grpc.status.NOT_FOUND,
          details: 'User not found'
        });
        return;
      }
      const updatedUser = { id, name, email, age };
      callback(null, updatedUser);
    });
  },
  DeleteUser: (call, callback) => {
    const id = call.request.id;
    connection.query('DELETE FROM users WHERE id = ?', [id], (error, results) => {
      if (error || results.affectedRows === 0) {
        callback({
          code: grpc.status.NOT_FOUND,
          details: 'User not found'
        });
        return;
      }
      callback(null, { success: true });
    });
  }
});

server.bindAsync('0.0.0.0:50052', grpc.ServerCredentials.createInsecure(), (err, port) => {
  if (err) {
    console.error(`Failed to bind server. Error: ${err}`);
    return;
  }
  console.log(`Users Service running at http://0.0.0.0:${port}`);
  server.start();
});
