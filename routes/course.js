const request = require('request');
const xml2js = require('xml2js');
const express = require('express');
const dateformat = require('dateformat');
const aws = require('aws-sdk');
const multer = require('multer');
const moment = require('moment');
const multerS3 = require('multer-s3');
var FCM = require('fcm-push');
var apiKey = 'AAAADEdN0NU:APA91bFIV55U8yxpyOy4S3McQQHJVgo0OSydNCxL5641g5y3brT9RRtxaKNvql9hk0L6gY8iq3MWJ0zJQ8CQN0-u00d_5aXia79PvZ1zDorTPlGLkam3ua3knfxyHsIMNcUKNlWbU4Yk';
var fcm = new FCM(apiKey);
var check = require('./need.js');

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
  check.coursecheck(req.body.userid, req.body.courseid, res)
  .catch(([err,connection]) => {
    res.status(500).send({ message: "getConnection error: "+err });
    connection.rollback();
    connection.release();
  })
  .then(([result,connection]) => {
    return new Promise((fulfill, reject) => {
      let query = 'update alarm set wheatherread = 1 where like_comment = 1 && courseid = ? && userid = ?'; //3. 포스트 테이블에 게시글 저장
      connection.query(query, [req.body.courseid,req.body.userid], (err,data) => {
         if(err) reject([err,connection]);
         else fulfill([result,connection]);
      });
    });
  })
  .catch(([err,connection]) => {
    res.status(500).send({ message: "getConnection error: "+err });
    connection.rollback();
    connection.release();
  })
  .then(([result,connection]) => {
    return new Promise((fulfill, reject) => {
      var query = 'select likeid from courselike where courseid = ? && userid = ?';
      connection.query(query, [req.body.courseid,req.body.userid], (err, data) => {
        if(err) reject([err,connection]);
        else {
          if(data[0]) fulfill(['like',connection,result]);
          else fulfill(['unlike',connection,result]);
        }
      });
    });
  })
  .catch(([err,connection]) => {
    res.status(500).send({ message: "getConnection error: "+err });
    connection.rollback();
    connection.release();
  })
  .then(([message,connection,result]) => {
    return new Promise((fulfill, reject) => {
      var query = 'select * from coursepage where courseid = ?';
      connection.query(query, req.body.courseid, (err, data) => {
        if(err) res.status(500).send({ message:err});
        else {
          res.status(200).send({page : data, result : result, message:message});
        }
      });
      connection.commit();
      connection.release();
    });
  });
});

