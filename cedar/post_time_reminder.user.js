// ==UserScript==
// @name         Bangumi 旧帖提醒（挖坟警告！）
// @namespace    tv.bgm.cedar.posttimereminder
// @version      0.1
// @description  展示帖子发布距今的时间，顺便找找挖坟的评论
// @author       Cedar
// @include      /^https?:\/\/(bgm\.tv|chii\.in|bangumi\.tv)\/.*/
// ==/UserScript==

// 代码有 ChatGPT 参与编写（ChatGPT 的大框架做得不错，但细节一塌糊涂）

const selectors = {
  postActions: "#columnInSubjectA > .postTopic .topic_actions > .post_actions",
  mainFloor: "#columnInSubjectA > .postTopic",
  commentList: "#comment_list",
  reply: "#comment_list .row_reply",
  subReply: ".sub_reply_bg",
  // 单个楼层的信息
  floorInfo: "div.post_actions.re_info > div.action small",
  floorAnchor: "div.post_actions.re_info > div.action a.floor-anchor"
};

function getCommentInfo(commentEl) {
  // timestamp & replyFloor (时间戳&回复楼层，例：1626553870000 & #11)
  const timestampEl = commentEl.querySelector(selectors.floorInfo);
  const [replyFloor, timeString] = timestampEl.innerText.split(' - ').map(x => x.trim());
  const timestamp = new Date(timeString).getTime();
  // reply hash (something like '#post_1234567')
  const replyLinkEl = commentEl.querySelector(selectors.floorAnchor);
  const replyLinkhash = replyLinkEl?.hash || null; // 主楼没有链接
  // username
  const username = commentEl.dataset.itemUser;

  return { node: commentEl, timestamp, timeString, replyFloor, replyLinkhash, username };
}

function getAllCommentInfo() {
  const commentList = document.querySelector(selectors.commentList);
  const comments = commentList.querySelectorAll(selectors.reply);

  const commentDetails = [];
  for (const comment of comments) {
    // reply
    const thisReplyInfo = getCommentInfo(comment);
    commentDetails.push(thisReplyInfo);
    // sub reply
    const subCommentsEl = comment.querySelectorAll(selectors.subReply);
    const subComments = Array.from(subCommentsEl).map(getCommentInfo);
    commentDetails.push(...subComments);
  }
  return commentDetails;
}

// 找到挖坟评论。定义一周后的首条新回复为挖坟评论
function findAllGraveDiggers(commentInfo) {
  const sortedInfo = commentInfo.toSorted((lft, ryt) => lft.timestamp - ryt.timestamp); // 时间戳由小到大排序
  const threshold = 7 * 24 * 60 * 60 * 1000; // 设置阈值为一周，单位为毫秒

  const graveDiggers = [];
  for (let i = 1; i < sortedInfo.length; i++) {
    const timeDiff = sortedInfo[i].timestamp - sortedInfo[i - 1].timestamp;
    if (timeDiff >= threshold) {
      graveDiggers.push(sortedInfo[i]);
    }
  }
  return graveDiggers;
}

// 找到挖坟评论。用 K-Means 算法尝试，但效果一般
function findAllGraveDiggers2(commentInfo) {
  const sortedInfo = commentInfo.toSorted((lft, ryt) => lft.timestamp - ryt.timestamp); // 时间戳由小到大排序
  // 计算所有评论与上一条评论的间隔时间（除了楼主）
  for (let i = 1; i < sortedInfo.length; i++) {
    const timeDiff = sortedInfo[i].timestamp - sortedInfo[i - 1].timestamp;
    sortedInfo[i].timeDiff = timeDiff;
  }
  // 找出最大值与最小值（去掉楼主）
  const maxDiff = Math.max(sortedInfo.slice(1).map(x => x.timeDiff));
  const minDiff = Math.min(sortedInfo.slice(1).map(x => x.timeDiff));
  const maxInfo = sortedInfo.slice(1).reduce((maxInfo, x) => x.timeDiff > maxInfo.timeDiff ? x : maxInfo, { timeDiff: -Infinity });
  const minInfo = sortedInfo.slice(1).reduce((minInfo, x) => x.timeDiff < minInfo.timeDiff ? x : minInfo, { timeDiff: Infinity });
  // 极简小批量迭代二维 K-Means（K=2）
  const diggers = { sum: maxInfo.timeDiff, comments: [maxInfo] };
  const normal = { sum: minInfo.timeDiff, comments: [maxInfo] };
  for (const c of sortedInfo.slice(1).filter(x => ![maxInfo, minInfo].includes(x))) {
    const diggerCenter = diggers.sum / diggers.comments.length;
    const normalCenter = normal.sum / normal.comments.length;
    if (Math.abs(diggerCenter - c.timeDiff) < Math.abs(normalCenter - c.timeDiff)) {
      diggers.sum += c.timeDiff;
      diggers.comments.push(c);
    } else {
      normal.sum += c.timeDiff;
      normal.comments.push(c);
    }
  }
  return diggers.comments;
}

