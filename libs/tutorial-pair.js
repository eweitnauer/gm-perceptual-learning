/// Displays an animated and a do-it-yourself GM view next to
/// each other. Will dispatch "done" and "error" events.
/// If you don't set setting.eq, there will be no DIY section.
GMTutorialPair = function(container, settings) {
	this.events = d3.dispatch('done', 'retry');
	this.gestureData = settings.gestureData;
	if (this.gestureData) this.gestureData.options.show_bg = false;
	this.eq = settings.eq;
	this.correctAnswers = settings.correctAnswers;
	this.title = settings.title;
	this.text = settings.text;
	this.startWiggle = settings.startWiggle;
	this.container = d3.select(container);
	this.dl_div = null;
	this.dl = null;
	this.play_btn = SVGPlayButton();
	this.player = null;
	this.allow_restart_after_done = true;
	if ('allow_restart_after_done' in settings)
		this.allow_restart_after_done = settings.allow_restart_after_done;
	this.init();
}

GMTutorialPair.prototype.replay = function() {
	this.play_btn.hidden(true);
	var self = this;
	self.player.replay(500, function() {
		setTimeout(function() {
			self.play_btn.hidden(false);
			self.dl_div.select('span').text("Try it!").style('opacity', 1).classed('light', true);
			if (self.startWiggle) self.dl.startWiggle(self.startWiggle);
			self.dl_div.on('mousedown', function() {
				self.dl_div.select('span').style('opacity', 0.00001).classed('light', false);;
				self.dl_div.on('mousedown',null);
			});
		}, 1000);
	});
}

GMTutorialPair.prototype.init = function() {
	this.container.append('h2').text(this.title);
	this.container.append('p')
		.attr('class', 'tutorial-instructions')
		.text(this.text);

	var div = this.container.append('div').classed('tutorial', true);

	var svg = div.append('div')
		.attr('id', 'ex')
		.classed('choice', true)
		.append('svg')
		.classed('animation', true);

	this.gestureData.options.pos = ['auto', 'auto'];
	this.gestureData.options.draggable = false;
	this.player = new GMEventRecorder(this.gestureData, svg.append('g').node());
	this.player.showPreview();

	svg.call(this.play_btn.on('click', this.replay.bind(this)));

	if (this.eq) {
		this.dl_div = div.append('div')
		  .classed('choice', true);

		var options = gmath.deepCopy(this.gestureData.options);
		options.inactive_color = gmath.AlgebraView.defaultOptions.inactive_color;
		options.color = gmath.AlgebraView.defaultOptions.color;

		this.dl = new DerivationList(this.dl_div.append('svg').attr({width: '100%', height: '100%'}).node(), options);
		this.dl.events.on('end-of-interaction', this.checkAnswer.bind(this));

		var self = this;
		this.dl_div.append('span').text('correct').style('opacity', 0.00001)
		  .classed('label', true)
		  .on('click', function() {
		  	if (self.allow_restart_after_done) self.retry();
		  });
	}
}

GMTutorialPair.prototype.chainTransition = function(sel, delay) {
	if (sel.node().__transition__ && sel.id && sel.node().__transition__[sel.id]) {
		var transition = sel.node().__transition__[sel.id];
		console.log('extra delay', transition.delay + transition.duration);
		delay += transition.delay + transition.duration;
	}
	return sel.transition().delay(delay);
}

GMTutorialPair.prototype.neutralTransition = function(sel, delay) {
	var ts = this.chainTransition(sel, delay).duration(500);
	ts.select('svg').style('background', '#eee');
	ts.select('span').style('opacity', 0.000001);
	return ts;
}

GMTutorialPair.prototype.wrongTransition = function(sel, delay) {
	var ts = this.chainTransition(sel, delay).duration(500);
	ts.select('svg').style('background', '#E0A8A8');
	ts.select('span').text('try again').style('opacity', 1);
	return ts;
}

GMTutorialPair.prototype.correctTransition = function(sel, delay) {
	var ts = this.chainTransition(sel, delay).duration(500);
	ts.select('svg').style('background', '#A8E0B3');
	ts.select('span').text('good').style('opacity', 1);
	return ts;
}

GMTutorialPair.prototype.checkAnswer = function() {
	this.dl.getLastView().interactive(false);
	var ans = this.dl.getLastModel().to_ascii()
	if (this.eq === this.dl.getLastModel().to_ascii()) { // Still in initial state.
 			this.dl.getLastView().interactive(true);
 	} else if (this.correctAnswers.indexOf(ans) !== -1) {
 		this.dl_div.select('span').text('good');
		this.correctTransition(this.dl_div, 200)
		  .each('end', this.events.done);
	} else {
		this.wrongTransition(this.dl_div, 200)
		  .transition()
		  .duration(500)
		  .each('end', this.retry.bind(this));
	}
}

GMTutorialPair.prototype.retry = function() {
	var self = this;
	this.neutralTransition(this.dl_div, 0)
		.each('end', function() {
			self.dl.getLastView().interactive(true);
			self.dl.setExpression(self.eq);
			self.events.retry();
		});
}

GMTutorialPair.prototype.stop = function() {
	this.player.stop_animation();
}

gmath.GMTutorialPair = GMTutorialPair;
