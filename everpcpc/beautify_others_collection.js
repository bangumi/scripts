// ==UserScript==
// @name         Bangumi 美化他人收藏数
// @namespace    com.everpcpc.bgm
// @version      0.1
// @description  enjoy~
// @author       everpcpc
// @include      /^https?://(bgm\.tv|chii\.in|bangumi\.tv)/user/\w+$/
// @grant        none
// ==/UserScript==

lstorage = {
	save : function(key, jsonData, expirationMin){
		var expirationMS = expirationMin * 60 * 1000;
		var record = {value: JSON.stringify(jsonData), timestamp: new Date().getTime() + expirationMS};
		localStorage.setItem(key, JSON.stringify(record));
		return jsonData;
	},
	load : function(key){
		var record = JSON.parse(localStorage.getItem(key));
		if (!record){return false;}
		return (new Date().getTime() < record.timestamp && JSON.parse(record.value));
	}
};

TYPES = ["anime", "game", "book", "music", "real"];

function replace_collection(collection) {
    TYPES.forEach(function(type){
        $(`#${type} div.horizontalOptions ul li`).each(function(index){
            if ($(this).hasClass("title")) return;
            var coll = $(this).find("a:first")[0];
            var token = coll.href.split("/");
            var status = token[token.length-1];
            if (collection[type][status] === undefined) return;

            var num = parseInt(coll.text.replace(/[^\d\.]*/g, ''), 10);
            if (num > collection[type][status] && num < 1000) {
                coll.text = "(" + (collection[type][status] - 2) + ")" + coll.text.replace(/[\d\.]*/g, '');
            }
        });
    });

}

(function() {
    'use strict';

    var self_url = $("#dock div ul li:first a")[0].href;
    if self_url.endsWith("/login") return;

    var self_collection = lstorage.load("self_collection");
    if (self_collection) {
        replace_collection(self_collection);
        return;
    }

    self_collection = {};
    $.get(self_url, function(data) {
        TYPES.forEach(function(type){
            self_collection[type] = {};
            $(`#${type} div.horizontalOptions ul li`, $(data)).each(function(index){
                if ($(this).hasClass("title")) return;
                var coll = $(this).find("a:first")[0];
                var token = coll.href.split("/");
                var status = token[token.length-1];
                self_collection[type][status] = parseInt(coll.text.replace( /[^\d\.]*/g, ''), 10);
            });
        });
        replace_collection(self_collection);
        // cache for one hour
        lstorage.save("self_collection", self_collection, 60);
    });
})();
