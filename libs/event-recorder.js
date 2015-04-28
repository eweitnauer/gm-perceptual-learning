GMEventRecorder = function(event_log, svg) {
	this.event_log = event_log;
	this.dl = null;
	this.other_dl = null; // for live replay
	this.svg = d3.select(svg);
	this.container = this.getSVGContainer(this.svg.node());
	this.stop_timer = false;
}

GMEventRecorder.prototype.getSVGContainer = function(svg) {
	while (svg.tagName.toLowerCase() !== 'svg') svg = svg.parentNode;
	return d3.select(svg.parentNode);
}

GMEventRecorder.prototype.showPreview = function() {
	var temp_options = gmath.extend({}, this.event_log.options);
	temp_options.interctive = false;
	if (this.dl) { this.dl.remove() }
	this.dl = new DerivationList(this.svg.node(), temp_options);
}

GMEventRecorder.prototype.replay = function(delay, callback) {
	var self = this;
	if (!this.event_log) {
		console.warn('set the event log before replaying!');
		return;
	}
	this.stop_timer = false;
	if (this.dl) { this.dl.remove() }
	this.dl = new DerivationList(this.svg.node(), this.event_log.options, on_load)
	var view = this.dl.getLastView();
	this.dl.events.on('added_line', function() { view = self.dl.getLastView(); });

	var evts = this.event_log.events;
	var start = evts[0].time;
	var next_idx = 0;

	function on_load() {
		d3.timer(step, delay || 0);
	}

	function step(t) {
		if (self.stop_timer) return true;
		while (evts[next_idx].time - start < t) {
			var evt = evts[next_idx];
			view.interaction_handler['on_'+evt.type](evt);
			if (evt.type === 'keyup') self.updateKey(evt.keyCode, false);
			if (evt.type === 'keydown') self.updateKey(evt.keyCode, true);
			next_idx++;
			if (next_idx === evts.length) {
				callback();
				return true;
			}
		}
	}
}

// TODO: generalize to show several keys at once!
GMEventRecorder.prototype.updateKey = function(keyCode, visible) {
	console.log(keyCode);
	var el = this.container.select('#key'+keyCode);

	if (el.size() === 0) {
		el = this.container.append('span')
		  .attr('id', 'key'+keyCode)
		  .classed('key-vis', true)
		  .style('opacity', 1e-5)
		  .style({ position: 'absolute'
  					 , bottom: '5px'
						 , right: '10px'
						 , padding: '1px 7px'
						 , border: '2px solid steelblue'
						 , 'border-radius': '10px'
						 , color: 'steelblue'
						 , background: 'white'})
		  .text({32: 'space'}[keyCode] || '');
	}

	if (visible) el.style('opacity', 1);
	else el.transition().duration(750).style('opacity', 1e-5);
}

GMEventRecorder.prototype.stop_animation = function() {
	this.stop_timer = true;
}

GMEventRecorder.prototype.createAndRecordDL = function(svg, options) {
	this.event_log = { options: options, events: [] };
	var dl = new DerivationList(svg, options);
	this.dl = dl;
	var view = dl.getLastView();
	var log = this.log.bind(this);
	this.registerListeners(view, log);
	var self = this;
	dl.events.on('added_line', function() {
		if (dl.getLastView() === view) return;
		// we would ideally unregister the event listeners from the old line,
		// but the last "release" or "tap" event might be triggered after the
		// added_line event, so we don't run
		//registerListeners(view, null);
		view = dl.getLastView();
		self.registerListeners(view, log);
	});
}

GMEventRecorder.prototype.liveReplay = function(svg, options) {
	this.other_dl = new DerivationList(svg, options);
}

GMEventRecorder.prototype.log = function(evt) {
	this.event_log.events.push(evt);
	if (this.other_dl) {
		this.other_dl.getLastView().interaction_handler['on_'+evt.type](evt);
	}
}

GMEventRecorder.prototype.registerListeners = function(view, fn) {
	view.interaction_handler.events
	  .on('touch', fn)
	  .on('release', fn)
	  .on('drag_start', fn)
	  .on('drag', fn)
	  .on('drag_end', fn)
	  .on('tap', fn)
	  .on('keydown', fn)
	  .on('keyup', fn);
}
