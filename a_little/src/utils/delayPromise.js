function delayPromise(t) {
  let max = 400;
  let min = 200;
  t = t || Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => {
    setTimeout(resolve, t);
  });
}

module.exports = delayPromise;
