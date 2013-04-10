//code adapted from http://mobile.tutsplus.com/tutorials/iphone/building-an-iscroll-kitchen-sink/
var pullDownEl,
pullDownOffset,
generatedCount = 0;
var theScroll;
function scroll() {
  function pullDownAction () {
      var el, li, i;
      el = document.getElementById('refreshList');
      for (i=0; i<3; i++) {
          li = document.createElement('li');
          li.innerText = 'Generated row ' + (++generatedCount);
          el.insertBefore(li, el.childNodes[0]);
      }
      theScroll.refresh();
  }
  pullDownEl = document.getElementById('pullDown');
  pullDownOffset = pullDownEl.offsetHeight;
  theScroll = new iScroll('wrapper', {
      useTransition: true,
      topOffset: pullDownOffset,
      onRefresh: function ()
      {
          if (pullDownEl.className.match('loading')) {
              pullDownEl.className = '';
              pullDownEl.querySelector('.pullDownLabel').innerHTML = 'Pull down to refresh...';
              }
      },
      onScrollMove: function () {
          if (this.y > 5 && !pullDownEl.className.match('flip')) {
              pullDownEl.className = 'flip';
              pullDownEl.querySelector('.pullDownLabel').innerHTML = 'Release to refresh...';
              this.minScrollY = 0;
              }
      },
      onScrollEnd: function () {
          if (pullDownEl.className.match('flip')) {
              pullDownEl.className = 'loading';
              pullDownEl.querySelector('.pullDownLabel').innerHTML = 'Loading...';
              pullDownAction();
          }
      }
  });
}
document.addEventListener('DOMContentLoaded', scroll, false);