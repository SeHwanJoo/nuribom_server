const request = require('request');
const xml2js = require('xml2js');
const express = require('express');
const dateformat = require('dateformat');
const aws = require('aws-sdk');
const multer = require('multer');
const moment = require('moment');
const multerS3 = require('multer-s3');
const router = express.Router();
var parser = new xml2js.Parser();
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

//조회수 올리는 방안 생각하기
router.post('/', (req, res) => {
  return new Promise((fulfill, reject) => {
    pool.getConnection((err, connection) => {
      if(err) reject(err);
      else fulfill(connection);
    });
  }).catch(err => { res.status(500).send({ message: "getConnection error: "+err });})
  .then((connection) => {
    return new Promise((fulfill, reject) => {
      if(!(req.body.courseid)) res.send({message : 'insert courseid'});
      else {
        var query = 'select from course where courseid = ?';
        connection.query(query, req.body.courseid, (err, data) => {
          if(err) rject(err);
          else {
            if(data[0]) fulfill([data[0],connection]);
            else res.status(200).send({message : "no"});
          }
        });
      }
    });
  })
  .catch(err => { res.status(500).send({ message: "getConnection error: "+err });})
  .then(([result, connection]) => {
    return new Promise((fulfill, reject) => {
      if(!(req.body.courseid)) res.send({message : 'insert courseid'});
      else {
        var query = 'select from coursepage where courseid = ?';
        connection.query(query, req.body.courseid, (err, data) => {
          if(err) res.status(500).send({ message:err});
          else {
            if(data[0]) res.status(200).send({page : data[0], result : result});
            else res.status(200).send({message : "no"});
          }
        });
        connection.release();
      }
    });
  });
});

//글작성
router.post('/edit', (req, res) => {
});

//삭제체크
router.post('/deletecheck', (req, res) => {
  return new Promise((fulfill, reject) => {
    pool.getConnection((err, connection) => {
      if(err) reject(err);
      else fulfill(connection);
    });
  })
  .catch(err => { res.status(500).send({ message: "getConnection error: "+err });})
  .then((connection) => {
    return new Promise((fulfill, reject) => {
      if(!(req.body.userid && req.body.courseid)) res.send({message : 'insert userid & courseid'});
      else {
        var query = 'select from course where courseid = ? && userid = ?';
        connection.query(query, [req.body.courseid, req.body.userid], (err, date) => {
          if(err) res.status(500).send({ message:err});
          else {
            if(data[0]) res.status(200).send({message : "yes"});
            else res.status(200).send({message : "no"});
          }
        });
        connection.release();
      }
    });
  });
});

//삭제
router.post('/delete', (req, res) => {
  return new Promise((fulfill, reject) => {
    pool.getConnection((err, connection) => {
      if(err) reject(err);
      else fulfill(connection);
    });
  })
  .catch(err => { res.status(500).send({ message: "getConnection error: "+err });})
  .then((connection) => {
    return new Promise((fulfill, reject) => {
      if(!(req.body.userid && req.body.courseid)) res.send({message : 'insert userid & courseid'});
      else {
        var query = 'select from course where courseid = ? && userid = ?';
        connection.query(query, [req.body.courseid, req.body.userid], (err, date) => {
          if(err) reject(err);
          else {
            if(data[0]) fulfill(connection);
            else res.status(500).send({message : "can't delete"});
          }
        });
      }
    });
  })
  .catch(err => { res.status(500).send({ message: "getConnection error: "+err });})
  .then((connection) => {
    return new Promise((fulfill, reject) => {
      if(err) res.status(500).send({ message:err});
      else {
        var query = 'delete from course where courseid = ? && userid = ?';
        connection.query(query, [req.body.courseid, req.body.userid], (err, date) => {
          if(err) reject(err);
          else {
            if(err) res.status(500).send({ message:err});
            else res.status(200).send({message : "success"});
          }
        });
        connection.release();
      }
    });
  });
});

