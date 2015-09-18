angular

    .module('ngResourceExplorer')

    .controller('NgResourceExplorerFormCtrl', [
        '$log', '$scope', '$resource', '$attrs',
        function ($log, $scope, $resource, $attrs) {
            var ctrl = this;
            $scope.options = null;

            ctrl.query = function (scope) {
                if (!scope.$resource) {
                    scope.$resource = $resource(scope.url);
                }
                if (!scope.$data) {
                    scope.$data = scope.$resource.query();
                }
                return scope.$data;
            }
        }])

    .directive('armForm', ['$rootScope', function ($rootSscope) {
        var definition = {
            restrict: 'AE',
            replace: true,
            require: '^ngModel',
            scope: {},
            templateUrl: 'angular-resource-explorer/angular-resource-explorer.form.html',
            controller: 'NgResourceExplorerFormCtrl',
            controllerAs: 'ctrl',
            link: function ($scope, $element, $attrs, $ngModel) {

                $ngModel.$formatters.push(function (modelValue) {
                    return modelValue;
                });

                $ngModel.$parsers.push(function (viewValue) {
                    return viewValue;
                });

                $scope.$watch('options', function () {
                    $ngModel.$setViewValue($scope.resource);
                });

                $ngModel.$render = function () {
                    $scope.options = $ngModel.$viewValue;
                };
            }
        }
        return definition;
    }])
