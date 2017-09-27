const request = require('request');
const xml2js = require('xml2js');
const express = require('express');
const dateformat = require('dateformat');
const aws = require('aws-sdk');
const multer = require('multer');
const moment = require('moment');
const multerS3 = require('multer-s3');
const check = require('./need.js');
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
//다시만들기
router.post('/', (req, res) => {
  var url = 'http://api.visitkorea.or.kr/openapi/service/rest/KorWithService/';
  var addurl = 'detailCommon';
  var contentid = req.body.contentid;
  var queryParams_1 = '?' + encodeURIComponent('serviceKey') + '=St8SeJItH0g9EjHGeoNaurQcgF0LEt0tRHcDnDYsl8EXbS%2FrSk0Q6E76IbcFKXeCjj83fdt1OLiyYobCHN5DyA%3D%3D';

  queryParams_1 += '&' + encodeURIComponent('MobileOS') + '=ETC' +
                  '&' + encodeURIComponent('MobileApp') + '=AppTesting' +
                  '&'+encodeURIComponent('contentTypeId') + '=' + req.body.contenttypeid +
                  '&'+encodeURIComponent('contentId') + '=' + req.body.contentid;



  var queryParams_2 = '&' + encodeURIComponent('defaultYN') + '=Y' +
                      '&' + encodeURIComponent('firstImageYN') + '=Y' +
                      '&' + encodeURIComponent('overviewYN') + '=Y';
  console.log(url+ addurl + queryParams_1 + queryParams_2);

  return new Promise((fulfill, reject) => {
    request({
        url: url + addurl + queryParams_1 + queryParams_2,
        method: 'GET'
    }, function (err, response, body) {
      if(err) reject(err);
      else fulfill(body);
    });
  })
  .catch(err => { res.status(500).send({ message: "getConnection error: "+err }); })
  .then(body => {
    var title = null;
    var telname = null;
    var tel = null;
    var overview = null;
    var homepage = null;
    parser.parseString(body, function(err, result){
      // if(result.response.body[0].items[0].item[0].title[0])
      console.log(result.response.body[0].items[0].item[0].title[0]);
      title = result.response.body[0].items[0].item[0].title[0];
      if(result.response.body[0].items[0].item[0].telname)
      telname = result.response.body[0].items[0].item[0].telname[0];
      if(result.response.body[0].items[0].item[0].tel)
      tel = result.response.body[0].items[0].item[0].tel[0];
      if(result.response.body[0].items[0].item[0].overview)
      overview = result.response.body[0].items[0].item[0].overview[0];
      if(result.response.body[0].items[0].item[0].homepage)
      homepage = result.response.body[0].items[0].item[0].homepage[0];
      // console.log(result);
      // console.log(result.response.body[0].items[0].item[0].homepage[0]);
    });
    var detailCommon = {
      title : title,
      telname : telname,
      tel : tel,
      overview : overview,
      homepage : homepage
    };
    addurl = 'detailIntro';
    queryParams_2 = '';
      // console.log(tourinfo.test);
    return new Promise((fulfill, reject) => {
      request({
          url: url + addurl + queryParams_1 + queryParams_2,
          method: 'GET'
      }, function (err, response, body) {
        if(err) reject(err);
        else fulfill(body);
      });
    })
    .catch(err => { res.status(500).send({ message: "getConnection error: "+err }); })
    .then(body => {
      var accomcountlodging = null;
      var checkintime = null;
      var checkouttime = null;
      var chkcooking = null;
      var infocenterlodging = null;
      var parkinglodging = null;
      var pickup = null;
      var roomcount = null;
      var reservationlodging = null;
      var reservationurl = null;
      var roomtype = null;
      var scalelodging = null;
      parser.parseString(body, function(err, result){
        console.log(result.response.body[0].items[0].item[0]);
        if(result.response.body[0].items[0].item[0].accomcountlodging)
        accomcountlodging = result.response.body[0].items[0].item[0].accomcountlodging[0];
        if(result.response.body[0].items[0].item[0].checkintime)
        checkintime = result.response.body[0].items[0].item[0].checkintime[0];
        if(result.response.body[0].items[0].item[0].checkouttime)
        checkouttime = result.response.body[0].items[0].item[0].checkouttime[0];
        if(result.response.body[0].items[0].item[0].chkcooking)
        chkcooking = result.response.body[0].items[0].item[0].chkcooking[0];
        if(result.response.body[0].items[0].item[0].infocenterlodging)
        infocenterlodging = result.response.body[0].items[0].item[0].infocenterlodging[0];
        if(result.response.body[0].items[0].item[0].parkinglodging)
        parkinglodging = result.response.body[0].items[0].item[0].parkinglodging[0];
        if(result.response.body[0].items[0].item[0].pickup)
        pickup = result.response.body[0].items[0].item[0].pickup[0];
        if(result.response.body[0].items[0].item[0].roomcount)
        roomcount = result.response.body[0].items[0].item[0].roomcount[0];
        if(result.response.body[0].items[0].item[0].reservationlodging)
        reservationlodging = result.response.body[0].items[0].item[0].reservationlodging[0];
        if(result.response.body[0].items[0].item[0].reservationurl)
        reservationurl = result.response.body[0].items[0].item[0].reservationurl[0];
        if(result.response.body[0].items[0].item[0].roomtype)
        roomtype = result.response.body[0].items[0].item[0].roomtype[0];
        if(result.response.body[0].items[0].item[0].scalelodging)
        scalelodging = result.response.body[0].items[0].item[0].scalelodging[0];
          // console.log(result);
      });
      var detailIntro = {
        accomcountlodging : accomcountlodging,
        checkintime : checkintime,
        checkouttime : checkouttime,
        chkcooking : chkcooking,
        infocenterlodging : infocenterlodging,
        parkinglodging : parkinglodging,
        pickup : pickup,
        roomcount : roomcount,
        reservationlodging : reservationlodging,
        reservationurl : reservationurl,
        roomtype : roomtype,
        scalelodging : scalelodging
      };
      addurl = 'detailInfo';
      queryParams_2 = '';
        // console.log(tourinfo.test);
      return new Promise((fulfill, reject) => {
        request({
            url: url + addurl + queryParams_1 + queryParams_2,
            method: 'GET'
        }, function (err, response, body) {
          if(err) reject(err);
          else fulfill(body);
        });
      })
      .catch(err => { res.status(500).send({ message: "getConnection error: "+err }); })
      .then(body => {
        var roomtitle = null;
        var roomsize1 = null;
        var roomcount = null;
        var roombasecount = null;
        var roommaxcount = null;
        var roomoffseasonminfee1 = null;
        var roomoffseasonminfee2 = null;
        var roompeakseasonminfee1 = null;
        var roompeakseasonminfee2 = null;
        var roomintro = null;
        var roomsize2 = null;
        var roomimg1 = null;
        var roomimg1alt = null;
        var roomimg2 = null;
        var roomimg2alt = null;
        var roomimg3 = null;
        var roomimg3alt = null;
        var roomimg4 = null;
        var roomimg4alt = null;
        var roomimg5 = null;
        var roomimg5alt = null;
        parser.parseString(body, function(err, result){
          // console.log(result.response.body[0].items[0].item[0]);
          if(result.response.body[0].items[0].item[0].roomtitle)
          roomtitle = result.response.body[0].items[0].item[0].roomtitle[0];
          if(result.response.body[0].items[0].item[0].roomsize1)
          roomsize1 = result.response.body[0].items[0].item[0].roomsize1[0];
          if(result.response.body[0].items[0].item[0].roomcount)
          roomcount = result.response.body[0].items[0].item[0].roomcount[0];
          if(result.response.body[0].items[0].item[0].roombasecount)
          roombasecount = result.response.body[0].items[0].item[0].roombasecount[0];
          if(result.response.body[0].items[0].item[0].roommaxcount)
          roommaxcount = result.response.body[0].items[0].item[0].roommaxcount[0];
          if(result.response.body[0].items[0].item[0].roomoffseasonminfee1)
          roomoffseasonminfee1 = result.response.body[0].items[0].item[0].roomoffseasonminfee1[0];
          if(result.response.body[0].items[0].item[0].roomoffseasonminfee2)
          roomoffseasonminfee2 = result.response.body[0].items[0].item[0].roomoffseasonminfee2[0];
          if(result.response.body[0].items[0].item[0].roomintro)
          roomintro = result.response.body[0].items[0].item[0].roomintro[0];
          if(result.response.body[0].items[0].item[0].roomsize2)
          roomsize2 = result.response.body[0].items[0].item[0].roomsize2[0];
          if(result.response.body[0].items[0].item[0].roomimg1)
          roomimg1 = result.response.body[0].items[0].item[0].roomimg1[0];
          if(result.response.body[0].items[0].item[0].roomimg1alt)
          roomimg1alt = result.response.body[0].items[0].item[0].roomimg1alt[0];
          if(result.response.body[0].items[0].item[0].roomimg2)
          roomimg2 = result.response.body[0].items[0].item[0].roomimg2[0];
          if(result.response.body[0].items[0].item[0].roomimg2alt)
          roomimg2alt = result.response.body[0].items[0].item[0].roomimg2alt[0];
          if(result.response.body[0].items[0].item[0].roomimg3)
          roomimg3 = result.response.body[0].items[0].item[0].roomimg3[0];
          if(result.response.body[0].items[0].item[0].roomimg3alt)
          roomimg3alt = result.response.body[0].items[0].item[0].roomimg3alt[0];
          if(result.response.body[0].items[0].item[0].roomimg4)
          roomimg4 = result.response.body[0].items[0].item[0].roomimg4[0];
          if(result.response.body[0].items[0].item[0].roomimg4alt)
          roomimg4alt = result.response.body[0].items[0].item[0].roomimg4alt[0];
          if(result.response.body[0].items[0].item[0].roomimg5)
          roomimg5 = result.response.body[0].items[0].item[0].roomimg5[0];
          if(result.response.body[0].items[0].item[0].roomimg5alt)
          roomimg5alt = result.response.body[0].items[0].item[0].roomimg5alt[0];
          // console.log(result);
        });
        var detailInfo = {
          roomtitle : roomtitle,
          roomsize1 : roomsize1,
          roomcount : roomcount,
          roombasecount : roombasecount,
          roommaxcount : roommaxcount,
          roomoffseasonminfee1 : roomoffseasonminfee1,
          roomoffseasonminfee2 : roomoffseasonminfee2,
          roomintro : roomintro,
          roomsize2 : roomsize2,
          roomimg1 : roomimg1,
          roomimg1alt : roomimg1alt,
          roomimg2 : roomimg2,
          roomimg2alt : roomimg2alt,
          roomimg3 : roomimg3,
          roomimg3alt : roomimg3alt,
          roomimg4 : roomimg4,
          roomimg4alt : roomimg4alt,
          roomimg5 : roomimg5,
          roomimg5alt : roomimg5alt
        };
        addurl = 'detailWithTour';
        queryParams_2 = '';
          // console.log(tourinfo.test);
        return new Promise((fulfill, reject) => {
          request({
              url: url + addurl + queryParams_1 + queryParams_2,
              method: 'GET'
          }, function (err, response, body) {
            if(err) reject(err);
            else fulfill(body);
          });
        })
        .catch(err => { res.status(500).send({ message: "getConnection error: "+err }); })
        .then(body => {
          var parking = null;
          var route = null;
          var wheelchair = null;
          var elevator = null;
          var restroom = null;
          var handicapetc = null;
          var braileblock = null;
          parser.parseString(body, function(err, result){
            // console.log(result.response.body[0].items[0].item[0]);
            if(result.response.body[0].items[0].item[0].parking)
            parking = result.response.body[0].items[0].item[0].parking[0];
            if(result.response.body[0].items[0].item[0].route)
            route = result.response.body[0].items[0].item[0].route[0];
            if(result.response.body[0].items[0].item[0].wheelchair)
            wheelchair = result.response.body[0].items[0].item[0].wheelchair[0];
            if(result.response.body[0].items[0].item[0].elevator)
            elevator = result.response.body[0].items[0].item[0].elevator[0];
            if(result.response.body[0].items[0].item[0].restroom)
            restroom = result.response.body[0].items[0].item[0].restroom[0];
            if(result.response.body[0].items[0].item[0].handicapetc)
            handicapetc = result.response.body[0].items[0].item[0].handicapetc[0];
            if(result.response.body[0].items[0].item[0].braileblock)
            braileblock = result.response.body[0].items[0].item[0].braileblock[0];
            // console.log(result);
          });
          var detailWithTour = {
            parking : parking,
            route : route,
            wheelchair : wheelchair,
            elevator : elevator,
            restroom : restroom,
            handicapetc : handicapetc,
            braileblock : braileblock
          };
          addurl = 'detailImage';
          queryParams_2 = '&' + encodeURIComponent('imageYN') + '=Y';
            // console.log(tourinfo.test);
          return new Promise((fulfill, reject) => {
            request({
                url: url + addurl + queryParams_1 + queryParams_2,
                method: 'GET'
            }, function (err, response, body) {
              if(err) reject(err);
              else fulfill(body);
            });
          })
          .catch(err => { res.status(500).send({ message: "getConnection error: "+err }); })
          .then(body => {
            var detailImage = new Array();

            console.log(detailImage);
            parser.parseString(body, function(err, result){
              for(var item in result.response.body[0].items[0].item){
                if(result.response.body[0].items[0].item[item].imgname)
                detailImage[item] = {
                  imgname : result.response.body[0].items[0].item[item].imgname[0],
                  originimgurl : result.response.body[0].items[0].item[item].originimgurl[0]
                };
                detailImage[item] = {
                  originimgurl : result.response.body[0].items[0].item[item].originimgurl[0]
                };
              }
            });
            return new Promise((fulfill, reject) => {
              pool.getConnection((err, connection) => {  //커낵션 객체 가져오기
                if(err) reject(err);
                else fulfill(connection);
                console.log('connection success');
              });
            })
            .catch(err => { res.status(500).send({ message: "getConnection error: "+err }); })
            .then(connection => {
              return new Promise((fulfill, reject) => {
                console.log(req.body);
                var query = 'select likecount, commentcount from trips where contentId = ?';
                  connection.query(query, contentid, (err, data) => {
                    var likecount = 0;
                    var commentcount = 0;
                     if(err) res.status(500).send({ message: "connection error: "+err});
                     else {
                       if(data[0]) {
                         likecount = data[0].likecount;
                         commentcount = data[0].commentcount;
                       }
                     }
                     var otherinfo = {
                       likecount : likecount,
                       commentcount : commentcount
                     };
                     var tripinfo = {
                       detailCommon : detailCommon,
                       detailIntro : detailIntro,
                       detailInfo : detailInfo,
                       detailWithTour : detailWithTour,
                       detailImage : detailImage,
                       otherinfo : otherinfo
                     };
                     console.log(tripinfo);

                     res.send({result : tripinfo});


                  });
                  connection.release();
              });
            });
          });
        });
      });
    });
  });
});


