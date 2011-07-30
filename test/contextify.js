var Contextify = require('../lib/contextify.js');

exports['basic tests'] = {
    // Creating a context shouldn't fail.
    'blank context' : function (test) {
        var ctx = Contextify({});
        test.notEqual(ctx, null);
        test.notEqual(ctx, undefined);
        test.done();
    },

    // Creating a context with sandbox shouldn't change existing sandbox
    // properties.
    'basic context' : function (test) {
        var sandbox = {
            prop1 : 'prop1',
            prop2 : 'prop2'
        };
        Contextify(sandbox);
        test.equal(sandbox.prop1, 'prop1');
        test.equal(sandbox.prop2, 'prop2');
        test.done();
    },

    // Ensure that the correct properties exist on a wrapped sandbox.
    'test contextified object extra properties' : function (test) {
        var sandbox = Contextify({});
        test.notEqual(sandbox.run, undefined);
        test.notEqual(sandbox.getGlobal, undefined);
        test.done();
    },

    // Passing undefined should create an empty context.
    'test undefined sandbox' : function (test) {
        // Should return an empty object.
        test.notEqual(Contextify(undefined, undefined), undefined);
        test.notEqual(Contextify(), undefined);
        test.done();
    },

    // Make sure properties that aren't there...aren't there.
    'test for nonexistent properties' : function (test) {
        var global = Contextify({}).getGlobal();
        test.equal(global.test1, undefined);
        test.done();
    },

    // Make sure run can be called with a filename parameter.
    'test run with filename' : function (test) {
        var sandbox = Contextify();
        sandbox.run('var x = 3', "test.js");
        test.equal(sandbox.x, 3);
        test.done();
    }
};

exports['synchronous script tests'] = {
    // Synchronous context script execution:
    // Ensure that global variables are put on the sandbox object.
    'global variables in scripts should go on sandbox' : function (test) {
        var sandbox = {
            prop1 : 'prop1',
            prop2 : 'prop2'
        };
        Contextify(sandbox);
        sandbox.run('x = 3');
        test.equal(sandbox.x, 3);
        test.done();
    },

    // Synchronous context script execution:
    // Ensure that sandbox properties can be accessed as global variables.
    'sandbox properties should be globals' : function (test) {
        var sandbox = {
            prop1 : 'prop1',
            prop2 : 'prop2'
        };
        Contextify(sandbox);
        sandbox.run("test1 = (prop1 == 'prop1');" +
                    "test2 = (prop2 == 'prop2');");
        test.ok(sandbox.test1);
        test.ok(sandbox.test2);
        test.done();
    }
};

exports['asynchronous script tests'] = {
    // Asynchronous context script execution:
    // Ensure that global variables are put on the sandbox object.
    'global variables in scripts should go on sandbox' : function (test) {
        var sandbox = {
            setTimeout : setTimeout,
            prop1 : 'prop1',
            prop2 : 'prop2'
        };
        Contextify(sandbox);
        sandbox.run('setTimeout(function () {x = 3}, 0);');
        test.equal(sandbox.x, undefined);
        setTimeout(function () {
            test.equal(sandbox.x, 3);
            test.done();
        }, 0);
    },

    // Asynchronous context script execution:
    // Ensure that sandbox properties can be accessed as global variables.
    'sandbox properties should be globals' : function (test) {
        var sandbox = {
            setTimeout : setTimeout,
            prop1 : 'prop1',
            prop2 : 'prop2'
        };
        Contextify(sandbox);
        sandbox.run("setTimeout(function () {" +
                    "test1 = (prop1 == 'prop1');" +
                    "test2 = (prop2 == 'prop2');" +
                    "}, 0)");
        test.equal(sandbox.test1, undefined);
        test.equal(sandbox.test2, undefined);
        setTimeout(function () {
            test.ok(sandbox.test1);
            test.ok(sandbox.test2);
            test.done();
        }, 0);
    }
};

