/* http://keith-wood.name/imageCube.html
   Image Cube for jQuery v1.2.2.
   Written by Keith Wood (kbwood{at}iinet.com.au) June 2008.
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
		repeat: true, // True to automatically trigger a new transition after a pause
		pause: 2000, // Time (milliseconds) between transitions
		selection: 'forward', // How to choose the next item to show:
			// 'forward', 'backward', 'random'
		shading: true, // True to add shading effects, false for no effects
		opacity: 0.8, // Maximum opacity (0.0 - 1.0) for highlights and shadows
		imagePath: '', // Any extra path to locate the highlight/shadow images
		full3D: true, // True to add cubic perspective, false for 2D rotation
		segments: 20, // The number of segments that make up each 3D face
		reduction: 30, // The amount (pixels) of reduction for far edges of the cube
		expansion: 10, // The amount (pixels) of expansion for the near edge of the cube
		lineHeight: [0.0, 1.25], // Hidden and normal line height (em) for text
		letterSpacing: [-0.4, 0.0], // Hidden and normal letter spacing (em) for text
		beforeRotate: null, // Callback before rotating
		afterRotate: null // Callback after rotating
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
	   @param  options  (object) the new settings to use as defaults */
	setDefaults: function(options) {
		extendRemove(this._defaults, options || {});
	},

	/* Attach the image cube functionality to a div.
	   @param  target   (element) the containing division
	   @param  options  (object) the settings for this image cube instance (optional) */
	_attachImageCube: function(target, options) {
		target = $(target);
		if (target.hasClass(this.markerClassName)) {
			return;
		}
		var allOptions = $.extend({_position: target.css('position')},
			this._defaults, options || {});
		$.data(target[0], PROP_NAME, allOptions);
		target.addClass(this.markerClassName).css({position: 'relative'}).
			children().each(function() {
				var child = $(this);
				$.data(this, PROP_NAME, { display: child.css('display'),
					width: child.css('width'), height: child.css('height'),
					position: child.css('position'), lineHeight: child.css('lineHeight'),
					letterSpacing: child.css('letterSpacing')});
				child.css({display: 'block', width: target.css('width'), height: target.css('height'),
					position: 'absolute', lineHeight: allOptions.lineHeight[1],
					letterSpacing: allOptions.letterSpacing[1]});
			}).not(':first').hide();
		this._prepareRotation(target[0]);
	},

	/* Note current visible child and schedule a repeat rotation (if required).
	   @param  target  (element) the containing division */
	_prepareRotation: function(target) {
		target = $(target);
		target.children('.imageCubeShading,.imageCubeFrom,.imageCubeTo').remove();
		var options = $.data(target[0], PROP_NAME);
		options.current = target.children(':visible')[0];
		var randomSelection = function(collection) {
			return (!collection.length ? collection : collection.filter(
				':eq(' + Math.floor(Math.random() * collection.length) + ')'));
		};
		options.next = (options.selection == 'random' ?
			randomSelection(target.children(':hidden')) :
			(options.selection == 'backward' ? $(options.current).prev() :
			$(options.current).next()));
		options.next = (options.next.length ? options.next :
			(options.selection == 'random' ? options.current :
			(options.selection == 'backward' ? target.children(':last') :
			target.children(':first'))))[0]; // Cycle around if at the end
		if (options.repeat && !options._timer) {
			options._timer = setTimeout(function() {
					$.imagecube._rotateImageCube(target[0]); },
				options.pause);
		}
		$.data(target[0], PROP_NAME, options);
	},

	/* Rotate the image cube to the next face.
	   @param  target    (element) the containing division
	   @param  next      (jQuery or element or string or number) next face to show (optional)
	   @param  callback  (function) a function to call when finished with the rotation (optional) */
	_rotateImageCube: function(target, next, callback) {
		if (typeof next == 'function') {
			callback = next;
			next = '';
		}
		target = $(target);
		this._stopImageCube(target[0], true);
		var options = $.data(target[0], PROP_NAME);
		if (next != null) {
			next = (typeof next == 'number' ? target.children(':eq(' + next + ')') : $(next));
			if (target.children().filter(function() { return this === next[0]; }).length > 0) {
				options.next = next;
			}
		}
		var callbackArgs = [options.current, options.next];
		if (options.beforeRotate) {
			options.beforeRotate.apply(target[0], callbackArgs);
		}
		var animTo = {};
		animTo[PROP_NAME] = 1.0;
		target.attr(PROP_NAME, 0.0).stop(true, true).
			animate(animTo, options.speed, options.easing, function() {
				if (options.afterRotate) {
					options.afterRotate.apply(target[0], callbackArgs);
				}
				if (callback) {
					callback.apply(target[0]);
				}
			});
	},

	/* Retrieve the currently visible child of an image cube div.
	   @param  target  (element) the containing division
	   @return  (element) the currently displayed child of target division */
	_currentImageCube: function(target) {
		return ($(target).hasClass(this.markerClassName) ?
			$.data(target, PROP_NAME).current : null);
	},

	/* Retrieve the next visible child of an image cube div.
	   @param  target  (element) the containing division
	   @return  (element) the next to be displayed child of target division */
	_nextImageCube: function(target) {
		return ($(target).hasClass(this.markerClassName) ?
			$.data(target, PROP_NAME).next : null);
	},

	/* Stop the image cube automatically rotating to the next face.
	   @param  target     (element) the containing division
	   @param  timerOnly  (boolean) true if only temporarily stopping (optional) */
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
	   @param  target  (element) the containing division */
	_startImageCube: function(target) {
		this._changeImageCube(target, {repeat: true});
	},

	/* Reconfigure the settings for an image cube div.
	   @param  target   (element) the containing division
	   @param  options  (object) the new settings for this image cube instance or
	                    (string) the name of the setting
	   @param  value    (any, optional) the value of the setting */
	_changeImageCube: function(target, options, value) {
		if (typeof options == 'string') {
			var opts = {};
			opts[options] = value;
			options = opts;
		}
		var curOptions = $.data(target, PROP_NAME);
		extendRemove(curOptions || {}, options || {});
		$.data(target, PROP_NAME, curOptions);
		this._prepareRotation(target);
	},

	/* Remove the image cube functionality from a div.
	   @param  target  (element) the containing division */
	_destroyImageCube: function(target) {
		target = $(target);
		if (!target.hasClass(this.markerClassName)) {
			return;
		}
		this._stopImageCube(target[0]);
		var options = $.data(target[0], PROP_NAME);
		target.stop().css({position: options._position}).
			removeClass(this.markerClassName).
			children('.imageCubeShading,.imageCubeFrom,.imageCubeTo').remove();
		target.children().each(function() {
			$(this).css($.data(this, PROP_NAME));
			$.removeData(this, PROP_NAME);
		});
		$.removeData(target[0], PROP_NAME);
	},

	/* Prepare the image cube for animation.
	   @param  target  (element) the containing division */
	_prepareAnimation: function(target) {
		var options = $.data(target, PROP_NAME);
		var target = $(target);
		var offset = {left: 0, top: 0};
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
		options._curDirection = direction;
		var upDown = (direction == UP || direction == DOWN);
		var leftRight = (direction == LEFT || direction == RIGHT);
		var upLeft = (direction == UP || direction == LEFT);
		var firstOpacity = (upLeft ? 0 : options.opacity);
		var pFrom = $(options.current);
		var pTo = $(options.next);
		// Calculate borders and padding for both elements
		var border = [];
		var parseBorders = function(p) {
			var b = [0, 0, 0, 0];
			if (!$.browser.msie || p.css('border')) {
				for (var i = 0; i < 4; i++) {
					b[i] = p.css('border' + ['Left', 'Right', 'Top', 'Bottom'][i] + 'Width');
					var extra = ($.browser.msie ? 1 : 0);
					b[i] = parseFloat(
						{thin: 1 + extra, medium: 3 + extra, thick: 5 + extra}[b[i]] || b[i]);
				}
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
		stepProps[0] = {elem: pFrom[0], // Currently displayed element
			props: {left: {start: offset.left,
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
				end: (upDown ? options.letterSpacing[1] : options.letterSpacing[0]), units: 'em'}}};
		stepProps[1] = {elem: pTo[0], // New element to be displayed
			props: {left: {start: offset.left + (direction == LEFT ? dims.width : 0),
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
				end: options.letterSpacing[1], units: 'em'}}};
		if (options.shading) {
			// Initialise highlight and shadow objects (or colours on IE)
			var setHighShad = function(props, startOpacity, endOpacity) {
				return {left: {start: props.left.start, end: props.left.end, units: 'px'},
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
			stepProps[2] = {elem: // Highlight shading (up/left)
				$(($.browser.msie ? '<img src="' + options.imagePath + 'imageCubeHigh.png"' :
				'<div') + ' class="imageCubeShading" style="background-color: white; opacity: ' +
				firstOpacity + '; z-index: 10; position: absolute;"' +
				($.browser.msie ? '/>' : '></div>'))[0],
				props: setHighShad(stepProps[upLeft ? 0 : 1].props,
				firstOpacity, options.opacity - firstOpacity)};
			stepProps[3] = {elem: // Shadow shading (down/right)
				$(($.browser.msie ? '<img src="' + options.imagePath + 'imageCubeShad.png"' :
				'<div') + ' class="imageCubeShading" style="background-color: black; opacity: ' +
				(options.opacity - firstOpacity) + '; z-index: 10; position: absolute;"' +
				($.browser.msie ? '/>' : '></div>'))[0],
				props: setHighShad(stepProps[upLeft ? 1 : 0].props,
				options.opacity - firstOpacity, firstOpacity)};
		}
		// Set up full 3D rotation
		if (options.full3D) {
			for (var i = 0; i < options.segments; i++) {
				target.append(pFrom.clone().addClass('imageCubeFrom').
					css({display: 'block', position: 'absolute', overflow: 'hidden'}));
				if (options.shading) {
					target.append($(stepProps[upLeft ? 2 : 3].elem).clone());
				}
			}
			for (var i = 0; i < options.segments; i++) {
				target.append(pTo.clone().addClass('imageCubeTo').
					css({display: 'block', position: 'absolute', width: 0, overflow: 'hidden'}));
				if (options.shading) {
					target.append($(stepProps[upLeft ? 3 : 2].elem).clone());
				}
			}
			pFrom.hide();
			pTo.css({width: dims.width - extras[1][0], height: dims.height - extras[1][1]});
		}
		else {
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
			pFrom.css(initCSS(stepProps[0].props));
			pTo.css(initCSS(stepProps[1].props)).show();
			if (options.shading) {
				target.append(stepProps[2].elem).append(stepProps[3].elem);
			}
		}
		// Pre-compute differences
		for (var i = 0; i < stepProps.length; i++) {
			for (var name in stepProps[i].props) {
				var prop = stepProps[i].props[name];
				prop.diff = prop.end - prop.start;
			}
		}
		return stepProps;
	},

	/* Draw one panel of the 3D perspective view of the cube.
	   @param  target     (element) the container
	   @param  pos        (number) the current position (0.0 - 1.0)
	   @param  stepProps  (object[]) details about the items being animated
	   @return  (boolean) true if drawn in 3D, false if not */
	_drawFull3D: function(target, pos, stepProps) {
		var options = $.data(target, PROP_NAME);
		if (!options.full3D) {
			return false;
		}
		var target = $(target);
		var direction = options._curDirection;
		var upDown = (direction == UP || direction == DOWN);
		var upLeft = (direction == UP || direction == LEFT);
		var width = target.width();
		var height = target.height();
		if (width == 0 || height == 0) {
			return true;
		}
		var current = (1 - pos) * (upDown ? height : width);
		var segments = options.segments;
		var maxExpand = options.expansion * (1 - Math.abs(2 * current - (upDown ? height : width)) /
			(upDown ? height : width));
		var maxReduce = options.reduction - (options.reduction * current / (upDown ? height : width));
		var update = function(className, al, at, bl, bt, cl, ct, dl, dt, opacity, props, attr) {
			var ws = [bl - al, cl - dl];
			var w = Math.max(ws[0], ws[1]);
			var hs = [dt - at, ct - bt];
			var h = Math.max(hs[0], hs[1]);
			var wStep = (upDown ? (ws[0] - ws[1]) / (segments - 1) / 2 : w / segments);
			var hStep = (upDown ? h / segments : (hs[0] - hs[1]) / (segments - 1) / 2);
			var pbw = props.paddingLeft[attr] + props.paddingRight[attr] +
				props.borderLeftWidth[attr] + props.borderRightWidth[attr];
			var pbh = props.paddingTop[attr] + props.paddingBottom[attr] +
				props.borderTopWidth[attr] + props.borderBottomWidth[attr];
			var ral = Math.round(al);
			var rat = Math.round(at);
			var thisLeft = ral;
			var thisTop = rat;
			var i = 0;
			for (var j = 0; j < target[0].childNodes.length; j++) {
				var child = target[0].childNodes[j];
				if (child.className != className) {
					continue;
				}
				var nextLeft = Math.round(al + (i + 1) * wStep);
				var nextTop = Math.round(at + (i + 1) * hStep);
				var wCur = ws[0] - (upDown ? 2 * i * wStep : 0);
				var hCur = hs[0] - (upDown ? 0 : 2 * i * hStep);
				child.style.left = (upDown ? thisLeft : al) + 'px';
				child.style.top = (upDown ? at : thisTop) + 'px';
				child.style.width = Math.max(0, wCur - pbw) + 'px';
				child.style.height = Math.max(0, hCur - pbh) + 'px';
				child.style.letterSpacing = (upDown ? wCur / w * (options.letterSpacing[1] -
					options.letterSpacing[0]) + options.letterSpacing[0] :
					pos * props.letterSpacing.diff + props.letterSpacing.start) +
					props.letterSpacing.units;
				child.style.lineHeight = (!upDown ? hCur / h * (options.lineHeight[1] -
					options.lineHeight[0]) + options.lineHeight[0] :
					pos * props.lineHeight.diff + props.lineHeight.start) +
					props.lineHeight.units;
				child.style.clip = 'rect(' + (!upDown ? 'auto' : (thisTop - rat) + 'px') + ',' +
					(upDown ? 'auto' : (nextLeft - ral) + 'px') + ',' +
					(!upDown ? 'auto' : (nextTop - rat) + 'px') + ',' +
					(upDown ? 'auto' : (thisLeft - ral) + 'px') + ')';
				if (options.shading) {
					var shading = child.nextSibling;
					shading.style.left = thisLeft + 'px';
					shading.style.top = thisTop + 'px';
					shading.style.width = (upDown ? ws[0] - 2 * i * wStep : nextLeft - thisLeft) + 'px';
					shading.style.height = (upDown ? nextTop - thisTop : hs[0] - 2 * i * hStep) + 'px';
					shading.style.opacity = opacity;
					if ($.browser.msie) {
						shading.style.filter = 'alpha(opacity=' + (opacity * 100) + ')';
					}
				}
				thisLeft = nextLeft;
				thisTop = nextTop;
				i++;
			}
		};
		update('imageCubeFrom',
			[maxReduce, -maxExpand, 0, width - current][direction], // top left
			[0, height - current, maxReduce, -maxExpand][direction],
			[width - maxReduce, width + maxExpand, current, width][direction], // top right
			[0, height - current, -maxExpand, maxReduce][direction],
			[width + maxExpand, width - maxReduce, current, width][direction], // bottom right
			[current, height, height + maxExpand, height - maxReduce][direction],
			[-maxExpand, maxReduce, 0, width - current][direction], // bottom left
			[current, height, height - maxReduce, height + maxExpand][direction],
			(!options.shading ? 0 : (upLeft ? pos : 1 - pos) *
			stepProps[2].props.opacity.diff + stepProps[2].props.opacity.start),
			stepProps[0].props, 'start');
		update('imageCubeTo',
			[-maxExpand, options.reduction - maxReduce, current, 0][direction], // top left
			[current, 0, -maxExpand, options.reduction - maxReduce][direction],
			[width + maxExpand, width - (options.reduction - maxReduce), width, width - current][direction], // top right
			[current, 0, options.reduction - maxReduce, -maxExpand][direction],
			[width - (options.reduction - maxReduce), width + maxExpand, width, width - current][direction], // bottom right
			[height, height - current, height - (options.reduction - maxReduce), height + maxExpand][direction],
			[options.reduction - maxReduce, -maxExpand, current, 0][direction], // bottom left
			[height, height - current, height + maxExpand, height - (options.reduction - maxReduce)][direction],
			(!options.shading ? 0 : (upLeft ? pos : 1 - pos) *
			stepProps[3].props.opacity.diff + stepProps[3].props.opacity.start),
			stepProps[1].props, 'end');
		return true;
	}
});

/* jQuery extend now ignores nulls!
   @param  target  (object) the object to extend
   @param  props   (object) the attributes to modify
   @return  (object) the updated target */
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
   @param  command  (string) the command to run (optional, default 'attach')
   @param  options  (object) the new settings to use for these image cube instances
   @return  (jQuery) for chaining further calls */
$.fn.imagecube = function(options) {
	var otherArgs = Array.prototype.slice.call(arguments, 1);
	if (options == 'current' || options == 'next') {
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
   @param  fx  (object) the effects instance to animate */
$.fx.step[PROP_NAME] = function(fx) {
	if (fx.state == 0 || !fx.stepProps) { // Initialisation
		fx.start = 0.0;
		fx.end = 1.0;
		fx.stepProps = $.imagecube._prepareAnimation(fx.elem);
		var elem = fx.stepProps[0].elem;
		fx.saveCSS = {borderLeftWidth: elem.style.borderLeftWidth,
			borderRightWidth: elem.style.borderRightWidth,
			borderTopWidth: elem.style.borderTopWidth,
			borderBottomWidth: elem.style.borderBottomWidth,
			padding: elem.style.padding};
	}

	if (!$.imagecube._drawFull3D(fx.elem, fx.pos, fx.stepProps)) {
		for (var i = 0; i < fx.stepProps.length; i++) { // Update all elements
			var comp = fx.stepProps[i];
			for (var name in comp.props) { // Update all properties
				var prop = comp.props[name];
				comp.elem.style[name] = (fx.pos * prop.diff + prop.start) + prop.units;
				if ($.browser.msie && name == 'opacity') {
					comp.elem.style.filter = 'alpha(opacity=' +
						((fx.pos * prop.diff + prop.start) * 100) + ')';
				}
			}
		}
	}

	if (fx.state == 1) { // Tidy up afterwards
		$(fx.stepProps[0].elem).hide().css(fx.saveCSS);
		$(fx.stepProps[1].elem).show();
		$.imagecube._prepareRotation(fx.elem);
	}
};

/* Initialise the image cube functionality. */
$.imagecube = new ImageCube(); // singleton instance

})(jQuery);
