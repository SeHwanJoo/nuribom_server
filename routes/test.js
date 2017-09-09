var express = require('express');
var request = require('request');
var xml2js = require('xml2js');
var dateformat = require('dateformat');
var aws = require('aws-sdk');
var multer = require('multer');
var moment = require('moment');
var multerS3 = require('multer-s3');
aws.config.loadFromPath('./config/aws_config.json');
var pool = require('../config/db_pool');
var s3 = new aws.S3();
var upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'joo97',
    acl: 'public-read',
    key: function (req, file, cb) {
      cb(null, Date.now() + '.' + file.originalname.split('.').pop());
    }
  })
});

var router = express.Router();
var parser = new xml2js.Parser();

var app = express();

// router.post('/sqlinjection', (req, res) => {
//   return new Promise((fulfill, reject) => {
//     pool.getConnection((err, connection) => {  //커낵션 객체 가져오기
//       if(err) reject(err);
//       else fulfill(connection);
//     });
//   })
//   .catch(err => { res.status(500).send({ message: "getConnection error: "+err });})
//   .then((connection) => {
//     return new Promise((fulfill, reject) => {
//       // var id = mysql_real_escape_string(req.body.id);
//       let query = 'select * from sql_injection where ?'; // 여기 sql문에서 sql injection을 시도할 예정
//       connection.query(query,req.body.id, (err,data) => {
//          if(err) res.status(500).send({ message: err});
//          else res.status(201).send(data);
//       });
//       connection.release();
//     });
//    });
// });

// app.set('port', process.env.PORT || 3000);
app.use(require('body-parser').urlencoded({ extended: true}));

router.get('/reviews/:contentId', (req, res) => {
  return new Promise((fulfill, reject) => {
    pool.getConnection((err, connection) => {  //커낵션 객체 가져오기
      if(err) reject(err);
      else fulfill(connection);
    });
  })
  .catch(err => { res.status(500).send({ message: "getConnection error: "+err });})
  .then((connection) => {
    return new Promise((fulfill, reject) => {
        let query = 'select * from tripreviews where contentid = ?'; //3. 포스트 테이블에 게시글 저장
        connection.query(query, req.params.contentId, (err,data) => {
           if(err) res.status(500).send({ message:err});
           else {
             if(data[0]) res.status(201).send({result : data[0]});
             else res.send({result : 'no'});
           }
        });
      connection.release();
    });
   });
});

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
      if(!(req.body.userid && req.body.contentid)) res.send({message : 'insert userid & contentid'});
      else {
        var message = 'like';
        var query = 'select * from triplike where contentid = ? && userid = ?';
        var likeid;
        connection.query(query, [req.body.contentid, req.body.userid], (err,data) => {
         if(err) res.status(500).send({ message: "inserting post error: "+err});
         else {
            if(data[0]){
               message = 'unlike';
               likeid = data[0].likeid;
             }
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
      var query;
      if(message === 'like') {
        query = 'update trips set likecount = likecount + 1 where contentid = ?';
        console.log(query);
        connection.query(query, req.body.contentid, (err) => {
           if(err) res.status(500).send({ message:err});
           else {
             if(err) reject(err);
             else fulfill([message,  connection]);
            //  res.status(200).send({result = {message : message, likecount : data[0].likecount}});
           }
        });
      } else {
        query = 'update trips set likecount = likecount - 1 where contentid = ?';
        console.log(query);
        connection.query(query, req.body.contentid, (err) => {
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
        query = 'insert into triplike set ?';
        record = {
          userid : req.body.userid,
          likeid : req.body.contentid + req.body.userid ,
          contentid : req.body.contentid
        };
        console.log(record);
        connection.query(query, record, (err) => {
           if(err) res.status(500).send({ message:err});
           else {
             if(err) reject(err);
             else fulfill([message,connection]);
           }
        });
      } else {
        query = 'delete from triplike where userid = ? && contentid = ?';
        connection.query(query, [req.body.userid, req.body.contentid], (err) => {
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
    console.log(message);
    return new Promise((fulfill, reject) => {
      var query = 'select likecount from trips where contentid = ?';
      connection.query(query, req.body.contentid, (err, data) => {
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


//
router.post('/:id', upload.single('image'), (req, res) => {
  console.log(req.body);
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
// module.exports = router;

// app.use(function(req, res){
//   res.status(404);
//   res.send('404');
// });
//
// app.use(function(req, res){
//   console.error(err.stack);
//   res.status(500);
//   res.send('500');
// });

// app.listen(app.get('port'), function(){
//   console.log('Express started on http://localhost:222' +
//     app.get('port')+';press Ctrl-C to terminate.');
// });

module.exports = router;
