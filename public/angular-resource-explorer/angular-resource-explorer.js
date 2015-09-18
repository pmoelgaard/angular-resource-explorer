angular

    .module('ngResourceExplorer', [
        'ngResource',
        'ui.grid', 'ui.grid.edit', 'ui.grid.selection'
    ])

    .controller('NgResourceExplorerCtrl', [
        '$log', '$scope', '$resource', '$attrs',
        function ($log, $scope, $resource, $attrs) {
            var ctrl = this;

            $attrs.$observe('dialogProvider', function($dialog) {
                $scope.dialogProvider = $scope.$parent.$eval($dialog);
            })

            $attrs.$observe('translateProvider', function($translate) {
                $scope.translationProvider = $scope.$parent.$eval($translate);
            })

            $scope.activeItem = null;

            $scope.formOptions = {
                fieldDefs: null,
                data: null
            }

            $scope.gridOptions = {
                enableRowSelection: true,
                enableSelectAll: false,
                multiSelect: false,
                columnDefs: null,
                data: null
            }

            $scope.gridOptions.onRegisterApi = function (gridApi) {
                $scope.gridApi = gridApi;

                if (gridApi.edit) {
                    gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                        ctrl.updateItem(rowEntity);
                        $scope.$apply();
                    });
                }

                if (gridApi.selection) {
                    gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                        $scope.activeItem = $scope.activeItem !== row.entity ? row.entity : null;
                    });
                }
            };

            $scope.$watch('url', function () {

                var specificationUrl = $scope.url + '/specification';
                $scope.specificationEndpoint = $resource(specificationUrl);
                $scope.specification = $scope.specificationEndpoint.get();
                $scope.specification.$promise.then(function (specification) {
                    _.each(specification.properties, function (item) {
                        _.set(item, 'enableCellEdit', true)
                    });
                    $scope.gridOptions.columnDefs = specification.properties;
                    $scope.formOptions.fieldDefs = specification.properties;
                });

                var queryUrl = $scope.url;
                $scope.queryEndpoint = $resource(queryUrl);
                $scope.queryContents = $scope.queryEndpoint.query();
                $scope.queryContents.$promise.then(function (items) {
                    $scope.gridOptions.data = items;
                });

                var updateUrl = $scope.url + '/:id';
                $scope.updateEndpoint = $resource(updateUrl, null,
                    {
                        'update': {method: 'PUT'}
                    });
            })

            $scope.$watch('activeItem', function () {
                $scope.formOptions.data = $scope.activeItem;
            })


            this.addItem = function () {

                var activeItem = {};
                Object.defineProperty(activeItem, 'isValid', {
                    get: function () {
                        var isValid = _.every($scope.specification.properties, function (property) {
                            if (!_.has(property, 'required') || !_.get(property, 'required')) {
                                return true;
                            }
                            var value = _.get(this, property.name);
                            var isValid = !_.isUndefined(value) && !_.isNull(value);
                            // do custom validation
                            return isValid;
                        }, this);
                        return isValid;
                    }
                }, activeItem);
                $scope.activeItem = activeItem;
            }

            this.addItemCancel = function () {
                $scope.activeItem = null;
            }

            this.saveItem = function (item) {
                return this.updateItem(item);
            }

            this.updateItem = function (item) {
                var query = {
                    id: _.get(item, $scope.specification.idField)
                }
                $scope.updateEndpoint.update(query, item)
                    .$promise.then(function (updateResult) {
                        console.log(updateResult);
                    });
            }


            this.removeItem = function (item, $event) {

                var confirm = $scope.dialogProvider.confirm()
                    .title($scope.translationProvider.DELETE_CONFIRM_TITLE)
                    .content($scope.translationProvider.DELETE_CONFIRM_CONTENT)
                    .ariaLabel($scope.translationProvider.DELETE_CONFIRM_TITLE)
                    .targetEvent($event)
                    .ok($scope.translationProvider.DELETE_CONFIRM_OK)
                    .cancel($scope.translationProvider.DELETE_CONFIRM_CANCEL);
                $scope.dialogProvider.show(confirm).then(
                    function () {
                        var query = {
                            id: _.get(item, $scope.specification.idField)
                        }
                        $scope.updateEndpoint.remove(query)
                            .$promise.then(function (updateResult) {
                                console.log(updateResult);
                            });
                    }
                )
            }
        }])

    .directive('ngResourceExplorer', ['$rootScope', function ($rootSscope) {
        var definition = {
            restrict: 'AE',
            replace: true,
            require: '^ngModel',
            scope: {
                dialogProvider: '@',
                translateProvider: '@'
            },
            templateUrl: 'angular-resource-explorer/angular-resource-explorer.html',
            controller: 'NgResourceExplorerCtrl',
            controllerAs: 'ctrl',
            link: function ($scope, $element, $attrs, $ngModel) {

                $ngModel.$formatters.push(function (modelValue) {
                    return modelValue;
                });

                $ngModel.$parsers.push(function (viewValue) {
                    return viewValue;
                });

                $scope.$watch('url', function () {
                    $ngModel.$setViewValue($scope.resource);
                });

                $ngModel.$render = function () {
                    $scope.url = $ngModel.$viewValue;
                };
            }
        }
        return definition;
    }])
