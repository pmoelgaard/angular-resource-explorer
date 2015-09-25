angular

    .module('ngResourceExplorer', [
        'ngResource',
        'ui.grid', 'ui.grid.edit', 'ui.grid.selection'
    ])

    .controller('NgResourceExplorerCtrl', [
        '$log', '$scope', '$resource', '$attrs',
        function ($log, $scope, $resource, $attrs) {
            var ctrl = this;

            $attrs.$observe('dialogProvider', function ($dialog) {
                $scope.dialogProvider = $scope.$parent.$eval($dialog);
            })

            $attrs.$observe('translateProvider', function ($translate) {
                $scope.translateProvider = $scope.$parent.$eval($translate);
                $scope.translateProvider([
                    'DELETE_CONFIRM_TITLE',
                    'DELETE_CONFIRM_CONTENT',
                    'DELETE_CONFIRM_TITLE',
                    'DELETE_CONFIRM_OK',
                    'DELETE_CONFIRM_CANCEL'
                ]).then(
                    function (texts) {
                        $scope.texts = texts;
                    }
                );
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
                    gridApi.edit.on.afterCellEdit($scope, function (rowEntity) {
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

                $scope.specificationEndpoint = $resource($scope.url + '/schema', null, {
                    'schema': {method: 'POST'}
                });
                $scope.specification = $scope.specificationEndpoint.schema();
                $scope.specification.$promise.then(function (specification) {
                    _.each(specification.properties, function (item) {
                        _.set(item, 'enableCellEdit', !item.readonly);
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

            $scope.$watch('activeItem', function (activeItem) {

                if (activeItem && !activeItem.hasOwnProperty('isValid')) {
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
                }

                $scope.formOptions.data = $scope.activeItem;
            })


            this.addItem = function () {
                var activeItem = {};
                $scope.activeItem = activeItem;
            }

            this.addItemCancel = function () {
                $scope.activeItem = null;
            }

            this.saveItem = function (item) {
                var id = _.get(item, $scope.specification.idField);
                if (id) {
                    this.updateItem(item);
                }
                else {
                    $scope.updateEndpoint.save(item)
                        .$promise.then(
                        function (saveResult) {

                            // we amend our local object, in case we get new properties set from the server (e.g. ID)
                            _.extend(item, saveResult);

                            // we add it to the local collection of items
                            $scope.queryContents.push(item);

                            // then we nullify this which will return to the grid
                            $scope.activeItem = null;
                        },
                        function (err) {
                            $scope.$error = err;
                        });
                }
            }

            this.updateItem = function (item) {
                var id = _.get(item, $scope.specification.idField);
                if (!id) {
                    return $scope.$error = new Error('ID needs to be set when calling update');
                }
                var query = {
                    id: id
                }
                $scope.updateEndpoint.update(query, item)
                    .$promise.then(
                    function () {
                        $scope.activeItem = null;
                    },
                    function (err) {
                        $scope.$error = err;
                    });
            }

            this.removeItem = function (item, $event) {
                var confirm = $scope.dialogProvider.confirm()
                    .title($scope.texts.DELETE_CONFIRM_TITLE)
                    .content($scope.texts.DELETE_CONFIRM_CONTENT)
                    .ariaLabel($scope.texts.DELETE_CONFIRM_TITLE)
                    .targetEvent($event)
                    .ok($scope.texts.DELETE_CONFIRM_OK)
                    .cancel($scope.texts.DELETE_CONFIRM_CANCEL);
                $scope.dialogProvider.show(confirm).then(
                    function () {
                        var query = {
                            id: _.get(item, $scope.specification.idField)
                        }
                        $scope.updateEndpoint.remove(query)
                            .$promise.then(
                            function () {
                                $scope.activeItem = null;
                            },
                            function (err) {
                                $scope.$error = err;
                            }
                        );
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
