const pool = require('../config/db_pool');

exports.usercheck = function(userid, res) {
  if(!userid) res.status(500).send({message:'no user'});
  return new Promise((fulfill, reject) => {
    pool.getConnection((err, connection) => {
      if(err) reject(err);
      else fulfill(connection);
    }); //커낵션 객체 가져오기
  })
  .catch(err => { res.status(500).send({ result: [], message: "getConnection error: "+err}); })
  .then(connection => {
    return new Promise((fulfill, reject) => {
      connection.beginTransaction(err => { //트랜잭션 작업을 시작합니다.
        if(err) reject(err);
        else fulfill(connection);
      });
    });
   })
  .catch(err => {
    res.send({message:err});
  })
  .then((connection) => {
    return new Promise((fulfill, reject) => {
      let query = 'select userid from user where userid = ?'; //
      connection.query(query, userid, (err,data) => {
         if(err) reject([err,connection]);
         else {
           console.log(data);
           if(data[0]) fulfill([connection,'exist']);
           else fulfill([connection,'not exist']);
         }
      });
    });
  })
};

exports.coursecheck = function(userid, courseid, res) {
  if(!userid) res.status(500).send({message:'no user'});

  if(!courseid) res.status(500).send({message:'no course'});
  return new Promise((fulfill, reject) => {
    pool.getConnection((err, connection) => {
      if(err) reject(err);
      else fulfill(connection);
    }); //커낵션 객체 가져오기
  })
  .catch(err => { res.status(500).send({ result: [], message: "getConnection error: "+err}); })
  .then(connection => {
    return new Promise((fulfill, reject) => {
      connection.beginTransaction(err => { //트랜잭션 작업을 시작합니다.
        if(err) reject(err);
        else fulfill(connection);
      });
    });
   })
  .catch(err => {
    res.status(500).send({message:err});
  })
  .then((connection) => {
    return new Promise((fulfill, reject) => {
      let query = 'select userid from user where userid = ?'; //
      connection.query(query, userid, (err,data) => {
         if(err) reject([err,connection]);
         else {
           if(data[0]) fulfill([connection,'exist']);
           else fulfill([connection,'not exist']);
         }
      });
    });
  })
  .catch(([err,connection]) => {
    res.status(500).send({message:err});
    connection.rollback();
    connection.release();
  })
  .then(([connection,message]) => {
    return new Promise((fulfill, reject) => {
      if(message==='exist'){
        let query = 'select * from course where courseid = ?'; //
        connection.query(query, courseid, (err,data) => {
           if(err) reject([err,connection]);
           else {
             if(data[0]) fulfill([data[0],connection]);
             else {
               res.status(500).send({message:'course is not exist'});
               connection.rollback();
               connection.release();
             }
           }
        });
      }
      else{
          res.status(500).send({message:'no user'});
          connection.rollback();
          connection.release();
      }
    });
  })
};
