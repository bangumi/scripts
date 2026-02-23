// ==UserScript==
// @name         由单行本创建系列
// @namespace    wiki.vol.to.series
// @version      0.1.0
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
// @updateURL    https://github.com/bangumi/scripts/raw/master/inchei/wikiVolToSeries.user.js
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
        if (document.querySelector('.focus.chl').href.split('/').pop() !== 'book') return;
        if (document.querySelector('.nameSingle .grey').nextElementSibling) { // 系列
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

                const inputBtns = document.querySelectorAll(':not(.canvas-btn-container) .inputBtn');
                const trimmedTitle = res.name.replace(/\s(上|下|\d+|[\u0030-\u0039\uFF10-\uFF19]+)|[（(].+?[）)]$/, '').trim();
                const titleInput = document.querySelector('input[name="subject_title"]');
                titleInput.addEventListener('input', () => {
                    inputBtns.forEach(inputBtn => {
                        if (titleInput.value !== res.name) {
                            inputBtn.style.pointerEvents = 'auto';
                            inputBtn.value = '提交';
                        } else {
                            inputBtn.style.pointerEvents = 'none';
                            inputBtn.value = '与来源单行本重名，请更改书名';
                        }
                    });
                });
                titleInput.value = trimmedTitle;
                titleInput.dispatchEvent(new Event('input'));
                document.querySelector('#subjectSeries').click();
                document.querySelector(`[value="${res.platform}"]`)?.click();
                document.querySelector('#subject_summary').value = res.summary;
                res.nsfw && document.querySelector('[name="subject_nsfw"]').click();
                document.querySelector('#tags').value = `${({
                    1001: '漫画',
                    1002: '小说',
                    1003: '画集',
                    1004: '绘本',
                    1005: '写真',
                    1006: '公式书',
                })[res.platform] || ''} 系列`;

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
        if (!sbjId || !info
            || document.querySelector('.focus.chl').href.split('/').pop() !== 'book'
            || !document.querySelector('.nameSingle .grey').nextElementSibling
        ) return;
        const [volName, volId] = info.split('"""');
        if (document.querySelector(`#crtRelateSubjects li a[href="/subject/${volId}"]`)) {
            sessionStorage.removeItem('seriesVolumeInfo');
            return;
        }
        // eslint-disable-next-line no-global-assign
        subjectList = [{ id: volId, type_id: '1', name: volName, name_cn: '', url_mod: 'subject' }];
        addRelateSubject(0, 'submitForm');
        const searchInput = document.querySelector('#subjectName');
        searchInput.value = document.querySelector('.nameSingle a').textContent;
        findSubjectFunc();
        // eslint-disable-next-line no-undef
        $('#crtRelateSubjects a.h').click(rmParent);
        waitForElement('#id_start', e => {
            e.value = volId;
            document.querySelector('#id_end').value = volId;
        });
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