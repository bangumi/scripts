// ==UserScript==
// @name         共同好友
// @version      0.0.1
// @description  好友页看共同好友
// @author       ooo
// @include      http*://bgm.tv/user/*/friends
// @include      http*://bgm.tv/user/*/rev_friends
// @include      http*://chii.in/user/*/friends
// @include      http*://chii.in/user/*/rev_friends
// @include      http*://bangumi.tv/user/*/friends
// @include      http*://bangumi.tv/user/*/rev_friends
// @license      MIT
// ==/UserScript==

(async function () {
    const getId = a => a.href.split('/').pop();
    const selfId = getId(document.querySelector('#dock a'));
    if (location.pathname.split('/')[2] === selfId) return;

    const friends = await getBgmFriends();

    function renderMutualFriendsBlock(friends) {
        const originalList = document.getElementById('memberUserList');
        if (!originalList) return;

        const originalUserItems = originalList.querySelectorAll('li.user');
        const originalUserIds = Array.from(originalUserItems).map(li => {
            const avatarLink = li.querySelector('a.avatar');
            if (!avatarLink) return null;
            return getId(avatarLink);
        });

        const mutualFriendIds = originalUserIds.filter(id => friends.includes(id));
        if (!mutualFriendIds.length) return;

        const newContainer = document.createElement('ul');
        newContainer.className = 'usersMedium';

        let mutualFriendIndex = 0;
        originalUserItems.forEach(li => {
            const userId = getId(li.querySelector('a.avatar'))
            if (!mutualFriendIds.includes(userId)) return;

            const clonedLi = li.cloneNode(true);
            mutualFriendIndex++;
            clonedLi.className = (mutualFriendIndex % 5 === 0) ? 'user odd' : 'user';

            newContainer.appendChild(clonedLi);
        });

        newContainer.style.backgroundColor = 'rgba(240, 145, 153, 0.3)';
        newContainer.style.padding = '2em';
        newContainer.style.borderRadius = '8px';

        const title = document.createElement('h3');
        title.textContent = '共同好友';
        title.style.margin = '0 0 1em 0';
        title.style.color = '#F09199';
        newContainer.prepend(title);

        originalList.parentNode.insertBefore(newContainer, originalList);
    }

    renderMutualFriendsBlock(friends);

    // [在讨论帖子标记出楼主和好友](https://bgm.tv/dev/app/1075)
    async function getBgmFriends() {
        const now = new Date().getTime();
        function getCache(force = false) {
            const predata = localStorage.getItem('bgmFriends');
            if (!predata) return;
            const data = JSON.parse(predata);
            if (data && data.friends) {
                if (force || now - data.stamp < 1800000) {
                    return Object.keys(data.friends);
                }
            }
        }

        let cache = getCache();
        if (cache) return cache;

        await sleep(1000);
        const markGadget = document.querySelector('.chip-warpper');
        if (markGadget) {
            cache = getCache(true);
            if (cache) return cache;
        }

        const newData = {
            stamp: now,
            friends: {}
        };
        try {
            const response = await fetch(`/user/${selfId}/friends`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const res = await response.text();

            let filter = /<a href="\/user\/([^"]*)" class="avatar">/g;
            let anchor;
            while ((anchor = filter.exec(res)) !== null) {
                newData.friends[anchor[1]] = true;
            }
            delete newData.friends[selfId];
            localStorage.setItem('bgmFriends', JSON.stringify(newData));
            return Object.keys(newData.friends);
        } catch (error) {
            console.error('请求好友列表时出错:', error);
            return [];
        }
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
})();