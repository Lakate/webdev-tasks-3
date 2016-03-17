'use strict';

const flow = require('../lib/flow.js');
const should = require('chai').should();
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
require('chai').use(sinonChai);

describe('Testing flow.js', () => {
    describe('Tests for serial function', () => {
        it('should throw error if got not Array of funcs', () => {
            const callback = sinon.spy();

            flow.serial({}, callback);
            callback.should.have.been.calledOnce;
            callback.should.have.been.calledWith(new Error('Wrong arguments!'));
        });

        it('should call callback at once if got []', () => {
            const callback = sinon.spy();

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
            const func = sinon.spy(cb => {
                setTimeout(() => cb(null, 1), 0);
            });
            const callback = sinon.spy((err, data) => {
                callback.should.have.been.calledOnce;
                callback.should.have.been.calledAfter(func);
                callback.should.have.been.calledWith(null, 1);
                done(err);
            });

            flow.serial([func], callback);
            func.should.have.been.calledOnce;
        });

        it('should call second function twice', done => {
            const func1 = sinon.spy(cb => {
                setTimeout(() => cb(null, 1), 0);
            });

            const func2 = sinon.spy((data, cb) => {
                setTimeout(() => cb(null, 2), 100);
            });

            const callback = sinon.spy((err, data) => {
                func1.should.have.been.calledOnce;
                func2.should.have.been.calledTwice;
                callback.should.have.been.calledOnce;
                done();
            });

            flow.serial([func1, func2, func2], callback);
        });

        it('should call functions at once if got 2 function to do', done => {
            const func1 = sinon.spy(cb => {
                setTimeout(cb(null, 1), 0);
            });
            const func2 = sinon.spy((data, cb) => {
                setTimeout(cb(null, 2), 1000);
            });
            const callback = sinon.spy(() => done());

            flow.serial([func1, func2], callback);
            func1.should.have.been.calledOnce;
            func2.should.have.been.calledOnce;
            func2.should.have.been.calledWith(1);
        });

        it('should call callback at once if got 2 function to do', done => {
            const func1 = sinon.spy(cb => {
                setTimeout(cb(null, 1), 0);
            });
            const func2 = sinon.spy((data, cb) => {
                setTimeout(cb(null, 2), 1000);
            });
            const callback = sinon.spy(() => done());

            flow.serial([func1, func2], callback);
            callback.should.have.been.calledOnce;
            callback.should.have.been.calledWith(null, 2);
            callback.should.have.been.calledAfter(func2);
        });

        it('should second function call after first function', done => {
            const func1 = sinon.spy(cb => {
                setTimeout(cb(null, 1), 0);
            });
            const func2 = sinon.spy((data, cb) => {
                setTimeout(cb(null, 2), 1000);
            });
            const callback = sinon.spy(() => done());

            flow.serial([func1, func2], callback);
            func2.should.have.been.calledAfter(func1);
        });

        it('should not call 2d function call after first function, if first throw error', done => {
            const func1 = sinon.spy(cb => {
                setTimeout(cb(new Error('err')), 0);
            });
            const func2 = sinon.spy((data, cb) => {
                setTimeout(cb(null, 2), 1000);
            });
            const callback = sinon.spy(() => done());

            flow.serial([func1, func2], callback);
            func1.should.have.been.calledOnce;
            func2.should.not.have.been.called;
            callback.should.have.been.calledOnce;
            callback.should.have.been.calledWith(new Error('err'));
        });
    });
    describe('Tests for parallel function', function () {
        it('should return error if got not Array of funcs', () => {
            const callback = sinon.spy();

            flow.parallel({}, callback);
            callback.should.have.been.calledOnce;
            callback.should.have.been.calledWith(new Error('Wrong arguments!'));
        });

        it('should call callback at once if got []', () => {
            const callback = sinon.spy();

            flow.parallel(([]), callback);
            callback.should.have.been.calledOnce;
            callback.args[0][1].should.be.an.instanceOf(Array);
        });

        it('should call callback at once after functions', done => {
            const func1 = sinon.spy(cb => {
                setTimeout(cb(null, 1), 0);
            });
            const func2 = sinon.spy(cb => {
                setTimeout(cb(null, 2), 1000);
            });
            const callback = sinon.spy((err, data) => {
                callback.should.have.been.calledOnce;
                callback.should.have.been.calledAfter(func1);
                callback.should.have.been.calledAfter(func2);
                done();
            });

            flow.parallel([func1, func2], callback);
            func1.should.have.been.calledOnce;
            func2.should.have.been.calledOnce;
        });

        it('should call callback with right data array', done => {
            const func1 = sinon.spy(cb => {
                setTimeout(cb(null, 1), 0);
            });
            const func2 = sinon.spy(cb => {
                setTimeout(cb(null, 2), 1000);
            });
            const callback = sinon.spy((err, data) => {
                callback.should.have.been.calledOnce;
                callback.should.have.been.calledWith(undefined, [1, 2]);
                done();
            });

            flow.parallel([func1, func2], callback);
        });

        it('should return error if one of functions throw err', () => {
            const func1 = sinon.spy(cb => {
                setTimeout(cb(new Error('err')), 0);
            });
            const func2 = sinon.spy(cb => {
                setTimeout(cb(null, 2), 100);
            });
            const callback = sinon.spy((err, data) => {
                callback.should.have.been.calledWith(new Error('err'), [undefined, 2]);
            });

            flow.parallel([func1, func2], callback);
        });

        it('should call all functions parallel if limit bigger then count of funcs', done => {
            const func1 = sinon.spy(cb => {
                setTimeout(cb(null, 1), 500);
            });
            const func2 = sinon.spy(cb => {
                setTimeout(cb(null, 2), 1000);
            });
            const callback = sinon.spy((err, data) => {
                callback.should.have.been.calledOnce;
                callback.should.have.been.calledWith(undefined, [1, 2]);
                done();
            });

            flow.parallel([func1, func2], 10, callback);
            func1.should.have.been.calledOnce;
            func2.should.have.been.calledOnce;
        });

        it('should call functions sync if limit equal 1', done => {
            const func1 = sinon.spy(cb => {
                setTimeout(cb(null, 1), 1000);
            });
            const func2 = sinon.spy(cb => {
                setTimeout(cb(null, 2), 500);
            });
            const callback = sinon.spy((err, data) => {
                callback.should.have.been.calledOnce;
                callback.should.have.been.calledAfter(func2);
                callback.should.have.been.calledWith(undefined, [1, 2]);
                done();
            });

            flow.parallel([func1, func2], 1, callback);
            func1.should.have.been.calledOnce;
            func2.should.have.been.calledOnce;
            func2.should.have.been.calledAfter(func1);
        });

        it('should return [] if limit equal 0', done => {
            const func1 = sinon.spy(cb => {
                setTimeout(cb(null, 1), 1000);
            });
            const func2 = sinon.spy(cb => {
                setTimeout(cb(null, 2), 1000);
            });
            const callback = sinon.spy((err, data) => {
                callback.should.have.been.calledOnce;
                callback.should.have.been.calledWith(undefined, []);
                done();
            });

            flow.parallel([func1, func2], 0, callback);
            func1.should.not.have.been.called;
            func2.should.not.have.been.called;
        });
    });
    describe('Tests for map function', function () {
        it('should return error if got not Array of funcs', () => {
            const func = () => {};
            const callback = sinon.spy();

            flow.map({}, func, callback);
            callback.should.have.been.calledOnce;
            callback.should.have.been.calledWith(new Error('Wrong arguments!'));
        });

        it('should call callback at once if got []', () => {
            const func = () => {};
            const callback = sinon.spy();

            flow.map(([]), func, callback);
            callback.should.have.been.calledOnce;
            callback.should.have.been.calledWith(undefined, []);
        });

        it('should call callback at once after functions', done => {
            const func = sinon.spy((data, cb) => {
                setTimeout(cb(null, data), 100);
            });
            const callback = sinon.spy((err, data) => {
                callback.should.have.been.calledOnce;
                done();
            });

            flow.map([1, 2], func, callback);
        });

        it('should apply function to each param', done => {
            const func = sinon.spy((data, cb) => {
                setTimeout(cb(null, data + 1), 100);
            });
            const callback = sinon.spy((err, data) => {
                callback.should.have.been.calledWith(undefined, [2, 3]);
                done();
            });

            flow.map([1, 2], func, callback);
        });
    });
    describe('Tests for makeAsync function', function () {
        it('should return a function', () => {
            const syncFunction = () => {};

            flow.makeAsync(syncFunction(1));
            syncFunction.should.be.a('function');
        });

        it('should call callback', done => {
            const syncFunction = (arg) => {
                return ++arg;
            };
            const callback = sinon.spy((err, data) => {
                callback.should.have.been.calledOnce;
                callback.should.have.been.calledWith(undefined, 1);
                done();
            });

            const asyncFunction = flow.makeAsync(syncFunction);
            asyncFunction(0, callback);
        });
    });
});
