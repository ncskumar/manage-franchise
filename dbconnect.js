const mysql = require('mysql');
const util = require('util');

const connectAndExecQuery=async (queryOps, queryData, mysqlObj)=>{
  const connection=mysql.createConnection(mysqlObj); 
  try {
    const query = util.promisify(connection.query).bind(connection);
    await query(queryOps, queryData);
    connection.end();
    return ({response:'query executed'});
  } catch (error) {
    if (error.sqlMessage) {
      connection.end();
    }
    return ({error: 'error occurred '+ error});
  }
};

const getDataFromDb=async (queryOps, queryData, mysqlObj)=>{
    const connection=mysql.createConnection(mysqlObj); 
    try {
      const query = util.promisify(connection.query).bind(connection);
      const response=await query(queryOps, queryData);
      connection.end();
      return response;
    } catch (error) {
      if (error.sqlMessage) {
        connection.end();
      }
      return ({error: 'error occurred '+ error});
    }
  };

module.exports={connectAndExecQuery, getDataFromDb};
