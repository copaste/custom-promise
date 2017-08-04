(function (window) {
    window.Promise = typeof window.Promise === 'function' ? window.Promise : Promise;

    /**
     * Promise callback init
     * @callback executorCallback
     * @param {Function} onResolve
     * @param {Function=} onReject
     */
    /**
     * Promise resolve
     * @callback resolveCallback
     * @param {value} value
     */
    /**
     * Promise reject
     * @callback rejectCallback
     * @param {error} error
     */

    /**
     * Promise
     * @param {executorCallback} executor
     * @class
     * @constructor Promise
     */
    function Promise (executor) {
        var self = this;
        this.handlers = [];
        this.promiseValue = null;
        this.promiseStatus = 'pending';

        try {
            executor(function (data) {
                    if (data instanceof Promise && data.promiseStatus!=='pending') {
                        self.promiseValue = data.promiseValue;
                        self.promiseStatus = data.promiseStatus;
                    }
                    else if (!(data instanceof Promise)) {
                        self.promiseValue = data;
                        self.promiseStatus = 'resolved';
                    }

                    self.handlers.map(function(handler) {
                        try {
                            var value = handler.onResolved(self.promiseValue);
                            if(value instanceof Promise) {
                                value.then(handler.resolve, handler.reject);
                            }
                            else {
                                handler.resolve(value);
                            }
                        } catch (err) {
                            self.promiseStatus = 'rejected';
                            handler.reject(err);
                        }
                    });
                    self.handlers = [];
                },
                function (error) {
                    if (error instanceof Promise && error.promiseStatus!=='pending') {
                        self.promiseValue = error.promiseValue;
                        self.promiseStatus = error.promiseStatus;
                    } else if (!(error instanceof Promise)) {
                        self.promiseValue = error;
                        self.promiseStatus = 'rejected';
                    }

                    self.handlers.map(function(handler) {
                        if(typeof handler.onRejected !== 'function') {
                            return;
                        }
                        var value = handler.onRejected(self.promiseValue);
                        if(value instanceof Promise) {
                            value.then(handler.resolve, handler.reject);
                        }
                        else {
                            handler.resolve(value); // ???!! reject or resolve
                        }
                    });
                    self.handlers = [];
                });
        } catch (ex) {
            if (this.promiseStatus==='pending') {
                this.promiseStatus = 'rejected';
                this.promiseValue  = ex;
            }
        }
    }

    /**
     * Promise.resolve
     *
     * @param {*} value
     * @return {Promise}
     */
    Promise.resolve = function (value) {
        return new Promise(function (resolve) {
            resolve(value);
        });
    };

    /**
     * Promise.reject
     * @param {*} value
     * @return {Promise}
     */
    Promise.reject = function (value) {
        return new Promise(function (resolve, reject) {
            reject(value);
        });
    };

    /**
     * The then() method returns a Promise.
     * It takes up to two arguments: callback functions for the success and failure cases of the Promise.
     * @memberof Promise
     *
     * @param {resolveCallback} onResolved
     * @param {rejectCallback=} onRejected
     * @return {Promise}
     */
    Promise.prototype.then = function (onResolved, onRejected) {
        var self = this;
        var throwError = null;
        var value;

        if (this.promiseStatus==='resolved') {
            try {
                value = onResolved(this.promiseValue);
                if(value instanceof Promise) {
                    return value;
                }
            }
            catch (err) {
                value = err;
                throwError = true;
            }
        }

        if (this.promiseStatus === 'rejected' && !throwError) {
            value = typeof onRejected === 'function' ? Promise.resolve(onRejected(this.promiseValue)) : this.promiseValue;
        }

        return new Promise(function (resolve, reject) {
            if (self.promiseStatus==='pending') {
                self.handlers.push({
                    resolve: resolve,
                    onResolved: onResolved,
                    reject: reject,
                    onRejected: onRejected
                });
            }
            else {
                if(! throwError && self.promiseStatus==='resolved') {
                    resolve(value);
                } else {
                    reject(value);
                }
            }
        });
    };

    /**
     * The catch() method returns a Promise and deals with rejected cases only.
     * @memberOf Promise
     *
     * @param {Function} onRejected
     * @return {Promise}
     */
    Promise.prototype.catch = function (onRejected) {
        return this.then(function() { }, onRejected);
    };

    /**
     * The Promise.all() method returns a single Promise that resolves when all of the promises in the
     * iterable argument have resolved or when the iterable argument contains no promises. It rejects
     * with the reason of the first promise that rejects.
     *
     * @param {Array} array
     * @return {Promise}
     */
    Promise.all = function (array) {
        var result = [];
        var count = array.length;
        return new Promise(function(resolve, reject) {
            array.map(function (e) { // do id with reducer !?
                if(e instanceof Promise) {
                    e.then(function(v) {
                        result.push(v);
                        --count;
                        if(count===0) {
                            resolve(result);
                        }
                    }, function (err) {
                        reject(err);
                    });
                } else {
                    result.push(e);
                    --count;
                    if(count===0) {
                        resolve(result);
                    }
                }
            });
        });
    };

    /**
     * The Promise.race(iterable) method returns a promise that resolves or rejects as soon as one of
     * the promises in the iterable resolves or rejects, with the value or reason from that promise.
     *
     * @param {Array} array
     * @return {Promise}
     **/
    Promise.race = function (array) {
        return new Promise(function(resolve, reject) {
            array.map(function (e) {
                if(e instanceof Promise) {
                    e.then(function(v) {
                        resolve(e);
                    }, function (err) {
                        reject(err);
                    });
                } else {
                    resolve(e);
                }
            });
        });
    };

})(window);