//글작성
router.post('/edit', upload.single('image'), (req, res) => {
  check.usercheck(req.body.main.userid, res)
  .catch(([err,connection]) => {
    res.status(500).send({message:err});
    connection.rollback();
    connection.release();
  })
  .then(([connection,message]) => {
    if(!(req.body.main.title&&req.body.main.overview&&req.body.main.userid&&req.body.page))
     res.status(500).send({message:'insert title, overview,userid,page'});
     else{
       return new Promise((fulfill, reject) => {
         if(message==='exist'){
           let query = 'insert into course set ?'; //
           let record = {
             title : req.body.main.title,
             overview : req.body.main.overview,
             userid : req.body.main.userid,
             image: req.file ? req.file.location : null
           }
           connection.query(query, record, (err,data) => {
              if(err) reject([err,connection]);
              else fulfill([connection,data.insertId]);
           });
         }
         else{
             res.status(500).send({message:'no user'});
             connection.rollback();
             connection.release();
         }
       });
     }
  })
  .catch(([err,connection]) => {
    res.status(500).send({message:err});
    connection.rollback();
    connection.release();
  })
  .then(([connection,courseid]) => {
    function postpage(i){
      return new Promise((fulfill, reject) => {
        let query = 'insert into coursepage set ?'; //
        let record = {
          title : req.body.page[i].title,
          content : req.body.page[i].content,
          contentid : req.body.page[i].contentid ? req.body.page[i].contentid : null,
          contenttypeid : req.body.page[i].contentid ? req.body.page[i].contenttypeid : null,
          image: req.file ? req.file.location : null,
          courseid : courseid
        }
        connection.query(query, record, err => {
           if(err) reject([err,connection]);
           else fulfill([connection,courseid]);
        });
      })
    }
    var page_promise = [];
    for(var i in req.body.page){
      page_promise[i] = postpage(i);
    }
    Promise.all(page_promise).then(([connection,courseid]) => {
      res.status(200).send({message : 'ok'});
      connection[0].commit();
      connection[0].release();
    })
  })
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
  check.coursecheck(req.body.userid, req.body.courseid, res)
  .catch(([err,connection]) => {
    res.status(500).send({ message: "getConnection error: "+err });
    connection.rollback();
    connection.release();
  })
  .then((connection) => {
    return new Promise((fulfill, reject) => {
      var query = 'select from course where courseid = ? && userid = ?';
      connection.query(query, [req.body.courseid, req.body.userid], (err, date) => {
        if(err) reject(err);
        else {
          if(data[0]) fulfill(connection);
          else {
            res.status(500).send({message : "can't delete"});
            connection.rollback();
            connection.release();
          }
        }
      });
    });
  })
  .catch(err => {
    connection.rollback(); //조회수는 변경된 상태에서 select 쿼리에 에러 발생 시 조회 수 변경을 롤백(취소) 시킵니다.
    connection.release();
    res.status(500).send({ message: "getConnection error: "+err });
   })
  .then((connection) => {
    return new Promise((fulfill, reject) => {
      var query = 'delete from course where courseid = ? && userid = ?';
      connection.query(query, [req.body.courseid, req.body.userid], (err, date) => {
        if(err) {
          res.status(500).send({ message:err});
            connection.rollback();
        }
        else {
          res.status(200).send({message : "success"});
            connection.commit();
        }
      });
      connection.release();
    });
  });
});


//댓글 달기
router.post('/comment', upload.single('image'), (req, res) => {
  check.coursecheck(req.body.userid, req.body.courseid, res)
  .catch(([err,connection]) => {
    res.status(500).send({ message: "getConnection error: "+err });
    connection.rollback();
    connection.release();
  })
  .then(([noneed,connection]) => {
    return new Promise((fulfill, reject) => {
      if(!(req.body.userid && req.body.courseid && req.body.content)) res.send({message : 'insert userid & courseid'});
      else {
        var query = 'insert into coursecomment set ?';
        var record = {
          userid : req.body.userid,
          courseid : req.body.courseid,
          date: moment(new Date()).format('YYYY-MM-DD, h:mm:ss a'),
          content: req.body.content,
          image: req.file ? req.file.location : null
        };
        connection.query(query, record, (err) => {
          if(err) reject([err,connection]);
          else fulfill(connection);
        });
      }
    })
  })
  .catch(([err,connection]) => {
    res.status(500).send({ message: "getConnectioor: "+err });
    connection.rollback();
    connection.release();
  })
  .then((connection) => {
    return new Promise((fulfill, reject) => {
      var query, record;
      query = 'select * from course where courseid = ?';
      // console.log(record);
      connection.query(query, req.body.courseid, (err,data) => {
        if(err) reject([err,connection]);
        else fulfill([connection,data[0]]);
      });
    });
  })
  .catch(([err,connection]) => {
    res.status(500).send({ message: "getConnectioor: "+err });
    connection.rollback();
    connection.release();
  })
  .then(([connection,result]) => {
    return new Promise((fulfill, reject) => {
      var query, record;
      query = 'select token from user where userid = ?';
      // console.log(record);
      connection.query(query,result.userid, (err,data) => {
        if(err) reject([err,connection]);
        else fulfill([connection,data[0].token,result]);
      });
    });
  })
  .catch(([err,connection]) => {
    res.status(500).send({message: err});
    connection.rollback();
    connection.release();
  })
  .then(([connection,token,result]) => {
    return new Promise((fulfill,reject) => {
      console.log(token);
      if(token === 'token'){
        fulfill(connection);
      } else{
        var fcm_message = {
          to: token, // required
          collapse_key: 'test',
          data: {
           title: result.title,
           body: req.body.userid+'님이 '+result.title+'에 댓글을 달았습니다.'
        }
       };
       fcm.send(fcm_message, function(err, messageId){
         if (err) {
           console.log("Something has gone wrong!");
           reject([err,connection]);
         } else {
           console.log("Sent with message ID: ", messageId);
           fulfill([connection,result]);
         }
       });
      }
    })
  })
  .catch(([err,connection]) => {
    res.status(500).send({ message: "getConnection error: "+err });
    connection.rollback();
    connection.release();
  })
  .then(([connection,result]) => {
    return new Promise((fulfill, reject) => {
      var query = 'insert into alarm set ?';
      var record = {
        courseid: result.courseid,
        title: result.title,
        writeuser: req.body.userid,
        like_comment: 0,
        userid: result.userid,
      }
      connection.query(query, record, (err) => {
        if(err) reject([err,connection]);
        else fulfill(connection);
     });
   });
 })
  .catch(([err,connection]) => {
    res.status(500).send({ message: "getConnection error: "+err });
    connection.rollback();
    connection.release();
  })
  .then((connection) => {
    return new Promise((fulfill, reject) => {
      var query = 'update course set commentcount = commentcount + 1 where courseid = ?';
      connection.query(query, req.body.courseid, (err) => {
       if(err) {
         res.status(500).send({ message: "comment error: "+err});
         connection.rollback();
       }
       else {
         res.status(200).send({message: "success"});
         connection.commit();
       }
     });
     connection.release();
   });
 });
});


