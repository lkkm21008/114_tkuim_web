// 猜數字遊戲

var answer = Math.floor(Math.random() * 100) + 1;
var guess;
var count = 0;
var result = '';

alert(' Guess 1～100 ');

do {
  guess = parseInt(prompt('input（1～100）：'));
  count++;

  if (isNaN(guess)) {
    alert('請輸入有效的數字！');
  } else if (guess > answer) {
    alert('太大了！再小一點～');
  } else if (guess < answer) {
    alert('太小了！再大一點～');
  } else {
    alert('恭喜答對！共猜了 ' + count + ' 次');
  }
} while (guess !== answer);

result = '正確答案：' + answer + '\n總猜測次數：' + count;
document.getElementById('result').textContent = result;