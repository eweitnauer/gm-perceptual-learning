/** js-psych-gm-tutorial.js
 *  David Brokaw
 *
 * 	This plugin runs a single Grasping Math action tutorial.
 *
 * 	The problem consists of:
 * 		A description.
 * 		An expression.
 * 		If the user performs the describes action, they will move on to the next tutorial.
 * 		If the user does the incorrect action, they will have to try again.
 *
 * 	Parameters:
 * 		type: "gm-tutorial"
 * 		problems: an array of objects
 * 			Each object contains:
 * 			- an expression (GM ascii string)
 * 			- the name of the action that should be performed on that expression
 */

(function($) {

	jsPsych['gm-tutorial'] = (function() {

		var plugin = {};

		// // the key is the name of the action,
		// // the value is the description you want to give it
		// var instructions = {
		// 	'commute terms': 'Drag a term in a sum or product to its new location to commute terms.'
		// , 'invert terms across equation': 'In many situations, you can drag a term to the other side of the equation. Try it.'
		// , 'direct factor': 'Drag one variable onto another identical variable to factor.'
		// , 'distribute': 'If a sum in parentheses is multiplied by something, drag the multiplier into the parentheses to distribute.'
		// , 'alt-select': 'To move an entire sum or product, hold the alt-key and then drag any of the terms. Try dragging the sum in the denominator to the other side.'
		// }

		plugin.create = function(params) {
			params = jsPsych.pluginAPI.enforceArray(params, ['problems']);
			plugin.timing_post_trial = params.timing_post_trial || 0;

			var trials = new Array(params.problems.length);
			for (var i=0; i<trials.length; i++) {
				var trial = {};
				trial.type = 'gm-tutorial';
				trial.id = i;

				var prob = params.problems[i];
				trial.expression = prob.expression;
				trial.instructions = prob.instructions;
				trial.correctAnswers = prob.correctAnswers;
				trials[i] = trial;
			}

			return trials;
		};

		plugin.trial = function(display_element, block, trial, part) {
			display_element = d3.select(display_element[0]);

			var expression = trial.expression
			   ,correctAction = trial.correctAction;

			var container = display_element.append('div').attr('id', 'container');
			appendInstructions();
			var eq = appendEqAndMakeGMExpr();
			addEventListeners();

			var lastActionTaken = null
			   ,mouse_is_up = true
			   ,finished = false;

			function appendInstructions() {
				container.append('div')
					.attr('id', 'welcome')
					.append('p')
					.text(trial.instructions);
			}

			function appendEqAndMakeGMExpr() {
				var div = container.append('div').classed('tutorial', true);

	  		var div2 = div.append('div')
	  			.attr('id', 'eq')
	  			.classed('choice', true);

	  		var eq = {dl:DerivationList.createStandalone(div2.node(), {eq: expression})
	  	           ,svg: div2.select('svg')
	  	           ,div: div2}

	  	  div2.append('span').text('correct').style('opacity', 0.00001);

				return eq;
			}

			function addEventListeners() {
				eq.dl.events.on('change', on_change);
				eq.svg.on('mousedown', mouse_down)
				eq.svg.on('mouseup', mouse_up);

			}

			function chainTransition(sel, delay) {
		  	if (sel.node().__transition__ && sel.id && sel.node().__transition__[sel.id]) {
	  			var transition = sel.node().__transition__[sel.id];
	  			console.log('extra delay', transition.delay + transition.duration);
	  			delay += transition.delay + transition.duration;
	  		}
	  		return sel.transition().delay(delay);
		  }

	  	function neutralTransition(sel, delay) {
	  		var ts = chainTransition(sel, delay).duration(500);
	  		ts.select('svg').style('background', '#eee');
		  	ts.select('span').style('opacity', 0.000001);
		  	return ts;
	  	}

	  	function wrongTransition(sel, delay) {
	  		var ts = chainTransition(sel, delay).duration(500);
	  		ts.select('svg').style('background', '#E0A8A8');
		  	ts.select('span').text('try again').style('opacity', 1);
		  	return ts;
	  	}

	  	function correctTransition(sel, delay) {
	  		var ts = chainTransition(sel, delay).duration(500);
	  		ts.select('svg').style('background', '#A8E0B3');
		  	ts.select('span').text('good').style('opacity', 1);
		  	return ts;
	  	}

	  	function problemAnsweredCorrectly() {
	  		correctTransition(eq.div, 100)
	  		  .each('end', function() { setTimeout(finish, 600) });
	  	}

	  	function problemAnsweredIncorrectly() {
			  wrongTransition(eq.div, 100)
			  	.each('end', function() {	setTimeout(retry, 600) });
	  	}

	  	function on_change(event) {
  			if (finished) return;
	  		lastActionTaken = event.action;
  			if (mouse_is_up) checkAnswer(lastActionTaken.name);
	  	}

	  	function mouse_down(event) {
	  		mouse_is_up = false;
		  }

		  function mouse_up(event) {
	  		mouse_is_up = true;
	  		if (!lastActionTaken) return;
	  		if (finished) return;
	  		checkAnswer(lastActionTaken);
		  }

			function checkAnswer(action) {
				finished = true;
				eq.dl.getLastView().interactive(false);
				console.log(mouse_is_up);
				var ans = action.newTree.to_ascii()
				if (trial.correctAnswers.indexOf(ans) !== -1) {
					problemAnsweredCorrectly();
				} else {
					finished = false;
					problemAnsweredIncorrectly();
				}
			}

			function retry() {
				display_element.html('');
				container = display_element.append('div').attr('id', 'container');
				appendInstructions();
				eq = appendEqAndMakeGMExpr();
				addEventListeners();
			}

			function finish() {
				display_element.html('');
				block.next()
			}
		};

		return plugin;
	})();

})(jQuery);
