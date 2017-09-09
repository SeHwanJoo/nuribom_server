const express = require('express');
const dateformat = require('dateformat');
const aws = require('aws-sdk');
const multer = require('multer');
const moment = require('moment');
const multerS3 = require('multer-s3');
const router = express.Router();
aws.config.loadFromPath('config/aws_config.json');
const pool = require('./config/db_pool');
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


//전체 게시글 조회
router.get('/', (req, res) => {
  return new Promise((fulfill, reject) => {
    pool.getConnection((err, connection) => {
      if(err) reject(err);
      else fulfill(connection);
    });
  })
  .catch(err => { res.status(500).send({ result: [], message: 'getConnection error : '+err}); })
  .then(connection => {
    return new Promise((fulfill, reject) => {
      let query = 'select id, view_number, writer, title, written_time from new_table';
      //최신순으로 게시글을 조회하므로, auto-increment로 설정된 기본키 내림차순을 기준으로 게시글들을 select합니다.
        connection.query(query, (err, data) => {
          if(err) res.status(500).send({ result: [], message: 'selecting posts error: '+err });
          else res.status(200).send({ result : data, message: 'ok' });
          connection.release();
        });
    });
  })
});


//게시글 상세 조회
//게시글 상세 조회는 조회 수를 변경하고 변경된 조회 수의 게시글을 select합니다.
//조회 수가 변경되고 나서 게시글 select 쿼리 중에 에러가 발생하면 조회 수는 늘어났지만 게시글은 조회가 안되는 상황이 발생합니다.
//따라서 여기에서 트랜잭션을 사용합니다. (권장)
router.get('/:id', (req, res) => {
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
  .catch(err => { res.status(500).send({ result: [], message: 'beginning transaction error: '+err}); connection.release(); })
  .then(connection => {
    return new Promise((fulfill, reject) => {
      let query = 'update posts set view_number = view_number + 1 where id = ?';
      connection.query(query, req.params.id, (err) => {
        if(err) reject([err, connection]);
        else fulfill(connection);
      });
    });
  })
  .catch(([err, connection]) => {
    res.status(500).send({ result: [], message: "updating view_number error: "+err});
    connection.rollback(); //조회 수 변경 쿼리에서 에러 발생 시 이전 상태로 롤백(취소)시키고 커낵션을 반납합니다.
    connection.release();
   })
  .then(connection => {
     return new Promise((fulfill, reject) => {
      let query = 'select * from posts where id = ?'; //게시글 가져오기
      connection.query(query, req.params.id, (err, post) => {
        if(err) reject([err,connection]);
        else fulfill([post,connection]);
      });
     });
  })
  .catch(([err, connection]) => {
    res.status(500).send({ result: [], message: "selecting post error: "+err});
    connection.rollback(); //조회수는 변경된 상태에서 select 쿼리에 에러 발생 시 조회 수 변경을 롤백(취소) 시킵니다.
    connection.release();
  })
  .then(([post, connection]) => {
    return new Promise((fulfill, reject) => {
       let query = 'select writer, written_time, content from comments where post_id = ?'; //게시글에 달린 댓글들 가져오기
       connection.query(query, req.params.id, (err, comments) => {
        if(err) {
          res.status(500).send({ result: [], message: "selecting comments error: "+err});
          connection.rollback(); //조회수는 변경된 상태에서 select 쿼리에 에러 발생 시 조회 수 변경을 롤백(취소) 시킵니다.
        }
        else {
          res.status(200).send( { result: { post: post[0], comment: comments }, message: 'ok' });
          connection.commit(); //모든 쿼리가 수행되면 commit하여 조회 수를 변경합니다.
        }
        connection.release();
       });
    });
  });
});



router.post('/', upload.single('image'), (req, res) => {
  return new Promise((fulfill, reject) => {
    pool.getConnection((err, connection) => {  //커낵션 객체 가져오기
      if(err) reject(err);
      else fulfill(connection);
    });
  })
  .catch(err => { res.status(500).send({ message: "getConnection error: "+err });})
  .then((connection) => {
    return new Promise((fulfill, reject) => {
      if(!(req.body.writer&&req.body.title&&req.body.content))
        res.status(403).send({ message: 'please input all of writer, title, content.'});
      else {
        let query = 'insert into posts set ?'; //3. 포스트 테이블에 게시글 저장
        let record = {
           writer : req.body.writer,
           title: req.body.title,
           written_time: moment(new Date()).format('YYYY-MM-DD, h:mm:ss a'),
           content: req.body.content,
           image_url: req.file ? req.file.location : null
        };
        connection.query(query, record, err => {
           if(err) res.status(500).send({ message: "inserting post error: "+err});
           else res.status(201).send({ message: 'ok' });
        });
      }
      connection.release();
    });
   });
});


router.post('/:id', (req, res) => {
  return new Promise((fulfill, reject) => {
    pool.getConnection((err, connection) => {  //커낵션 객체 가져오기
      if(err) reject(err);
      else fulfill(connection);
    });
  })
  .catch(err => { res.status(500).send({ message: "getConnection error: "+err }); })
  .then(connection => {
    return new Promise((fulfill, reject) => {
      console.log(req.body);
      if(!(req.body.writer&&req.body.content))
        res.status(403).send({ message: 'please input both of writer and content.'});
      else {
        let query = 'insert into comments set ?'; //댓글 저장하기
        let record = {
          post_id: req.params.id,
          writer: req.body.writer,
          content: req.body.content,
          written_time: moment(new Date()).format('YYYY-MM-DD, h:mm:ss a')
        };
        connection.query(query, record, (err) => {
           if(err) res.status(500).send({ message: "inserting comment error: "+err});
           else res.status(201).send({ message: 'ok' });
           connection.release();
        });
      }
    });
  })
});
module.exports = router;
