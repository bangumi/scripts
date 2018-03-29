const StackBlur = require('stackblur-canvas');
const { gmFetch } = require('./gmFetch');
const getImageBase64 = require('./getImageBase64');

function insertBlurInfo($target) {
  const rawHTML = `
    <input style="vertical-align: top;" class="inputBtn" value="上传处理后的图片" name="submit" type="button">
    <canvas id="e-wiki-cover-preview" width="8" height="10"></canvas>
    <br>
    <label for="e-wiki-cover-amount">Blur width and radius:</label>
    <input id="e-wiki-cover-amount" type="text" readonly>
    <br>
    <input id="e-wiki-cover-slider-width" type="range" value="20" name="width" min="1" max="100"><canvas></canvas>
    <br>
    <input id="e-wiki-cover-slider-radius" type="range" value="20" name="radius" min="1" max="100">
    <br>
    <a href="javascript:void(0)" id="e-wiki-cover-reset">reset</a>
    <img src="" alt="" style="display:none;">
  `;
  var $info = document.createElement('div');
  $info.classList.add('e-wiki-cover-container');
  $info.innerHTML = rawHTML;
  $target.parentElement.insertBefore($info, $target.nextElementSibling);
  var $width = document.querySelector('#e-wiki-cover-slider-width');
  var $radius = document.querySelector('#e-wiki-cover-slider-radius');
  drawRec($width);
  changeInfo($width, $radius);
  $width.addEventListener('change', (e) => {
    drawRec($width);
    changeInfo($width, $radius);
  });
  $radius.addEventListener('change', (e) =>{
    changeInfo($width, $radius);
  });
}

function drawRec($width) {
  var $canvas = $width.nextElementSibling;
  var ctx = $canvas.getContext('2d');
  var width = Number($width.value);
  $canvas.width = width * 1.4;
  $canvas.height = width * 1.4;
  ctx.strokeStyle = '#f09199';
  ctx.strokeRect(0.2 * width, 0.2 * width, width, width);
  window.dispatchEvent(new Event('resize'));
}

function previewSelectedImage($file, $canvas, $img = new Image()) {
  var ctx = $canvas.getContext('2d');
  // var $img = new Image();
  $img.addEventListener('load', function () {
    $canvas.width = $img.width;
    $canvas.height = $img.height;
    ctx.drawImage($img, 0, 0);
    window.dispatchEvent(new Event('resize'));  // let img cut tool at right position
  }, false);
  function loadImgData() {
    var file = $file.files[0];
    var reader = new FileReader();
    reader.addEventListener('load', function () {
      $img.src = reader.result;
    }, false);
    if (file) {
      reader.readAsDataURL(file);
    }
  }
  if ($file) {
    $file.addEventListener('change', loadImgData, false);
  }
}

function blur(el, $width, $radius) {
  var isDrawing;
  var ctx = el.getContext('2d');
  el.onmousedown = function (e) {
    isDrawing = true;
    var pos = getMousePos(el, e);
    ctx.moveTo(pos.x, pos.y);
  };
  el.onmousemove = function (e) {
    if (isDrawing) {
      //ctx.lineTo(e.layerX, e.layerY);
      //ctx.stroke();
      var width = Number($width.value);
      var radius = Number($radius.value);
      var pos = getMousePos(el, e);
      StackBlur.canvasRGBA(el, pos.x - width / 2, pos.y - width / 2, width, width, radius);
    }
  };
  el.onmouseup = function () {
    isDrawing = false;
  };
}

function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
    y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
  };
}

function changeInfo($width, $radius) {
  var $info = document.querySelector('#e-wiki-cover-amount');
  var radius = $radius.value;
  var width = $width.value;
  $info.value = width + ', ' + radius;
}

