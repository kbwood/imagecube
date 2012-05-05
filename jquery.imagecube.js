/* http://keith-wood.name/imageCube.html
   Image Cube for jQuery v1.0.1.
   Written by Keith Wood (kbwood@virginbroadband.com.au) June 2008.
   Dual licensed under the GPL (http://dev.jquery.com/browser/trunk/jquery/GPL-LICENSE.txt) and 
   MIT (http://dev.jquery.com/browser/trunk/jquery/MIT-LICENSE.txt) licenses. 
   Please attribute the author if you use it. */

/* Rotate images (or other things) as if on the faces of a cube.
   $('div selector').imagecube();
   Or with options like:
   $('div selector').imagecube({direction: 'left', speed: 1000});
*/

(function($) { // Hide scope, no $ conflict

/* Image cube manager. */
function ImageCube() {
	this._defaults = {
		direction: 'random', // Direction of rotation: random|up|down|left|right
		randomSelection: ['up', 'down', 'left', 'right'], // If direction is random, select one of these
		speed: 2000, // Time taken (milliseconds) to transition
		easing: 'linear', // Name of the easing to use during transitions
		noShading: false, // True to not add shading effects
		imagePath: '', // Any extra path to locate the highlight/shadow images
		repeat: true, // True to automatically trigger a new transition after a pause
		pause: 2000, // Time (milliseconds) between transitions
		opacity: [0.0, 0.8], // Minimum/maximum opacity (0.0 - 1.0) for highlights and shadows
		lineHeight: [0.0, 1.25], // Hidden and normal line height (em) for text
		letterSpacing: [-0.4, 0.0] // Hidden and normal letter spacing (em) for text
	};
};

var UP = 0;
var DOWN = 1;
var LEFT = 2;
var RIGHT = 3;

var PROP_NAME = 'imageCube';

$.extend(ImageCube.prototype, {
	/* Class name added to elements to indicate already configured with image cube. */
	markerClassName: 'hasImageCube',

	/* Override the default settings for all image cube instances.
	   @param  options  object - the new settings to use as defaults */
	setDefaults: function(options) {
		extendRemove(this._defaults, options || {});
	},

	/* Attach the image cube functionality to a div.
	   @param  target   element - the containing division
	   @param  options  object - the settings for this image cube instance (optional) */
	_attachImageCube: function(target, options) {
		target = $(target);
		if (target.is('.' + this.markerClassName)) {
			return;
		}
		target.addClass(this.markerClassName);
		var allOptions = $.extend({}, this._defaults, options || {});
		$.data(target[0], PROP_NAME, allOptions);
		target.children().each(function() {
			var child = $(this);
			$.data(this, PROP_NAME,
				{width: child.css('width'), height: child.css('height'),
				position: child.css('position'), lineHeight: child.css('lineHeight'),
				letterSpacing: child.css('letterSpacing')});
			child.css({width: target.css('width'), height: target.css('height'),
				position: 'absolute', lineHeight: allOptions.lineHeight[1],
				letterSpacing: allOptions.letterSpacing[1]});
		}).not(':first').hide();
		this._prepareRotation(target[0]);
	},

	/* Note current visible child and schedule a repeat rotation (if required).
	   @param  target  element - the containing division */
	_prepareRotation: function(target) {
		target = $(target);
		var options = $.data(target[0], PROP_NAME);
		options.current = target.children(':visible')[0];
		if (options.repeat && !options._timer) {
			if (!target[0].id) {
				target[0].id = 'ic' + new Date().getTime();
			}
			options._timer = setTimeout('jQuery.imagecube._rotateImageCube("#' +
				target[0].id + '")', options.pause);
		}
		$.data(target[0], PROP_NAME, options);
	},

	/* Rotate the image cube to the next face.
	   @param  target    element - the containing division
	   @param  callback  function - a function to call when finished with the rotation (optional) */
	_rotateImageCube: function(target, callback) {
		target = $(target);
		this._stopImageCube(target[0], true);
		var options = $.data(target[0], PROP_NAME);
		var animTo = {};
		animTo[PROP_NAME] = 1.0;
		target.attr(PROP_NAME, 0.0).animate(animTo, options.speed, options.easing, callback);
	},

	/* Retrieve the currently visible child of an image cube div.
	   @param  target  element - the containing division
	   @return  element - the currently displayed child of target division */
	_currentImageCube: function(target) {
		return $.data(target, PROP_NAME).current;
	},

	/* Stop the image cube automatically rotating to the next face.
	   @param  target     element - the containing division
	   @param  timerOnly  boolean - true if only temporarily stopping (optional) */
	_stopImageCube: function(target, timerOnly) {
		var options = $.data(target, PROP_NAME);
		if (options._timer) {
			clearTimeout(options._timer);
			options._timer = null;
		}
		if (!timerOnly) {
			options.repeat = false;
		}
		$.data(target, PROP_NAME, options);
	},

	/* Start the image cube automatically rotating to the next face.
	   @param  target  element - the containing division */
	_startImageCube: function(target) {
		this._changeImageCube(target, {repeat: true});
	},

	/* Reconfigure the settings for an image cube div.
	   @param  target   element - the containing division
	   @param  options  object - the new settings for this image cube instance */
	_changeImageCube: function(target, options) {
		var curOptions = $.data(target, PROP_NAME);
		extendRemove(curOptions || {}, options || {});
		$.data(target, PROP_NAME, curOptions);
		this._prepareRotation(target);
	},

	/* Remove the image cube functionality from a div.
	   @param  target  element - the containing division */
	_destroyImageCube: function(target) {
		this._stopImageCube(target);
		target = $(target);
		if (!target.is('.' + this.markerClassName)) {
			return;
		}
		target.stop().removeClass(this.markerClassName).
			children('.imageCubeShading').remove();
		target.children().each(function() {
			$(this).css($.data(this, PROP_NAME)).show();
			$.removeData(this, PROP_NAME);
		});
		$.removeData(target[0], PROP_NAME);
	},

	/* Prepare the image cube for animation.
	   @param  target  element - the containing division */
	_prepareImageCube: function(target) {
		var options = $.data(target, PROP_NAME);
		var target = $(target);
		var isFixed = false;
		var pFrom = target.children(':visible');
		var pTo = pFrom.next();
		pTo = (pTo.length ? pTo : target.children(':first')); // Cycle around if at the end
		var offset = target.offset();
		target.parents().each(function() { // Check if this area is fixed
			var $this = $(this);
			if ($this.css('position') == 'fixed') {
				offset.left -= $this.offset().left;
				offset.top -= $this.offset().top;
				return false;
			}
		});
		var dims = {width: target.width(), height: target.height()};
		var direction = (options.direction != 'random' ? options.direction :
			options.randomSelection[Math.floor(Math.random() * options.randomSelection.length)]);
		direction = Math.max(0, $.inArray(direction, ['up', 'down', 'left', 'right']));
		var upDown = (direction == UP || direction == DOWN);
		var leftRight = (direction == LEFT || direction == RIGHT);
		var upLeft = (direction == UP || direction == LEFT);
		var firstOpacity = (upLeft ? options.opacity[0] : options.opacity[1]);
		// Calculate borders and padding for both elements
		var border = [];
		var parseBorders = function(p) {
			var b = [];
			for (var i = 0; i < 4; i++) {
				b[i] = p.css('border' + ['Left', 'Right', 'Top', 'Bottom'][i] + 'Width');
				var value = parseFloat(b[i]);
				b[i] = (!isNaN(value) ? value :
					Math.max(0, $.inArray(b[i], ['thin', 'medium', 'thick']) * 2 + 1));
			}
			return b;
		};
		border[0] = parseBorders(pFrom);
		border[1] = parseBorders(pTo);
		var pad = [];
		pad[0] = [parseFloat(pFrom.css('padding-left')), parseFloat(pFrom.css('padding-right')),
			parseFloat(pFrom.css('padding-top')), parseFloat(pFrom.css('padding-bottom'))];
		pad[1] = [parseFloat(pTo.css('padding-left')), parseFloat(pTo.css('padding-right')),
			parseFloat(pTo.css('padding-top')), parseFloat(pTo.css('padding-bottom'))];
		var extras = [];
		extras[0] = [($.boxModel ? border[0][0] + border[0][1] + pad[0][0] + pad[0][1] : 0),
			($.boxModel ? border[0][2] + border[0][3] + pad[0][2] + pad[0][3] : 0)];
		extras[1] = [($.boxModel ? border[1][0] + border[1][1] + pad[1][0] + pad[1][1] : 0),
			($.boxModel ? border[1][2] + border[1][3] + pad[1][2] + pad[1][3] : 0)];
		// Define the property ranges per element
		var stepProps = [];
		stepProps[0] = {elem: pFrom, // Currently displayed element
			left: {start: offset.left,
				end: offset.left + (direction == RIGHT ? dims.width : 0), units: 'px'},
			width: {start: dims.width - extras[0][0],
				end: (upDown ? dims.width - extras[0][0] : 0), units: 'px'},
			top: {start: offset.top,
				end: offset.top + (direction == DOWN ? dims.height : 0), units: 'px'},
			height: {start: dims.height - extras[0][1],
				end: (upDown ? 0 : dims.height - extras[0][1]), units: 'px'},
			paddingLeft: {start: pad[0][0], end: (leftRight ? 0 : pad[0][0]), units: 'px'},
			paddingRight: {start: pad[0][1], end: (leftRight ? 0 : pad[0][1]), units: 'px'},
			paddingTop: {start: pad[0][2], end: (upDown ? 0 : pad[0][2]), units: 'px'},
			paddingBottom: {start: pad[0][3], end: (upDown ? 0 : pad[0][3]), units: 'px'},
			borderLeftWidth: {start: border[0][0], end: (leftRight ? 0 : border[0][0]), units: 'px'},
			borderRightWidth: {start: border[0][1], end: (leftRight ? 0 : border[0][1]), units: 'px'},
			borderTopWidth: {start: border[0][2], end: (upDown ? 0 : border[0][2]), units: 'px'},
			borderBottomWidth: {start: border[0][3], end: (upDown ? 0 : border[0][3]), units: 'px'},
			lineHeight: {start: options.lineHeight[1],
				end: (upDown ? options.lineHeight[0] : options.lineHeight[1]), units: 'em'},
			letterSpacing: {start: options.letterSpacing[1],
				end: (upDown ? options.letterSpacing[1] : options.letterSpacing[0]), units: 'em'}};
		stepProps[1] = {elem: pTo, // New element to be displayed
			left: {start: offset.left + (direction == LEFT ? dims.width : 0),
				end: offset.left, units: 'px'},
			width: {start: (upDown ? dims.width - extras[1][0] : 0),
				end: dims.width - extras[1][0], units: 'px'},
			top: {start: offset.top + (direction == UP ? dims.height : 0),
				end: offset.top, units: 'px'},
			height: {start: (upDown ? ($.browser.msie ? 1 : 0) : dims.height - extras[1][1]),
				end : dims.height - extras[1][1], units: 'px'},
			paddingLeft: {start: (leftRight ? 0 : pad[1][0]), end: pad[1][0], units: 'px'},
			paddingRight: {start: (leftRight ? 0 : pad[1][1]), end: pad[1][1], units: 'px'},
			paddingTop: {start: (upDown ? 0 : pad[1][2]), end: pad[1][2], units: 'px'},
			paddingBottom: {start: (upDown ? 0 : pad[1][3]), end: pad[1][3], units: 'px'},
			borderLeftWidth: {start: (leftRight ? 0 : border[1][0]), end: border[1][0], units: 'px'},
			borderRightWidth: {start: (leftRight ? 0 : border[1][1]), end: border[1][1], units: 'px'},
			borderTopWidth: {start: (upDown ? 0 : border[1][2]), end: border[1][2], units: 'px'},
			borderBottomWidth: {start: (upDown ? 0 : border[1][3]), end: border[1][3], units: 'px'},
			lineHeight: {start: (upDown ? options.lineHeight[0] : options.lineHeight[1]),
				end: options.lineHeight[1], units: 'em'},
			letterSpacing: {start: (upDown ? options.letterSpacing[1] : options.letterSpacing[0]),
				end: options.letterSpacing[1], units: 'em'}};
		if (!options.noShading) {
			var setHighLow = function(props, startOpacity, endOpacity) {
				return {elem: null,
					left: {start: props.left.start, end: props.left.end, units: 'px'},
					width: {start: props.width.start, end: props.width.end, units: 'px'},
					top: {start: props.top.start, end: props.top.end, units: 'px'},
					height: {start: props.height.start, end: props.height.end, units: 'px'},
					paddingLeft: {start: props.paddingLeft.start + props.borderLeftWidth.start,
						end: props.paddingLeft.end + props.borderLeftWidth.end, units: 'px'},
					paddingRight: {start: props.paddingRight.start + props.borderRightWidth.start,
						end: props.paddingRight.end + props.borderRightWidth.end, units: 'px'},
					paddingTop: {start: props.paddingTop.start + props.borderTopWidth.start,
						end: props.paddingTop.end + props.borderTopWidth.end, units: 'px'},
					paddingBottom: {start: props.paddingBottom.start + props.borderBottomWidth.start,
						end: props.paddingBottom.end + props.borderBottomWidth.end, units: 'px'},
					opacity: {start: startOpacity, end: endOpacity, units: ''}};
			};
			stepProps[2] = setHighLow(stepProps[upLeft ? 0 : 1], // Highlight shading (up/left)
				firstOpacity, options.opacity[1] - firstOpacity);
			stepProps[3] = setHighLow(stepProps[upLeft ? 1 : 0], // Shadow shading (down/right)
				options.opacity[1] - firstOpacity, firstOpacity);
		}
		// Initialise from and to objects
		var initCSS = function(props) {
			return {left: props.left.start + 'px', width: props.width.start + 'px',
				top: props.top.start + 'px', height: props.height.start + 'px',
				lineHeight: props.lineHeight.start + 'em',
				padding: props.paddingTop.start + 'px ' + props.paddingRight.start + 'px ' +
				props.paddingBottom.start + 'px ' + props.paddingLeft.start + 'px',
				borderLeftWidth: props.borderLeftWidth.start + 'px',
				borderRightWidth: props.borderRightWidth.start + 'px',
				borderTopWidth: props.borderTopWidth.start + 'px',
				borderBottomWidth: props.borderBottomWidth.start + 'px',
				letterSpacing: props.letterSpacing.start + 'em', overflow: 'hidden'};
		};
		pFrom.css(initCSS(stepProps[0]));
		pTo.css(initCSS(stepProps[1])).show();
		// Initialise highlight and shadow objects (or colours on IE)
		if (!options.noShading) {
			stepProps[2].elem = $(($.browser.msie ? '<img src="' + options.imagePath + 'imageCubeHigh.png"' :
				'<div') + ' class="imageCubeShading" style="background-color: white; opacity: ' +
				firstOpacity + '; z-index: 10; position: absolute; ' +
				'left: ' + stepProps[2].left.start + 'px; width: ' + stepProps[2].width.start + 'px; ' +
				'top: ' + stepProps[2].top.start + 'px; height: ' + stepProps[2].height.start + 'px; ' +
				'padding: ' + (upLeft ? pFrom : pTo).css('padding') + ';"' +
				($.browser.msie ? '/>' : '></div>'));
			stepProps[3].elem = $(($.browser.msie ? '<img src="' + options.imagePath + 'imageCubeShad.png"' :
				'<div') + ' class="imageCubeShading" style="background-color: black; opacity: ' +
				(options.opacity[1] - firstOpacity) + '; z-index: 10; position: absolute; ' +
				'left: ' + stepProps[3].left.start + 'px; width: ' + stepProps[3].width.start + 'px; ' +
				'top: ' + stepProps[3].top.start + 'px; height: ' + stepProps[3].height.start + 'px; ' +
				'padding: ' + (upLeft ? pTo : pFrom).css('padding') + ';"' +
				($.browser.msie ? '/>' : '></div>'));
			target.append(stepProps[2].elem).append(stepProps[3].elem);
		}
		// Pre-compute differences
		for (var i = 0; i < stepProps.length; i++) {
			for (var name in stepProps[i]) {
				var prop = stepProps[i][name];
				prop.diff = prop.end - prop.start;
			}
		}
		return stepProps;
	}
});

/* jQuery extend now ignores nulls! */
function extendRemove(target, props) {
	$.extend(target, props);
	for (var name in props) {
		if (props[name] == null) {
			target[name] = null;
		}
	}
	return target;
}

/* Attach the image cube functionality to a jQuery selection.
   @param  command  string - the command to run (optional, default 'attach')
   @param  options  object - the new settings to use for these image cube instances
   @return  jQuery object - for chaining further calls */
$.fn.imagecube = function(options) {
	var otherArgs = Array.prototype.slice.call(arguments, 1);
	if (options == 'current') {
		return $.imagecube['_' + options + 'ImageCube'].
			apply($.imagecube, [this[0]].concat(otherArgs));
	}
	return this.each(function() {
		if (typeof options == 'string') {
			$.imagecube['_' + options + 'ImageCube'].
				apply($.imagecube, [this].concat(otherArgs));
		}
		else {
			$.imagecube._attachImageCube(this, options);
		}
	});
};

/* Enable synchronised animation for all of the image cube properties.
   @param  fx  object - the effects instance to animate */
$.fx.step[PROP_NAME] = function(fx) {
	if (fx.state == 0) { // Initialisation
		fx.start = 0.0;
		fx.end = 1.0;
		fx.stepProps = $.imagecube._prepareImageCube(fx.elem);
		fx.saveCSS = {borderLeftWidth: fx.stepProps[0].elem.css('borderLeftWidth'),
			borderRightWidth: fx.stepProps[0].elem.css('borderRightWidth'),
			borderTopWidth: fx.stepProps[0].elem.css('borderTopWidth'),
			borderBottomWidth: fx.stepProps[0].elem.css('borderBottomWidth'),
			padding: fx.stepProps[0].elem.css('padding')};
	}
	for (var i = 0; i < fx.stepProps.length; i++) { // Update all elements
		var newValues = {};
		for (var name in fx.stepProps[i]) { // Update all properties
			var prop = fx.stepProps[i][name];
			if (name != 'elem') {
				newValues[name] = (fx.pos * prop.diff + prop.start) + prop.units;
			}
		}
		fx.stepProps[i].elem.css(newValues);
	}
	if (fx.state == 1) { // Tidy up afterwards
		fx.stepProps[0].elem.hide().css(fx.saveCSS);
		if (fx.stepProps.length > 2) {
			fx.stepProps[2].elem.remove();
			fx.stepProps[3].elem.remove();
		}
		$.imagecube._prepareRotation(fx.elem);
	}
};

/* Initialise the image cube functionality. */
$.imagecube = new ImageCube(); // singleton instance

})(jQuery);
