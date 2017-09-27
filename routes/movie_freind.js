const express = require('express');
const dateformat = require('dateformat');
const aws = require('aws-sdk');
const multer = require('multer');
const moment = require('moment');
const multerS3 = require('multer-s3');
const router = express.Router();
var need = require('./need.js');
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../config/db_pool');
const s3 = new aws.S3();
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'joo97',
    acl: 'public-read',
    key: function (req, file, cb) {
      cb(null, Date.now() + '.' + file.originalname.split('.').pop());
    }
  })
});

router.get('/moviedetail/:movieid', (req,res) => {
  return new Promise((fulfill, reject) => {
    pool.getConnection((err, connection) => {
      if(err) reject(err);
      else fulfill(connection);
    }); //커낵션 객체 가져오기
  })
  .catch((err) => {
    res.status(500).send({message : err});
  })
  .then((connection) => {
    if(!(req.params.movieid))
      res.status(403).send({ message: 'please input all of movieid.'});
    else {
      let query = 'select * from movies where movieid = ?';
      connection.query(query, req.params.movieid, (err,data) => {
         if(err) res.status(500).send({ message: err});
         else {
           if(data[0]) res.status(201).send({ message: 'ok',friends:data[0]});
           else res.status(403).send({message: 'fail'});
         }
      });
    }
    connection.release();
  });
})

router.get('/friends/:userid', (req,res) => {
  return new Promise((fulfill, reject) => {
    pool.getConnection((err, connection) => {
      if(err) reject(err);
      else fulfill(connection);
    }); //커낵션 객체 가져오기
  })
  .catch((err) => {
    res.status(500).send({message : err});
  })
  .then((connection) => {
    if(!(req.params.userid))
      res.status(403).send({ message: 'please input all of userid.'});
    else {
      let query = 'select * from friends where userid = ?';
      connection.query(query, req.params.userid, (err,data) => {
         if(err) res.status(500).send({ message: err});
         else {
           if(data[0]) res.status(201).send({ message: 'ok',friends:data});
           else res.status(403).send({message: 'fail'});
         }
      });
    }
    connection.release();
  });
})


router.post('/friends', (req,res) => {
  return new Promise((fulfill, reject) => {
    pool.getConnection((err, connection) => {
      if(err) reject(err);
      else fulfill(connection);
    }); //커낵션 객체 가져오기
  })
  .catch((err) => {
    res.status(500).send({message : err});
  })
  .then((connection) => {
    if(!(req.body.userid))
      res.status(403).send({ message: 'please input all of userid.'});
    else {
      function getdata(email){
        return new Promise((fulfill,reject) => {
          let query = 'select * from user where email = ?';
          connection.query(query, email, (err,data) => {
             if(err) inject(err);
             else {
               if(data[0]) fulfill([connection,data[0]]);
               else fulfill([connection,null]);
             }
          });
        })
      }
      var getdatas = new Array();
      for(var index in req.body.friends){
        getdatas[index] = getdata(req.body.friends[index]);
      }
      Promise.all(getdatas,([connection, data]) => {
        res.send({message:"ok", result:data});
        console.log(data);
      })
    }
    connection.release();
  });
})

router.get('/movie', (req,res) => {
  return new Promise((fulfill, reject) => {
    pool.getConnection((err, connection) => {
      if(err) reject(err);
      else fulfill(connection);
    }); //커낵션 객체 가져오기
  })
  .catch((err) => {
    res.status(500).send({message : err});
  })
  .then((connection) => {
    if(!(req.params.userid))
      res.status(403).send({ message: 'please input all of userid.'});
    else {
      let query = 'select * from movies';
      connection.query(query,(err,data) => {
         if(err) res.status(500).send({ message: err});
         else {
           if(data[0]) res.status(201).send({ message: 'ok',movies:data});
           else res.status(403).send({message: 'fail'});
         }
      });
    }
    connection.release();
  });
})

module.exports = router;
