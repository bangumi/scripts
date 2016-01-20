// ==UserScript==
// @name          bangumi tracking improvement
// @namespace     https://gist.github.com/chaucerling/407c27678487ef69d438
// @version       0.1.1
// @description   tracking more than 50 subject on bangumi index page
// @author        chaucerling
// @include       http://bangumi.tv/
// @include       https://bgm.tv/
// @include       http://bgm.tv/
// @include       http://chii.in/
// ==/UserScript==

var $ = unsafeWindow.jQuery
var index_ids = []
var refresh = false
var extra_subjects = []
var subjects_size = 0

var cache_extra_subjects = function() {
	if (localStorage['extra_watching_animes'] === undefined){
		return []
	} else {
		return JSON.parse(localStorage['extra_watching_animes'])
	}
}()

$("body").prepend("<style>\
#ti-pages.categoryTab {\
		padding: 5px;\
}\
#ti-pages.categoryTab a.focus {\
		color: #FFF;\
		background: #F09199;\
}\
#ti-pages.categoryTab a.refresh {\
		color: #FFF;\
		background: #4EB1D4;;\
}\
#ti-pages.categoryTab a.refresh.disabled {\
		cursor: not-allowed;\
		opacity: 0.6\
}\
#ti-pages.categoryTab a {\
		display: inline-block;\
		box-sizing: border-box;\
		min-width: 50px;\
		padding: 3px 10px;\
		color: #555;\
		font-size: 13px;\
		text-align: center;\
		border-radius: 15px;\
		background: #F0F0F0;\
}\
</style>")

function Subject(id, title, progress, prg_list_html, prg_content_html, thumb, order, extra) {
	// return {
	//   id: id,
	//   title: title,
	//   progress: progress,
	//   ep_html: ep_html,
	//   thumb: thumb,
	//   order: order
	// }
	this.id = id
	this.title = title
	this.progress = progress
	this.prg_list_html = prg_list_html
	this.prg_content_html = prg_content_html
	this.thumb = thumb
	this.order = order
	this.extra = extra //boolean
}

function remove_img_src(str){
	return str.replace(/<img src=\S+/ig, "<img src=''")
}

function get_display_subject_type() {
	return $("#prgCatrgoryFilter > li > a.focus").atrr('subject_type')
}

function change_dispaly(){
	$('#prgCatrgoryFilter a[subject_type="0"],a[subject_type="6"]').hide()
	$('#prgCatrgoryFilter a').removeClass('focus')
	$('#prgCatrgoryFilter a[subject_type="2"]').addClass('focus')

	$('#switchNormalManager').removeClass()
	$('#switchNormalManager').hide()
	$('#switchTinyManager').addClass('active')

	$('.cloumnSubjects').hide()
	$('#cloumnSubjectInfo .infoWrapper').removeClass('blockMode', 'info_hidden').addClass('tinyMode')
	$('#cloumnSubjectInfo').css('width', '100%')
	$('#prgManagerMain').css('height', 'auto').removeClass('blockModeWrapper').addClass('tinyModeWrapper')
	$.cookie('prg_display_mode', 'tiny', {expires: 2592000})

	$('#ti-pages').show()
}

function recover_dispaly(){
	$('#prgCatrgoryFilter a').show()
	$('#switchNormalManager').show()
	$('.infoWrapper_tv div.infoWrapper').show()
	$('#ti-pages').hide()
}
// function get_all_display_subjects(subject_type) {
//   switch(subject_type) {
//     case "0": //all
//       return 0;
//     case "1": //book
//       return 1;
//     case "2": //anime
//       return 2;
//     case "6": //real
//       return 6;
//     default:
//       return -1;
//   }
// }

