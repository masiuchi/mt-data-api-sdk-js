module.exports = function( grunt ) {
    "use strict";

    var srcHintOptionsBrowser = grunt.file.readJSON("src/.jshintrc"),
        srcHintOptionsNode    = grunt.file.readJSON("src/.jshintrc"),
        proxySnippet          = require("grunt-connect-proxy/lib/utils").proxyRequest,
        srcBrowser            = [
            "src/data-api/common/core.js",
            "src/data-api/common/cookie.js",
            "src/data-api/common/endpoints.js",
            "src/data-api/common/exports.js",
            "src/data-api/common/sessionstore-cookie.js",
            "src/data-api/common/sessionstore-cookie-encrypted.js"
        ],
        srcNode               = srcBrowser.concat([
            "src/data-api/common/window.js",
            "src/data-api/common/sessionstore-fs.js",
            "src/node/bootstrap.js"
        ]);
    srcHintOptionsBrowser.browser = true;
    srcHintOptionsNode.node = true;

    function getJasmineDataApiCoverageConfig(report) {
        return {
            src: [
                "src/data-api/common/core.js",
                "src/data-api/common/sessionstore-cookie.js",
                "src/data-api/common/sessionstore-cookie-encrypted.js",
                "<%= preprocess['data-api-coverage-endpoints'].dest %>",
                "src/data-api/common/exports.js",
            ],
            options: {
                specs: "spec/data-api/**/*.js",
                host: "http://localhost:<%= connect.jasmine.options.port %>/",
                helpers: [
                    "bower_components/sinon-browser/*.js",
                    "bower_components/underscore/underscore.js",
                    "bower_components/jquery/jquery.min.js",
                    "spec/helpers/common/*.js",
                    "src/data-api/common/sjcl.js",
                    "src/data-api/common/cookie.js",
                ],
                template: require("grunt-template-jasmine-istanbul"),
                templateOptions: {
                    coverage: "reports/coverage/coverage.json",
                    report: report || "reports/coverage",
                }
            }
        };
    }

    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        clean: {
            "data-api": [
                "<%= preprocess['data-api-coverage-endpoints'].dest %>",
                "<%= Object.keys(uglify['data-api-browser'].files)[0] %>",
                "<%= uglify['data-api-browser'].options.sourceMap %>",
                "<%= movabletype.options.helper %>",
            ]
        },
        preprocess: {
            "data-api-browser": {
                dest: "mt-static/data-api/v1/js/mt-data-api.js",
                src: "src/data-api/v1/mt-data-api.js"
            },
            "data-api-node": {
                dest: "node-lib/data-api/v1/node-mt-data-api.js",
                src: "src/data-api/v1/node-mt-data-api.js"
            },
            "node-bootstrap": {
                dest: "node-lib/bootstrap.js",
                src: "src/node/bootstrap.js"
            },
            "data-api-coverage-endpoints": {
                dest: ".src/data-api/coverage/endpoints.js",
                src: "src/data-api/v1/endpoints.js"
            }
        },
        watch: {
            "data-api": {
                files: [
                    "src/**/*.js",
                    "./spec/data-api/**/*.js",
                ],
                tasks: "test"
            },
            "data-api-coverage": {
                files: [
                    "src/**/*.js",
                    "./spec/data-api/**/*.js",
                ],
                tasks: "test-browser-coverage"
            }
        },
        uglify: {
            "data-api-browser": {
                files: {
                    "mt-static/data-api/v1/js/mt-data-api.min.js": [
                        "mt-static/data-api/v1/js/mt-data-api.js"
                    ]
                },
                options: {
                    banner: "/* Copyright (c) 2013 Six Apart, Ltd.\n * This file is generated by Movable Type DataAPI SDK for JavaScript.\n * Consult the source files for their respective licenses and copyrights.\n * <%= pkg.homepage %>\n */\n",
                    sourceMap: "mt-static/data-api/v1/js/mt-data-api.min.map",
                    sourceMapPrefix: 4,
                    sourceMappingURL: "mt-data-api.min.map",
                    report: "min",
                    beautify: {
                        ascii_only: true
                    },
                    compress: {
                        if_return: false,
                        hoist_funs: false,
                        join_vars: false,
                        loops: false,
                        unused: false
                    },
                    mangle: {
                        // saves some bytes when gzipped
                        except: ["undefined"]
                    }
                }
            }
        },
        jshint: {
            "data-api-browser": {
                src: srcBrowser,
                options: srcHintOptionsBrowser
            },
            "data-api-node": {
                src: srcNode,
                options: srcHintOptionsNode
            },
            grunt: {
                src: [
                    "Gruntfile.js",
                    "tasks/test.js",
                    "tasks/build.js"
                ],
                options: {
                    jshintrc: ".jshintrc"
                }
            }
        },
        plato: {
            options: {
                jshint: srcHintOptionsBrowser
            },
            files: {
                dest: "reports/plato",
                src: srcBrowser
            }
        },
        connect: {
            jasmine: {
                options: {
                    hostname: "localhost",
                    port: 9001,
                    middleware: function (connect, options) {
                        return [
                            proxySnippet,
                            connect.static(options.base),
                            connect.directory(options.base)
                        ];
                    }
                },
                proxies: [
                    {
                        context: "/cgi-bin",
                        host: "localhost",
                        port: "<%= movabletype.options.port %>",
                        https: false,
                        changeOrigin: false
                    }
                ]
            },
        },
        open: {
            test: {
                path: "http://localhost:<%= connect.jasmine.options.port %>/<%= jasmine['data-api'].options.outfile %>"
            }
        },
        jasmine: {
            "data-api": {
                src: ["mt-static/data-api/v1/js/mt-data-api.js"],
                options: {
                    specs: "spec/data-api/**/*.js",
                    host: "http://localhost:<%= connect.jasmine.options.port %>/",
                    helpers: [
                        "bower_components/sinon-browser/*.js",
                        "bower_components/underscore/underscore.js",
                        "bower_components/jquery/jquery.min.js",
                        "bower_components/requirejs/require.js",
                        "spec/helpers/common/*.js",
                        "src/data-api/common/cookie.js",
                    ],
                    keepRunner: true,
                    outfile: "spec/runner.html",
                }
            },
            "data-api-coverage": getJasmineDataApiCoverageConfig(),
            "data-api-coverage-text": getJasmineDataApiCoverageConfig({
                type: "text"
            }),
        },
        jasmine_node: {
            projectRoot: "spec",
            useHelpers: true,
            jUnit: {
                report: true,
                savePath : "reports/node/",
                useDotNotation: true,
                consolidate: true
            }
        },
        prompt: {
            wait: {
                options: {
                    questions: [
                        {
                            config: "wait",
                            type: "input",
                            message: "Hit enter key, if you finished a test.",
                        }
                    ]
                }
            }
        },
        movabletype: {
            options: {
                port: 9002,
                helper: "spec/helpers/common/psgi-server-status-helper.js"
            }
        }
    });


    grunt.task.loadTasks("tasks");

    require("matchdep").filterDev("grunt-*").forEach(function (name) {
        if (!/template/.test(name)) {
            grunt.loadNpmTasks(name);
        }
    });
};
