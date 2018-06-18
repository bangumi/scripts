function infoOutdated(prefix, interval, version) {
  const localVersion = localStorage.getItem(prefix + 'VERSION');
  const time = localStorage.getItem(prefix + 'LATEST_UPDATE_TIME');
  if (!localVersion || !time || localVersion !== version){
    return true;
  }
  const now = new Date();
  if (now - new Date(time) > interval) {
    clearInfoStorage(prefix);
    return true;
  }
}

function clearInfoStorage(prefix) {
  let now = new Date();
  for (var key in localStorage) {
    if (key.match(prefix)) {
      console.log(localStorage.getItem(key));
      localStorage.removeItem(key);
    }
  }
}

module.exports = {
  infoOutdated,
  clearInfoStorage
};
