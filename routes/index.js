const express = require('express');
const router = express.Router();
const title = 'Browser Speech Recognition';
const message = 'Press "Start listing" and say someting.';
const reply = ['One', 'Two'];

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', {title, message, reply});
});

module.exports = router;
