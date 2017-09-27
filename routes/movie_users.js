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

router.get('/profile', (req,res) => {
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
    let query = 'select * from users where userid = ?'
    connection.query(query,req.params.userid,(err,data) => {
      if(err) res.status(500).send({message:err});
      else res.status(200).send({result:data[0]});
    })
  })
})

router.post('/', upload.single('image'), (req, res) => {
  var check = need.usercheck(req.body.userid, res)
  .catch(([err,connection]) => {
    res.status(500).send({message : err});
    connection.rollback();
    connection.release();
  })
  .then(([connection,message]) => {
    if(message === 'exist') {
      res.status(201).send({message : 'user exist'});
      connection.rollback();
      connection.release();
    }
    else if(message === 'not exist') {
      if(!(req.body.userid&&req.body.email&&req.body.password))
        res.status(403).send({ message: 'please input all of userid, email,password.'});
      else {
        let query = 'insert into user set ?'; //3. 포스트 테이블에 게시글 저장
        let record = {
           userid : req.body.userid,
           email: req.body.email,
           img: req.file ? req.file.location : null,
           password: req.body.password
        };
        connection.query(query, record, err => {
           if(err) res.status(500).send({ message: err});
           else res.status(201).send({ message: 'ok' });
        });
      }
    }
    else res.status(500).send({message:message});
    connection.commit();
    connection.release();
  });
});

router.post('/login', (req,res) => {
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
    if(!(req.body.email&&req.body.password))
      res.status(403).send({ message: 'please input all of email, password.'});
    else {
      let query = 'select * from user where email = ? && password = ?';
      connection.query(query, [req.body.email,req.body.password], (err,data) => {
         if(err) res.status(500).send({ message: err});
         else {
           if(data[0]) res.status(201).send({ message: 'ok',userid:data[0].userid });
           else res.status(403).send({message: 'fail'});
         }
      });
    }
    connection.release();
  });
})


router.post('/modify', upload.single('image'), (req, res) => {
  var check = need.usercheck(req.body.userid, res)
  .catch(([err,connection]) => {
    res.status(500).send({message : err});
    connection.rollback();
    connection.release();
  })
  .then(([connection,message]) => {
    if(message === 'not exist') {
      res.status(201).send({message : 'no user'});
      connection.rollback();
      connection.release();
    }
    else if(message === 'exist') {
      if(!(req.body.modify_userid&&req.body.email&&req.body.password))
        res.status(403).send({ message: 'please input all of userid, email,password.'});
      else {
        let query = 'update user set ? where userid = ?'; //3. 포스트 테이블에 게시글 저장
        let record = {
           userid : req.body.modify_userid,
           email: req.body.email,
           img: req.file ? req.file.location : null,
           password: req.body.password
        };
        connection.query(query, [record,req.body.userid], err => {
           if(err) res.status(500).send({ message: err});
           else res.status(201).send({ message: 'ok' });
        });
      }
    }
    else res.status(500).send({message:message});
    connection.commit();
    connection.release();
  });
});

router.get('/idtest/:userid', (req, res) => {
  var check = need.usercheck(req.params.userid, res)
  .catch(([err,connection]) => {
    res.status(500).send({message : err});
    connection.rollback();
    connection.release();
  })
  .then(([connection,message]) => {
    if(message === 'not exist') {
      res.status(201).send({message : 'no user'});
      connection.rollback();
      connection.release();
    }
    else if(message === 'exist') res.status(201).send({message : 'no'});
    else res.status(500).send({message:message});
    connection.commit();
    connection.release();
  });
});

router.get('/emailtest/:email', (req, res) => {
  return new Promise((fulfill, reject) => {
    pool.getConnection((err, connection) => {  //커낵션 객체 가져오기
      if(err) reject(err);
      else fulfill(connection);
    });
  })
  .catch(err => { res.status(500).send({ message: "getConnection error: "+err });})
  .then((connection) => {
    return new Promise((fulfill, reject) => {
        let query = 'select email from user where email = ?'; //3. 포스트 테이블에 게시글 저장
        connection.query(query, req.params.email, (err,data) => {
           if(err) res.status(500).send({ message: "inserting post error: "+err});
           else {
             if(data[0]) res.status(201).send({message : 'no'});
             else res.status(201).send({message : 'yes'});
           }
        });
      connection.release();
    });
   });
});

module.exports = router;
