/** js-psych-gm-multiple-choice.js
 *  David Brokaw
 *
 *  This plugin runs a single Grasping Math multiple choice problem.
 *  The problem consists of:
 *  	A solution presented at the top.
 *  	4 similar expressions in a list.
 *  	One of the similar expressions is equivalent to the solution if the
 *  	correct transformation is performed on it.
 *  	The user gets one chance.
 *  	If the answer is correct, that expression will be highlighted in green.
 *  	If the answer is incorrect, that expression will be highlighted in red,
 *  	and the correct answer will be highlighted in green.
 *
 * 	Parameters:
 * 		type: "gm-multiple-choice"
 * 		problems: An array of objects.
 * 			Each object contains members:
 * 		  - solution
 * 			- A, B, C, D
 * 		  *These are the ascii or latex representations of valid GM expressions
 * 		timing_post_trial: an array with a single element representing the time
 * 			in milliseconds to delay after a completed problem until the next
 */

(function($) {

	jsPsych['gm-multiple-choice'] = (function() {

		var plugin = {};

		var timeLimit = 1000*60*30;
		var start_time;

		plugin.create = function(params) {
			params = jsPsych.pluginAPI.enforceArray(params, ['problems']);
			plugin.save_trial = params.save_trial;
			plugin.timing_post_trial = params.timing_post_trial || 0;

			var parts = new Array(params.problems.length);
			for (var i=0; i<parts.length; i++) {
				var part = {};
				var prob = params.problems[i];
				part.solution = prob.solution;
				part.A = prob.A;
				part.B = prob.B;
				part.C = prob.C;
				part.task_id = prob.task_id;
				//part.D = prob.D;
				part.number = prob.number;
				part.correctAnswer = prob.correctAnswer;
				part.data = (typeof params.data === 'undefined') ? {} : params.data[i];
				parts[i] = part;
			}

			var trial = {type:'gm-multiple-choice', id:0, parts:parts};
			return [trial];
		};

	  plugin.trial = function(display_element, block, trial, part) {
	  	display_element = part===1 ? d3.select(display_element[0]) : display_element;
	  	if (!start_time) start_time = Date.now();
	  	// { // next button for debugging
	  	// 	display_element.append('button').text('next').on('click', function() {
	  	// 		display_element.html('');
	  	// 		plugin.trial(display_element, block, trial, part+1);
	  	// 	});
	  	// }

	  	display_element.append('p')
	  	  .text("Rearrange the terms of the correct candidate on the left to make it match the target on the right. Do so by dragging one of the terms.")
	  	  .style('font-size', '16px')
	  	  .style('color', '#666')
	  	  .style('font-style', 'italic');

	  	var d = trial.parts[(part-1)%trial.parts.length];
	  	var solution = d.solution;
	  	choices = {
	  			  A: { id: 'A', expr: d.A, dl: null, svg: null }
	  			, B: { id: 'B', expr: d.B, dl: null, svg: null }
	  			, C: { id: 'C', expr: d.C, dl: null, svg: null }
	  			//, D: { id: 'D', expr: d.D, dl: null, svg: null }
	  		  }
	  	correctChoice = choices[d.correctAnswer];

	  	var userChoice
	  	  , userActionCount = 0
	  	  , finished = false;

	  	var partData = {
	  		time_to_action : null
	  	 ,time_to_submit : null
	  	 ,userChoice : null
	  	 ,userAction : null
	  	 ,userResult : null
	  	 ,accuracy : false
	  	 ,correctAction : null
	  	 ,task_id: d.task_id
	  	};

	  	var container = display_element.append('div').attr('id', 'container');

	  	d3.values(choices).forEach(setupChoice);
	  	var sol = appendSolutionAndMakeGMExpr(solution);

	  	addEventListeners();

  		var startTime = Date.now();

	  	function appendSolutionAndMakeGMExpr(expr) {
	  		var div = container.append('div').classed('solution', true);
	  		div.append('span').text('Target');
		  	var sol = DerivationList.createStandalone(div.node(), {eq: expr, interactive: false});
	  		return sol;
	  	}

	  	function setupChoice(choice) {
	  		var choices = container.select('.choices');
	  		if (choices.empty()) choices = container.append('div').classed('choices', true);
		  	var div = choices.append('div')
		  	  .attr('id', 'choice'+choice.id)
		  	  .classed('choice', true);
		  	choice.dl = DerivationList.createStandalone(div.node(),
		  		{eq: choice.expr, selection_color: '#0093FF'});
		  	div.append('span').text('correct').style('opacity', 0.00001);
		  	choice.svg = div.select('svg');
		  	choice.div = div;
		  }

		  function addEventListeners() {
		  	d3.values(choices).forEach(function(choice) {
		  		choice.dl.events.on('change', on_change(choice));
		  		choice.svg.on('mousedown', mouse_down(choice));
		  		//choice.svg.on('mouseup', mouse_up(choice));
		  		choice.dl.events.on('end-of-interaction', function()
		  			{ finish_interaction(userChoice) });
		  	});
		  }

		  function chainTransition(sel, delay) {
		  	if (sel.node().__transition__ && sel.id && sel.node().__transition__[sel.id]) {
	  			var transition = sel.node().__transition__[sel.id];
	  			delay += transition.delay + transition.duration;
	  		}
	  		return sel.transition().delay(delay);
		  }

	  	function wrongTransition(sel, delay) {
	  		var ts = chainTransition(sel, delay).duration(500);
	  		ts.select('svg').style('background', '#E0A8A8');
		  	ts.select('span').text('wrong').style('opacity', 1);
		  	return ts;
	  	}

	  	function correctTransition(sel, delay) {
	  		var ts = chainTransition(sel, delay).duration(500);
	  		ts.select('svg').style('background', '#A8E0B3');
		  	ts.select('span').text('correct').style('opacity', 1);
		  	return ts;
	  	}

	  	function neutralTransition(sel, delay) {
	  		var ts = chainTransition(sel, delay).duration(500);
	  		ts.select('svg').style('background', '#eee');
		  	ts.select('span').style('opacity', 0.000001);
		  	return ts;
	  	}

	  	function problemAnsweredCorrectly(choice) {
	  		partData.accuracy = true;
	  		correctTransition(choice.div, 0)
	  		  .each('end', function() { setTimeout(afterResponse, 1000) });
	  	}

	  	function problemAnsweredIncorrectly(choice) {
			  var correctAction;
			  var ts = wrongTransition(choice.div, 0);
			  ts = neutralTransition(ts, 1500);
	  		ts.each('end', function() {
					if (choice === correctChoice)
	  		 		userChoice.dl.setExpression(d[userChoice.id]);
					correctAction = breadthFirstActionSearch(2);
					ts = correctTransition(correctChoice.div, 500);
					ts = chainTransition(ts, 1000).duration(0);
					ts.each('end', function() {
			   	  doActionForUser(correctAction, function() {
		  	 	  	setTimeout(afterResponse, 2000);
		  	 		});
		  	 	});
	  		});
	  	}

	  	function breadthFirstActionSearch(maxDepth) {
	  		var result;
	  		var correctAnsTree = correctChoice.dl.getLastModel()
	  		   ,solutionAscii = sol.getLastModel().to_ascii()
	  		for (var i=1; i<=maxDepth; i++) {
	  			var startingDepth = 1;
	  			result = findAction(correctAnsTree, solutionAscii, startingDepth, i);
	  			if (result) return result;
	  		}
	  		return false;
	  	}

	  	function doActionForUser(actions, callback) {
	  		if (actions) {
		  		if (actions.length===1) doSingleActionForUser(actions[0], callback);
		  		if (actions.length===2) doTwoActionsForUser(actions, callback);
		  	}
	  		return false;
	  	}

			var findAction = function(tree, targetAscii, currDepth, maxDepth) {
				if (tree.to_ascii()===targetAscii) return [];
				if (currDepth>maxDepth) return false;
				var treeNodes = tree.select_all().slice(1).filter(function(x) {
					return x.is_group('add', 'sub', 'num', 'var', 'mul', 'div');
				});
				var moveActions = [];
				for (var i=0; i<treeNodes.length; i++) {
					moveActions = moveActions.concat(tree.getMoveActions([treeNodes[i]]));
				}
				var actions = [];
				for (var i=0; i<moveActions.length; i++) {
					var action = moveActions[i];
					action.run();
					action.newTree.finishInteraction();
					var res = findAction(action.newTree, targetAscii, currDepth+1, maxDepth, (currDepth+1)%2===0);
					if (res) actions.push([action].concat(res));//return [action].concat(res);
				}
				if (actions.length>0) return getArrayWithShortestLength(actions);
				return false;
			}

			function getArrayWithShortestLength(arr) {
				var best = null;
				var l = Infinity;
				for (var i=arr.length-1; i>=0; i--) {
					if (arr[i].length<l) best = arr[i];
				}
				return best;
			}

			var doSingleActionForUser = function(action, callback) {
				partData.correctAction = [action.name];
				var view = correctChoice.dl.getLastView();
				action.newTree = action.oldTree;
				view.interaction_handler.highlight_nodes(action.nodes || []);
				var doActionTimer = setTimeout(function() {
					view.options.dur = 1000;
					view.options.easing_fn = 'quad-in-out';
					action.doInPlace();
					action.newTree.finishInteraction();
					action.newTree.hide_nodes();
					view.update_all();
					setTimeout(function() {
						view.options.dur = 250;
						view.interaction_handler.highlight_nodes([]);
						setTimeout(callback, 250);
					}, 1000);
				}, 750);
			}

			// animate two actions simultaneously (only update after second action)
			var doTwoActionsForUser = function(actions, callback) {
				partData.correctAction = [actions[0].name, actions[1].name];
				var view = correctChoice.dl.getLastView();
				actions[0].newTree = actions[0].oldTree;
				view.interaction_handler.highlight_nodes(actions[0].nodes || []);
				var doActionTimer = setTimeout(function() {
					view.options.dur = 1000;
					view.options.easing_fn = 'quad-in-out';
					actions[0].doInPlace();
					actions[0].newTree.finishInteraction();
					actions[0].newTree.hide_nodes();
					actions[1].oldTree = actions[0].newTree;
					actions[1].newTree = actions[1].oldTree;
					actions[1].nodes = actions[1].getOldTreeNode(actions[1].nodes);
					actions[1].target = actions[1].getOldTreeNode(actions[1].target);
					actions[1].doInPlace();
					actions[1].newTree.finishInteraction();
					actions[1].newTree.hide_nodes();
					view.update_all();
					setTimeout(function() {
						view.options.dur = 250;
						view.interaction_handler.highlight_nodes([]);
						setTimeout(callback, 250);
					}, 1000);
				}, 750);
			}

			// animate two actions distinctly (update after each action)
			// var doTwoActionsForUser = function(actions, callback) {
			// 	partData.correctAction = [actions[0].name, actions[1].name];
			// 	var view = correctChoice.dl.getLastView();
			// 	actions[0].newTree = actions[0].oldTree;
			// 	view.interaction_handler.highlight_nodes(actions[0].nodes || []);
			// 	var doActionTimer = setTimeout(function() {
			// 		view.options.dur = 1000;
			// 		view.options.easing_fn = 'quad-in-out';
			// 		actions[0].doInPlace();
			// 		actions[0].newTree.hide_nodes();
			// 		view.update_all();
			// 		actions[1].oldTree = actions[0].newTree;
			// 		actions[1].newTree = actions[1].oldTree;
			// 		var nsToHighlight = actions[1].getNewTreeNode(actions[1].nodes);
			// 		view.interaction_handler.highlight_nodes(nsToHighlight || []);
			// 		var doSecondActionTimer = setTimeout(function() {
			// 			view.options.dur = 1000;
			// 			view.options.easing_fn = 'quad-in-out'
			// 			actions[1].doInPlace();
			// 			actions[1].newTree.hide_nodes();
			// 			view.update_all();
			// 			setTimeout(function() {
			// 				view.options.dur = 250;
			// 				view.interaction_handler.highlight_nodes([]);
			// 				setTimeout(callback, 250);
			// 			}, 1000);
			// 		}, 1000);
			// 	}, 750);
			// }

	  	function on_change(choice) {
	  		return function(evt) {
	  			if (finished) return;
		  		userActionCount++;
		  	}
	  	}

		  var afterResponse = function() {
		  	display_element.html('');
		  	var tasks_to_do = 2;
		  	function finish() {
		  		if (--tasks_to_do === 0) {
		  			if (Date.now() - start_time > timeLimit) block.next();
		  			else plugin.trial(display_element, block, trial, part+1);
		  		}
		  	}
		  	setTimeout(finish, plugin.timing_post_trial);
		  	var data = $.extend({}, trial, partData, d);
		  	if (plugin.save_trial) plugin.save_trial(part-1, data, finish);
		  	finish();
		  }

		  function mouse_down(choice) {
		  	return function() {
		  		if (userActionCount) return;
		  		userChoice = choice;
		  		partData.time_to_action = Date.now() - startTime;
		  	}
		  }

		  function finish_interaction(choice) {
	  		if (finished || userActionCount === 0) return;
		  	finished = true;
		  	if (partData.time_to_submit) return;
		  	d3.values(choices).forEach(function(choice) {
	  			choice.dl.getLastView().interactive(false);
	  		});
  			partData.time_to_submit = Date.now() - startTime;
	  		partData.userChoice = choice.id;
	  		partData.userActionCount = userActionCount;
	  		partData.userResult = choice.dl.getLastModel().to_ascii();

	  		checkAnswer(choice);
		  }

		  function checkAnswer(choice) {
		  	var correctAnsAscii = sol.getLastModel().to_ascii();
	  		if (partData.userResult === correctAnsAscii) {
	  			problemAnsweredCorrectly(choice);
	  		} else {
	  			problemAnsweredIncorrectly(choice);
	  		}
		  }
	  };

	  return plugin;
	})();
})(jQuery);
