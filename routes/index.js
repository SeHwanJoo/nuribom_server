const express = require('express');
const router = express.Router();

router.get('/', function(req, res, next) {
  res.send('welcome to express');
});


module.exports = router;
