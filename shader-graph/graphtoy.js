//--- utils -------------------------------

function sign(x)
{
    if( x>0.0 ) x=1.0; else x=-1.0;
    return x;
}
function smoothstep(a,b,x)
{
    if( x<a ) return 0.0;
    if( x>b ) return 1.0;
    var y = (x-a)/(b-a);
    return y*y*(3.0-2.0*y);
}
function clamp(x,a,b)
{
    if( x<a ) return a;
    if( x>b ) return b;
    return x;
}
function radians(degrees)
{
     return degrees*Math.PI/180.0;
}
function inversesqrt(x)
{
     return 1.0/Math.sqrt(x);
}
function degrees(radians)
{
     return radians*180.0/Math.PI;
}

function step(a,x)
{
    if( x<a ) return 0.0;
    else      return 1.0;
}
function mix(a,b,x)
{
    return a + (b-a)*Math.min(Math.max(x,0.0),1.0);
}
function over(x,y)
{
    return 1.0 - (1.0-x)*(1.0-y);
}
function tri(a,x)
{
    x = x / (2.0*Math.PI);
    x = x % 1.0;
    if( x<0.0 ) x = 1.0+x;
    if(x<a) x=x/a; else x=1.0-(x-a)/(1.0-a);
    return -1.0+2.0*x;
}
function sqr(a,x)
{
    if( Math.sin(x)>a ) x=1.0; else x=-1.0;
    return x;
}

function grad(n, x)
{
    n = (n << 13) ^ n;
    n = (n * (n * n * 15731 + 789221) + 1376312589);
    var res = x;
    if( n & 0x20000000 ) res = -x;
    return res;
}

function noise(x)
{
    var i = Math.floor(x);
    var f = x - i;
    var w = f*f*f*(f*(f*6.0-15.0)+10.0);
    var a = grad( i+0, f+0.0 );
    var b = grad( i+1, f-1.0 );
    return a + (b-a)*w;
}

function cellnoise(x)
{
    var n = Math.floor(x);
    n = (n << 13) ^ n;
    n = (n * (n * n * 15731 + 789221) + 1376312589);
    n = (n>>14) & 65535;
    return n/65535.0;
}
function frac(x)
{
    return x - Math.floor(x);
}

//--- grapher -------------------------------

function Grapher()
{
    this.mCanvas = document.getElementById('mainCanvas');
    this.mContext = this.mCanvas.getContext('2d');

    this.mXres = this.mCanvas.width = this.mCanvas.clientWidth;
    this.mYres = this.mCanvas.height = this.mCanvas.clientHeight;

    this.mMouseFunction = 0;

    // ripped from Ed Mackey
    this.blackList = ["=","[","]","'",";", "new", "ml", "$", ").", "alert", "ook", "ipt", "doc", "win", "set", "get", "tim", "net", "post", "black", "z"];

    this.mCx = 0.0;
    this.mCy = 0.0;
    this.mRx = 12.0;
    this.mRy = this.mRx*this.mYres/this.mXres;
    this.mRangeType = 2; // free

    this.mShowAxes = true;
    this.mShowGuides = true;

    var me = this;
    this.mCanvas.onmousedown = function(ev) { me.mouseDown(ev); }
    this.mCanvas.onmousemove = function(ev) { me.mouseMove(ev); }
    this.mCanvas.onmouseup   = function(ev) { me.mouseUp(ev); }
    this.mCanvas.onmouseout  = function(ev) { me.mouseUp(ev); }

    this.draw();
}

Grapher.prototype.toggleShowGuides = function()
{
    this.mShowGuides = !this.mShowGuides;
    this.draw();
}

Grapher.prototype.toggleShowAxes = function()
{
    this.mShowAxes = !this.mShowAxes;
    this.draw();
}

Grapher.prototype.setRange = function(val)
{

    if( val==0 )
    {
      this.mCx = 0.5;
      this.mCy = 0.5;
      this.mRx = 0.5;
      this.mRy = 0.5;
    }
    else if( val==1 )
    {
      this.mCx = 0.0;
      this.mCy = 0.0;
      this.mRx = 1.0;
      this.mRy = 1.0;
    }
    else
    {
      this.mCx = 0.0;
      this.mCy = 0.0;
      this.mRx = 12.0;
      this.mRy = this.mRx*this.mYres/this.mXres;
    }

    this.mRangeType = val;
    this.draw();
}

Grapher.prototype.setSize = function(val)
{
    var xres = 720;
    var yres = 540;

    if( val==0 )
    {
        xres = 720;
        yres = 540;
    }
    else if( val==1 )
    {
        xres = 960;
        yres = 720;
    }
    else
    {
        xres = 1280;
        yres = 960;
    }

    this.mXres = xres;
    this.mYres = yres;
    this.mCanvas.width = xres;
    this.mCanvas.height = yres;

    this.draw();
}

Grapher.prototype.notOnBlackList = function(formula)
{
    if( formula.length > 256 )
    {
        alert("Formula is too long...");
        return false;
    }

    var lowFormula = formula.toLowerCase();
    for( var n=0; n<this.blackList.length; n++ )
    {
        if( lowFormula.indexOf(this.blackList[n]) != -1 )
        {
            alert("Syntax error");
            return false;
        }
    }
    return true;
}

Grapher.prototype.getPrecision = function()
{
    return 1+Math.floor(  Math.log(this.mXres/(this.mRx*2.0))/Math.log(10.0) );
}