function sendFormDataPic($form, dataURL) {
  var genString = Array.apply(null, Array(5)).map(function(){
    return (function(charset){
      return charset.charAt(Math.floor(Math.random()*charset.length));
    }('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'));
  }).join('');
  function dataURItoBlob(dataURI) {
    // convert base64/URLEncoded data component to raw binary data held in a string
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
      byteString = atob(dataURI.split(',')[1]);
    else
      byteString = decodeURI(dataURI.split(',')[1]);  // instead of unescape
    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ia], {type:mimeString});
  }
  function dataURLtoFile(dataurl, filename) {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
  }
  // loading
  var $submit = $form.querySelector('[type=submit]');
  $submit.style.display = 'none';
  var $loading = document.createElement('div');
  $loading.style = 'width: 208px; height: 13px; background-image: url("/img/loadingAnimation.gif");';
  $form.appendChild($loading);

  // ajax
  var fd = new FormData($form);
  var $file = $form.querySelector('input[type=file]');
  var inputFileName = $file.name ? $file.name : 'picfile';
  fd.set(inputFileName, dataURItoBlob(dataURL), genString + '.jpg');
  if ($submit && $submit.name && $submit.value) {
    fd.set($submit.name, $submit.value);
  }
  console.info('pic file: ', fd.get(inputFileName));
  var xhr = new XMLHttpRequest();
  xhr.open($form.method.toLowerCase(), $form.action, true);
  xhr.onreadystatechange = function () {
    var _location;
    if(xhr.readyState === 2 && xhr.status === 200){
      _location = xhr.responseURL;
      $loading.remove();
      $submit.style.display = '';
      if(_location) {
        location.assign(_location);
      }
    }
  };
  xhr.send(fd);
}

async function uploadTargetCover(subjectId) {
  let d = await gmFetch(`/${subjectId}/upload_img`, 3000);
  let $canvas = document.querySelector('#e-wiki-cover-preview');

  let $doc = (new DOMParser()).parseFromString(d, "text/html");
  let $form = $doc.querySelector('form[name=img_upload]');
  if (!$form) return;

  if ($canvas.width > 8 && $canvas.height > 10) {
    sendFormDataPic($form, $canvas.toDataURL('image/jpg', 1));
  }
}

function blobToBase64(myBlob) {
  return new Promise((resolve, reject) => {
    var reader = new window.FileReader();
    reader.readAsDataURL(myBlob);
    reader.onloadend = function() {
      resolve(reader.result);
    };
    reader.onerror = reject;
  });
}

async function getImageDataByURL(url) {
  let myBlob = await gmFetchBinary(url);
  console.info('Content: cover pic: ', myBlob);
  return await blobToBase64(myBlob);
}

/**
 * 初始化上传处理图片组件
 * @param {Object} $form - 包含 input file 的 DOM
 * @param {string} base64Data - 图片链接或者 base64 信息 
 */
function dealImageWidget($form, base64Data) {
  if (document.querySelector('.e-wiki-cover-container')) return;
  insertBlurInfo($form);
  var $canvas = document.querySelector('#e-wiki-cover-preview');
  var $img = document.querySelector('.e-wiki-cover-container img');
  if (base64Data) {
    if (base64Data.match(/^http/)) {
      // base64Data = getImageDataByURL(base64Data);
      base64Data = getImageBase64(base64Data);
    }
    $img.src = base64Data;
  }
  var $file = $form.querySelector('input[type = file]');
  previewSelectedImage($file, $canvas, $img);

  var $width = document.querySelector('#e-wiki-cover-slider-width');
  var $radius = document.querySelector('#e-wiki-cover-slider-radius');
  blur($canvas, $width, $radius);
  document.querySelector('#e-wiki-cover-reset').addEventListener('click', (e) => {
    var $fillForm = document.querySelector('.fill-form');
    if (base64Data) {
      $img.dispatchEvent(new Event('load'));
    } else if ($file && $file.files[0]) {
      $file.dispatchEvent(new Event('change'));
    } else if ($fillForm) {
      $fillForm.dispatchEvent(new Event('click'));
    }
  }, false);
  var $inputBtn = document.querySelector('.e-wiki-cover-container .inputBtn');
  if ($file) {
    $inputBtn.addEventListener('click',(e) => {
      e.preventDefault();
      if ($canvas.width > 8 && $canvas.height > 10) {
        sendFormDataPic($form, $canvas.toDataURL('image/jpg', 1));
      }
    }, false);
  } else {
    $inputBtn.value = '处理图片';
  }
}

module.exports = dealImageWidget;
