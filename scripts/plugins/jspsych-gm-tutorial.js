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
			plugin.progress_fn = params.progress_fn;

			var trials = new Array(params.pages.length);
			for (var i=0; i<trials.length; i++) {
				var trial = {};
				trial.type = 'gm-tutorial';
				trial.id = i;

				var page = params.pages[i];
				trial.title = page.title;
				trial.tasks = page.tasks;
				trials[i] = trial;
			}

			return trials;
		};

		plugin.trial = function(display_element, block, trial, part) {
			display_element = d3.select(display_element[0]);

			var container = display_element.append('div').attr('id', 'container');
			container.append('h2').text(trial.title);

			var task_count = trial.tasks.length
			  , eqs = []
			  , expressions = []
			  , players = []
			  , finished = 0;

			trial.tasks.forEach(function(task, i) {
				expressions.push(task.expression);
				appendInstructions(task.instructions);
				var eq = appendEqAndMakeGMExpr(i, task.expression, task.gestureTutorialData);
				eqs.push(eq);
				eq.dl.events.on('end-of-interaction', checkAnswer.bind(this, eq, i));
			});

			function appendInstructions(text) {
				container.append('div')
					.attr('id', 'tutorial-instructions')
					.append('p')
					.text(text);
			}

			function appendEqAndMakeGMExpr(i, expr, gestureData) {
				var div = container.append('div').classed('tutorial', true);

				var animationSVGID = 'animation'+i;

	  	 	var div3 = div.append('div')
	  	  	.attr('id', 'ex')
	  	  	.classed('choice', true);

	  	  div3.append('svg')
	  	  	.classed('animation', true)
	  	  	.attr('id', animationSVGID);

	  	  if (gestureData) {
	  	  	var player = new GMEventRecorder(gestureData, animationSVGID);
		  	  overlayReplayButton(player);
		  	  players.push(player);
	  	  }

	  		var div2 = div.append('div')
	  			.attr('id', 'eq')
	  			.classed('choice', true);

	  		var eq = {dl:DerivationList.createStandalone(div2.node(), {eq: expr})
	  	           ,svg: div2.select('svg')
	  	           ,div: div2}

	  	  div2.append('span').text('correct').style('opacity', 0.00001);

				return eq;
			}

			function overlayReplayButton(player) {
				var replaySVG = d3.select('#'+player.svgID);

				player.showPreview();

				var buttonSVG = replaySVG.append('svg')
					.attr('id', 'button')
					.attr('width', '100%')
					.attr('height', '100%')
					.attr('cursor', 'pointer')
					.style('opacity', 0.5);

				var button = buttonSVG.append('image')
					.attr('x', '220px')
					.attr('y', '18px')
					.attr('width', '75px')
					.attr('height', '75px')
					.attr('xlink:href', 'libs/play-circled-64-000000.png');

				buttonSVG.on('click', function() {
					buttonSVG.remove();
					setTimeout(function() {
						replay(player);
					}, 10);
				});
			}

			function replay(player) {
				if (player.dl) {
					player.dl.remove();
					player.dl = null;
				}
				player.replay(2000, function() {
					setTimeout(function() {
						player.dl.remove();
						player.dl = null;
						overlayReplayButton(player);
						player.waiting_for_callback = false;
						finish();
					}, 5000);
				});
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

	  	function problemAnsweredCorrectly(eq, i) {
	  		finished++;
	  		correctTransition(eq.div, 200)
	  		  .each('end', function() { setTimeout(finish.bind(this, eq, i), 1000) });
	  	}

	  	function problemAnsweredIncorrectly(eq, i) {
			  wrongTransition(eq.div, 200)
			  	.each('end', function() {	setTimeout(retry.bind(this, eq, i), 1000) });
	  	}

			function checkAnswer(eq, i) {
				eq.dl.getLastView().interactive(false);
				var ans = eq.dl.getLastModel().to_ascii()
				if (trial.tasks[i].correctAnswers.indexOf(ans) !== -1) {
					problemAnsweredCorrectly(eq, i);
				} else {
					problemAnsweredIncorrectly(eq, i);
				}
			}

			function retry(eq, i) {
				neutralTransition(eq.div, 0)
				  .each('end', function() {
						eq.dl.setExpression(expressions[i]);
						eq.dl.getLastView().interactive(true);
					});
				// display_element.html('');
				// container = display_element.append('div').attr('id', 'container');
				// appendInstructions();
				// eq = appendEqAndMakeGMExpr();
				// addEventListeners();
			}

			function finish(eq, i) {
				if (finished < task_count) return;
				if (players.some(function(player){return player.waiting_for_callback})) return;
				finished = 0;
				players.forEach(function(player) {
					if (player.dl) {
						player.stop_animation();
						player.dl.remove()
					}
				});
				display_element.html('');
				if (plugin.progress_fn) plugin.progress_fn((trial.id+1)/block.trials.length);
				block.next()
			}
		};

		return plugin;
	})();

})(jQuery);
