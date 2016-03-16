/**
 * Created by mv on 05.12.2015.
 */

'use strict';

/**
 * flow.serial([func1, func2], callback)
 * Функция serial запускает функции в массиве последовательно.
 * Результат функции передается в следующую.
 * Помимо результата предыдущей функции, она получает колбэк.
 * Колбэк принимает первым параметром ошибку, а вторым – данные для следующей функции.
 * Если любая из функций передает в колбэк ошибку, то следующая не выполняется,
 * а вызывается основной колбэк callback.
 */
exports.serial = function (functions, callback) {
    if (functions.length === 0) {
        callback(null, []);
        return;
    }
    if (!(functions instanceof Array)) {
        //callback('Wrong arguments!');
        callback(new Error('Wrong arguments!'))
        return;
    }

    var functionIndex = 0;
    var nextCallback = function (error, data) {
        if (error || (functionIndex === functions.length - 1)) {
            callback(error, data);
        } else {
            functionIndex++;
            functions[functionIndex](data, nextCallback);
        }
    };
    functions[0](nextCallback);
};

/**
 * flow.parallel([func1, func2], callback)
 * Функция parallel запускает функции в массиве параллельно.
 * Результат собирается в массив, который передается в основной колбэк при завершении всех функций.
 * Функции принимают колбэк. Колбэк принимает первым параметром ошибку,
 * а вторым – данные для конечного массива.
 */
exports.parallel = function (functions, limit, parallelCallback) {
    if (typeof limit === 'function') {
        parallelCallback = limit;
        limit = functions.length;
    }

    if (!(functions instanceof Array)) {
        parallelCallback(new Error('Wrong arguments!'));
        return;
    }

    if (functions.length === 0 || limit === 0) {
        parallelCallback(undefined, []);
        return;
    }

    var countFunctions = functions.length;
    var resultArray = [];
    var currentError;
    var currentFunction = 0;
    var countOfExecutingFuncs = 0;

    var callback = () => {
        return (err, result) => {
            if (err) {
                currentError = currentError ? currentError : err;
            } else {
                resultArray.push(result);
                countOfExecutingFuncs--;
            }
            if (resultArray.length === countFunctions) {
                parallelCallback(currentError, resultArray);
            }
            execFunctions();
        };
    };

    function execFunctions() {
        while (currentFunction < countFunctions && countOfExecutingFuncs <= limit) {
            countOfExecutingFuncs++;
            functions[currentFunction](callback(currentFunction++));
        }
    }

    execFunctions();
};

/**
 * flow.map(['value1', 'value2'], func, callback)
 * Функция map запускает функцию с каждым значением параллельно.
 * Функция принимает значение из массива и колбэк.
 * Результат собираются в массив, который передается в основной колбэк при завершении всех запусков.
 */
exports.map = function (params, func, callback) {
    if (!(params instanceof Array)) {
        callback(new Error('Wrong arguments!'));
        return;
    }

    var functionWithParams = params.map(function (parameter) {
        return function (callback) {
            func(parameter, callback);
        };
    });
    module.exports.parallel(functionWithParams, callback);
};

exports.makeAsync = function (syncFunction) {
    return (arg, callback) => {
        try {
            callback(undefined, syncFunction(arg));
        } catch (err) {
            callback(err);
        };
    };
};
