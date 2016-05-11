// ==UserScript==
// @name        Horriblesubs Magnet Links to Remote Aria2
// @namespace   15cm
// @description Show magent links directly for Remove Aria2 Download in Horriblesubs
// @include     http://horriblesubs.info/shows/*
// @version     1
// @grant       none
// @require http://cdn.bootcss.com/jquery/2.2.0/jquery.min.js
// @require https://greasyfork.org/scripts/1003-wait-for-key-elements/code/Wait%20for%20key%20elements.js?version=49342
// @require https://raw.githubusercontent.com/datagraph/jquery-jsonrpc/master/jquery.jsonrpc.js
// ==/UserScript==

// Set your aria2 config here
var aria2Url = 'http://ip:port/jsonrpc'
var token = 'Your_aria2_token'

// this.$ = this.jQuery = jQuery.noConflict(true)
$.jsonRPC.setup({
  endPoint: aria2Url,
})

var latestMatch = /\d+/.exec(window.location.search)
var latest = latestMatch ? latestMatch[0] : 0
var romaNameAdded = false

waitForKeyElements(
    'table.release-info tr',
    function(tr){
        var id = tr.attr('id')
        if(Number.parseInt(latest) >= Number.parseInt(/\d+/.exec(id.substr(-3))[0])){
            tr.attr('style','display: none')
            return false
        }
        tr.find('td.linkful').remove() //attr('style','display: none')
        var resolutions = ['480p','720p','1080p']
        for(let resolution of resolutions){
            let magnet = $(`div.release-links.${id}-${resolution} td.hs-magnet-link`)
            if(magnet.length == 0) continue
            let magnet_link = magnet.find('a').attr('href')
            magnet.html(`<button class="aria2-btn">${resolution}</button>`)
            tr.append(magnet)
            magnet.click(function(){
                $.jsonRPC.request('aria2.addUri', {
                  params: [`token:${token}`,[magnet_link]],
                  success: function(result) {
                      console.log(result)
                      if(Notification.permission != 'granted'){
                        Notification.requestPermission()
                      }
                      else{
                          var notification = new Notification('Aria2 Remote',{
                              body: `${id} added`
                          })
                      }
                  },
                  error: function(result) {
                      console.log(result)
                  }
                })
            })
        }
        if(!romaNameAdded){
            let romaName = window.location.pathname.split('/')[2]
            $('#hs-search').after(`<div id='bgm-roma-name'><h1 style="text-align: center">${romaName}</h1></div>`)
            $('html, body').animate({
               scrollTop: $('div.series-releases').offset().top
           }, 2000)
           romaNameAdded = true
        }
   })