//userid, contentid 무결성검사
router.post('/bookmark', (req, res) => {
  return new Promise((fulfill, reject) => {
    pool.getConnection((err, connection) => {
      if(err) reject(err);
      else fulfill(connection);
    });
  })
  .catch(err => {res.status(500).send({message : "getConnection error" + err});})
  .then(connection => {
    return new Promise((fulfill, reject) => {
      if(!(req.body.userid && req.body.courseid)) res.send({message : 'insert userid & courseid'});
      else {
        var message = 'mark';
        var query = 'select * from coursebookmark where courseid = ? && userid = ?';
        connection.query(query, [req.body.courseid, req.body.userid], (err,data) => {
         if(err) res.status(500).send({ message: "inserting post error: "+err});
         else {
            if(data[0]) message = 'unmark';
            if(err) reject(err);
            else fulfill([message, connection]);
          }
        });
         console.log(message);
      }
    });
  })
  .catch(err => { res.status(500).send({ message: "getConnection error: "+err });})
  .then(([message, connection]) => {
    return new Promise((fulfill, reject) => {
      var query, record;
      if(message === 'mark'){
        query = 'insert into coursebookmark set ?';
        record = {
          userid : req.body.userid,
          courseid : req.body.courseid
        };
        connection.query(query, record, (err) => {
           if(err) res.status(500).send({ message:err});
           else res.status(200).send({message : message});
        });
      } else {
        query = 'delete from coursebookmark where userid = ? && courseid = ?';
        connection.query(query, [req.body.userid, req.body.courseid], (err) => {
          if(err) res.status(500).send({ message:err});
          else res.status(200).send({message : message});
        });
        connection.release();
      }
    })
  });
});

//댓글 달기
router.post('/comment', upload.single('image'), (req, res) => {
  return new Promise((fulfill, reject) => {
    pool.getConnection((err, connection) => {
      if(err) reject(err);
      else fulfill(connection);
    });
  })
  .catch(err => {res.status(500).send({message : "getConnection error" + err});})
  .then(connection => {
    return new Promise((fulfill, reject) => {
      if(!(req.body.userid && req.body.courseid && req.body.content)) res.send({message : 'insert userid & contentid'});
      else {
        var query = 'insert into coursecomment set ?';
        var record = {
          userid : req.body.userid,
          courseid : req.body.courseid,
          date: moment(new Date()).format('YYYY-MM-DD, h:mm:ss a'),
          content: req.body.content,
          image: req.file ? req.file.location : null,
        }
        connection.query(query, record, (err) => {
         if(err) res.status(500).send({ message: "inserting post error: "+err});
         else {
            if(err) reject(err);
            else fulfill(connection);
          }
        });
      }
    });
  })
  .catch(err => { res.status(500).send({ message: "getConnection error: "+err });})
  .then((connection) => {
    return new Promise((fulfill, reject) => {
      var query = 'update trips set viewcount = viewcount + 1 where contentid = ?';
      connection.query(query, req.body.contentid, (err) => {
       if(err) res.status(500).send({ message: "viewcount error: "+err});
       else res.status(200).send({message: "success"});
     });
   });
 });
});


