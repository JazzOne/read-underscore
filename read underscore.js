(function() {
    
    var root = this;
    var previousUnderscore = root._;

    // 缓存变量, 便于压缩代码
    // 同时可减少在原型链中的查找次数(提高代码效率)
    // 此处「压缩」指的是压缩到 min.js 版本
    // 而不是 gzip 压缩
    var ArrayProto = Array.prototype, 
        ObjProto = Object.prototype, 
        FuncProto = Function.prototype;
    
    var push             = ArrayProto.push,
        slice            = ArrayProto.slice,
        toString         = ObjProto.toString,
        hasOwnProperty   = ObjProto.hasOwnProperty;

    // ES5 原生方法, 如果浏览器支持, 则 underscore 中会优先使用
    var nativeIsArray      = Array.isArray,
        nativeKeys         = Object.keys,
        nativeBind         = FuncProto.bind,
        nativeCreate       = Object.create;
    
    var Ctor = function() {};

    var _ = function(obj) {
        
        if(obj instanceof _) return obj;

        if(!(obj instanceof _)) return new _(obj)

        this._wrapped = obj
    }

    // 将上面定义的 `_` 局部变量赋值给全局对象中的`_`属性
    if(typeof exports !== 'undefined') { // node 环境下
        if(typeof module !== 'undefined' && module.exports) {
            exports = module.exports = _;
        }
        exports._ = _;
    }else { 
        root._ = _;
    }

    // underscore 内部方法
    // 根据 this 指向（context 参数）
    // 以及 argCount 参数
    // 二次操作返回一些回调、迭代方法
    var optimizeCb = function(func, context, argCount) {
        // 如果没有指定 this 指向，则返回原函数
        if(context == void 0) // void 0 即 undefined
            return func

        // 这个switch 只是因为 call 比 apply 块。。
        // .apply 在运行前要对作为参数的数组进行一系列检验和深拷贝，.call 则没有这些步骤
        // https://segmentfault.com/q/1010000007894513
        switch(argCount == null ? 3 : argCount) {
            case 1: return function(value) {
                return func.call(context, value)
            }

            case 2: return function(value, index) {
                return func.call(context, value, index)
            }

            // 传入指定this，但没有传入argCount
            // _.each, _.map
            case 3: return function(value, index, collection) {
                return func.call(context, value, index, collection)
            }
            // _.reduce, _reduceRight 
            case 4: return function(accumulator, value, index, collection) {
                return func.call(context, accumulator, value, index, collection)
            }
        }

        return function() {
            return func.apply(context, arguments)
        }
        
    }


    var cb = function(value, context, argCount) {
        if(value == null) return _.identity;
        if(_.isFunction(value)) return optimizeCb(value, context, argCount);
        if(_.isObject(value)) return _.matcher(value);
        return _.property(value);
    }

    // 内部迭代器
    _.iteratee = function(value, context) {
        return cb(value, context, Infinity)
    }

    // 有三个方法用到了这个内部函数
    // _.extend & _.extendOwn & _.defaults
    // _.extend = createAssigner(_.allKeys);
    // _.extendOwn = createAssigner(_.keys);
    // _.defaults = createAssigner(_.allKeys, true);

    // 该函数返回了一个函数，返回的函数引用了外层函数的一个变量，典型的闭包
    
    var createAssigner = function(keysFunc, undefinedOnly) {
        return function(obj) {
            var length = arguments.length;
            // 如果传入参数小于2个， 或者传入的第一个参数为null，则返回传入的参数
            if(length < 2 || obj == null) return obj 

            // 遍历除第一个参数以外的其他参数
            for(var index = 1; index < length; index++) {
                var source = arguments[index],
                    // 提取对象参数的 keys值
                    // keysFunc 参数表示 _.keys 或 _.allKeys
                    keys = keysFunc(source),
                    l = keys.length;
                for(var i = 0; i < l; i++) {
                    var key = keys[i]; 
                    // _.extend 和 _.extendOwn 方法
                    // 没有传入 undefinedOnly 参数，即 !undefinedOnly 为 true
                    // 即肯定会执行 obj[key] = source[key] 
                    // 后面对象的键值对直接覆盖 obj
                    // ==========================================
                    // _.defaults 方法，undefinedOnly 参数为 true
                    // 即 !undefinedOnly 为 false
                    // 那么当且仅当 obj[key] 为 undefined 时才覆盖
                    // 即如果有相同的 key 值，取最早出现的 value 值
                    if(!undefinedOnly || obj[key] == void 0) 
                        obj[key] = source[key]
                }
            }
            // 返回合并后的第一个参数对象
            return obj
        };
    };




}())