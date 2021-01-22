// ==UserScript==
// @name         bangumi上传图片
// @namespace    https://github.com/bangumi/scripts/yonjar
// @version      0.1.0
// @description  在各种地方的回复框下加个"上传图片"
// @author       Yonjar
// @include      /^https?:\/\/(bgm\.tv|chii\.in|bangumi\.tv)\/((blog|(group|subject)\/topic|rakuen\/topic\/(group|subject))\/\d+(\?.*)?(#.*)?)?$/
// @grant        GM_addStyle
// ==/UserScript==

GM_addStyle(`
    .yonjar_bgm_uploader_btn{
        display: inline-block;
        color: #666;
        text-shadow: 0px 1px 2px #FFF;
        text-decoration: none;
        line-height: 20px;
        margin: 3px 0;
        padding: 0 12px;
        border: 1px solid #DDD;
        background: -webkit-gradient(linear,left top,left bottom,from(#FCFCFC),to(#F1F1F1));
        background: -moz-linear-gradient(top,#FCFCFC,#F1F1F1);
        background: -o-linear-gradient(top,#FCFCFC,#F1F1F1);
        -webkit-box-shadow: 0 1px 2px #EEE,inset 0 1px 1px #FFF;
        -moz-box-shadow: 0 1px 2px #EEE,inset 0 1px 1px #FFF;
        box-shadow: 0 1px 2px #EEE,inset 0 1px 1px #FFF;
        -moz-border-radius: 4px;
        -webkit-border-radius: 4px;
        border-radius: 4px
    }
    .yonjar_bgm_uploader_btn:hover {
        color: #FFF;
        text-shadow: none;
        background: #4F93CF;
        background: -moz-linear-gradient(top,#6BA6D8,#4F93CF);
        background: -o-linear-gradient(top,#6BA6D8,#4F93CF);
        background: -webkit-gradient(linear,left top,left bottom,from(#5FA3DB),to(#72B6E3));
        -webkit-box-shadow: 0 0 3px #EEE,inset 0 -1px 5px rgba(0,0,0,0.1);
        -moz-box-shadow: 0 0 3px #EEE,inset 0 -1px 5px rgba(0,0,0,0.1);
        box-shadow: 0 0 3px #EEE,inset 0 -1px 5px rgba(0,0,0,0.1)
    }
    `);

// 加个btn
function addBtn(describe, type, container, style, callback, arg) {
  let btn_prn = document.createElement("button");

  btn_prn.textContent = describe;
  btn_prn.classList.add(...style);

  btn_prn.addEventListener(
    type,
    () => {
      callback(arg);
    },
    false
  );

  container.append(btn_prn);

  return btn_prn;
}

function copy(text) {
  let copyText = document.createElement("input");
  document.body.append(copyText);
  copyText.value = text;
  copyText.select();
  document.execCommand("Copy");
  copyText.style.display = "none";
}

(function () {
  const new_comment = document.querySelector("#new_comment");
  //   const reply_form = document.querySelector("#ReplyForm");
  const inner = document.createElement("div");
  inner.classList.add("inner");
  new_comment.append(inner);

  addBtn("上传图片", "click", inner, ["yonjar_bgm_uploader_btn"], () => {
    if (document.querySelector("#fileUpload") !== null) {
      return;
    }

    const fileUploader = document.createElement("div");
    fileUploader.id = "fileUpload";
    fileUploader.classList.add("dropzone");
    inner.append(fileUploader);

    // chiiLib.blog.uploader();
    $.cachedScript("/min/g=uploader").done(function () {
      Dropzone.autoDiscover = false;
      var myDropzone = new Dropzone("#fileUpload", {
        url: "/blog/upload_photo",
        maxFilesize: 2,
        acceptedFiles: "image/*,.jpg,.gif,.png",
        dictDefaultMessage: "点击或拖动图片到这里上传",
        thumbnailWidth: 240,
        thumbnailHeight: 240,
      });
      myDropzone.on("success", function (file, response, event) {
        var photo_id = response.photo_id,
          filename = response.filename;
        file.previewElement.addEventListener(
          "click",
          function () {
            // insertPhoto(id, filename);
            copy("[photo=" + photo_id + "]" + filename + "[/photo]");
            alert("已复制BBcode到剪切板 请直接粘贴");
          },
          false
        );
        $(file.previewElement).append(
          '<input type="hidden" name="upload_photo[]" value="' +
            photo_id +
            '" />'
        );
      });
    });
  });
})();
