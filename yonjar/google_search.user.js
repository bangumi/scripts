// ==UserScript==
// @name         整合bangumi小组(谷歌自定义)搜索
// @namespace    https://github.com/bangumi/scripts/yonjar
// @version      0.1.1
// @description  整合bangumi小组(谷歌自定义)搜索
// @author       Yonjar
// @include      /^https?:\/\/(bgm\.tv|chii\.in|bangumi\.tv)\/.*$/
// @grant        none
// ==/UserScript==

function init () {
	let form = document.querySelector('#headerSearch form');
	let siteSearchSelect = form.querySelector('#siteSearchSelect');
	let search_text = form.querySelector('#search_text');

	let opn = document.createElement('option');
	opn.value = 'google';
	opn.textContent = '小组';
	siteSearchSelect.appendChild(opn);

	function listener(e) {
		e.preventDefault();
		window.open(`https://cse.google.com/cse?cx=008561732579436191137:pumvqkbpt6w#gsc.tab=0&gsc.q=${search_text.value}&gsc.sort=`,'_blank');
	}

	siteSearchSelect.addEventListener('change', (e) => {
		switch (e.target.value) {
			case 'google':
				form.addEventListener('submit', listener, false);
				break;
			default:
				form.removeEventListener('submit', listener, false);
				break;
		}
	}, false);
}

if (document.querySelector('#headerSearch form')) {
	init();
}
