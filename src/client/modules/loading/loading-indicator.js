// jshint -W098
'use strict';

module.exports = LoadingIndicator;

// @ngInject
function LoadingIndicator($modal, loadingConfig, $log) {
    var modalInstance;

    this.show = function(size) {
        if (modalInstance) { return; }

        $log.debug('showing loading indicator...');
        modalInstance = $modal.open({
            animation: true,
            templateUrl: loadingConfig.dialogTemplateUrl,
            controller: loadingConfig.dialogController,
            size: size || loadingConfig.dialogSize,
        });
    };

    this.hide = function() {
        if (!modalInstance) { return; }
        $log.debug('hiding loading indicator.');
        modalInstance.dismiss('complete');
        modalInstance = null;
    };
}

