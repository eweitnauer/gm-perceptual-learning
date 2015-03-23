GMEventRecorder = function(event_log, svgID) {
	this.event_log = event_log;
	this.dl = null;
	this.other_dl = null; // for live replay
	this.svgID = svgID;
	this.stop_timer = false;
	this.waiting_for_callback = false;
}

GMEventRecorder.prototype.replay = function(delay, callback) {
	var self = this;
	if (!this.event_log) {
		console.warn('set the event log before replaying!');
		return;
	}
	this.stop_timer = false;
	var dl = new DerivationList('#'+this.svgID, this.event_log.options, on_load);
	this.dl = dl;
	var view = dl.getLastView();
	dl.events.on('added_line', function() { view = dl.getLastView(); });

	var evts = this.event_log.events;
	var start = evts[0].time;
	var next_idx = 0;
	var stop_timer = false;

	function on_load() {
		d3.timer(step, delay || 0);
	}

	function step(t) {
		while (evts[next_idx].time - start < t) {
			view.interaction_handler['on_'+evts[next_idx].type](evts[next_idx]);
			next_idx++;
			if (self.stop_timer) {
				console.log('timer stopped')
				return self.stop_timer;
			}
			if (next_idx === evts.length) {
				console.log('callback about to be called', self.event_log.options.eq);
				self.waiting_for_callback = true;
				callback();
				return true;
			}
		}
	}
}

GMEventRecorder.prototype.stop_animation = function() {
	this.stop_timer = true;
}