jQuery ImageMap Area Canvas Editor
======================

jQuery plugin to create imagemap area polygon coordinates. 
Display an image with a canvas on which points may be added 
to create a polygon.

### Options

```
$("#elem").htmlimagemap({
  imageUrl: "", //REQUIRED
  points: [], //OPTIONAL
  onMove: function(){}, //OPTIONAL EVENT HANDLER
  onStopDrag: function(){} //OPTIONAL EVENT HANDLER
});
```

### METHODS

```
reset: delete all current points and start again
getpoints: get the current state of points generated
```

### Examples

Include the javascript file in your page after jQuery and use the following jQuery call:

```
<div id="element"></div>
<textarea id="points"></textarea>
<button id="reset"></button>
<button id="getpoints"></button>

<script type="text/javascript">
  (function($){
    $(document).ready(function(){
      var htmlmap = $("#element").htmlimagemap({
        imageUrl: "http://farm8.staticflickr.com/7259/6956772778_2fa755a228.jpg",
        points: [208,221,208,202,198,199,201,191,218,176,229,155,221,132,196,117,169,131,157,158,163,172,177,164,173,180,190,185,192,199,187,201,185,222],
        onMove: function(points){
        	$("#points").text(points.join());
        },
        onStopDrag: function(points){
        	$("#points").text(points.join());
        }
      });
      $("#reset").click(function(){
        htmlmap.htmlimagemap("reset");
      });
      $("#getpoints").click(function(){
        alert(""+htmlmap.htmlimagemap("getpoints").join());
      });
    });
  })(jQuery);
</script>
```

_You may want to use a document load or ready event to make sure your elements are already added to the DOM before you invoke the plugin._

### SUPPORT

Supports IE6 and later if you include the excanvas polyfill before the canvasAreaDraw script.

```
<!--[if IE]><script type="text/javascript" src="excanvas.js"></script><![endif]-->
<script language="javascript" src="//ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js"></script>
<script language="javascript" src="//code.jquery.com/ui/1.11.1/jquery-ui.js"></script>
<script language="javascript" src="jquery.canvasAreaDraw.js"></script>
```