router.post('/review', upload.single('image'), (req, res) => {
  check.usercheck(req.body.userid)
  .catch(([err,connection]) => {
    res.status(500).send({message:err});
    connection.rollback();
    connection.release();
  })
  .then(([connection,wheatheruser]) => {
    return new Promise((fulfill, reject) => {
      if(wheatheruser==='exist'){
        if(!(req.body.userid && req.body.contentid && req.body.stars && req.body.content)) res.send({message : 'insert userid & contentid'});
        else {
          var query = 'insert into tripreviews set ?';
          var record = {
            userid : req.body.userid,
            contentid: req.body.contentid,
            stars : req.body.stars,
            date: moment(new Date()).format('YYYY-MM-DD, h:mm:ss a'),
            content: req.body.content,
            image: req.file ? req.file.location : null
            // reviewid : req.body.contentid + Date.now()
          };
          connection.query(query, record, (err,data) => {
            if(err) reject(err);
           else fulfill(connection);
          });
        }
      }
      else{
        res.status(500).send({message:err});
        connection.rollback();
        connection.release();
      }
    });
  })
  .catch(([err,connection]) => {
    res.status(500).send({message:err});
    connection.rollback();
    connection.release();
  })
  .then((connection) => {
    return new Promise((fulfill, reject) => {
      var query = 'update trips set commentcount = commentcount + 1 where contentid = ?';
      connection.query(query, req.body.contentid, (err) => {
       if(err) res.status(500).send({ message: "commentcount error: "+err});
       else res.status(200).send({message: "success"});
      });
      connection.commit();
      connection.release();
    });
  });
});



