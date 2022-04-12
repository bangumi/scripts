// ==UserScript==
// @name         Bangumi简易修改收藏条目
// @namespace    https://github.com/bangumi/scripts/tree/master/liaune
// @author       liaune
// @license      MIT
// @description  在收藏页面点击“Edit”即可修改收藏条目的状态，评分，标签，评论等信息，可单项修改，随改随存。
// @include      /^https?://(bangumi\.tv|bgm\.tv|chii\.in)\/\S+\/list\/\S+\/(wish|collect|do|on_hold|dropped).*
// @version      1.4.1
// @grant        GM_addStyle
// ==/UserScript==
GM_addStyle(`
	.input_tags{
		min-width: 200px;
		height: 20px;
		border: 1px solid;
		border-radius: 5px;
		margin: 5px 0;
		padding: 0 5px;
	}
	.select_rating{
		border-radius: 5px;
	}
	.select_interest{
		width: 50px;
		border-radius: 5px;
	}
`);
class BgmCollections {
	constructor() {

	}
	init(){
		// $('#browserTools').append('<a id="saveCollect" class="chiiBtn" href="#">保存修改</a>');
		let securitycode = $('#badgeUserPanel a[href*="logout"]').length? $('#badgeUserPanel a[href*="logout"]')[0].href.split('/logout/')[1].toString(): '';
		let interest = this.get_interest();
		let itemsList = document.querySelectorAll('#browserItemList li.item');
		itemsList.forEach( (elem, i) =>{
			if(!securitycode){
				let del = elem.querySelector('a[href="#;"]');
				if(del.textContent == '删除') securitycode = del.onclick.toString().match(/'(\S+)'/)[1];
			}
			let subject_id = elem.querySelector('a.subjectCover').href.split('/subject/')[1];
			//评分
			let rating = elem.querySelector('.collectInfo .starlight')? elem.querySelector('.collectInfo .starlight').className.match(/stars(\d+)/)[1]:0;
			//标签
			let tags = '';
			let privacy = '';
			let elem_tips = elem.querySelectorAll('.collectInfo .tip');
			elem_tips.forEach((tip,i) =>{
				if(tip.textContent.match(/标签: (.*)/)){
					tags = tip.textContent.match(/标签: (.*)/)[1];
					$(tip).hide();
				}
				if(tip.textContent.match(/自己可见/)) privacy = 1;
			});
			//评论
			let comment = elem.querySelector('.text')? elem.querySelector('.text').textContent: '';
			let info = {
						securitycode: securitycode,
						subject_id: subject_id,
						interest: interest,
						rating: rating,
						tags: tags,
						comment: comment,
						privacy: privacy,
					   };
			this.edit_interest(elem,info);
			this.edit_rating(elem,info);
			this.edit_tags(elem,info);
			this.edit_privacy(elem, info);
			this.edit_comment(elem,info);
		});
	}
	get_interest(){
		let status = location.href.match(/list\/\S+\/(wish|collect|do|on_hold|dropped)/)[1];
		const dc = {"wish":1,"collect":2,"do":3,"on_hold":4,"dropped":5};
		return dc[status];
	}
	edit_interest(elem,info){
		let select_interest = document.createElement('select');
		select_interest.classList.add("select_interest");
		let media = location.href.match(/^https?:\/\/(bgm\.tv|chii\.in|bangumi\.tv)\/(\S+)\/list\//)[2];
		const dc = {anime:'看',book:'读',music:'听',game:'玩',real:'看'};
		$(select_interest).append(`
			<option value="0">取消收藏</option>
			<option value="1">想${dc[media]}</option>
			<option value="2">${dc[media]}过</option>
			<option value="3">在${dc[media]}</option>
			<option value="4">搁置</option>
			<option value="5">抛弃</option>
		`);
		select_interest.value = info.interest;
		$(elem.querySelector('.inner h3')).append(select_interest);
		select_interest.addEventListener('change',function(){
			let data = {
						interest: select_interest.value,
						rating: info.rating,
						tags: info.tags,
						comment: info.comment,
						privacy: info.privacy,
					   };
			if(data.interest == '0') $.post(`/subject/${info.subject_id}/remove?gh=${info.securitycode}`);
			else $.post(`/subject/${info.subject_id}/interest/update?gh=${info.securitycode}`, data);

		});
	}
	edit_rating(elem,info){
		let select_rating = document.createElement('select');
		select_rating.classList.add("select_rating");;
		$(select_rating).append(`
			<option value="0"></option>
			<option value="1">1</option>
			<option value="2">2</option>
			<option value="3">3</option>
			<option value="4">4</option>
			<option value="5">5</option>
			<option value="6">6</option>
			<option value="7">7</option>
			<option value="8">8</option>
			<option value="9">9</option>
			<option value="10">10</option>
		`);
		select_rating.value = info.rating;
		$(elem.querySelector('.tip_j')).before(`<span> 评分：</span>`);
		$(elem.querySelector('.tip_j')).before(select_rating);
		select_rating.addEventListener('change',function(){
			let data = {
						interest: info.interest,
						rating: select_rating.value,
						tags: info.tags,
						comment: info.comment,
						privacy: info.privacy,
					   };
			$.post(`/subject/${info.subject_id}/interest/update?gh=${info.securitycode}`, data);
		});
	}
	edit_tags(elem,info){
		let input_tags = document.createElement('input');input_tags.type='text';
		input_tags.classList.add("input_tags");
		input_tags.value = info.tags;
		$(elem.querySelector('.collectInfo')).after(input_tags);
		$(elem.querySelector('.collectInfo')).after(`<span> 标签： </span>`);
		input_tags.addEventListener('blur',function(){
			let data = {
						interest: info.interest,
						rating: info.rating,
						tags: input_tags.value.trim(),
						comment: info.comment,
						privacy: info.privacy,
					   };
			$.post(`/subject/${info.subject_id}/interest/update?gh=${info.securitycode}`, data);
		});
	}
	edit_privacy(elem, info){
		let input_privacy = document.createElement('input'); input_privacy.type='checkbox';
		input_privacy.checked = info.privacy;
		input_privacy.title = '自己可见';
		$(elem.querySelector('.collectInfo')).append(input_privacy);
		input_privacy.addEventListener('change',function(){
			let data = {
						interest: info.interest,
						rating: info.rating,
						tags: info.tags,
						comment: info.comment,
						privacy: input_privacy.checked? 1: '',
					   };
			$.post(`/subject/${info.subject_id}/interest/update?gh=${info.securitycode}`, data);
		});
	}
	edit_comment(elem,info){
		if(!info.comment)
				$(elem).find('.inner').append(`<div id="comment_box"><div class="item"><div style="float:none;" class="text_main_even"><div class="text"><br></div><div class="text_bottom"></div></div></div></div>`);
		let comment = $(elem).find('.text')[0];
		$(comment).attr('contenteditable', 'true');
		comment.addEventListener('blur',function(){
			let data = {
						interest: info.interest,
						rating: info.rating,
						tags: info.tags,
						comment: $(comment).text().trim(),
						privacy: info.privacy,
					   };
			$.post(`/subject/${info.subject_id}/interest/update?gh=${info.securitycode}`, data);
		});
	}
}

(function() {
    let You = $('#headerNeue2 .idBadgerNeue a.avatar')[0]? $('#headerNeue2 .idBadgerNeue a.avatar')[0].href.split('/user/')[1]:null;
    let User = location.href.match(/\/list\/(\S+)\//)? location.href.match(/\/list\/(\S+)\//)[1]: null;
    if(You != User) return;
	$('#browserTools').append(`<a id="modifyCollect" class="chiiBtn" href="javascript:;">Edit</a>`);
	$('#modifyCollect').on('click',()=>{
		$('#modifyCollect').remove();
		let bc = new BgmCollections();
		bc.init();
	});
})();
