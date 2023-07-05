// ==UserScript==
// @name         Bangumi 旧帖提醒（挖坟警告！）
// @namespace    tv.bgm.cedar.posttimereminder
// @version      0.2
// @description  展示帖子发布距今的时间，顺便找找挖坟的评论
// @author       Cedar
// @include      /^https?:\/\/(bgm\.tv|chii\.in|bangumi\.tv)\/.*/
// ==/UserScript==

// 代码有 ChatGPT 参与编写（ChatGPT 的大框架做得不错，但细节一塌糊涂）

const constants = {
  dayInMilliseconds: 24 * 60 * 60 * 1000,
  threshold: 7 * 24 * 60 * 60 * 1000  // 设置阈值为一周，单位为毫秒
}

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

function getSortedCommentInfo() {
  const commentList = document.querySelector(selectors.commentList);
  const comments = commentList.querySelectorAll(selectors.reply);

  // 获取楼主信息
  const postEl = document.querySelector(selectors.mainFloor);
  const postInfo = getCommentInfo(postEl);
  // 获取评论信息
  const commentDetails = [postInfo];
  for (const comment of comments) {
    // reply
    const thisReplyInfo = getCommentInfo(comment);
    commentDetails.push(thisReplyInfo);
    // sub reply
    const subCommentsEl = comment.querySelectorAll(selectors.subReply);
    const subComments = Array.from(subCommentsEl).map(getCommentInfo);
    commentDetails.push(...subComments);
  }
  commentDetails.sort((lft, ryt) => lft.timestamp - ryt.timestamp); // 按时间戳由小到大排序
  console.log(commentDetails);
  return commentDetails;
}

// 找到挖坟评论。定义无人回复的一周后的首条新回复为挖坟评论
function findAllGraveDiggers(sortedInfo) {
  const graveDiggers = [];
  for (let i = 1; i < sortedInfo.length; i++) {
    const timeDiff = sortedInfo[i].timestamp - sortedInfo[i - 1].timestamp;
    if (timeDiff >= constants.threshold) {
      graveDiggers.push(sortedInfo[i]);
    }
  }
  return graveDiggers;
}

function displayTimeSincePost(postInfo) {
  // 计算天数
  const daysSincePost = Math.floor((Date.now() - postInfo.timestamp) / constants.dayInMilliseconds);
  // 帖子发布时间提示元素
  const reminderTextEl = document.createElement('span');
  reminderTextEl.innerText = `发布于 ${daysSincePost} 天前`;
  // 挖坟查询按钮
  const graveDiggerButton = document.createElement('button');
  graveDiggerButton.innerText = '是谁在顶旧贴？';
  graveDiggerButton.addEventListener('click', function (evt) {
    // 获取所有评论
    const commentInfo = getSortedCommentInfo();
    // 创建挖坟楼层指示元素
    const floorEl = document.createElement('span');
    if (Date.now() - postInfo.timestamp < constants.threshold) {
      // 不是旧贴
      floorEl.innerText = '不是旧帖';
    } else if (Date.now() - commentInfo[commentInfo.length - 1].timestamp > constants.threshold) {
      // 是旧贴但无人挖坟（最近无人评论）
      floorEl.innerText = '最近无人顶帖';
    } else {
      // 找到所有挖坟评论
      const graveDiggers = findAllGraveDiggers(commentInfo);
      const newDigger = graveDiggers[graveDiggers.length - 1];
      // 添加挖坟楼层指示元素
      const graveDiggerFloorEl = document.createElement('a');
      graveDiggerFloorEl.href = newDigger.replyLinkhash;
      graveDiggerFloorEl.innerText = newDigger.replyFloor;
      floorEl.innerText = '顶贴楼层是';
      floorEl.appendChild(graveDiggerFloorEl);
    }
    evt.target.parentNode.replaceChild(floorEl, evt.target);
  });
  // 挖坟楼层指示元素的关闭按钮
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

  // 找出挖坟评论 TODO delete
  const graveDiggers = findAllGraveDiggers(getSortedCommentInfo());
  console.log(graveDiggers);
}

main();