router.post('/like', (req, res) => {
  check.usercheck(req.body.userid)
  .catch(([err,connection]) => {
    res.status(500).send({message:err});
    connection.rollback();
    connection.release();
  })
  .then(([connection,wheatheruser]) => {
    return new Promise((fulfill, reject) => {
      if(wheatheruser==='exist'){
        if(!(req.body.userid && req.body.contentid)) res.send({message : 'insert userid & contentid'});
        else {
          var message = 'like';
          var query = 'select * from triplike where contentid = ? && userid = ?';
          connection.query(query, [req.body.contentid, req.body.userid], (err,data) => {
            if(err) reject([err,connection]);
            else {
              if(data[0]) message = 'unlike';
              fulfill([message, connection]);
            }
          });
          console.log(message);
        }
      }
      else{
        res.status(500).send({message:err});
        connection.rollback();
        connection.release();
      }
    });
  })
  .catch(([err,connection]) => {
    res.status(500).send({message:err});
    connection.rollback();
    connection.release();
  })
  .then(([message, connection]) => {
    return new Promise((fulfill, reject) => {
      var query;
      if(message === 'like') {
        query = 'update trips set likecount = likecount + 1 where contentid = ?';
        console.log(query);
        connection.query(query, req.body.contentid, (err) => {
          if(err) reject([err,connection]);
          else fulfill([message,  connection]);
        });
      } else {
        query = 'update trips set likecount = likecount - 1 where contentid = ?';
        // console.log(query);
        connection.query(query, req.body.contentid, (err) => {
          if(err) reject([err,connection]);
          else fulfill([message,  connection]);
        });
      }
    });
  })
  .catch(([err,connection]) => {
    res.status(500).send({message:err});
    connection.rollback();
    connection.release();
  })
  .then(([message, connection]) => {
    console.log(message);
    return new Promise((fulfill, reject) => {
      var query, record;
      if(message === 'like'){
        query = 'insert into triplike set ?';
        record = {
          userid : req.body.userid,
          contentid : req.body.contentid
        };
        // console.log(record);
        connection.query(query, record, (err) => {
          if(err) reject([err,connection]);
          else fulfill([message,  connection]);
        });
      } else {
        query = 'delete from triplike where userid = ? && contentid = ?';
        connection.query(query, [req.body.userid, req.body.contentid], (err) => {
          if(err) reject([err,connection]);
          else fulfill([message,  connection]);
        });
      }
    });
  })
  .catch(([err,connection]) => {
    res.status(500).send({message:err});
    connection.rollback();
    connection.release();
  })
  .then(([message, connection]) => {
    // console.log(message);
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
      connection.commit();
      connection.release();
    });
  });

});


