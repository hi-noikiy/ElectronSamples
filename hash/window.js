$(() => {
  const crypto = require('crypto')
  var calculateHashBtn = document.getElementById("calculateHashBtn");
  calculateHashBtn.addEventListener("click", function () {
    var text = document.getElementById("text-input").value;
    var startTime, finishTime;

    startTime = performance.now();
    for (var i = 0; i < 1000; i++)
      var md5 = crypto.createHash('md5').update(text, 'utf8').digest('hex');
    finishTime = performance.now();
    $('#md5-output').text(md5)
    $('#md5-time').text("MD5 calculation took " + ((finishTime - startTime) / 1000) + "miliseconds");

    startTime = performance.now();
    for (var i = 0; i < 1000; i++)
      var sha1 = crypto.createHash('sha1').update(text, 'utf8').digest('hex')
    finishTime = performance.now();
    $('#sha1-output').text(sha1)
    $('#sha1-time').text("SHA1 calculation took " + ((finishTime - startTime) / 1000) + "miliseconds");

    const sha256 = crypto.createHash('sha256').update(text, 'utf8').digest('hex')
    $('#sha256-output').text(sha256)

    const sha512 = crypto.createHash('sha512').update(text, 'utf8').digest('hex')
    $('#sha512-output').text(sha512)
  });
});