//user가 있는 지 무결성검사, contentid가 있는지 무결성 검사
router.post('/like', (req, res) => {
  return new Promise((fulfill, reject) => {
    pool.getConnection((err, connection) => {
      if(err) reject(err);
      else fulfill(connection);
    });
  })
  .catch(err => {res.status(500).send({message : "getConnection error" + err});})
  .then(connection => {
    return new Promise((fulfill, reject) => {
      if(!(req.body.userid && req.body.courseid)) res.send({message : 'insert userid & courseid'});
      else {
        var message = 'like';
        var query = 'select * from courselike where courseid = ? && userid = ?';
        connection.query(query, [req.body.courseid, req.body.userid], (err,data) => {
         if(err) reject(err);
         else {
           if(data[0]) message = 'unlike';
           if(err) reject(err);
           else fulfill([message, connection]);
            console.log(message);
          }
        });
      }
    });
  })
  .catch(err => { res.status(500).send({ message: "getConnection error: "+err });})
  .then(([message, connection]) => {
    return new Promise((fulfill, reject) => {
      var query;
      if(message === 'like') {
        query = 'update course set likecount = likecount + 1 where courseid = ?';
        console.log(query);
        connection.query(query, req.body.courseid, (err) => {
           if(err) res.status(500).send({ message:err});
           else {
             if(err) reject(err);
             else fulfill([message,  connection]);
            //  res.status(200).send({result = {message : message, likecount : data[0].likecount}});
           }
        });
      } else {
        query = 'update course set likecount = likecount - 1 where courseid = ?';
        // console.log(query);
        connection.query(query, req.body.courseid, (err) => {
           if(err) res.status(500).send({ message:err});
           else {
             if(err) reject(err);
             else fulfill([message,connection]);
            //  res.status(200).send({result : { message: message}, likecount : likecount});
           }
        });
      }
    });
  })
  .catch(err => { res.status(500).send({ message: "getConnection error: "+err });})
  .then(([message, connection]) => {
    console.log(message);
    return new Promise((fulfill, reject) => {
      var query, record;
      if(message === 'like'){
        query = 'insert into courselike set ?';
        record = {
          userid : req.body.userid,
          courseid : req.body.courseid
        };
        // console.log(record);
        connection.query(query, record, (err) => {
           if(err) res.status(500).send({ message:err});
           else {
             if(err) reject(err);
             else fulfill([message,connection]);
           }
        });
      } else {
        query = 'delete from courselike where userid = ? && courseid = ?';
        connection.query(query, [req.body.userid, req.body.courseid], (err) => {
           if(err) res.status(500).send({ message:err});
           else {
             if(err) reject(err);
             else fulfill([message,connection]);
           }
        });
      }
    })
  })
  .catch(err => { res.status(500).send({ message: "getConnection error: "+err });})
  .then(([message, connection]) => {
    // console.log(message);
    return new Promise((fulfill, reject) => {
      var query = 'select likecount from course where courseid = ?';
      connection.query(query, req.body.courseid, (err, data) => {
         if(err) res.status(500).send({ message:err});
         else {
           var result = {
             message : message,
             likecount : data[0].likecount
           };
           res.status(200).send({result : result});
         }
      });
      connection.release();
    })
  })

});


//댓글 불러오기
router.get('/comments/:courseid', (req, res) => {
  return new Promise((fulfill, reject) => {
    pool.getConnection((err, connection) => {  //커낵션 객체 가져오기
      if(err) reject(err);
      else fulfill(connection);
    });
  })
  .catch(err => { res.status(500).send({ message: "getConnection error: "+err });})
  .then((connection) => {
    return new Promise((fulfill, reject) => {
        let query = 'select * from coursecomment where courseid = ?'; //3. 포스트 테이블에 게시글 저장
        connection.query(query, req.params.courseid, (err,data) => {
           if(err) res.status(500).send({ message:err});
           else {
             if(data[0]) res.status(201).send({result : data});
             else res.send({result : 'no'});
           }
        });
      connection.release();
    });
   });
});

//검색하기
router.get('/list/:keyword', (req, res) =>{
  return new Promise((fulfill, reject) => {
    pool.getConnection((err, connection) => {
      if(err) reject(err);
      else fulfill(connection);
    });
  })
  .catch(err => { res.status(500).send({ message: "getConnection error: "+err });})
  .then((connection) => {
    return new Promise((fulfill, reject) => {
      if(req.params.keyword === '') res.send({message : 'insert keyword'});
      else {
        var query = 'select from course where title Like ?'
        connection.query(query, req.params.keyword, (err, data) => {
          if(err) res.status(500).send({ message:err});
          else {
            if(data[0]) res.status(200).send({result : data[0]});
            else res.status(200).send({message : "no"});
          }
        });
        connection.release();
      }
    })
  });
});

module.exports = router;