exports['test global'] = {
    // Make sure getGlobal() works.
    'basic test' : function (test) {
        var sandbox = {
            prop1 : 'prop1',
            prop2 : 'prop2'
        };
        Contextify(sandbox);
        var global = sandbox.getGlobal();
        test.notDeepEqual(global, null);
        test.notDeepEqual(global, undefined);
        // Make sure global is forwarding properly.
        test.equal(global.prop1, 'prop1');
        test.equal(global.prop2, 'prop2');
        global.prop3 = 'prop3';
        test.equal(sandbox.prop3, 'prop3');
        test.done();
    },

    // Make sure that references to the global are correct.
    'self references to the global object' : function (test) {
        var sandbox = Contextify({});
        var global = sandbox.getGlobal();
        sandbox.ref1 = global;
        sandbox.ref2 = {
            ref2 : global
        };
        sandbox.run("test1 = (this == ref1);" +
                    "test2 = (this == ref2.ref2);");
        test.ok(sandbox.test1);
        test.ok(sandbox.test2);
        test.done();
    },

    // Make sure the enumerator is enumerating correctly.
    'test enumerator' : function (test) {
        var sandbox = {
            prop1 : 'prop1',
            prop2 : 'prop2'
        };
        var global = Contextify(sandbox);
        var globalProps = Object.keys(global);
        test.equal(globalProps.length, 4);
        test.ok(globalProps.indexOf('prop1') != -1);
        test.ok(globalProps.indexOf('prop2') != -1);
        test.ok(globalProps.indexOf('run') != -1);
        test.ok(globalProps.indexOf('getGlobal') != -1);
        test.done();
    },

    // Make sure deleter is working.
    'test deleter' : function (test) {
        var sandbox = {
            prop1 : 'prop1',
            prop2 : 'prop2'
        };
        var global = Contextify(sandbox).getGlobal();
        test.equal(Object.keys(sandbox).length, 4);
        test.equal(Object.keys(global).length, 4);
        delete global.prop1;
        test.equal(Object.keys(global).length, 3);
        test.equal(Object.keys(sandbox).length, 3);
        delete global.prop2;
        test.equal(Object.keys(global).length, 2);
        test.equal(Object.keys(sandbox).length, 2);
        delete global.run;
        test.equal(Object.keys(global).length, 1);
        test.equal(Object.keys(sandbox).length, 1);
        delete global.getGlobal;
        test.equal(Object.keys(global).length, 0);
        test.equal(Object.keys(sandbox).length, 0);
        test.done();
    },

    // Make sure the global's class name is the same as the sandbox.
    'test global class name' : function (test) {
        function DOMWindow () {};
        var sandbox = Contextify(new DOMWindow());
        var global = sandbox.getGlobal();
        test.equal(sandbox.constructor.name, 'DOMWindow');
        test.equal(sandbox.constructor.name, global.constructor.name);
        sandbox.run('thisName = this.constructor.name');
        test.equal(sandbox.thisName, sandbox.constructor.name);
        test.done();
    },

    // Make sure functions in global scope are accessible through global.
    'test global functions' : function (test) {
        var sandbox = Contextify();
        var global = sandbox.getGlobal();
        sandbox.run("function testing () {}");
        test.notEqual(global.testing, undefined);
        test.done();
    }
};


// Test that multiple contexts don't interfere with each other.
exports['test multiple contexts'] = function (test) {
    var sandbox1 = {
        prop1 : 'prop1',
        prop2 : 'prop2'
    };
    var sandbox2 = {
        prop1 : 'prop1',
        prop2 : 'prop2'
    };
    var global1 = Contextify(sandbox1).getGlobal();
    var global2 = Contextify(sandbox2).getGlobal();
    test.equal(global1.prop1, 'prop1');
    test.equal(global2.prop1, 'prop1');
    sandbox1.run('test = 3');
    sandbox2.run('test = 4');
    test.equal(sandbox1.test, 3);
    test.equal(global1.test, 3);
    test.equal(sandbox2.test, 4);
    test.equal(global2.test, 4);
    test.done();
};

// Test console - segfaults in REPL.
exports['test console'] = function (test) {
    var sandbox = {
        console : console,
        prop1 : 'prop1'
    };
    Contextify(sandbox);
    test.doesNotThrow(function () {
        sandbox.run('console.log(prop1);');
    });
    test.done();
};


// Make sure exceptions get thrown for invalid scripts.
exports['test exceptions'] = function (test) {
    var sandbox = Contextify();
    test.throws(function () {
        sandbox.run('doh');
    });
    test.throws(function () {
        sandbox.run('x = y');
    });
    test.throws(function () {
        sandbox.run('function ( { (( }{);');
    });
    test.done();
};
