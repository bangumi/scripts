function jump() {
    let needJump = false;
    if(location.protocol != 'https:') needJump = true;
    const domain = GM_getValue('domain');
    if(domain&&domain!=location.hostname) needJump = true;
    if(!needJump) return;
    location.href = location.href.replace(`${location.protocol}//${location.hostname}`,`https://${domain||location.hostname}`)
}
jump();
GM_registerMenuCommand('设置统一域名', () => {
    let input = prompt('请选择要统一到的域名\n1. bgm.tv\n2. bangumi.tv\n3. chii.in');
    if(!input) return;
    input = input.trim()
    let domain = '';
    switch(input) {
        case '1': domain = 'bgm.tv'; break;
        case '2': domain = 'bangumi.tv'; break;
        case '3': domain = 'chii.in'; break;
    }
    if(!domain) {
        alert('不正确的选项');
        return;
    }
    GM_setValue('domain', domain);
    alert('成功设置统一的域名');
    jump();
})