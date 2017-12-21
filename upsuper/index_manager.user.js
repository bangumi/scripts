// ==UserScript==
// @name        Bangumi 目录管理增强
// @namespace   org.upsuper.bangumi
// @include     /^https?://(bgm\.tv|chii\.in|bangumi\.tv)/index/\d+(\?.*)?(#.*)?$/
// @grant       none
// @version     1.1.1
// ==/UserScript==

function $(q) { return document.querySelectorAll(q); }
function $c(t) { return document.createElement(t); }

var $style = $c('style');
$style.textContent = 
  'input.order { text-align: right; width: 3em; margin-left: 3em; position: absolute; }';
document.body.appendChild($style);

// 检查目录归属
if (!$('a[href="' + location.pathname + '/edit"]')[0])
  return;

// 自动将焦点切换到输入框
document.body.addEventListener('DOMSubtreeModified', function () {
  if ($('#TB_window')[0])
    $('#title')[0].focus();
});

var formhash = $('input[name="formhash"]')[0].value;

// 添加按钮
function addFunction(name) {
  var $span = $c('span');
  $span.textContent = name;
  var $link = $c('a');
  $link.className = 'add';
  $link.title = name;
  $link.href = '#';
  $link.appendChild($span);
  var $li = $c('li');
  $li.appendChild($link);
  $('#indexCatBox>ul.cat')[0].appendChild($li);
  return $link;
}
var $edit = addFunction('修改排序');
$edit.dataset.status = 'off';

$edit.addEventListener('click', function (evt) {
  evt.preventDefault();
  if (this.dataset.status == 'off') {
    enableEditor();
  } else if (this.dataset.status == 'on') {
    saveOrder();
  }
});

var edited = false;

var $itemList = $('#browserItemList')[0];
function forEachItem(callback) {
  var $items = $('#browserItemList>li');
  for (var i = 0; i < $items.length; i++) {
    var $item = $items[i];
    var elems = {
      tools: $item.querySelector('.tools'),
      order: $item.querySelector('input.order'),
      modify: $item.querySelector('a[order]')
    };
    var id = elems.modify.id.substr(7);
    if (callback(i, $items[i], id, elems) === false)
      break;
  }
}
function parent(e, tag) {
  tag = tag.toUpperCase();
  while (e && e.tagName != tag)
    e = e.parentNode;
  return e;
}
function refreshCount() {
  forEachItem(function (i, $item, id, elems) {
    $item.classList.remove(i % 2 ? 'odd' : 'even');
    $item.classList.add(i % 2 ? 'even' : 'odd');
    if (elems.order)
      elems.tools.removeChild(elems.order);
    var $input = $c('input');
    $input.type = 'number';
    $input.className = 'order';
    $input.dataset.id = id;
    $input.value = i * 2 + 1;
    elems.tools.appendChild($input);
  });
}
function changeOrder(evt) {
  if (evt.target.className != 'order')
    return;

  var order = parseInt(evt.target.value);
  var $insertBefore = null;
  forEachItem(function (i, $item, id, elems) {
    if (parseInt(elems.order.value) > order) {
      $insertBefore = $item;
      return false;
    }
  });

  var $item = parent(evt.target, 'li');
  $itemList.removeChild($item);
  $itemList.insertBefore($item, $insertBefore);

  edited = true;
  refreshCount();
}
function enableEditor() {
  $edit.dataset.status = 'on';
  $edit.textContent = '保存';
  $itemList.addEventListener('change', changeOrder);
  refreshCount();
}

function saveOrder() {
  $edit.dataset.status = 'off';
  $edit.textContent = '修改排序';
  $itemList.removeEventListener('change', changeOrder);

  var updateList = [];
  forEachItem(function (i, $item, id, elems) {
    var order1 = parseInt(elems.order.value);
    var order2 = parseInt(elems.modify.attributes.order.value);
    if (order1 != order2) {
      var content = $item.querySelector('.text');
      content = content ? content.textContent.trim() : '';
      updateList.push({
        id: id,
        order: order1,
        content: content
      });
    }
    elems.tools.removeChild(elems.order);
  });

  var total = updateList.length;
  if (!total)
    return;

  $edit.style.pointerEvents = 'none';
  $edit.innerHTML = '保存中 <span>0</span>/' + total;
  var $span = $edit.getElementsByTagName('span')[0];
  var updated = 0;
  nextUpdateItem();
  nextUpdateItem();
  nextUpdateItem();
  nextUpdateItem();

  function nextUpdateItem() {
    var item = updateList.shift();
    if (!item)
      return;

    var url = location.origin + '/index/related/' + item.id + '/modify';
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState != 4)
        return;
      if (xhr.status == 200) {
        updated += 1;
        $span.textContent = updated;
        if (updated == total)
          location.reload();
      } else {
        updateList.push(item);
      }
      nextUpdateItem();
    };
    //xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    var data = [
      'content=' + encodeURIComponent(item.content) + '&',
      'order=' + item.order + '&',
      'formhash=' + encodeURIComponent(formhash) + '&',
      'submit=%E6%8F%90%E4%BA%A4'
    ];
    var blob = new Blob(data, {type: "application/x-www-form-urlencoded"});
    setTimeout(function () {
      xhr.send(blob);
    }, Math.random() * 500);
  }
}
