
/*
function mergeFields(prev, next, locks=[]) {
  const result = {}

  let keys, key, i

  keys = Object.keys(prev)
  for(i=0; i < keys.length; i++) {
    key = keys[i]
    if(locks.indexOf(key) >= 0) {
      result[key] = prev[key]
    } else if (next[key]) {
      result[key] = next[key]
    }
  }

  // handle new keys
  keys = Object.keys(next)
  for(i=0; i < keys.length; i++) {
    key = keys[i]
    if(locks.indexOf(key) < 0) {
      result[key] = next[key]
    } 
  }

  return result
}


*/