Grapher.prototype.drawGraph = function(formula,mycolor)
{
    this.mContext.strokeStyle = mycolor;
    this.mContext.lineWidth = 1.5;

    let oldBadNum = true;

    this.mContext.beginPath();
    for( let i = 0; i <this.mXres; i++ )
    {
        let x = this.mCx + this.mRx * (-1.0 + 2.0*i/this.mXres);
        let y = formula(x);

        let badNum = isNaN(y) || (y==Number.NEGATIVE_INFINITY) || (y==Number.POSITIVE_INFINITY) || (Math.abs(y)>1e6); // || (!isFinite(y))

        if( !badNum )
        {
            var j = this.mYres*(0.5 + 0.5*(this.mCy-y)/this.mRy);
            if( oldBadNum )
                this.mContext.moveTo(i, j);
            else
                this.mContext.lineTo(i, j);
        }
        oldBadNum = badNum;
    }
    this.mContext.stroke();
    this.mContext.closePath();
}

// ugly    
var f1, f2, f3, f4, f5;

Grapher.prototype.draw = function(id)
{
    var minx = this.mCx - this.mRx;
    var maxx = this.mCx + this.mRx;
    var miny = this.mCy - this.mRy;
    var maxy = this.mCy + this.mRy;

    // axes
    var ctx = this.mContext;
    ctx.fillStyle = '#202020';
    ctx.fillRect(0, 0, this.mXres, this.mYres);
    if( this.mShowAxes )
    {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        var xPos = this.mXres*(0-minx)/(this.mRx*2.0);
        var yPos = this.mYres*(1.0-(0-miny)/(this.mRy*2.0));
        ctx.beginPath(); ctx.moveTo(xPos, 0); ctx.lineTo(xPos, this.mYres); ctx.stroke(); ctx.closePath();
        ctx.beginPath(); ctx.moveTo(0, yPos); ctx.lineTo(this.mXres,  yPos); ctx.stroke(); ctx.closePath();
    }

    var graphColor = [ '#ffc040', '#ffffa0', '#a0ffc0', '#40c0ff', '#d0a0ff', '#ff80c0' ];

    // graphs
    for( let i=0; i<6; i++ )
    {
        let uiCheck = document.getElementById('draw'+(1+i));
        let uiFormula = document.getElementById('formula'+(1+i));
        let strFormula = uiFormula.value;
        
        if( this.notOnBlackList(strFormula) == false ) continue;
        
        let fnFormula = new Function( "x", "with(Math) { return( " + strFormula + "); } " );
        if( uiCheck.checked ) this.drawGraph(fnFormula,graphColor[i]);
        if( i==0 ) f1 = fnFormula;
        if( i==1 ) f2 = fnFormula;
        if( i==2 ) f3 = fnFormula;
        if( i==3 ) f4 = fnFormula;
        if( i==4 ) f5 = fnFormula;
    }

    
    // guides
    if( this.mShowGuides )
    {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '10px arial';

        var n = this.getPrecision()
        for( i=0; i<11; i++ )
        {
             var x = minx + 2.0*this.mRx*i/10.0;
             var ix = this.mXres*i/10;
             ctx.beginPath(); ctx.moveTo(ix, this.mYres); ctx.lineTo(ix, this.mYres-12); ctx.stroke(); ctx.closePath();
             ctx.fillText(x.toFixed(n), ix + 4, this.mYres - 2);
        }
        for( i=0; i<11; i++ )
        {
             var y = maxy - 2.0*this.mRy*i/10.0;
             var iy = this.mYres*i/10;
             ctx.beginPath(); ctx.moveTo(0, iy); ctx.lineTo(12, iy); ctx.stroke(); ctx.closePath();
             ctx.fillText(y.toFixed(n), 2, iy + 10 );
        }

    }
}

Grapher.prototype.mouseDown = function(e)
{
    if(!e) var e = window.event;
    if( this.mRangeType!=2 ) return;

    if( (e.button==0) && (e.shiftKey==false) )
        this.mMouseFunction = 1;
    else
        this.mMouseFunction = 2;
    this.mRefCx = this.mCx;
    this.mRefCy = this.mCy;
    this.mRefRx = this.mRx;
    this.mRefRy = this.mRy;
    this.mRefMouseX = e.clientX;
    this.mRefMouseY = e.clientY;
}

Grapher.prototype.mouseUp = function(e)
{
    this.mMouseFunction = 0;
}

Grapher.prototype.mouseMove = function(e)
{
    if(!e) var e = window.event;

    if( this.mMouseFunction==0 )
    {
        var obj = this.mCanvas; var xo = yo = 0; do { xo += obj.offsetLeft; yo += obj.offsetTop; }while (obj = obj.offsetParent);
        var mousex = e.clientX - xo
        var mousey = e.clientY - yo;
        var x = this.mCx + 2.0*this.mRx*((mousex/this.mXres)-0.5);
        var y = this.mCy - 2.0*this.mRy*((mousey/this.mYres)-0.5);
        var n = this.getPrecision()
        document.getElementById('myCoords').innerHTML = '(' + x.toFixed(n) + ', ' + y.toFixed(n) + ')';
    }

    if( this.mRangeType!=2 ) return;

   if( this.mMouseFunction==1 )
    {
        this.mCx = this.mRefCx - (e.clientX - this.mRefMouseX) * 2.0*this.mRx / this.mXres;
        this.mCy = this.mRefCy + (e.clientY - this.mRefMouseY) * 2.0*this.mRy / this.mYres;
        this.draw();
    }
    else if( this.mMouseFunction==2 )
    {
        var scale = Math.pow(0.99, (e.clientX - this.mRefMouseX));
        this.mRx = this.mRefRx * scale;
        this.mRy = this.mRefRy * scale;
        this.draw();
    }
}