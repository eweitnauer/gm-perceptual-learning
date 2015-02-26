(function($) {
    jsPsych['call-function'] = (function() {

        var plugin = {};

        plugin.create = function(params) {
            return [{ type: 'call-function', fn: params.fn }];
        };

        plugin.trial = function(display_element, block, trial, part) {
            trial.fn();
            block.next();
        };

        return plugin;
    })();
})(jQuery);