router.get('/reviews/:contentid', (req, res) => {
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
        connection.query(query, req.params.contentid, (err,data) => {
           if(err) res.status(500).send({ message:err});
           else {
             if(data[0]) res.status(201).send({result : data, message:'ok'});
             else res.send({result : 'no'});
           }
        });
      connection.release();
    });
   });
});

router.post('/list', (req, res) =>{
  var url = 'http://api.visitkorea.or.kr/openapi/service/rest/KorWithService/';
  var addurl = 'searchKeyword';
  var queryParams_1 = '?' + encodeURIComponent('serviceKey') + '=St8SeJItH0g9EjHGeoNaurQcgF0LEt0tRHcDnDYsl8EXbS%2FrSk0Q6E76IbcFKXeCjj83fdt1OLiyYobCHN5DyA%3D%3D';

  queryParams_1 += '&' + encodeURIComponent('MobileOS') + '=ETC' +
                  '&' + encodeURIComponent('MobileApp') + '=AppTesting';

  if(req.body.local) queryParams_1 += '&' + encodeURIComponent('areaCode') + '=' + req.body.local;

  var queryParams_2 = '&' + encodeURIComponent('numOfRows') + '=5' +
                      '&' + encodeURIComponent('keyword') + '=' + encodeURIComponent(req.body.keyword, 'UTF-8');

  return new Promise((fulfill, reject) => {
    request({
        url: url + addurl + queryParams_1 + queryParams_2,
        method: 'GET'
    }, function (err, response, body) {
      if(err) reject(err);
      else fulfill(body);
    });
  })
  .catch(err => { res.status(500).send({ message: "getConnection error: "+err }); })
  .then(body => {

    var triplists = new Array();
    var addr1 = new Array();
    var title = new Array();
    var firstimage = new Array();
    var queryParams_3 = new Array();
    var lng;
    var contenttypeid = new Array();
    var contentid = new Array();
    parser.parseString(body, function(err, result){
      if(!result.response.body[0].items[0].item) res.send({message : 'fail'});
      else {
        // console.log('??');
        lng = result.response.body[0].items[0].item.length;
        console.log(lng);
        for(var i=0; i<lng; i++){
          queryParams_3[i] = '&'+encodeURIComponent('contentTypeId') + '=' + result.response.body[0].items[0].item[i].contenttypeid[0] +
                            '&'+encodeURIComponent('contentId') + '=' + result.response.body[0].items[0].item[i].contentid[0];
          contenttypeid[i] = result.response.body[0].items[0].item[i].contenttypeid[0];
          console.log(i);
          contentid[i] = result.response.body[0].items[0].item[i].contentid[0];
          if(result.response.body[0].items[0].item[i].addr1)
          addr1[i] = result.response.body[0].items[0].item[i].addr1[0];
          if(result.response.body[0].items[0].item[i].title)
          title[i] = result.response.body[0].items[0].item[i].title[0];
          if(result.response.body[0].items[0].item[i].firstimage)
          firstimage[i] = result.response.body[0].items[0].item[i].firstimage[0];
        }

      }

    });
    addurl = 'detailCommon';
    queryParams_2 = '&' + encodeURIComponent('overviewYN') + '=Y';
    var overview = new Array();
    var parking = new Array();
    var route = new Array();
    var wheelchair = new Array();
    var elevator = new Array();
    var restroom = new Array();
    var handicapetc = new Array();
    var braileblock = new Array();
    function gettingdata(i) {
      return new Promise((fulfill, reject) => {
        request({
            url: url + addurl + queryParams_1 + queryParams_2 + queryParams_3[i],
            method: 'GET'
        }, function (err, response, body) {
          if(err) reject(err);
          else fulfill(body);
        });
      })
      .catch(err => { res.status(500).send({ message: "getConnection error: "+err }); })
      .then(body => {
        return new Promise((fulfill, reject) => {
          parser.parseString(body, function(err, result){
            if(err) reject(err)
            else fulfill(result);
          });
        })
      })
      .catch(err => { res.status(500).send({ message: "getConnection error: "+err }); })
      .then((result) => {
        if(result.response.body[0].items[0].item[0].overview)
        overview[i] = result.response.body[0].items[0].item[0].overview[0];
        return new Promise((fulfill, reject) => {
          request({
              url: url + addurl + queryParams_1 + queryParams_2 + queryParams_3[i],
              method: 'GET'
          }, function (err, response, body) {
            if(err) reject(err);
            else fulfill(body);
          });
        })
      })
      .catch(err => { res.status(500).send({ message: "getConnection error: "+err }); })
      .then(body => {
        return new Promise((fulfill, reject) => {
          parser.parseString(body, function(err, result){
            if(err) reject(err);
            else fulfill(result);
            // console.log(result.response.body[0].items[0].item[0]);

            // console.log(result);
          });
        })
      })
      .catch(err => { res.status(500).send({ message: "getConnection error: "+err }); })
      .then((result) => {
        if(result.response.body[0].items[0].item[0].parking)
        parking[i] = result.response.body[0].items[0].item[0].parking[0];
        else parking[i] = null;
        if(result.response.body[0].items[0].item[0].route)
        route[i] = result.response.body[0].items[0].item[0].route[0];
        else route[i] = null;
        if(result.response.body[0].items[0].item[0].wheelchair)
        wheelchair[i] = result.response.body[0].items[0].item[0].wheelchair[0];
        else wheelchair[i] = null;
        if(result.response.body[0].items[0].item[0].elevator)
        elevator[i] = result.response.body[0].items[0].item[0].elevator[0];
        else elevator[i] = null;
        if(result.response.body[0].items[0].item[0].restroom)
        restroom[i] = result.response.body[0].items[0].item[0].restroom[0];
        else restroom[i] = null;
        if(result.response.body[0].items[0].item[0].handicapetc)
        handicapetc[i] = result.response.body[0].items[0].item[0].handicapetc[0];
        else handicapetc[i] = null;
        if(result.response.body[0].items[0].item[0].braileblock)
        braileblock[i] = result.response.body[0].items[0].item[0].braileblock[0];
        else braileblock[i] = null;
        return new Promise((fulfill, reject) => {
          pool.getConnection((err, connection) => {  //커낵션 객체 가져오기
            if(err) reject(err);
            else fulfill(connection);
            console.log('connection success');
          });
        })
      })
      .catch(err => { res.status(500).send({message: err});})
      .then(connection => {
        return new Promise((fulfill, reject) => {
          var query = 'select likeid from triplike where contentid = ? && userid = ?'
          connection.query(query,[contentid[i],req.body.userid], (err,data) => {
            if(err) res.status(500).send({message: "er" + err});
            else {
              if(data[0]) fulfill([connection,'like']);
              else fulfill([connection,'unlike']);
            }
          })
        })
      })
      .catch(err => { res.status(500).send({ message: "getConnection error: "+err }); })
      .then(([connection,message]) => {
        return new Promise((fulfill, reject) => {
          console.log(i);
          var query = 'select likecount, commentcount from trips where contentid = ?';
          connection.query(query, contentid[i], (err, data) => {
             if(err) res.status(500).send({ message: "connection error: "+err});
             else {
               var likecount = 0;
               var commentcount = 0;
               if(data[0]) likecount = data[0].likecount;
               if(data[0]) commentcount = data[0].commentcount;
               triplists[i] = {
                 message : message,
                 tripinfo : {
                   contentid : contentid[i],
                   contenttypeid : contenttypeid[i],
                   addr1 : addr1[i],
                   title : title[i],
                   firstimage : firstimage[i],
                   overview :  overview[i],
                   likecount : likecount,
                   commentcount : commentcount
                 },
                 detailWithTour : {
                   parking : parking[i],
                   route : route[i],
                   wheelchair : wheelchair[i],
                   elevator : elevator[i],
                   restroom : restroom[i],
                   handicapetc : handicapetc[i],
                   braileblock : braileblock[i]
                 }
               };
             }
             fulfill(triplists[i]);
          });
        });
      });
    }
    var func = [];
    for(var j=0;j<lng;j++) func[j] = gettingdata(j);
    Promise.all(func).then(result => {
      res.send({result:triplists});
      console.log(triplists);
    })

  });
});

module.exports = router;
