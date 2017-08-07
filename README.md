# Custom Promise implementation

There're still some browsers which doesn't support Promises, this is a custom implementation on it.
Tested on IE8!

## Examples:

      - Chaining then

``` javascript
var p1 = new Promise(function(resolve, reject) {
  setTimeout(function() {
    reject(10);
  },3000);
});

p1.then(function(value) {
    console.log(value); // This is never called
}, function(err) {
    console.log('reject with ', err); // reject with 10
    return err + 10;
})
.then(function(value) {
  console.log(value + ' - This synchronous usage is virtually pointless'); // 20 - This synchronous usage is virtually pointless
  return value + 10;
})
.then(function(value) {
  console.log(value + ' - This synchronous usage is virtually pointless'); // 30 - This synchronous usage is virtually pointless
});
```

  - Return a promise

  ``` javascript
function resolveLater(resolve, reject) {
  setTimeout(function () {
    resolve(100);
  }, 1000);
}

function rejectLater(resolve, reject) {
  setTimeout(function () {
    reject(200);
  }, 2000);
}

var p2 = Promise.resolve('bar');
var p3 = p2.then(function(value) {
	return new Promise(resolveLater); // return a new promise from the then of p2 (which will resolve after 1s)
});

p3.then(function(value) {
	console.log('resolved with ', value); // resolved with 100
	return new Promise(rejectLater); // return a new promise again (which will reject after 2s)
})
.then(function(value) {
	console.warn('NEVER!', value); // This is never called
},
function(value) {
	console.log('rejected with ', value); // rejected with 200
});
```

 - Catch an error

``` javascript
Promise.resolve()
  .then( () => {
  // Makes .then() return a rejected promise
  throw 'Oh no!';
})
.catch( reason => {
  console.error( 'Error catch with reason: ', reason ); // Error catch with reason: Oh no!
})
.then( () => {
  console.log( "I am always called even if the prior then's promise rejects" );
});
```
