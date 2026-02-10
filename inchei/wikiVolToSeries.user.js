// ==UserScript==
// @name         由单行本创建系列
// @namespace    wiki.vol.to.series
// @version      0.0.1
// @description  从单行本第一卷创建系列条目
// @author       you
// @icon         https://bgm.tv/img/favicon.ico
// @match        http*://bgm.tv/subject/*
// @match        http*://bgm.tv/new_subject/1
// @match        http*://bangumi.tv/subject/*
// @match        http*://bangumi.tv/new_subject/1
// @match        http*://chii.in/subject/*
// @match        http*://chii.in/new_subject/1
// @grant        GM_xmlhttpRequest
// @connect      next.bgm.tv
// @license      MIT
// @gf
// @gadget
// ==/UserScript==

(function () {
    'use strict';

    const pathname = location.pathname;

    const exposeEntry = () => {
        const a = document.createElement('a');
        a.classList.add('l');
        a.textContent = '/ 创建对应系列';
        a.href = '/new_subject/1';
        const br = document.createElement('br');
        document.querySelector('.modifyTool .tip_i p:nth-of-type(2)').append(br, a);
    }

    if (pathname.match(/^\/subject\/\d+$/)) { // 条目页
        const type = document.querySelector('.nameSingle .grey');
        if (type.textContent !== '漫画') return;
        if (type.nextElementSibling) { // 系列
            const info = sessionStorage.getItem('seriesVolumeInfo');
            if (document.referrer !== `${location.origin}/new_subject/1` || !info) return;
            location.href += '/add_related/subject/book';
        } else {
            exposeEntry();
            const title = document.querySelector('.nameSingle a');
            sessionStorage.setItem('seriesVolumeInfo', `${title.textContent}"""${title.href.split('/').pop()}`);
            sessionStorage.setItem('seriesVolumeCover', document.querySelector('.cover')?.href || '');
        }
    } else if (pathname === '/new_subject/1') { // 创建条目页
        const referrer = document.referrer;
        const sbjId = referrer.match(/subject\/(\d+)/)?.[1];
        const info = sessionStorage.getItem('seriesVolumeInfo');
        const cover = sessionStorage.getItem('seriesVolumeCover');
        if (sbjId !== info?.split('"""')?.[1] || (!cover && cover !== '')) return;

        GM_xmlhttpRequest({
            method: 'GET',
            url: `https://next.bgm.tv/p1/wiki/subjects/${sbjId}`,
            responseType: 'json',
            timeout: 5000,
            onload: function (response) {
                if (response.status !== 200) {
                    alert(`获取单行本信息失败，状态码：${response.status}`);
                    return;
                }

                const res = response.response;

                const infobox = res.infobox.replace(/\|(页数|ISBN|价格)\s*=\s*.+(\r?\n|$)/gim, '');
                document.querySelector('#subject_infobox').value = infobox;

                document.querySelector('input[name="subject_title"]').value = res.name.replace(/\s(上|下|\d+)|[（(].+?[）)]$/, '').trim();
                document.querySelector('#subjectSeries').click();
                document.querySelector(`[value="${res.platform}"]`)?.click();
                document.querySelector('#subject_summary').value = res.summary;
                res.nsfw && document.querySelector('[name="subject_nsfw"]').click();
                document.querySelector('#tags').value = '漫画 系列';

                if (cover) {
                    waitForElement('img.preview', async (previewImg) => {
                        const coverDataURL = await convertImageToDataURL(cover);
                        previewImg.src = coverDataURL;
                    });
                }
            },
            onerror: function (error) {
                alert(`请求单行本API失败：${error.message}`);
            },
            ontimeout: function () {
                alert('获取单行本信息超时，请检查网络或稍后重试');
            }
        });
    } else if (pathname.endsWith('/add_related/subject/book')) {
        const sbjId = document.referrer.match(/subject\/(\d+)/)?.[1];
        const info = sessionStorage.getItem('seriesVolumeInfo');
        if (document.querySelector('#crtRelateSubjects li')) {
            sessionStorage.removeItem('seriesVolumeInfo');
            return;
        }
        if (!sbjId || !info) return;
        const [volName, volId] = info.split('"""');
        const ul = document.querySelector('#crtRelateSubjects');
        ul.insertAdjacentHTML('afterbegin', `<li class="clearit"><a href="javascript:void(0);" class="h rr">x</a><p class="title"><a href="/subject/${volId}" target="_blank" class="l">${volName}</a></p><span class="tip">关系: <select name="infoArr[n0][relation_type]" style="width:150px;"><option value="1003">单行本 / Offprint</option><option value="1">改编 / Adaptation</option><option value="1002">系列 / Series</option><option value="1004">画集 / Album</option><option value="1010">不同版本 / Version</option><option value="1005">前传 / Prequel</option><option value="1006">续集 / Sequel</option><option value="1007">番外篇 / Side Story</option><option value="1008">主线故事 / Parent Story</option><option value="1015">不同演绎 / Alternative Version</option><option value="1011">角色出演 / Character</option><option value="1012">相同世界观 / Same setting</option><option value="1013">不同世界观 / Alternative setting</option><option value="1014">联动 / Collaboration</option><option value="1099">其他 / Other</option></select><input type="hidden" name="infoArr[n0][subject_id]" value="${volId}"><input type="hidden" name="infoArr[n0][subject_type_id]" value="1"></span></li>`);
        document.querySelector('#subjectName').value = document.querySelector('.nameSingle a').textContent;
        findSubjectFunc();
    }

    function waitForElement(selector, callback) {
        const element = document.querySelector(selector);
        if (element) {
            callback(element);
            return;
        }

        // 使用MutationObserver等待元素出现
        const observer = new MutationObserver(() => {
            const elem = document.querySelector(selector);
            if (elem) {
                observer.disconnect();
                callback(elem);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    /**
     * 将远程图片链接转换为DataURL
     * @param {string} imageUrl 图片链接
     * @returns {Promise<string>} DataURL字符串
     */
    async function convertImageToDataURL(imageUrl) {
        try {
            // 使用GM_xmlhttpRequest（油猴特权）跨域请求图片（避免CORS限制）
            const imageBlob = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: imageUrl,
                    responseType: 'blob', // 以二进制Blob形式获取图片
                    timeout: 5000,
                    onload: (response) => {
                        if (response.status === 200 && response.response) {
                            resolve(response.response);
                        } else {
                            reject(new Error(`获取图片失败，状态码：${response.status}`));
                        }
                    },
                    onerror: (error) => reject(new Error(`请求图片失败：${error.message}`)),
                    ontimeout: () => reject(new Error('获取图片超时'))
                });
            });

            // 将Blob转换为DataURL
            const dataUrl = await new Promise((resolve) => {
                const fileReader = new FileReader();
                fileReader.onload = (e) => resolve(e.target.result);
                fileReader.readAsDataURL(imageBlob);
            });

            return dataUrl;
        } catch (error) {
            console.error('转换图片为DataURL失败：', error);
            throw error; // 抛出错误让上层处理
        }
    }

})();