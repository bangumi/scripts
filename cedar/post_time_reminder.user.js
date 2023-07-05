// ==UserScript==
// @name         Bangumi 旧帖提醒（“挖坟”警告！）
// @namespace    tv.bgm.cedar.posttimereminder
// @version      0.4
// @description  展示帖子发布距今的时间，顺便找找顶旧帖的评论
// @author       Cedar
// @include      /^https?://(bgm\.tv|chii\.in|bangumi\.tv)/group/topic/.*/
// @include      /^https?://(bgm\.tv|chii\.in|bangumi\.tv)/subject/topic/.*/
// @include      /^https?://(bgm\.tv|chii\.in|bangumi\.tv)/rakuen/topic/group/.*/
// @include      /^https?://(bgm\.tv|chii\.in|bangumi\.tv)/rakuen/topic/subject/.*/
// @grant        GM_addStyle
// ==/UserScript==

// 代码有 ChatGPT 参与编写（ChatGPT 的大框架做得不错，但细节一塌糊涂）

const constants = {
  dayInMilliseconds: 24 * 60 * 60 * 1000,
  threshold: 7 * 24 * 60 * 60 * 1000  // 设置阈值为一周，单位为毫秒
}

const selectors = {
  postActions: ".postTopic .topic_actions > .post_actions",
  mainFloor: ".postTopic",
  commentList: "#comment_list",
  reply: "#comment_list .row_reply",
  subReply: ".sub_reply_bg",
  // 单个楼层的信息
  floorInfo: "div.post_actions.re_info > div.action small",
  floorAnchor: "div.post_actions.re_info > div.action a.floor-anchor"
};

function getCommentInfo(commentEl) {
  // timestamp & replyFloor (时间戳 & 回复楼层，例：1626553870000 & #11)
  const timestampEl = commentEl.querySelector(selectors.floorInfo);
  const [replyFloor, timeString] = timestampEl.innerText.split(' - ').map(x => x.trim());
  const timestamp = new Date(timeString).getTime();
  // reply hash (比如 '#post_1234567')
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
  const commentInfo = [postInfo];
  for (const comment of comments) {
    // reply
    const thisReplyInfo = getCommentInfo(comment);
    commentInfo.push(thisReplyInfo);
    // sub reply
    const subCommentsEl = comment.querySelectorAll(selectors.subReply);
    const subComments = Array.from(subCommentsEl).map(getCommentInfo);
    commentInfo.push(...subComments);
  }
  commentInfo.sort((lft, ryt) => lft.timestamp - ryt.timestamp); // 按时间戳由小到大排序
  // console.log(commentInfo);
  return commentInfo;
}

// 找到顶旧帖的评论。如果某回复与前一条回复间隔超过 threshold 时间，则为“挖坟”评论。
function findAllPostDiggers(sortedInfo) {
  const postDiggers = [];
  for (let i = 1; i < sortedInfo.length; i++) {
    const timeDiff = sortedInfo[i].timestamp - sortedInfo[i - 1].timestamp;
    if (timeDiff >= constants.threshold) {
      postDiggers.push(sortedInfo[i]);
    }
  }
  // console.log(postDiggers);
  return postDiggers;
}

function displayTimeSincePost(postInfo) {
  // 计算天数
  const daysSincePost = Math.floor((Date.now() - postInfo.timestamp) / constants.dayInMilliseconds);
  // 帖子发布时间提示元素
  const reminderTextEl = document.createElement('span');
  reminderTextEl.innerText = `发布于 ${daysSincePost} 天前`;
  // 顶贴楼层查询按钮
  const postDiggerButton = document.createElement('button');
  postDiggerButton.innerText = '是谁在顶旧贴？';
  postDiggerButton.addEventListener('click', function (evt) {
    const commentInfo = getSortedCommentInfo(); // 获取所有评论
    const floorEl = document.createElement('span'); // 创建顶贴楼层指示元素
    // 判断谁在顶旧帖
    if (Date.now() - postInfo.timestamp < constants.threshold) {
      // 不是旧贴
      floorEl.innerText = '不是旧帖';
    } else if (commentInfo.length === 1) {
      // 没有评论（此时 Array 中只有楼主自己的 Info）
      floorEl.innerText = '没有评论';
    } else if (Date.now() - commentInfo[commentInfo.length - 1].timestamp > constants.threshold) {
      // 是旧贴但无人顶帖
      floorEl.innerText = '最近无人顶帖';
    } else {
      const postDiggers = findAllPostDiggers(commentInfo); // 找到所有顶旧帖的评论
      if (postDiggers.length === 0) {
        // 是长期活跃的旧帖，没有任何两条评论的间隔超出 thershold 时间
        floorEl.innerText = "本帖一直活跃至今！";
      } else {
        // 确实被顶帖了的旧帖
        const newDigger = postDiggers[postDiggers.length - 1];
        // 添加顶贴楼层指示元素
        const postDiggerFloorEl = document.createElement('a');
        postDiggerFloorEl.href = newDigger.replyLinkhash;
        postDiggerFloorEl.innerText = newDigger.replyFloor;
        floorEl.innerText = '原来是你，';
        floorEl.appendChild(postDiggerFloorEl);
      }
    }
    evt.target.parentNode.replaceChild(floorEl, evt.target);
  });
  // 顶贴楼层指示元素的关闭按钮
  const closeButton = document.createElement('button');
  closeButton.innerText = 'X';
  closeButton.addEventListener('click', function (evt) {
    const wrapper = evt.target.parentNode;
    wrapper.parentNode.removeChild(wrapper);
  });
  // 把按钮包裹起来
  const buttonWrapper = document.createElement('span');
  buttonWrapper.classList.add('button-wrapper');
  buttonWrapper.append(closeButton, postDiggerButton);
  // 所有元素都放进 reminderWrapper 并添加到页面上
  const reminderWrapper = document.createElement('div');
  reminderWrapper.classList.add('post-time-reminder');
  reminderWrapper.append(buttonWrapper, reminderTextEl);
  document.querySelector(selectors.postActions).prepend(reminderWrapper);
}

function main() {
  // 获取楼主信息
  const postEl = document.querySelector(selectors.mainFloor);
  if (!postEl) return;
  const postInfo = getCommentInfo(postEl);
  // 添加提示信息
  displayTimeSincePost(postInfo);
}

main();

GM_addStyle(`
.post-time-reminder,
.post-time-reminder > span {
  display: flex;
  align-items: center;
  justify-content: right;
  column-gap: 5px;
}
.post-time-reminder .button-wrapper {
  visibility: hidden;
}
.post-time-reminder:hover .button-wrapper {
  visibility: unset;
}
.post-time-reminder button {
  cursor: pointer;
  margin: 0;
  padding: 0;
  color: #0084B4;
  border: none;
  font-size: 12px;
  background: none;
}
.post-time-reminder button::before {
  content: '[';
}
.post-time-reminder button::after {
  content: ']';
}
`);