// 找到挖坟评论。用 K-Means 算法尝试，多步迭代，但效果一般
function findAllGraveDiggers3(commentInfo) {
  const sortedInfo = commentInfo.toSorted((lft, ryt) => lft.timestamp - ryt.timestamp); // 时间戳由小到大排序
  // 计算所有评论与上一条评论的间隔时间（除了楼主）
  for (let i = 1; i < sortedInfo.length; i++) {
    const timeDiff = sortedInfo[i].timestamp - sortedInfo[i - 1].timestamp;
    sortedInfo[i].timeDiff = timeDiff;
  }
  // 找出最大值与最小值（去掉楼主）
  const maxDiff = Math.max(...sortedInfo.slice(1).map(x => x.timeDiff));
  const minDiff = Math.min(...sortedInfo.slice(1).map(x => x.timeDiff));
  const maxInfo = sortedInfo.slice(1).reduce((maxInfo, x) => x.timeDiff > maxInfo.timeDiff ? x : maxInfo, { timeDiff: -Infinity });
  const minInfo = sortedInfo.slice(1).reduce((minInfo, x) => x.timeDiff < minInfo.timeDiff ? x : minInfo, { timeDiff: Infinity });
  // 极简全数据迭代二维 K-Means（K=2）
  let diggerCenter = maxDiff;
  let normalCenter = minDiff;
  const diggers = [];
  const normal = [];
  for (let step = 1; step <= 10; step++) {
    for (const c of sortedInfo.slice(1)) {
      if (Math.abs(diggerCenter - c.timeDiff) < Math.abs(normalCenter - c.timeDiff)) {
        diggers.push(c);
      } else {
        normal.push(c);
      }
    }
    if (step < 10) {
      diggerCenter = diggers.reduce((s, x) => s + x.timeDiff, 0) / diggers.length;
      normalCenter = normal.reduce((s, x) => s + x.timeDiff, 0) / normal.length;
      diggers.length = 0;
      normal.length = 0;
    }
  }
  return diggers;
}


function displayTimeSincePost(postInfo) {
  // 计算天数
  const millisecondsInDay = 24 * 60 * 60 * 1000;
  const timeDifference = Date.now() - postInfo.timestamp;
  const daysSincePost = Math.floor(timeDifference / millisecondsInDay);
  // 帖子发布时间提示元素
  const reminderTextEl = document.createElement('span');
  reminderTextEl.innerText = `发布于 ${daysSincePost} 天前`;
  // 挖坟查询按钮
  const graveDiggerButton = document.createElement('button');
  graveDiggerButton.innerText = '是谁在挖坟？';
  graveDiggerButton.addEventListener('click', function (evt) {
    // 找到所有挖坟评论
    const graveDiggers = findAllGraveDiggers(getAllCommentInfo());
    const newDigger = graveDiggers[graveDiggers.length - 1];
    // 点击按钮后寻找挖坟楼层链接
    const graveDiggerFloorEl = document.createElement('a');
    graveDiggerFloorEl.href = newDigger.replyLinkhash;
    graveDiggerFloorEl.innerText = newDigger.replyFloor;
    // 创建挖坟评论指示元素
    const floorEl = document.createElement('span');
    floorEl.innerText = '找到了，就在';
    floorEl.appendChild(graveDiggerFloorEl);
    evt.target.parentNode.replaceChild(floorEl, evt.target);
  });
  // 关闭展示挖坟评论的按钮
  const closeButton = document.createElement('button');
  closeButton.innerText = 'X';
  closeButton.addEventListener('click', function (evt) {
    const wrapper = evt.target.parentNode;
    wrapper.parentNode.removeChild(wrapper);
  });
  // 在页面添加按钮，注意挖坟按钮与关闭按钮被包裹起来了
  const buttonWrapper = document.createElement('span');
  buttonWrapper.classList.add('button-wrapper');
  buttonWrapper.append(closeButton, graveDiggerButton);
  // 所有元素都放进 reminderWrapper
  const reminderWrapper = document.createElement('div');
  reminderWrapper.classList.add('post-time-reminder');
  reminderWrapper.append(buttonWrapper, reminderTextEl);
  document.querySelector(selectors.postActions).prepend(reminderWrapper);
}

function main() {
  // 获取楼主信息
  const postEl = document.querySelector(selectors.mainFloor);
  const postInfo = getCommentInfo(postEl);
  // 添加提示信息
  displayTimeSincePost(postInfo);
  // 获取所有评论的信息
  const commentInfo = getAllCommentInfo();
  commentInfo.push(postInfo); // 把楼主信息也加进去
  console.log(commentInfo);
  // 找出挖坟评论
  const graveDiggers = findAllGraveDiggers(commentInfo);
  console.log(graveDiggers);
}

main();
