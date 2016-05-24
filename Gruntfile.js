module.exports = function (grunt) {
    grunt.loadNpmTasks("grunt-angular-templates");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-cssmin");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-watch");

    grunt.initConfig({
        "pkg": grunt.file.readJSON("package.json"),
        "concat": {
            "app": {
                "files": {
                    "tmp/app.css": [
                        "frontend/vendor/font-awesome_4.5.0/font-awesome.css",
                        "frontend/app/**/*.css"
                    ],
                    "tmp/app.js": [
                        "frontend/vendor/angular_1.5.0/angular.js",
                        "frontend/vendor/angular-route_1.5.0/angular-route.js",
                        "frontend/vendor/angular-sanitize_1.5.0/angular-sanitize.js",
                        "frontend/vendor/jspdf_1.2.61/jspdf.min.js",
                        "frontend/vendor/pdfjs-dist_1.4.21/pdf.combined.js",
                        "<%= ngtemplates.app.dest %>",
                        "frontend/app/**/*.js"
                    ]
                }
            },
            "app-dev": {
                "files": {
                    "output/app.css": ["tmp/app.css"],
                    "output/app.js": ["tmp/app.js"]
                }
            }
        },
        "cssmin": {
            "app-prod": {
                "files": {
                    "output/app.css": ["tmp/app.css"]
                }
            }
        },
        "ngtemplates": {
            "app": {
                "cwd": "frontend/app",
                "src": "**/*.html",
                "dest": "tmp/app-templates.js",
                "options": {
                    "htmlmin": {
                        "collapseBooleanAttributes": true,
                        "collapseWhitespace": true,
                        "removeAttributeQuotes": true,
                        "removeComments": true,
                        "removeEmptyAttributes": true,
                        "removeRedundantAttributes": true,
                        "removeScriptTypeAttributes": true,
                        "removeStyleLinkTypeAttributes": true
                    },
                    "module": "App.templates",
                    "standalone": true
                }
            }
        },
        "uglify": {
            "app-prod": {
                "files": {
                    "output/app.js": ["tmp/app.js"]
                }
            }
        },
        "watch": {
            "app-dev": {
                "options": {
                    "atBegin": true
                },
                "files": [
                    "Gruntfile.js",
                    "frontend/app/**",
                    "frontend/vendor/**"
                ],
                "tasks": [
                    "ngtemplates:app",
                    "concat:app",
                    "concat:app-dev"
                ]
            },
            "app-prod": {
                "options": {
                    "atBegin": true
                },
                "files": [
                    "Gruntfile.js",
                    "frontend/app/**",
                    "frontend/vendor/**"
                ],
                "tasks": [
                    "ngtemplates:app",
                    "concat:app",
                    "cssmin:app-prod",
                    "uglify:app-prod"
                ]
            }
        }
    });

    grunt.task.registerTask("watch:dev", ["watch:app-dev"]);
    grunt.task.registerTask("watch:prod", ["watch:app-prod"]);
};
