const express = require('express');
const router = express.Router();
const title = 'Browser Speech Recognition';
const message = 'Press "Start listing" and say someting.';
const reply = null;

/* GET home page. */
router.get('/', function (req, res, next) {
  console.log(`request: ${req.url}`);
  res.render('index', {title, message, reply});
});

module.exports = router;