function get_watching_animes(){
	// <a href="/anime/list/chaucerling/do" class="nav">在看</a>
	var path = location.protocol+'//'+location.hostname + $("#navMenuNeue > li > ul > li > a.nav")[5].getAttribute('href')
	var wathcing_list = [] // only implement animes list in v0.1.0
	var page = 1
	extra_subjects = []
	for (page = 1;page < 5; page++){
		$.ajax({
			method: "GET",
			accepts: "html",
			dataType: "html",
			url: path + "?page=" + page,
			async: false,
		}).success(function(data, textStatus, jqXHR) {
			console.log(page)
			var html = remove_img_src(data)
			wathcing_list = $.merge(wathcing_list, $(html).find('#browserItemList > li'))
		})
		if (wathcing_list.length !== 0 && wathcing_list.length % 24 !== 0) break;
	}
	subjects_size = wathcing_list.length
	if (subjects_size > 50) {
		$('#ti-alert').text("Watching more than 50 animes, loading extra animes' progress (click to close).")
		change_dispaly()
		$.each(wathcing_list, function (index, value) {
			get_subject_progress($(value).attr('id').split("_")[1], parseInt(index))
		})
	} else {
		recover_dispaly()
		$('#ti-alert').show()
		$('#ti-alert').text("Watching "+subjects_size+" animes (click to close).")
	}
}

function get_subject_progress(subject_id, order){
	if (index_ids.includes(subject_id)) return check_get_all_subjects_finished()

	$.ajax({
		method: "GET",
		accepts: "html",
		dataType: "html",
		url: location.protocol+'//'+location.hostname + '/subject/' + subject_id,
		success: function(data, textStatus, jqXHR){
			var html = remove_img_src(data)
			var progress = $(html).find('.panelProgress > .progress > .inner > small').text().split("/")[0]
			var title = $(html).find('.nameSingle > a').text()
			var prg_list_html = $(html).find('.prg_list').addClass("clearit").html()
			// $(prg_list_html).find('a.load-epinfo').attr('subject_id', subject_id)
			var prg_content_html = $(html).find('#subject_prg_content').html()
			var thumb = $(html).find('a.thickbox.cover').attr('href').replace('/l/','/g/')
			var subject = new Subject(subject_id, title, progress, prg_list_html, prg_content_html, thumb, order, true)
			extra_subjects.push(subject)
			check_get_all_subjects_finished()
		}
	})
}

var finished_subjects_count = 0
function check_get_all_subjects_finished(){
	finished_subjects_count += 1
	if (finished_subjects_count < subjects_size) return

	finished_subjects_count = 0
	localStorage['extra_watching_animes'] = JSON.stringify(extra_subjects)
	add_extra_subjecs(extra_subjects)
}

function add_extra_subjecs(extra_subjects){
	for(var i=0; i < extra_subjects.length; i+=2){
		console.log(extra_subjects[i])
		console.log(extra_subjects[i+1])
		create_subject_cell(extra_subjects[i], "odd")
		if (parseInt(i)+1 < extra_subjects.length) {
			create_subject_cell(extra_subjects[parseInt(i)+1], "even")
		}
	}
	$('.infoWrapper_tv a.load-epinfo').cluetip({
		local: true,
		dropShadow: false,
		cursor: 'pointer',
		sticky: true,
		closePosition: 'title',
		arrows: true,
		closeText: 'X',
		mouseOutClose: true,
		positionBy: 'fixed',
		topOffset: 30,
		leftOffset: 0,
		cluezIndex: 79
	})
	$('#subject_prg_content a.ep_status').click(function() {
		chiiLib.home.epStatusClick(this)
		return false
	})
	if (refresh === true) {
		$('.infoWrapper_tv div.infoWrapper').hide()
		$('.infoWrapper_tv div.infoWrapper.extra').show()
		$('#ti-pages a').removeClass('focus')
		$('#ti-pages a[data-page="extra"]').addClass('focus')
		$('#ti-pages a.refresh').removeClass('disabled')
		$('#ti-pages a.refresh').html('refresh')
	}
}

