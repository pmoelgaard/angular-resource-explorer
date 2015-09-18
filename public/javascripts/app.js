angular

    .module('NxNgResourceExplorerDemo', [
        'ngResource', 'ngMaterial',
        'ngResourceExplorer'
    ])

    .controller('AppCtrl', [
        '$scope', '$http', '$mdDialog',
        function ($scope, $http, $dialogProvider) {

            $http.defaults.headers.common['Authorization'] = '1e69ac19-0636-4774-82c3-8f770b89be16';

            var demoUrl = '//localhost:8000/api/alarms';
            $scope.demoUrl = demoUrl;

            $scope.$dialog = $dialogProvider;
            $scope.$translate = {
                DELETE_CONFIRM_TITLE: 'Confirm Delete',
                DELETE_CONFIRM_CONTENT: 'Are you sure you wish to delete, the information will be deleted permanently',
                DELETE_CONFIRM_OK: 'Yes, please delete',
                DELETE_CONFIRM_CANCEL: 'NO, please cancel'
            }
        }
    ])