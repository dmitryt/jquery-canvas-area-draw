(function( $ ){
	
	$.widget("custom.htmlimagemap", {
		
		//Default options
		options:{
			name: "map",
			imageUrl: "",
			points: [],
			onMove: function(p){},
			onStopDrag: function(p){}
		},
		
		//Widget implementation
		_create: function(){
			
			var self = this;
			this.__activePoint = undefined;
			this.__settings = undefined;
			this.__$canvas = undefined;
			this.__ctx = undefined;
			this.__image = new Image();
			
			this.__$canvas = $('<canvas>');
			if (!this.__$canvas[0].getContext) {
				//IE Support
				this.__$canvas[0] = G_vmlCanvasManager.initElement(this.__$canvas[0]);
			}
			this.__ctx = this.__$canvas[0].getContext('2d');

			var imgonload = function(){
				$(self.__$canvas).css({background: 'url('+self.__image.src+')'});
				self.__resize();
			};
			
			var preload = function(){
				if(self.__image.complete != null && self.__image.complete == true){
					imgonload();
					return;
				}
				setTimeout(preload, 500);
			};
			
			$(this.__image).load(imgonload);
			preload();
			this.__image.src = this.options.imageUrl;
			
			$(this.element).append(this.__$canvas);
			$(this.__$canvas).on('mousedown', function(e){
				self.__mousedown(e);
			});
			$(this.__$canvas).on('contextmenu', function(e){
				self.__rightclick(e);
			});
			$(this.__$canvas).on('mouseup', function(e){
				self.__stopdrag(e);
			});
			$(this.__$canvas).on('mouseleave', function(e){
				self.__stopdrag(e);
			});
			
		},
		
		__resize: function(){
			$(this.__$canvas[0]).attr('height', this.__image.height).attr('width', this.__image.width);
			$(this.__$canvas[0]).css('height', this.__image.height+"px").css('width', this.__image.width+"px");
			this.__$canvas[0].width = this.__image.width;
			this.__$canvas[0].height = this.__image.height;
			this.__draw();
		},
		
		__move: function(e){
			e.offsetX = (e.pageX - $(this.__$canvas[0]).offset().left);
			e.offsetY = (e.pageY - $(this.__$canvas[0]).offset().top);
			if($.browser.msie && parseFloat($.browser.version)<8){
				e.offsetY = e.offsetY-$('body').scrollTop();
			}
			this.options.points[this.__activePoint] = Math.round(e.offsetX);
			this.options.points[this.__activePoint+1] = Math.round(e.offsetY);
			this.__resize();
			this.options.onMove(this.options.points);
		},
		
		__stopdrag: function(){
			$(this.element).off('mousemove');
			this.__activePoint = null;
			this.options.onStopDrag(this.options.points);
		},
		
		__rightclick: function(e){
			e.preventDefault();
			e.offsetX = (e.pageX - $(this.__$canvas[0]).offset().left);
			e.offsetY = (e.pageY - $(this.__$canvas[0]).offset().top);
			var x = e.offsetX, y = e.offsetY;
			if($.browser.msie && parseFloat($.browser.version)<8){
				y = e.offsetY-$('body').scrollTop();
			}
			for (var i = 0; i < this.options.points.length; i+=2) {
				dis = Math.sqrt(Math.pow(x - this.options.points[i], 2) + Math.pow(y - this.options.points[i+1], 2));
				if ( dis < 6 ) {
					this.options.points.splice(i, 2);
					this.__resize();
					return false;
				}
			}
			return false;
		},
		
		__mousedown: function(e){
			
			var x, y, dis, lineDis, insertAt = this.options.points.length;
			var self = this;
			
			if (e.which === 3) {
				return false;
			}
			
			e.preventDefault();
			e.offsetX = (e.pageX - $(this.__$canvas[0]).offset().left);
			e.offsetY = (e.pageY - $(this.__$canvas[0]).offset().top);
			x = e.offsetX; y = e.offsetY;
			if($.browser.msie && parseFloat($.browser.version)<8){
				y = e.offsetY-$('body').scrollTop();
			}
			
			//Move existing point
			for (var i = 0; i < this.options.points.length; i+=2) {
				dis = Math.sqrt(Math.pow(x - this.options.points[i], 2) + Math.pow(y - this.options.points[i+1], 2));
				if ( dis < 6 ) {
					this.__activePoint = i;
					$(this.element).on('mousemove', function(e){
						self.__move(e);
					});
					return false;
				}
			}
			
			//Insert new point if close to line
			for (var i = 0; i < this.options.points.length; i+=2) {
				if (i > 1) {
					lineDis = dotLineLength(
						x, y,
						this.options.points[i], this.options.points[i+1],
						this.options.points[i-2], this.options.points[i-1],
						true
					);
					if (lineDis < 6) {
						insertAt = i;
					}
				}
			}
			
			this.options.points.splice(insertAt, 0, Math.round(x), Math.round(y));
			
			this.__activePoint = insertAt;
			$(this.element).on('mousemove', function(e){
				self.__move(e);
			});
			
			this.__resize();
			
			return false;
		},
		
		__draw: function(){
			
			this.__ctx.canvas.width = this.__ctx.canvas.width;
			if (this.options.points.length < 2) {
				return false;
			}
			this.__ctx.globalCompositeOperation = 'destination-over';
			this.__ctx.fillStyle = 'rgb(255,255,255)'
			this.__ctx.strokeStyle = 'rgb(255,20,20)';
			this.__ctx.lineWidth = 1;
			
			this.__ctx.beginPath();
			this.__ctx.moveTo(this.options.points[0], this.options.points[1]);
			for (var i = 0; i < this.options.points.length; i+=2) {
				this.__ctx.fillRect(this.options.points[i]-2, this.options.points[i+1]-2, 4, 4);
				this.__ctx.strokeRect(this.options.points[i]-2, this.options.points[i+1]-2, 4, 4);
				if (this.options.points.length > 2 && i > 1) {
					this.__ctx.lineTo(this.options.points[i], this.options.points[i+1]);
				}
			}
			this.__ctx.closePath();
			this.__ctx.stroke();
			this.__ctx.fillStyle = 'rgba(255,0,0,0.3)';
			this.__ctx.fill();
			
		},
		
		//Public API
		reset: function(){
			this.options.points = [];
			this.__resize();
		},
		
		getPoints: function(){
			return this.options.points;
		}
		
	});

	var dotLineLength = function(x, y, x0, y0, x1, y1, o) {
		function lineLength(x, y, x0, y0){
	        return Math.sqrt((x -= x0) * x + (y -= y0) * y);
	    }
	    if(o && !(o = function(x, y, x0, y0, x1, y1){
	        if(!(x1 - x0)) return {x: x0, y: y};
	        else if(!(y1 - y0)) return {x: x, y: y0};
	        var left, tg = -1 / ((y1 - y0) / (x1 - x0));
	        return {x: left = (x1 * (x * tg - y + y0) + x0 * (x * - tg + y - y1)) / (tg * (x1 - x0) + y0 - y1), y: tg * left - tg * x + y};
	    }(x, y, x0, y0, x1, y1), o.x >= Math.min(x0, x1) && o.x <= Math.max(x0, x1) && o.y >= Math.min(y0, y1) && o.y <= Math.max(y0, y1))){
	        var l1 = lineLength(x, y, x0, y0), l2 = lineLength(x, y, x1, y1);
	        return l1 > l2 ? l2 : l1;
	    }
	    else {
	        var a = y0 - y1, b = x1 - x0, c = x0 * y1 - y0 * x1;
	        return Math.abs(a * x + b * y + c) / Math.sqrt(a * a + b * b);
	    }
	};
	
})( jQuery );
