'use strict';

const flow = require('../lib/flow.js');
const should = require('chai').should();
const expect = require('chai').expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
require('chai').use(sinonChai);

describe('Testing flow.js', () => {
    describe('Tests for serial function', () => {
        it('should call callback at once if got []', () => {
            var callback = sinon.spy();
            flow.serial(([]), callback);
            expect(callback.calledOnce).to.be.true;
        });

        it('should return [] if got []', () => {
            flow.serial([], (err, actual) => {
                actual.should.be.an.instanceOf(Array);
            });
        });

        it('should call callback at once if got 1 function to do', () => {
            var func = sinon.spy(cb => {
                cb(null, 1);
            });
            var callback = sinon.spy();

            flow.serial([func], callback);
            expect(func).to.have.been.calledOnce;
            expect(callback).to.have.been.calledOnce;
            expect(callback).to.have.been.calledWithExactly(null, 1);
        });

        it('should call functions at once if got 2 function to do', () => {
            var func1 = sinon.spy(cb => {
                cb(null, 1);
            });
            var func2 = sinon.spy((data, cb) => {
                cb(null, 2);
            });
            var callback = sinon.spy();

            flow.serial([func1, func2], callback);
            expect(func1).to.have.been.calledOnce;
            expect(func2).to.have.been.calledOnce;
            expect(func2.args[0][0]).to.be.equal(1);
        });

        it('should call callback at once if got 2 function to do', () => {
            var func1 = sinon.spy(cb => {
                cb(null, 1);
            });
            var func2 = sinon.spy((data, cb) => {
                cb(null, 2);
            });
            var callback = sinon.spy();

            flow.serial([func1, func2], callback);
            expect(callback).to.have.been.calledOnce;
            expect(callback).to.have.been.calledWithExactly(null, 2);
            expect(callback.calledAfter(func2)).to.be.true;
        });

        it('should second function call after first function', () => {
            var func1 = sinon.spy(cb => {
                cb(null, 1);
            });
            var func2 = sinon.spy((data, cb) => {
                cb(null, 2);
            });
            var callback = sinon.spy();

            flow.serial([func1, func2], callback);
            expect(func2.calledAfter(func1)).to.be.true;
        });

        it('should not call 2d function call after first function, if first throw error', () => {
            var func1 = sinon.spy(cb => {
                cb('err');
            });
            var func2 = sinon.spy((data, cb) => {
                cb(null, 2);
            });
            var callback = sinon.spy();

            flow.serial([func1, func2], callback);
            expect(func1).to.have.been.calledOnce;
            expect(func2).to.not.have.been.called;
            expect(callback).to.have.been.calledOnce;
            expect(callback.args[0][0]).to.be.equal('err');
        });
    });
    describe('Tests for parallel function', function () {
        it('should call callback at once if got []', () => {
            var callback = sinon.spy();
            flow.parallel(([]), callback);
            expect(callback.calledOnce).to.be.true;
            expect(callback.args[0][1]).to.be.an.instanceOf(Array);
        });

        it('should call callback at once after functions', () => {
            var func1 = sinon.spy(cb => {
                cb(null, 1);
            });
            var func2 = sinon.spy(cb => {
                cb(null, 2);
            });
            var callback = sinon.spy((err, data) => {
                expect(callback).to.have.been.calledOnce;
                expect(callback.calledAfter(func1)).to.be.true;
                expect(callback.calledAfter(func2)).to.be.true;
            });

            flow.parallel([func1, func2], callback);
            expect(func1).to.have.been.calledOnce;
            expect(func2).to.have.been.calledOnce;
        });

        it('should call callback with right data array', () => {
            var func1 = sinon.spy(cb => {
                cb(null, 1);
            });
            var func2 = sinon.spy(cb => {
                cb(null, 2);
            });
            var callback = sinon.spy((err, data) => {
                expect(callback).to.have.been.calledOnce;
                expect(callback).to.be.calledWith(null, [1, 2]);
            });

            flow.parallel([func1, func2], callback);
            expect(func1).to.have.been.calledOnce;
            expect(func2).to.have.been.calledOnce;
        });

        it('should return error if one of functions throw err', () => {
            var func1 = sinon.spy(cb => {
                cb('err');
            });
            var func2 = sinon.spy(cb => {
                cb(null, 2);
            });
            var callback = sinon.spy((err, data) => {
                expect(callback).to.have.been.calledOnce;
                expect(callback.calledAfter(func1)).to.be.true;
                expect(callback.calledAfter(func2)).to.be.true;
                expect(callback).to.be.calledWith('err', [undefined, 2]);
            });

            flow.parallel([func1, func2], callback);
            expect(func1).to.have.been.calledOnce;
            expect(func2).to.have.been.calledOnce;
        });
    });
    describe('Tests for map function', function () {
        it('should call callback at once if got []', () => {
            var func = () => {};
            var callback = sinon.spy();
            flow.map(([]), func, callback);
            expect(callback.calledOnce).to.be.true;
            expect(callback).to.be.calledWith(null, []);
        });

        it('should call callback at once after functions', () => {
            var func = sinon.spy((data, cb) => {
                cb(null, data);
            });
            var callback = sinon.spy((err, data) => {
                expect(callback).to.have.been.calledOnce;
            });

            flow.map([1, 2], func, callback);
        });

        it('should apply function to each param', () => {
            var func = sinon.spy((data, cb) => {
                cb(null, data + 1);
            });
            var callback = sinon.spy((err, data) => {
                expect(callback).to.be.calledWith(null, [2, 3]);
            });

            flow.map([1, 2], func, callback);
        });
    });
});
