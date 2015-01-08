var letters = 'ABCDEFGHKMNPQRSTUVW'.split('');
// var letters = 'abcdefghkmnpqrstuvw'.split('');
var abcd = ['a', 'b', 'c', 'd'];

function param_count(str) {
  var c=0;
  for (var i=0; i<4; i++) if (str.indexOf(abcd[i]) !== -1) c++;
  return c;
}

function permutation(arr) {
  var N = arr.length;
  var a = [];
  for (var n=0; n<N; n++) {
    var i = Math.round(Math.random()*n);
    var v = arr[i];
    a[i] = arr[n];
    a[n] = v;
  }
  return a;
}

/// Pass in an array of strings that will all be varied in the same way.
function scramble(strs) {
  var pcount = param_count(strs[0]);
  var num_pos = Math.floor(Math.random()*pcount);
  var num = Math.ceil(Math.random()*15)+1;
  var scrambled = permutation(letters);
  scrambled[num_pos] = num;
  var results = [];
  for (var i=0; i<strs.length; i++) {
    var res = strs[i];
    for (var j=0; j<pcount; j++) {
      res = res.replace(new RegExp(abcd[j], 'g'), scrambled[j]);
    }
    results.push(res.toLowerCase());

  }
  return results;
}
