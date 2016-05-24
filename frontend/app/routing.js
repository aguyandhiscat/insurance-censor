angular.module("App.routing")
    .config(["$routeProvider",
        function ($routeProvider) {
            $routeProvider
                .when("/", {
                    "templateUrl": "pages/index/index.html",
                    "controller": "index.controller"
                });

            $routeProvider.otherwise("/");
        }]);
