/*!
 * imgspect
 */
;(function($) {
	
	/**
	 * Holds default options, adds user defined options, and initializes the plugin
	 *
	 * @param { obj } _elem The image DOM element you want to inspect
	 *
	 * @param { obj } _options Key value pairs that hold 
	 *		imgspect's configuration
	 *
	 * @param { string } _id The id of the DOM element 
	 */
	function imgspect( _elem, _options, _id ) {
		var self = this;
		self.elem = _elem;
		self.id = _id;
		self.init( _elem, _options );
	}
	
	/**
	 * Holds default options, adds user defined options, and initializes the plugin
	 *
	 * @param { obj } _elem The image DOM element you want to inspect
	 *
	 * @param { obj } _options Key value pairs that hold 
	 *		imgspect's configuration
	 */
	imgspect.prototype.init = function( _elem, _options ) {
		var self = this;
		
		//------------------------------------------------------------
		// 	User options 
		//------------------------------------------------------------
		self.options = $.extend({
			'zoom_unit': .1
		}, _options);
		
		//------------------------------------------------------------
		//  Plugin properties
		//------------------------------------------------------------
		self.lites = [];
		self.zoom_n = 1;
		self.pan = { x:0, y:0 };
		self.c_lite = null;
		
		//------------------------------------------------------------
		//  Original height and width
		//------------------------------------------------------------
		self.orig_w = $( self.elem ).width();
		self.orig_h = $( self.elem ).height();
		
		//------------------------------------------------------------
		//	Build the application and get ready for interactivity
		//------------------------------------------------------------
		self.buildDom();
		self.resize();
		self.start();
	}
	
	/**
	 * Build the imgspect DOM elements
	 */
	imgspect.prototype.buildDom = function() {
		var self = this;
		
		//------------------------------------------------------------
		//  Wrap the image in the imgspect class.
		//------------------------------------------------------------
		$( self.elem ).wrap( '<div class="imgspect">' );
		self.elem = $( self.elem ).parent();
		
		//------------------------------------------------------------
		//  Create the navigation window
		//------------------------------------------------------------
		$( 'img', self.elem ).wrap( '<div class="nav">' );
		
		//------------------------------------------------------------
		//  Create the navigation "dragger"
		//------------------------------------------------------------
		$( '.nav', self.elem ).prepend( '<div class="drag">' );
		
		//------------------------------------------------------------
		//  Create the viewport
		//------------------------------------------------------------
		$( self.elem ).append( '<div class="view">' );
		
		//------------------------------------------------------------
		//  Create the drawing space
		//------------------------------------------------------------
		$( '.view', self.elem ).append( '<div class="draw">' );
		
		//------------------------------------------------------------
		//  Set image as drawing space background
		//------------------------------------------------------------
		var src = $( '.nav img', self.elem ).attr('src');
		$( '.draw', self.elem ).css({ 
			'background-image': "url('"+src+"')",
		});
		
		//------------------------------------------------------------
		//  Clear elements so no unexpected wrapping occurs
		//------------------------------------------------------------
		$( self.elem ).append( '<div style="clear:both">' );
		
		//------------------------------------------------------------
		//  Create the toolbars
		//------------------------------------------------------------
		$( self.elem ).append( '<div class="tools">' );
		$( '.tools', self.elem ).append( '<a href="#" class="zoom in">+</a>' );
		$( '.tools', self.elem ).append( '<a href="#" class="zoom out">-</a>' );
		
		//------------------------------------------------------------
		//  Clear element so no unexpected wrapping occurs
		//------------------------------------------------------------
		$( self.elem ).append( '<div style="clear:both">' );
	}
	
	/**
	 * Resize imgspect
	 */
	imgspect.prototype.resize = function() {
		var self = this;
		
		//------------------------------------------------------------
		//  Resize the drawing area
		//------------------------------------------------------------
		self.drawResize()
		self.dragResize();
		self.liteResize();
	}
	
	/**
	 * Start imgspect
	 */
	imgspect.prototype.start = function() {
		var self = this;
		
		//------------------------------------------------------------
		//  Start event listeners
		//------------------------------------------------------------
		self.zoomStart();
		self.liteStart();
		self.dragStart();
	}
	
	/**
	 * Start the lite mouse event listeners
	 */
	imgspect.prototype.liteStart = function() {
		var self = this;
		
		$( '.view', self.elem ).mousedown( function( _e ) {
			self.c_lite = $( document.createElement('div') ).addClass( 'lite' );
			$( '.draw', self.elem ).append( self.c_lite );
			var dp = $( '.draw', self.elem ).position();
			var mp = self.viewMousePos( _e );
			self.c_lite.css({
				left: mp.x - dp.left,
				top: mp.y - dp.top,
			});
			_e.preventDefault();
		});
		
		$( '.view', self.elem ).mousemove( function( _e ) {
			if ( self.c_lite != null ) {
				var lp = self.c_lite.position();
				var mp = self.viewMousePos( _e );
				var dp = $( '.draw', self.elem ).position();
				self.c_lite.css({
					width: mp.x - lp.left - dp.left,
					height: mp.y - lp.top - dp.top
				});
			}
			
		});
		
		$( '.view', self.elem ).mouseup( function( _e ) {
			//------------------------------------------------------------
			//  Store lite position in relation to original
			//------------------------------------------------------------
			var cp = self.c_lite.position();
			var x1 = cp.left / self.zoom_n;
			var y1 = cp.top / self.zoom_n;
			var x2 = x1 + self.c_lite.width() / self.zoom_n;
			var y2 = y1 + self.c_lite.height() / self.zoom_n;
			self.lites.push({ x1:x1, y1:y1, x2:x2, y2:y2 });
			
			self.liteDrawNav();
			
			//------------------------------------------------------------
			//  Reset current lite
			//------------------------------------------------------------
			self.c_lite = null;
			_e.preventDefault();
		});
	}
	
	/**
	 * Build the DOM element for a lite
	 *
	 * @return { jQuery } A jQuery DOM element handle
	 */
	imgspect.prototype.liteDom = function() {
		return $( document.createElement('div') ).addClass( 'lite' );
	}
	
	/**
	 * Build the imgspect DOM elements
	 */
	imgspect.prototype.liteDrawNav = function() {
		var self = this;
		var lite = self.liteDom();
		$( '.nav', self.elem ).append( lite );
		
		var lp = self.lites[ self.lites.length - 1 ];
		lite.css({
			'left': lp.x1,
			'top': lp.y1,
			'width': lp.x2 - lp.x1,
			'height': lp.y2 - lp.y1
		});
	}
	
	/**
	 * Resize the lites
	 */
	imgspect.prototype.liteResize = function() {
		var self = this;
		
		//------------------------------------------------------------
		//  Clear the existing lites
		//------------------------------------------------------------
		$( '.draw .lite', self.elem ).remove();
		
		//------------------------------------------------------------
		//  Redraw at different dimensions
		//------------------------------------------------------------
		var dp = $( '.draw', self.elem ).position();
		for ( var i in self.lites ) {
			var lite = self.liteDom();
			$( '.draw' ).append( lite );
			lite.css({
				'left': self.lites[i].x1 * self.zoom_n,
				'top': self.lites[i].y1 * self.zoom_n,
				'width': ( self.lites[i].x2 - self.lites[i].x1 ) * self.zoom_n,
				'height': ( self.lites[i].y2 - self.lites[i].y1 ) * self.zoom_n
			});
		}
	}
	
	/**
	 * Start the zoom event listeners
	 */
	imgspect.prototype.zoomStart = function() {
		var self = this;
		$( '.zoom', self.elem ).click( function( _e ) {
			if ( $(this).hasClass('in') ) {
				self.zoomIn();
			}
			else {
				self.zoomOut();
			}
			_e.preventDefault();
		});
	}
	
	/**
	 * Make drawable image larger
	 */
	imgspect.prototype.zoomIn = function() {
		var self = this;
		self.zoom('IN');
	}

	/**
	 * Make drawable image smaller
	 */
	imgspect.prototype.zoomOut = function() {
		var self = this;
		self.zoom('OUT');
	}
	
	/**
	 * Scale drawable image
	 *
	 * @param { string } Either 'IN' or 'OUT'
	 */
	imgspect.prototype.zoom = function( _dir ) {
		var self = this;
		switch( _dir.toUpperCase() ) {
			case 'IN':
				self.zoom_n += self.options['zoom_unit'];
				break;
			case 'OUT':
				self.zoom_n = ( self.zoom_n <= 1 ) ? 1 : self.zoom_n-self.options['zoom_unit'];
				break;
		}
		
		//------------------------------------------------------------
		//  Resize draw window & nav drag
		//------------------------------------------------------------
		self.resize();
	}
	
	/**
	 * Start drag listener
	 */
	imgspect.prototype.dragStart = function() {
		var self = this;
		
		$( '.drag', self.elem ).draggable({
			containment: 'parent',
			scroll: false,
			drag: function() {
				var nav_pos = $( '.nav', this.elem ).position();
				var drag_pos = $( '.drag', this.elem ).position();
				self.dragHandler( nav_pos, drag_pos );
			}
		});
	}
	
	/**
	 * Moves the drawable image when the nav drag is moved
	 *
	 * @param { object } nav window position
	 * @param { object } drag position
	 */
	imgspect.prototype.dragHandler = function( _nav_pos, _drag_pos ) {
		var self = this;
		var x = _drag_pos.left - _nav_pos.left;
		var y = _drag_pos.top - _nav_pos.top;
		
		var left = x*-1*this.zoom_n;
		var top = y*-1*this.zoom_n;
		
		self.drawMove( left, top );
	}
	
	/**
	 * Resize drag window
	 */
	imgspect.prototype.dragResize = function() {
		var self = this;
		var view = $( '.view', self.elem );
		var draw = $( '.draw', self.elem );
		
		var w_ratio = view.width() / draw.width();
		w_ratio = ( w_ratio > 1 ) ? 1 : w_ratio;
		
		var h_ratio = view.height() / draw.height();
		h_ratio = ( h_ratio > 1 ) ? 1 : h_ratio;
		
		var img = $( '.nav img', self.elem );
		$( '.drag', self.elem ).css({
			width: img.width() * w_ratio,
			height: img.height() * h_ratio
		});
	}
	
	/**
	 * Move the drawable image
	 *
	 * @param { float } new left css parameter
	 * @param { float } new top css parameter
	 */
	imgspect.prototype.drawMove = function( _left, _top ) {
		var self = this;
		$( '.draw', this.elem ).css({
			left: _left,
			top: _top
		});
	}
	
	/**
	 * Resize drawable window when zoomed
	 */
	imgspect.prototype.drawResize = function() {
		var self = this;
		$( '.draw', self.elem ).css({
			width: self.orig_w * self.zoom_n,
			height: self.orig_h * self.zoom_n
		});
	}
	
	/**
	 * Retrieve the mouse position in relation to the view
	 */
	imgspect.prototype.viewMousePos = function( _e ) {
		var vp = $( '.view', this.elem ).position();		
		var x = _e.clientX - vp.left;
		var y = _e.clientY - vp.top;
		return { 'x':x, 'y':y }
	}
	
	/**
	 * "Register" this plugin with jQuery
	 */
	jQuery(document).ready( function($) {
		jQuery.fn.imgspect = function( options ) {
			var id = jQuery(this).selector;
			return this.each( function() {
				jQuery.data( this, id, new imgspect( this, options, id ) );
			});
		};
	})
})(jQuery);