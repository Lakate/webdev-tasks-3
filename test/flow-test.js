'use strict';

const flow = require('../lib/flow.js');
const should = require('chai').should();
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
require('chai').use(sinonChai);

function getFunc(params) {
    params = params || {};

    return sinon.spy((data, cb) => {
        cb = cb || data;
        setTimeout(() => cb(params.error, params.data), 0);
    });
}

describe('Testing flow.js', () => {
    describe('Tests for serial function', () => {
        it('should throw error if got not Array of funcs', () => {
            let callback = sinon.spy();

            flow.serial({}, callback);
            callback.should.have.been.calledOnce;
            callback.should.have.been.calledWith(new Error('Wrong arguments!'));
        });

        it('should call callback at once if got []', () => {
            let callback = sinon.spy();

            flow.serial(([]), callback);
            callback.should.have.been.calledOnce;
        });

        it('should return [] if got []', () => {
            flow.serial([], (err, actual) => {
                actual.should.be.an.instanceOf(Array);
                actual.length.should.be.an.equal(0);
            });
        });

        it('should call callback at once if got 1 function to do', done => {
            let func = getFunc({error: null, data: 1});
            let callback = sinon.spy(() => {
                func.should.have.been.calledOnce;
                callback.should.have.been.calledOnce;
                callback.should.have.been.calledWith(null, 1);
                done();
            });

            flow.serial([func], callback);
        });

        it('should call second function twice', done => {
            let func = getFunc();
            let callback = sinon.spy(() => {
                func.should.have.been.calledTwice;
                callback.should.have.been.calledOnce;
                done();
            });

            flow.serial([func, func], callback);
        });

        it('should call functions at once if got 2 function to do', done => {
            let func1 = getFunc();
            let func2 = getFunc();
            let callback = sinon.spy(() => {
                func1.should.have.been.calledOnce;
                func2.should.have.been.calledOnce;
                done();
            });

            flow.serial([func1, func2], callback);
        });

        it('should call callback at once if got 2 function to do', done => {
            let func1 = getFunc({error: null, data: 1});
            let func2 = getFunc({error: null, data: 2});
            let callback = sinon.spy(() => {
                callback.should.have.been.calledOnce;
                callback.should.have.been.calledWith(null, 2);
                callback.should.have.been.calledAfter(func2);
                done();
            });

            flow.serial([func1, func2], callback);
        });

        it('should second function call after first function', done => {
            let func1 = getFunc();
            let func2 = getFunc();
            let callback = sinon.spy(() => {
                func2.should.have.been.calledAfter(func1);
                done();
            });

            flow.serial([func1, func2], callback);
        });

        it('should not call 2d function call after first function, if first throw error', done => {
            let func1 = getFunc({error: new Error('err')});
            let func2 = getFunc();
            let callback = sinon.spy(() => {
                func1.should.have.been.calledOnce;
                func2.should.not.have.been.called;
                callback.should.have.been.calledOnce;
                callback.should.have.been.calledWith(new Error('err'));
                done();
            });

            flow.serial([func1, func2], callback);
        });
    });
    describe('Tests for parallel function', function () {
        it('should return error if got not Array of funcs', () => {
            let callback = sinon.spy();

            flow.parallel({}, callback);
            callback.should.have.been.calledOnce;
            callback.should.have.been.calledWith(new Error('Wrong arguments!'));
        });

        it('should call callback at once if got []', () => {
            let callback = sinon.spy();

            flow.parallel(([]), callback);
            callback.should.have.been.calledOnce;
            callback.args[0][1].should.be.an.instanceOf(Array);
        });

        it('should call callback at once after functions', done => {
            let func1 = getFunc();
            let func2 = getFunc();
            let callback = sinon.spy((err, data) => {
                callback.should.have.been.calledOnce;
                callback.should.have.been.calledAfter(func1);
                callback.should.have.been.calledAfter(func2);
                done();
            });

            flow.parallel([func1, func2], callback);
        });

        it('should call callback with right data array', done => {
            let func1 = getFunc({error: null, data: 1});
            let func2 = getFunc({error: null, data: 2});
            let callback = sinon.spy((err, data) => {
                callback.should.have.been.calledOnce;
                callback.should.have.been.calledWith(undefined, [1, 2]);
                done();
            });

            flow.parallel([func1, func2], callback);
        });

        it('should return error if one of functions throw err', () => {
            let func1 = getFunc({error: new Error('err')});
            let func2 = getFunc();
            let callback = sinon.spy((err, data) => {
                callback.should.have.been.calledWith(new Error('err'), [undefined, 2]);
            });

            flow.parallel([func1, func2], callback);
        });

        it('should call all functions parallel if limit bigger then count of funcs', done => {
            let func1 = getFunc({error: null, data: 1});
            let func2 = getFunc({error: null, data: 2});
            let callback = sinon.spy((err, data) => {
                func1.should.have.been.calledOnce;
                func2.should.have.been.calledOnce;
                callback.should.have.been.calledOnce;
                callback.should.have.been.calledWith(undefined, [1, 2]);
                done();
            });

            flow.parallel([func1, func2], 10, callback);
        });

        it('should call functions sync if limit equal 1', done => {
            let func1 = getFunc();
            let func2 = getFunc();
            let callback = sinon.spy((err, data) => {
                func1.should.have.been.calledOnce;
                func2.should.have.been.calledOnce;
                func2.should.have.been.calledAfter(func1);
                callback.should.have.been.calledOnce;
                callback.should.have.been.calledAfter(func2);
                done();
            });

            flow.parallel([func1, func2], 1, callback);
        });

        it('should return [] if limit equal 0', done => {
            let func1 = getFunc();
            let func2 = getFunc();
            let callback = sinon.spy((err, data) => {
                func1.should.not.have.been.called;
                func2.should.not.have.been.called;
                callback.should.have.been.calledOnce;
                callback.should.have.been.calledWith(undefined, []);
                done();
            });

            flow.parallel([func1, func2], 0, callback);
        });
    });
    describe('Tests for map function', function () {
        it('should return error if got not Array of funcs', () => {
            let func = () => {};
            let callback = sinon.spy();

            flow.map({}, func, callback);
            callback.should.have.been.calledOnce;
            callback.should.have.been.calledWith(new Error('Wrong arguments!'));
        });

        it('should call callback at once if got []', () => {
            let func = () => {};
            let callback = sinon.spy();

            flow.map(([]), func, callback);
            callback.should.have.been.calledOnce;
            callback.should.have.been.calledWith(undefined, []);
        });

        it('should call callback at once after functions', done => {
            let func = getFunc();
            let callback = sinon.spy(() => {
                callback.should.have.been.calledOnce;
                done();
            });

            flow.map([1, 2], func, callback);
        });

        it('should apply function to each param', done => {
            let func = sinon.spy((data, cb) => {
                setTimeout(cb(null, data + 1), 0);
            });
            let callback = sinon.spy(() => {
                callback.should.have.been.calledWith(undefined, [2, 3]);
                done();
            });

            flow.map([1, 2], func, callback);
        });
    });
    describe('Tests for makeAsync function', function () {
        it('should return a function', () => {
            let syncFunction = () => {};

            flow.makeAsync(syncFunction(1));
            syncFunction.should.be.a('function');
        });

        it('should call callback', done => {
            let syncFunction = (arg) => {
                return ++arg;
            };
            let callback = sinon.spy((err, data) => {
                callback.should.have.been.calledOnce;
                callback.should.have.been.calledWith(undefined, 1);
                done();
            });

            let asyncFunction = flow.makeAsync(syncFunction);
            asyncFunction(0, callback);
        });
    });
});
