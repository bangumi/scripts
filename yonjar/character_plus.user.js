// ==UserScript==
// @name         bgm角色数目统计
// @namespace    https://github.com/bangumi/scripts/yonjar
// @version      0.1.1
// @description  某声优的出演角色页面功能增强
// @author       Yonjar
// @include      /^https?:\/\/(bgm\.tv|chii\.in|bangumi\.tv)\/person/\d+\/works\/voice$/
// @grant        none
// ==/UserScript==


// 出演角色统计
function charactersCount() {
	let subtitle = document.querySelector('#columnCrtB .subtitle');
	let charCount = document.querySelectorAll('.browserList .item').length;

	subtitle.textContent += `(${charCount})`;
}

// 只看正在收藏的
function filterFollowing () {
	// 检查localstorage数据
	let localData = localStorage.getItem('bgm_user_detail_by_yonjar');
	if (!localData) {
		return console.warn('只看正在收藏角色功能依赖user_detail.user.js, 请先安装');
	}

	let userDetail = JSON.parse(localData);
	let charactersList = userDetail.characters;
	let pageCharas = document.querySelectorAll('.browserList .item');
	let container = document.querySelector('#columnCrtB .section');
	let count = 0;
	let p = document.createElement('p');
	let followingBox = document.createElement('ul');

	p.setAttribute('style', 'color: #9f9f9f; text-align: center; margin-bottom: 5px;');
	followingBox.setAttribute('class', 'browserList following');

	container.insertBefore(p, container.querySelector('ul'));
	container.insertBefore(followingBox, p);

	for (let chara_cur of pageCharas){
		let charaId = chara_cur.querySelector('div.ll>a.avatar').href.split('/character/')[1];
		if (charactersList.includes(charaId)) {
			followingBox.appendChild(chara_cur);
			count++;
		}
	}

	p.textContent = `↑你已收藏的角色会被拽到上面(共 ${count} 个)↑`;
}

(function () {
	charactersCount();
	filterFollowing();
})();