//user가 있는 지 무결성검사, contentid가 있는지 무결성 검사
router.post('/like', (req, res) => {
  check.coursecheck(req.body.userid, req.body.courseid, res)
  .catch(([err,connection]) => {
    res.status(500).send({ message: "getConnection error: "+err });
    connection.rollback();
    connection.release();
  })
  .then(([noneed,connection]) => {
    return new Promise((fulfill, reject) => {
      if(!(req.body.userid && req.body.courseid)) res.send({message : 'insert userid & courseid'});
      else {
        var message = 'like';
        var query = 'select * from courselike where courseid = ? && userid = ?';
        connection.query(query, [req.body.courseid, req.body.userid], (err,data) => {
         if(err) reject([err,connection]);
         else {
           if(data[0]) message = 'unlike';
           fulfill([message, connection]);
           console.log(message);
          }
        });
      }
    });
  })
  .catch(([err,connection]) => {
    res.status(500).send({ message: "3 error: "+err });
    connection.rollback();
    connection.release();
  })
  .then(([message, connection]) => {
    return new Promise((fulfill, reject) => {
      console.log(message);
      var query;
      if(message === 'like') {
        query = 'update course set likecount = likecount + 1 where courseid = ?';
        console.log(query);
        connection.query(query, req.body.courseid, (err) => {
             if(err) reject([err,connection]);
             else fulfill([message,connection]);
            //  res.status(200).send({result = {message : message, likecount : data[0].likecount}});
        });
      }
      else {
        query = 'update course set likecount = likecount - 1 where courseid = ?';
        console.log(query);
        connection.query(query, req.body.courseid, (err) => {
            if(err) reject([err,connection]);
            else fulfill([message,connection]);
            //  res.status(200).send({result : { message: message}, likecount : likecount});
        });
      }
    });
  })
  .catch(([err,connection]) => {
    res.status(500).send({ message: "4 error: "+err });
    connection.rollback();
    connection.release();
  })
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
        connection.query(query, record, (err) => {
             if(err) reject([err,connection]);
             else fulfill([message,connection]);
        });
      } else {
        query = 'delete from courselike where userid = ? && courseid = ?';
        connection.query(query, [req.body.userid, req.body.courseid], (err) => {
             if(err) reject([err,connection]);
             else fulfill([message,connection]);
        });
      }
    });
  })
  .catch(([err,connection]) => {
    res.status(500).send({ message: "getConnectioor: "+err });
    connection.rollback();
    connection.release();
  })
  .then(([message, connection]) => {
    return new Promise((fulfill, reject) => {
      var query, record;
      query = 'select * from course where courseid = ?';
      connection.query(query, req.body.courseid, (err,data) => {
        if(err) reject([err,connection]);
        else fulfill([message,connection,data[0]]);
      });
    });
  })
  .catch(([err,connection]) => {
    res.status(500).send({ message: "getConnectioor: "+err });
    connection.rollback();
    connection.release();
  })
  .then(([message, connection,result]) => {
    return new Promise((fulfill, reject) => {
      var query, record;
      if(message === 'like'){
        query = 'select token from user where userid = ?';
        connection.query(query,result.userid, (err,data) => {
          if(err) reject([err,connection]);
          else fulfill([message,connection,data[0].token,result]);
        });
      } else {
        fulfill([message,connection,'token',result]);
      }
    });
  })
  .catch(([err,connection]) => {
    res.status(500).send({message: err});
    connection.rollback();
    connection.release();
  })
  .then(([message,connection,token,result]) => {
    return new Promise((fulfill,reject) => {
      console.log(token);
      if(token === 'token'){
        fulfill([message,connection]);
      } else{
        var fcm_message = {
          to: token, // required
          collapse_key: 'test',
          data: {
           title: result.title,
           body: req.body.userid+' 님이'+result.title+'에 좋아요를 눌렀습니다.'
        }
       };
       fcm.send(fcm_message, function(err, messageId){
         if (err) {
           console.log("Something has gone wrong!");
           reject([err,connection]);
         } else {
           console.log("Sent with message ID: ", messageId);
           fulfill([message,connection,result]);
         }
       });
      }
    })
  })
  .catch(([err,connection]) => {
    res.status(500).send({ message: "getConnection error: "+err });
    connection.rollback();
    connection.release();
  })
  .then(([message, connection,result]) => {
    return new Promise((fulfill, reject) => {
      if(message ==='like'){
        var query = 'insert into alarm set ?';
        var record = {
          courseid: result.courseid,
          title: result.title,
          writeuser: req.body.userid,
          like_comment: 1,
          userid: result.userid,
        }
        connection.query(query, record, (err) => {
          if(err) reject([err,connection]);
          else fulfill([message, connection]);
       });
      }
      else fulfill([message, connection]);
   });
 })
  .catch(([err,connection]) => {
    res.status(500).send({ message: " error: "+err });
    connection.rollback();
    connection.release();
  })
  .then(([message, connection]) => {
    return new Promise((fulfill, reject) => {
      var query = 'select likecount from course where courseid = ?';
      connection.query(query, req.body.courseid, (err, data) => {
         if(err) {
           res.status(500).send({ message:err});
           connection.rollback();
         }
         else {
           var result = {
             message : message,
             likecount : data[0].likecount
           };
           res.status(200).send({result : result});
           connection.commit();
         }
      });
      connection.release();
    });
  });
});


//댓글 불러오기
router.get('/comments/:courseid/:userid', (req, res) => {
  return new Promise((fulfill, reject) => {
    pool.getConnection((err, connection) => {  //커낵션 객체 가져오기
      if(err) reject(err);
      else fulfill(connection);
    });
  })
  .catch(err => { res.status(500).send({ message: "getConnection error: "+err });})
  .then((connection) => {
    return new Promise((fulfill, reject) => {
        let query = 'update alarm set wheatherread = 1 where like_comment = 0 && courseid = ? && userid = ?'; //3. 포스트 테이블에 게시글 저장
        connection.query(query, [req.params.courseid,req.params.userid], (err,data) => {
           if(err) reject(err);
           else fulfill(connection);
        });
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
router.get('/list/:keyword/:userid', (req, res) =>{
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
        var query = 'select * from course where title Like ?';
        connection.query(query, '%'+req.params.keyword+'%', (err, data) => {
          if(err) res.status(500).send({ message:err});
          else {
            if(data[0]) res.status(200).send({result : data});
            else res.status(200).send({message : "no"});
          }
        });
        connection.release();
      }
    });
  });
});

module.exports = router;
