(function( $ ){

	$.widget("custom.htmlimagemap", {

		//Default options
		options:{
			name: "map",
			imageUrl: "",
			mode: "",
			areas: [{
				href:"",
				coords:[]
			}],
			onMove: function(p){},
			onUpdateArea: function(p){}
		},

		//Widget implementation
		_create: function(){

			var self = this;
			this.__activeArea = 0;
			this.__activeCoord = undefined;
			this.__settings = undefined;
			this.__$canvas = undefined;
			this.__ctx = undefined;
			this.__image = new Image();

			this.__$canvas = this._initCanvas();
			this.__ctx = this.__$canvas[0].getContext('2d');

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

			if (this.isContiniousSelectMode()) {
				this.__$drawCanvas = this._initCanvas();
				$(this.element).append(this.__$drawCanvas);
			}

			this.setImageUrl(this.options.imageUrl);

		},

		_initCanvas: function() {
			var canvas = $('<canvas>');
			if (!canvas[0].getContext && typeof G_vmlCanvasManager !== 'undefined') {
				//IE Support
				canvas[0] = G_vmlCanvasManager.initElement(canvas[0]);
			}
			return canvas;
		},

		_onCanvasSizeUpdate: function() {
			if (this.__$drawCanvas) {
				var w = this.__$canvas.width(),
					h = this.__$canvas.height();
				this.__$drawCanvas.attr('height', h).attr('width', w);
				this.__$drawCanvas.css({
					display: 'none',
					position: 'absolute',
					left: 0,
					width: w + 'px',
					height: h + 'px'
				});
				this.__$drawCanvas.width = w;
				this.__$drawCanvas.height = h;
				$(this.__$drawCanvas).on('mousemove', this._onContiniousSelectClick.bind(this));
				$(this.__$drawCanvas).on('mouseup', this.__mouseupCSMode.bind(this));
				$(this.__$drawCanvas).on('mousedown', this.__mousedownCSMode.bind(this));
				$(this.__$drawCanvas).on('mouseleave', this._stopCSDrag.bind(this));
				this.__drawCanvasCtx = this.__$drawCanvas[0].getContext('2d');
				this.__mouseMoves = [];
			}
		},

		_clearCtx: function(ctx) {
			ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Clears the canvas
		},

		_addCSClick: function(e, isDragging) {
			var offset = $(e.target).offset();
			this.__mouseMoves.push({x: e.pageX - offset.left, y: e.pageY - offset.top, isDragging: isDragging});
		},

		_onContiniousSelectClick: function(e) {
			if (!this._isDrawing) {
				return false;
			}
			this._addCSClick(e, true);
			this._continiousSelectRedraw();
		},

		_continiousSelectRedraw: function() {
			var ctx = this.__drawCanvasCtx;
			this._clearCtx(ctx);

			ctx.strokeStyle = "#df4b26";
			ctx.lineJoin = "round";
			ctx.lineWidth = 5;

			for(var i=0; i < this.__mouseMoves.length; i++) {
				ctx.beginPath();
				if (this.__mouseMoves[i].isDragging && i) {
					ctx.moveTo(this.__mouseMoves[i - 1].x, this.__mouseMoves[i - 1].y);
				} else {
					ctx.moveTo(this.__mouseMoves[i].x - 1, this.__mouseMoves[i].y);
				}
				ctx.lineTo(this.__mouseMoves[i].x, this.__mouseMoves[i].y);
				ctx.stroke();
				ctx.closePath();
			}
		},

		_showDrawArea: function(flag) {
			if (flag !== false) {
				this.__$drawCanvas.css({display: 'inline-block'});
			} else {
				this.__$drawCanvas.hide();
			}
		},

		__redraw: function(){
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
			this.options.areas[this.__activeArea].coords[this.__activeCoord] = Math.round(e.offsetX);
			this.options.areas[this.__activeArea].coords[this.__activeCoord+1] = Math.round(e.offsetY);
			this.__redraw();
			this.options.onMove(this.options.areas[this.__activeArea]);
		},

		__stopdrag: function(){
			$(this.element).off('mousemove');
			this.__activeCoord = null;
			this.options.onUpdateArea(this.options.areas[this.__activeArea]);
		},

		__rightclick: function(e){
			e.preventDefault();
			e.offsetX = (e.pageX - $(this.__$canvas[0]).offset().left);
			e.offsetY = (e.pageY - $(this.__$canvas[0]).offset().top);
			var x = e.offsetX, y = e.offsetY;
			if($.browser.msie && parseFloat($.browser.version)<8){
				y = e.offsetY-$('body').scrollTop();
			}
			for (var i = 0; i < this.options.areas[this.__activeArea].coords.length; i+=2) {
				dis = Math.sqrt(Math.pow(x - this.options.areas[this.__activeArea].coords[i], 2) + Math.pow(y - this.options.areas[this.__activeArea].coords[i+1], 2));
				if ( dis < 6 ) {
					this.options.areas[this.__activeArea].coords.splice(i, 2);
					this.options.onUpdateArea(this.options.areas[this.__activeArea]);
					this.__redraw();
					return false;
				}
			}
			return false;
		},

		__mousedown: function(e){

			if (this.isContiniousSelectMode()) {
				return this.__mousedownCSMode(e);
			}

			var x, y, dis, lineDis, insertAt = this.options.areas[this.__activeArea].coords.length;
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

			//Move existing coord
			for (var i = 0; i < this.options.areas[this.__activeArea].coords.length; i+=2) {
				dis = Math.sqrt(Math.pow(x - this.options.areas[this.__activeArea].coords[i], 2) + Math.pow(y - this.options.areas[this.__activeArea].coords[i+1], 2));
				if ( dis < 6 ) {
					this.__activeCoord = i;
					$(this.element).on('mousemove', function(e){
						self.__move(e);
					});
					return false;
				}
			}

			//Insert new coord if close to line
			for (var i = 0; i < this.options.areas[this.__activeArea].coords.length; i+=2) {
				if (i > 1) {
					lineDis = dotLineLength(
						x, y,
						this.options.areas[this.__activeArea].coords[i], this.options.areas[this.__activeArea].coords[i+1],
						this.options.areas[this.__activeArea].coords[i-2], this.options.areas[this.__activeArea].coords[i-1],
						true
					);
					if (lineDis < 6) {
						insertAt = i;
					}
				}
			}

			this.options.areas[this.__activeArea].coords.splice(insertAt, 0, Math.round(x), Math.round(y));

			this.__activeCoord = insertAt;
			$(this.element).on('mousemove', function(e){
				self.__move(e);
			});

			this.options.onUpdateArea(this.options.areas[this.__activeArea]);
			this.__redraw();

			return false;
		},

		_stopCSDrag: function() {
			this._isDrawing = false;
		},

		__mousedownCSMode: function(e) {
			e.preventDefault();
			this._isDrawing = true;
			this._showDrawArea();
			this._addCSClick(e);
		},

		__mouseupCSMode: function() {
			this._stopCSDrag();
		},

		__draw: function(){

			this.__ctx.canvas.width = this.__ctx.canvas.width;
			this.__ctx.globalCompositeOperation = 'source-over';

			for(var i=0; i<this.options.areas.length; i++){

				if(i != this.__activeArea){
					this.__drawArea(i);
				}

			}

			this.__drawArea(this.__activeArea);

		},

		__drawArea: function(area){

			var strokePolygonRgb = '';
			var fillPolygonRgba = '';
			var strokeCoordRgb = '';
			var fillCoordRgb = '';

			if(area == this.__activeArea){
				strokePolygonRgb = 'rgb(255,20,20)';
				fillPolygonRgba = 'rgba(255,0,0,0.3)';
				strokeCoordRgb = 'rgb(255,20,20)';
				fillCoordRgb = 'rgb(255,255,255)';
			}else{
				strokePolygonRgb = 'rgb(50,50,50)';
				fillPolygonRgba = 'rgba(50,50,50,0.3)';
				strokeCoordRgb = 'rgb(50,50,50)';
				fillCoordRgba = 'rgba(50,50,50,0.3)';
			}

			if (this.options.areas[area].coords.length < 2) {
				return false;
			}

			this.__ctx.lineWidth = 1;

			//Draw polygon
			this.__ctx.beginPath();
			this.__ctx.moveTo(this.options.areas[area].coords[0], this.options.areas[area].coords[1]);
			for (var i = 0; i < this.options.areas[area].coords.length; i+=2) {
				if (this.options.areas[area].coords.length > 2 && i > 1) {
					this.__ctx.lineTo(this.options.areas[area].coords[i], this.options.areas[area].coords[i+1]);
				}
			}
			this.__ctx.closePath();
			this.__ctx.strokeStyle = strokePolygonRgb;
			this.__ctx.stroke();
			this.__ctx.fillStyle = fillPolygonRgba;
			this.__ctx.fill();

			//Draw coords
			this.__ctx.strokeStyle = strokeCoordRgb;
			this.__ctx.fillStyle = fillCoordRgb;
			for (var i = 0; i < this.options.areas[area].coords.length; i+=2) {
				this.__ctx.strokeRect(this.options.areas[area].coords[i]-2, this.options.areas[area].coords[i+1]-2, 4, 4);
				this.__ctx.fillRect(this.options.areas[area].coords[i]-2, this.options.areas[area].coords[i+1]-2, 4, 4);
			}

		},

		__fixActiveAreaIndex: function(){
			if(typeof this.options.areas[this.__activeArea] == "undefined"){
				if(typeof this.options.areas[this.__activeArea-1] != "undefined"){
					this.setActiveAreaIndex(this.__activeArea-1);
				}else{
					this.setActiveAreaIndex(this.__activeArea);
				}
			}
		},

		//Public API
		removeAll: function(){
			this.options.areas = [];
			this.__fixActiveAreaIndex();
			this.__redraw();
		},

		getMode: function() {
			return this.options.mode;
		},

		isContiniousSelectMode: function() {
			return this.getMode() === 'continiousSelect';
		},

		getAreas: function(){
			return this.options.areas;
		},

		setAreas: function(areas){
			this.options.areas = areas;
			this.setActiveAreaIndex(0);
			this.__redraw();
		},

		getArea: function(i){
			return this.options.areas[i];
		},

		setArea: function(i,v){
			this.options.areas[i] = v;
			this.__redraw();
		},

		removeArea: function(i){
			this.options.areas.splice(i,1);
			this.__fixActiveAreaIndex();
			this.__redraw();
		},

		resetArea: function(i){
			this.setArea(i, {
				href: "",
				coords: []
			});
			this.options.onUpdateArea(this.options.areas[i]);
			this.__redraw();
		},

		//ACTIVE AREA
		getActiveArea: function(){
			return this.options.areas[this.__activeArea];
		},

		setActiveArea: function(v){
			this.setArea(this.__activeArea, v);
		},

		resetActiveArea: function(){
			this.resetArea(this.__activeArea);
		},

		removeActiveArea: function(){
			this.removeArea(this.__activeArea);
		},

		//ACTIVE AREA INDEX
		getActiveAreaIndex: function(){
			return this.__activeArea;
		},

		setActiveAreaIndex: function(i){
			if(i < 0){
				return;
			}
			this.__activeArea = i;
			if(typeof this.options.areas[i] == "undefined"){
				this.resetArea(i);
			}
			this.__redraw();
		},

		setImageUrl: function(url){

			var self = this;

			this.options.imageUrl = url;
			var imgonload = function(){
				$(self.__$canvas).css({background: 'url('+self.__image.src+')'});
				self.__redraw();
				self._onCanvasSizeUpdate();
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
			this.__image.src = url;

		},

		getImageUrl: function(){

			return this.options.imageUrl;

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
