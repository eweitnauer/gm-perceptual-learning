/** js-psych-gm-solve-eq.js
 *  David Brokaw
 *
 * 	This plugin presents a non-interactible Grasping Math equation and the
 * 	user must enter the value of the variable in the text box.
 *
 * 	Parameters:
 * 		type: "gm-solve-eq"
 * 		problems: a list of objects containing:
 * 		  equation: the ascii or latex representations of a GM equation
 * 		  variable: a string, the variable to be solved for
 * 		  sol: a string, the value of the variable to be solved
 * 		timing_post_trial: an array with a single element representing the time
 * 			in milliseconds to delay after a completed problem until the next
 */

(function($) {

	jsPsych['gm-solve-eq'] = (function() {

		var plugin = {};

		plugin.create = function(params) {
			params = jsPsych.pluginAPI.enforceArray(params, ['problems']);
			plugin.save_trial = params.save_trial;
			plugin.timing_post_trial = params.timing_post_trial;

			var trials = new Array(params.problems.length);
			for (var i=0; i<trials.length; i++) {
				trials[i] = {};
				trials[i].type = 'gm-solve-eq';
				trials[i].id = i;

				var prob = params.problems[i];
				trials[i].eq = prob.eq;
				trials[i].var = prob.var;
				trials[i].sol = prob.sol;
				trials[i].stage = params.stage;

				trials[i].data = (typeof params.data === 'undefined') ? {} : params.data[i];
			}
			return trials;
		};

		plugin.trial = function(display_element, block, trial, part) {
			display_element = d3.select(display_element[0]);
			var equation = trial.eq
			   ,variable = trial.var
			   ,sol = trial.sol
			   ,x_is_left = trial.sol[0] === 'x';

			var trialData = {
			  time_to_action : null
			 ,time_to_submit : null
			 ,userInput : null
			 ,accuracy : false
			};

			var container = display_element.append('div').attr('id', 'container');
			var eq = appendEqAndMakeGMExpr();
			appendSubmissionBoxAndButton();
			addEventListeners();

			var startTime = Date.now();

			function appendEqAndMakeGMExpr() {
				var div = container.append('div').classed('labeled-box', true);
	  		div.append('span').classed('mylabel', true).text('Equation');

				return DerivationList.createStandalone(div.node(), {eq: equation, interactive:false});
			}

			function appendSubmissionBoxAndButton() {
				var div = container.append('div').classed('labeled-box', true)
				  .classed('response', true);
				function append_submit_button() {
					div.append('span').classed('input-group-btn', true)
					   .append('button').attr('id', 'submitButton').text('Submit')
					   .classed('btn btn-default', true);
				}
				div.append('span').classed('mylabel', true).text('Your Solution');
				var idiv = div.append('div').classed('inner', true);
				if (x_is_left) {
					idiv.append('span').text(variable).classed('x', true);
					idiv.append('span').text(' = ').classed('eqls', true);
				}
				div = idiv.append('div').classed('input-group-outer', true)
				         .append('div').classed('input-group', true);
				if (!x_is_left) append_submit_button();
				var input_el = div.append('input')
				  .attr({type: 'text', id: 'userSolution', name: 'solution'})
				  .classed('form-control', true)
				  .attr('autofocus', 'autofocus')
				  .on('keyup', function() {
				  	if (d3.event.keyCode === 13) submit();
				  })
				  .style('text-align', x_is_left ? 'left' : 'right');
				if (x_is_left) append_submit_button();
				if (!x_is_left) {
					idiv.append('span').text(' = ').classed('eqls', true);
					idiv.append('span').text(variable).classed('x', true);
				}
				input_el.node().focus();
			}

			function isCorrectSolution(a, b) {
				if (!a || !b) return false;
				if (a === b) return true;
				function normalize(x) {
					return x.toLowerCase().replace(/\s/g, '').replace(/\*([^0-9])/g, '$1');
				}
				if (normalize(a) === normalize(b)) return true;
				return false;
			}

			function submit() {
				trialData.time_to_submit = Date.now() - startTime;
				var uinput = document.getElementById('userSolution').value;
				trialData.userInput = x_is_left ? 'x='+uinput : uinput+'=x';
				trialData.accuracy = isCorrectSolution(trialData.userInput, sol);
				display_element.html('');

			  var tasks_to_do = 2;
		  	function finish() {
		  		if (--tasks_to_do === 0) block.next();
		  	}
		  	setTimeout(finish, plugin.timing_post_trial);
		  	var data = $.extend({}, trial, trialData);
		  	if (plugin.save_trial) plugin.save_trial(block.trial_idx, data, finish);
		  	else finish();
			}

			function addEventListeners() {
				d3.select('input[name="solution"]').on('keydown', function() {
					if (!trialData.time_to_action) {
						trialData.time_to_action = Date.now() - startTime;
					}
				});
				d3.select('#submitButton').on('click', submit);
			}
		};
		return plugin;
	})();
})(jQuery);
