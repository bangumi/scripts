const gmFetchBinary = require('./gmFetch.js').gmFetchBinary;

function getImageSuffix(url) {
  var m = url.match(/png|jpg|jpeg|gif|bmp/);
  if (m) {
    switch (m[0]) {
      case 'png':
        return 'png';
      case 'jpg':
      case 'jpeg':
        return 'jpeg';
      case 'gif':
        return 'gif';
      case 'bmp':
        return 'bmp';
    }
  }
  return ''
}

function getImageBase64(url) {
  return gmFetchBinary(url).then((info) => {
    var bytes = [];
    for (var i = 0; i < info.length; i++) {
      bytes[i] = info.charCodeAt(i) & 0xff;
    }
    var binary = String.fromCharCode.apply(String, bytes);
    return 'data:image/' + getImageSuffix(url) + ';base64,' + btoa(binary);
  });
}

module.exports = getImageBase64;