function create_subject_cell(subject, odd){
	var extra = subject.extra ? " extra" : ""
	$('.infoWrapper_tv').append("<div id='subjectPanel_"+subject.id+"' subject_type='2' class='"+odd+extra+" clearit infoWrapper tinyMode' \
		style='display:none;'>\
		<a href='/subject/"+subject.id+"' title='"+subject.title+"' class='grid tinyCover ll'>\
			<img src='"+subject.thumb+"' class='grid'>\
		</a>\
		<div class='epGird'>\
			<div class='tinyHeader'>\
				<a href='/subject/"+subject.id+"' title='"+subject.title+"'>"+subject.title+"</a>\
				<small class='progress_percent_text'><a href='/update/"+subject.id+"?keepThis=false&TB_iframe=true&height=350&width=500'\
					title='修改 "+subject.title+" ' class='thickbox l' id='sbj_prg_"+subject.id+"'>edit</a></small>\
			</div>\
			<ul class='prg_list clearit'>"+subject.prg_list_html+"</ul>\
		</div></div>"
	)
	$('#subject_prg_content').append(subject.prg_content_html)
}

function get_watching_animes_on_index(){
	if (location.pathname === "/") {
		return $('.infoWrapper_tv > div')
	} else {
		return []
	}
}

// init
$(document).ready(function(){
	var ary = get_watching_animes_on_index()
	if (location.pathname !== "/") return

	$("#cloumnSubjectInfo").prepend("<div id='ti-alert'\
	style='font-size: 14px;text-align: center;padding: 5px;background-color: #fcf8e3;display:none;'>\
	</div>")
	$('#cloumnSubjectInfo').prepend("<div id='ti-pages' class='categoryTab' style='display:none;'>\
		<a type='button' data-page='50' class='focus' href='javascript:void(0);'><span>50</span></a>\
		<a type='button' data-page='extra' href='javascript:void(0);'><span>extra</span></a>\
		<a type='button' class='refresh' href='javascript:void(0);'><span>refresh</span></a>\
		</div>")
	if (ary.length <= 49){
		$('#ti-alert').show()
		$('#ti-alert').text("Watching "+ary.length+" animes. (click to close).")
		localStorage.removeItem('extra_watching_animes')
	} else {
		if (cache_extra_subjects.length > 0){
			$('#ti-alert').show()
			$('#ti-alert').text("Maybe watching "+(50+cache_extra_subjects.length)+" animes, load form localStorage. (click to close).")
			change_dispaly()
			add_extra_subjecs(cache_extra_subjects)
		} else {
			index_ids = []
			$.each(ary, function (index, value) {
				index_ids.push($(value).attr('id').split("_")[1])
			})
			console.log(index_ids)
			$('#ti-alert').show()
			$('#ti-alert').text("Maybe more than 50 watching animes, loading to comfirm. (click to close).")
			setTimeout(function () {
				get_watching_animes()
			}, 10)
		}
	}
})

// bind events
$(document).on('click', '#ti-alert', function(e){
	$('#ti-alert').hide()
})

$('body').on('click', 'a.disabled', function(e){
		event.preventDefault()
})

$(document).on('click', '#ti-pages a', function(e){
	$('#ti-pages a').removeClass('focus')
	if ($(this).data('page') == '50'){
		$(this).addClass('focus')
		$('.infoWrapper_tv div.infoWrapper').show()
		$('.infoWrapper_tv div.infoWrapper.extra').hide()
	} else if ($(this).data('page') == 'extra') {
		$(this).addClass('focus')
		$('.infoWrapper_tv div.infoWrapper').hide()
		$('.infoWrapper_tv div.infoWrapper.extra').show()
	} else {
		t = this
		$(t).addClass('disabled')
		$(t).html('refreshing')

		localStorage.removeItem('extra_watching_animes')
		$('.infoWrapper_tv div.extra').remove()
		var ary = get_watching_animes_on_index()
		index_ids = []
		$.each(ary, function (index, value) {
			index_ids.push($(value).attr('id').split("_")[1])
		})
		refresh = true
		setTimeout(function () {
			get_watching_animes()
		}, 10)
	}
})
