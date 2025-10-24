// example5_script.js
// 以巢狀 for 產生自訂範圍的乘法表

var start = prompt('Start：');
var end = prompt('End：');

var s = parseInt(start, 10);
var e = parseInt(end, 10);
var output = '';

if (isNaN(s) || isNaN(e) || s < 1 || e > 9 || s > e) {
  output = '輸入範圍不正確！請輸入 1～9 之間的數字，且起始 ≤ 結束。';
} else {
  for (var i = s; i <= e; i++) {
    for (var j = 1; j <= 9; j++) {
      output += i + 'x' + j + '=' + (i * j) + '\t';
    }
    output += '\n\n';
  }
}

document.getElementById('result').textContent = output;