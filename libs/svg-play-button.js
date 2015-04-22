SVGPlayButton = function() {
	var dispatch = d3.dispatch("click");

	var container    // svg element to place the play button on
	  , dims         // calculated dimensions of the container
	  , g, gg        // top-level content element
	  , overlay_rect // the rectangle on top to shade on mouseover
	  , hidden = false; // is the button visible or not?

	var play = function(sel) {
		container = sel;
		play.init();
		return play;
	}

	play.hidden = function(arg) {
		if (arguments.length === 0) return hidden;
		hidden = arg;
		if (gg) gg.style('display', hidden ? 'none' : null);
		if (overlay_rect) overlay_rect.attr('opacity', 0);
		return this;
	}

	play.remove = function() {
		g.remove();
	}

	play.init = function() {
		dims = container.node().getBoundingClientRect();
		g = container.append('svg')
			.attr('id', 'button')
			.attr('width', '100%')
			.attr('height', '100%')
			.attr('cursor', 'pointer');

		gg = g.append('g')
		  .style('display', hidden ? 'none' : null)
			.attr('transform', 'translate('+[dims.width/2, dims.height/2]+')');

		gg.append('rect')
 			.attr({ x: -dims.width/2, y: -dims.height/2
 				    , width: dims.width, height: dims.height})
 			.attr({fill: 'black', opacity: 0.1});
 		gg.append('circle')
 		  .attr({r: '35px' })
 		  .attr({fill: '#666', stroke: 'white', 'stroke-width': '4px'
 		  	    ,'fill-opacity': 0.6});
 		gg.append('circle')
 		  .attr({r: '37px' })
 		  .attr({fill: 'none', stroke: 'silver', 'stroke-width': 1.5});
 		gg.append('path')
 		  .attr('d', 'M0,0 L0,1 L0.8,0.5 Z')
 		  .attr('transform', 'scale(40)translate(-0.3,-0.5)')
 		  .attr('fill', 'white');
 		overlay_rect = g.append('rect')
 			.classed('overlay', true)
 			.attr({ width: dims.width, height: dims.height })
 			.attr({fill: 'black', opacity: 0})
 			.attr('pointer-events', 'all')
			.on('mouseover', function() { overlay_rect.attr('opacity', hidden ? 0 : 0.1) })
			.on('mouseout', function() { overlay_rect.attr('opacity', 0) })
			.on('click', function() { if (!hidden) dispatch.click() });
 	}

	return d3.rebind(play, dispatch, "on");
}
