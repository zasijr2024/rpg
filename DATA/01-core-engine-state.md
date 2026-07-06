# Core Engine, State, Scoring, Prestige Data

Generated from the original game source. Callback functions and formulas are preserved because they carry gameplay data such as costs, rewards, unlock conditions, and side effects.

## Scope

Global version/configuration, perk definitions, state categories/migrations, score formula, prestige store map, and persistent state behavior.

## Source Files

- `ORIGINAL/script/engine.js` (834 lines)
- `ORIGINAL/script/state_manager.js` (392 lines)
- `ORIGINAL/script/scoring.js` (28 lines)
- `ORIGINAL/script/prestige.js` (99 lines)

## `ORIGINAL/script/engine.js`

````javascript
(function() {
  var Engine = window.Engine = {

    SITE_URL: encodeURIComponent("http://adarkroom.doublespeakgames.com"),
    VERSION: 1.3,
    MAX_STORE: 99999999999999,
    SAVE_DISPLAY: 30 * 1000,
    GAME_OVER: false,

    //object event types
    topics: {},

    Perks: {
      'boxer': {
        name: _('boxer'),
        desc: _('punches do more damage'),
        /// TRANSLATORS : means with more force.
        notify: _('learned to throw punches with purpose')
      },
      'martial artist': {
        name: _('martial artist'),
        desc: _('punches do even more damage.'),
        notify: _('learned to fight quite effectively without weapons')
      },
      'unarmed master': {
        /// TRANSLATORS : master of unarmed combat
        name: _('unarmed master'),
        desc: _('punch twice as fast, and with even more force'),
        notify: _('learned to strike faster without weapons')
      },
      'barbarian': {
        name: _('barbarian'),
        desc: _('melee weapons deal more damage'),
        notify: _('learned to swing weapons with force')
      },
      'slow metabolism': {
        name: _('slow metabolism'),
        desc: _('go twice as far without eating'),
        notify: _('learned how to ignore the hunger')
      },
      'desert rat': {
        name: _('desert rat'),
        desc: _('go twice as far without drinking'),
        notify: _('learned to love the dry air')
      },
      'evasive': {
        name: _('evasive'),
        desc: _('dodge attacks more effectively'),
        notify: _("learned to be where they're not")
      },
      'precise': {
        name: _('precise'),
        desc: _('land blows more often'),
        notify: _('learned to predict their movement')
      },
      'scout': {
        name: _('scout'),
        desc: _('see farther'),
        notify: _('learned to look ahead')
      },
      'stealthy': {
        name: _('stealthy'),
        desc: _('better avoid conflict in the wild'),
        notify: _('learned how not to be seen')
      },
      'gastronome': {
        name: _('gastronome'),
        desc: _('restore more health when eating'),
        notify: _('learned to make the most of food')
      }
    },

    options: {
      state: null,
      debug: false,
      log: false,
      dropbox: false,
      doubleTime: false
    },

    init: function(options) {
      this.options = $.extend(
        this.options,
        options
      );
      this._debug = this.options.debug;
      this._log = this.options.log;

      // Check for HTML5 support
      if(!Engine.browserValid()) {
        window.location = 'browserWarning.html';
      }

      // Check for mobile
      if(Engine.isMobile()) {
        window.location = 'mobileWarning.html';
      }

      Engine.disableSelection();

      if(this.options.state != null) {
        window.State = this.options.state;
      } else {
        Engine.loadGame();
      }

      // start loading music and events early
      for (var key in AudioLibrary) {
        if (
          key.toString().indexOf('MUSIC_') > -1 ||
          key.toString().indexOf('EVENT_') > -1) {
            AudioEngine.loadAudioFile(AudioLibrary[key]);
          }
      }

      $('<div>').attr('id', 'locationSlider').appendTo('#main');

      var menu = $('<div>')
        .addClass('menu')
        .appendTo('body');

      if(typeof langs != 'undefined'){
        var customSelect = $('<span>')
          .addClass('customSelect')
          .addClass('menuBtn')
          .appendTo(menu);
        var selectOptions = $('<span>')
          .addClass('customSelectOptions')
          .appendTo(customSelect);
        var optionsList = $('<ul>')
          .appendTo(selectOptions);
        $('<li>')
          .text("language.")
          .appendTo(optionsList);

        $.each(langs, function(name,display){
          $('<li>')
            .text(display)
            .attr('data-language', name)
            .on("click", function() { Engine.switchLanguage(this); })
            .appendTo(optionsList);
        });
      }

      $('<span>')
        .addClass('volume menuBtn')
        .text(_('sound on.'))
        .click(() => Engine.toggleVolume())
        .appendTo(menu);

      $('<span>')
        .addClass('appStore menuBtn')
        .text(_('get the app.'))
        .click(Engine.getApp)
        .appendTo(menu);

      $('<span>')
        .addClass('lightsOff menuBtn')
        .text(_('lights off.'))
        .click(Engine.turnLightsOff)
        .appendTo(menu);

      $('<span>')
        .addClass('hyper menuBtn')
        .text(_('hyper.'))
        .click(Engine.confirmHyperMode)
        .appendTo(menu);

      $('<span>')
        .addClass('menuBtn')
        .text(_('restart.'))
        .click(Engine.confirmDelete)
        .appendTo(menu);

      $('<span>')
        .addClass('menuBtn')
        .text(_('share.'))
        .click(Engine.share)
        .appendTo(menu);

      $('<span>')
        .addClass('menuBtn')
        .text(_('save.'))
        .click(Engine.exportImport)
        .appendTo(menu);

      if(this.options.dropbox && Engine.Dropbox) {
        this.dropbox = Engine.Dropbox.init();

        $('<span>')
          .addClass('menuBtn')
          .text(_('dropbox.'))
          .click(Engine.Dropbox.startDropbox)
          .appendTo(menu);
      }

      $('<span>')
        .addClass('menuBtn')
        .text(_('github.'))
        .click(function() { window.open('https://github.com/doublespeakgames/adarkroom'); })
        .appendTo(menu);

      // Register keypress handlers
      $('body').off('keydown').keydown(Engine.keyDown);
      $('body').off('keyup').keyup(Engine.keyUp);

      // Register swipe handlers
      swipeElement = $('#outerSlider');
      swipeElement.on('swipeleft', Engine.swipeLeft);
      swipeElement.on('swiperight', Engine.swipeRight);
      swipeElement.on('swipeup', Engine.swipeUp);
      swipeElement.on('swipedown', Engine.swipeDown);

      // subscribe to stateUpdates
      $.Dispatch('stateUpdate').subscribe(Engine.handleStateUpdates);

      $SM.init();
      AudioEngine.init();
      Notifications.init();
      Events.init();
      Room.init();


      if(typeof $SM.get('stores.wood') != 'undefined') {
        Outside.init();
      }
      if($SM.get('stores.compass', true) > 0) {
        Path.init();
      }
      if ($SM.get('features.location.fabricator')) {
        Fabricator.init();
      }
      if($SM.get('features.location.spaceShip')) {
        Ship.init();
      }

      if($SM.get('config.lightsOff', true)){
        Engine.turnLightsOff();
      }

      if($SM.get('config.hyperMode', true)){
        Engine.triggerHyperMode();
      }

      Engine.toggleVolume(Boolean($SM.get('config.soundOn')));
      if(!AudioEngine.isAudioContextRunning()){
        document.addEventListener('click', Engine.resumeAudioContext, true);
      }
      
      Engine.saveLanguage();
      Engine.travelTo(Room);

      setTimeout(notifyAboutSound, 3000);

    },
    resumeAudioContext: function () {
      AudioEngine.tryResumingAudioContext();
      
      // turn on music!
          AudioEngine.setMasterVolume($SM.get('config.soundOn') ? 1.0 : 0.0, 0);

      document.removeEventListener('click', Engine.resumeAudioContext);
    },
    browserValid: function() {
      return ( location.search.indexOf( 'ignorebrowser=true' ) >= 0 || ( typeof Storage != 'undefined' && !oldIE ) );
    },

    isMobile: function() {
      return ( location.search.indexOf( 'ignorebrowser=true' ) < 0 && /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test( navigator.userAgent ) );
    },

    saveGame: function() {
      if(typeof Storage != 'undefined' && localStorage) {
        if(Engine._saveTimer != null) {
          clearTimeout(Engine._saveTimer);
        }
        if(typeof Engine._lastNotify == 'undefined' || Date.now() - Engine._lastNotify > Engine.SAVE_DISPLAY){
          $('#saveNotify').css('opacity', 1).animate({opacity: 0}, 1000, 'linear');
          Engine._lastNotify = Date.now();
        }
        localStorage.gameState = JSON.stringify(State);
      }
    },

    loadGame: function() {
      try {
        var savedState = JSON.parse(localStorage.gameState);
        if(savedState) {
          State = savedState;
          $SM.updateOldState();
          Engine.log("loaded save!");
        }
      } catch(e) {
        State = {};
        $SM.set('version', Engine.VERSION);
        Engine.event('progress', 'new game');
      }
    },

    exportImport: function() {
      Events.startEvent({
        title: _('Export / Import'),
        scenes: {
          start: {
            text: [
              _('export or import save data, for backing up'),
              _('or migrating computers')
            ],
            buttons: {
              'export': {
                text: _('export'),
                nextScene: {1: 'inputExport'}
              },
              'import': {
                text: _('import'),
                nextScene: {1: 'confirm'}
              },
              'cancel': {
                text: _('cancel'),
                nextScene: 'end'
              }
            }
          },
          'inputExport': {
            text: [_('save this.')],
            textarea: Engine.export64(),
            onLoad: function() { Engine.event('progress', 'export'); },
            readonly: true,
            buttons: {
              'done': {
                text: _('got it'),
                nextScene: 'end',
                onChoose: Engine.disableSelection
              }
            }
          },
          'confirm': {
            text: [
              _('are you sure?'),
              _('if the code is invalid, all data will be lost.'),
              _('this is irreversible.')
            ],
            buttons: {
              'yes': {
                text: _('yes'),
                nextScene: {1: 'inputImport'},
                onChoose: Engine.enableSelection
              },
              'no': {
                text: _('no'),
                nextScene: {1: 'start'}
              }
            }
          },
          'inputImport': {
            text: [_('put the save code here.')],
            textarea: '',
            buttons: {
              'okay': {
                text: _('import'),
                nextScene: 'end',
                onChoose: Engine.import64
              },
              'cancel': {
                text: _('cancel'),
                nextScene: 'end'
              }
            }
          }
        }
      });
    },

    generateExport64: function(){
      var string64 = Base64.encode(localStorage.gameState);
      string64 = string64.replace(/\s/g, '');
      string64 = string64.replace(/\./g, '');
      string64 = string64.replace(/\n/g, '');

      return string64;
    },

    export64: function() {
      Engine.saveGame();
      Engine.enableSelection();
      return Engine.generateExport64();
    },

    import64: function(string64) {
      Engine.event('progress', 'import');
      Engine.disableSelection();
      string64 = string64.replace(/\s/g, '');
      string64 = string64.replace(/\./g, '');
      string64 = string64.replace(/\n/g, '');
      var decodedSave = Base64.decode(string64);
      localStorage.gameState = decodedSave;
      location.reload();
    },

    event: function(cat, act) {
      if(typeof ga === 'function') {
        ga('send', 'event', cat, act);
      }
    },

    confirmDelete: function() {
      Events.startEvent({
        title: _('Restart?'),
        scenes: {
          start: {
            text: [_('restart the game?')],
            buttons: {
              'yes': {
                text: _('yes'),
                nextScene: 'end',
                onChoose: Engine.deleteSave
              },
              'no': {
                text: _('no'),
                nextScene: 'end'
              }
            }
          }
        }
      });
    },

    deleteSave: function(noReload) {
      if(typeof Storage != 'undefined' && localStorage) {
        var prestige = Prestige.get();
        window.State = {};
        localStorage.clear();
        Prestige.set(prestige);
      }
      if(!noReload) {
        location.reload();
      }
    },

    getApp: function() {
      Events.startEvent({
        title: _('Get the App'),
        scenes: {
          start: {
            text: [_('bring the room with you.')],
            buttons: {
              'ios': {
                text: _('ios'),
                nextScene: 'end',
                onChoose: function () {
                  window.open('https://itunes.apple.com/app/apple-store/id736683061?pt=2073437&ct=adrproper&mt=8');
                }
              },
              'android': {
                text: _('android'),
                nextScene: 'end',
                onChoose: function() {
                  window.open('https://play.google.com/store/apps/details?id=com.yourcompany.adarkroom');
                }
              },
              'close': {
                text: _('close'),
                nextScene: 'end'
              }
            }
          }
        }
      });
    },

    share: function() {
      Events.startEvent({
        title: _('Share'),
        scenes: {
          start: {
            text: [_('bring your friends.')],
            buttons: {
              'facebook': {
                text: _('facebook'),
                nextScene: 'end',
                onChoose: function() {
                  window.open('https://www.facebook.com/sharer/sharer.php?u=' + Engine.SITE_URL, 'sharer', 'width=626,height=436,location=no,menubar=no,resizable=no,scrollbars=no,status=no,toolbar=no');
                }
              },
              'google': {
                text:_('google+'),
                nextScene: 'end',
                onChoose: function() {
                  window.open('https://plus.google.com/share?url=' + Engine.SITE_URL, 'sharer', 'width=480,height=436,location=no,menubar=no,resizable=no,scrollbars=no,status=no,toolbar=no');
                }
              },
              'twitter': {
                text: _('twitter'),
                nextScene: 'end',
                onChoose: function() {
                  window.open('https://twitter.com/intent/tweet?text=A%20Dark%20Room&url=' + Engine.SITE_URL, 'sharer', 'width=660,height=260,location=no,menubar=no,resizable=no,scrollbars=yes,status=no,toolbar=no');
                }
              },
              'reddit': {
                text: _('reddit'),
                nextScene: 'end',
                onChoose: function() {
                  window.open('http://www.reddit.com/submit?url=' + Engine.SITE_URL, 'sharer', 'width=960,height=700,location=no,menubar=no,resizable=no,scrollbars=yes,status=no,toolbar=no');
                }
              },
              'close': {
                text: _('close'),
                nextScene: 'end'
              }
            }
          }
        }
      },
      {
        width: '400px'
      });
    },

    findStylesheet: function(title) {
      for(var i=0; i<document.styleSheets.length; i++) {
        var sheet = document.styleSheets[i];
        if(sheet.title == title) {
          return sheet;
        }
      }
      return null;
    },

    isLightsOff: function() {
      var darkCss = Engine.findStylesheet('darkenLights');
      if ( darkCss != null && !darkCss.disabled ) {
        return true;
      }
      return false;
    },

    turnLightsOff: function() {
      var darkCss = Engine.findStylesheet('darkenLights');
      if (darkCss == null) {
        $('head').append('<link rel="stylesheet" href="css/dark.css" type="text/css" title="darkenLights" />');
        $('.lightsOff').text(_('lights on.'));
        $SM.set('config.lightsOff', true, true);
      } else if (darkCss.disabled) {
        darkCss.disabled = false;
        $('.lightsOff').text(_('lights on.'));
        $SM.set('config.lightsOff', true,true);
      } else {
        $("#darkenLights").attr("disabled", "disabled");
        darkCss.disabled = true;
        $('.lightsOff').text(_('lights off.'));
        $SM.set('config.lightsOff', false, true);
      }
    },

    confirmHyperMode: function(){
      if (!Engine.options.doubleTime) {
        Events.startEvent({
          title: _('Go Hyper?'),
          scenes: {
            start: {
              text: [_('turning hyper mode speeds up the game to x2 speed. do you want to do that?')],
              buttons: {
                'yes': {
                  text: _('yes'),
                  nextScene: 'end',
                  onChoose: Engine.triggerHyperMode
                },
                'no': {
                  text: _('no'),
                  nextScene: 'end'
                }
              }
            }
          }
        });
      } else {
        Engine.triggerHyperMode();
      }
    },

    triggerHyperMode: function() {
      Engine.options.doubleTime = !Engine.options.doubleTime;
      if(Engine.options.doubleTime)
        $('.hyper').text(_('classic.'));
      else
        $('.hyper').text(_('hyper.'));

      $SM.set('config.hyperMode', Engine.options.doubleTime, false);
    },

    // Gets a guid
    getGuid: function() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
      });
    },

    activeModule: null,

    travelTo: function(module) {
      if(Engine.activeModule == module) {
        return;
      }

      var currentIndex = Engine.activeModule ? $('.location').index(Engine.activeModule.panel) : 1;
      $('div.headerButton').removeClass('selected');
      module.tab.addClass('selected');

      var slider = $('#locationSlider');
      var stores = $('#storesContainer');
      var panelIndex = $('.location').index(module.panel);
      var diff = Math.abs(panelIndex - currentIndex);
      slider.animate({left: -(panelIndex * 700) + 'px'}, 300 * diff);

      if($SM.get('stores.wood') !== undefined) {
        // FIXME Why does this work if there's an animation queue...?
        stores.animate({right: -(panelIndex * 700) + 'px'}, 300 * diff);
      }

      if(Engine.activeModule == Room || Engine.activeModule == Path || Engine.activeModule == Fabricator) {
        // Don't fade out the weapons if we're switching to a module
        // where we're going to keep showing them anyway.
        if (module != Room && module != Path && module != Fabricator) {
          $('div#weapons').animate({opacity: 0}, 300);
        }
      }

      if(module == Room || module == Path || module == Fabricator) {
        $('div#weapons').animate({opacity: 1}, 300);
      }

      Engine.activeModule = module;
      module.onArrival(diff);
      Notifications.printQueue(module);
    },

    /* Move the stores panel beneath top_container (or to top: 0px if top_container
     * either hasn't been filled in or is null) using transition_diff to sync with
     * the animation in Engine.travelTo().
     */
    moveStoresView: function(top_container, transition_diff) {
      var stores = $('#storesContainer');

      // If we don't have a storesContainer yet, leave.
      if(typeof(stores) === 'undefined') return;

      if(typeof(transition_diff) === 'undefined') transition_diff = 1;

      if(top_container === null) {
        stores.animate({top: '0px'}, {queue: false, duration: 300 * transition_diff});
      }
      else if(!top_container.length) {
        stores.animate({top: '0px'}, {queue: false, duration: 300 * transition_diff});
      }
      else {
        stores.animate({
          top: top_container.height() + 26 + 'px'
        }, {
          queue: false,
          duration: 300 * transition_diff
        });
      }
    },

    log: function(msg) {
      if(this._log) {
        console.log(msg);
      }
    },

    updateSlider: function() {
      var slider = $('#locationSlider');
      slider.width((slider.children().length * 700) + 'px');
    },

    updateOuterSlider: function() {
      var slider = $('#outerSlider');
      slider.width((slider.children().length * 700) + 'px');
    },

    getIncomeMsg: function(num, delay) {
      return _("{0} per {1}s", (num > 0 ? "+" : "") + num, delay);
      //return (num > 0 ? "+" : "") + num + " per " + delay + "s";
    },

    keyLock: false,
    tabNavigation: true,
    restoreNavigation: false,

    keyDown: function(e) {
      e = e || window.event;
      if(!Engine.keyPressed && !Engine.keyLock) {
        Engine.pressed = true;
        if(Engine.activeModule.keyDown) {
          Engine.activeModule.keyDown(e);
        }
      }
      return jQuery.inArray(e.keycode, [37,38,39,40]) < 0;
    },

    keyUp: function(e) {
      Engine.pressed = false;
      if(Engine.activeModule.keyUp) {
        Engine.activeModule.keyUp(e);
      } else {
        switch(e.which) {
          case 38: // Up
          case 87:
            Engine.log('up');
            break;
          case 40: // Down
          case 83:
            Engine.log('down');
            break;
          case 37: // Left
          case 65:
            if (Engine.tabNavigation) {
              if (Engine.activeModule == Ship && Fabricator.tab) {
                Engine.travelTo(Fabricator);
              }
              else if ((Engine.activeModule == Ship || Engine.activeModule == Fabricator) && Path.tab) {
                Engine.travelTo(Path);
              }
              else if (Engine.activeModule == Path && Outside.tab) {
                Engine.travelTo(Outside);
              } 
              else if (Engine.activeModule == Outside && Room.tab) {
                Engine.travelTo(Room);
              }
            }
            Engine.log('left');
            break;
          case 39: // Right
          case 68:
            if (Engine.tabNavigation){
              if (Engine.activeModule == Room && Outside.tab) {
                Engine.travelTo(Outside);
              }
              else if (Engine.activeModule == Outside && Path.tab){
                Engine.travelTo(Path);
              }
              else if(Engine.activeModule == Path && Fabricator.tab) {
                Engine.travelTo(Fabricator);
              }
              else if ((Engine.activeModule == Path || Engine.activeModule == Fabricator) && Ship.tab){
                Engine.travelTo(Ship);
              }
            }
            Engine.log('right');
            break;
        }
      }
      if(Engine.restoreNavigation){
        Engine.tabNavigation = true;
        Engine.restoreNavigation = false;
      }
      return false;
    },

    swipeLeft: function(e) {
      if(Engine.activeModule.swipeLeft) {
        Engine.activeModule.swipeLeft(e);
      }
    },

    swipeRight: function(e) {
      if(Engine.activeModule.swipeRight) {
        Engine.activeModule.swipeRight(e);
      }
    },

    swipeUp: function(e) {
      if(Engine.activeModule.swipeUp) {
        Engine.activeModule.swipeUp(e);
      }
    },

    swipeDown: function(e) {
      if(Engine.activeModule.swipeDown) {
        Engine.activeModule.swipeDown(e);
      }
    },

    disableSelection: function() {
      document.onselectstart = eventNullifier; // this is for IE
      document.onmousedown = eventNullifier; // this is for the rest
    },

    enableSelection: function() {
      document.onselectstart = eventPassthrough;
      document.onmousedown = eventPassthrough;
    },

    autoSelect: function(selector) {
      $(selector).focus().select();
    },

    handleStateUpdates: function(e){

    },

    switchLanguage: function(dom){
      var lang = $(dom).data("language");
      if(document.location.href.search(/[\?\&]lang=[a-z_]+/) != -1){
        document.location.href = document.location.href.replace( /([\?\&]lang=)([a-z_]+)/gi , "$1"+lang );
      }else{
        document.location.href = document.location.href + ( (document.location.href.search(/\?/) != -1 )?"&":"?") + "lang="+lang;
      }
    },

    saveLanguage: function(){
      var lang = decodeURIComponent((new RegExp('[?|&]lang=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
      if(lang && typeof Storage != 'undefined' && localStorage) {
        localStorage.lang = lang;
      }
    },

    toggleVolume: function(enabled /* optional */) {
      if (enabled == null) {
        enabled = !$SM.get('config.soundOn');
      }
      if (!enabled) {
        $('.volume').text(_('sound on.'));
        $SM.set('config.soundOn', false);
        AudioEngine.setMasterVolume(0.0);
      } else {
        $('.volume').text(_('sound off.'));
        $SM.set('config.soundOn', true);
        AudioEngine.setMasterVolume(1.0);
      }
    },

    setInterval: function(callback, interval, skipDouble){
      if( Engine.options.doubleTime && !skipDouble ){
        Engine.log('Double time, cutting interval in half');
        interval /= 2;
      }

      return setInterval(callback, interval);

    },

    setTimeout: function(callback, timeout, skipDouble){

      if( Engine.options.doubleTime && !skipDouble ){
        Engine.log('Double time, cutting timeout in half');
        timeout /= 2;
      }

      return setTimeout(callback, timeout);

    }
  };

  function eventNullifier(e) {
    return $(e.target).hasClass('menuBtn');
  }

  function eventPassthrough(e) {
    return true;
  }

  function notifyAboutSound() {
    if ($SM.get('playStats.audioAlertShown')) {
      return;
    }

    // Tell new users that there's sound now!
    $SM.set('playStats.audioAlertShown', true);
    Events.startEvent({
      title: _('Sound Available!'),
      scenes: {
        start: {
          text: [
            _('ears flooded with new sensations.'),
            _('perhaps silence is safer?')
          ],
          buttons: {
            'yes': {
              text: _('enable audio'),
              nextScene: 'end',
              onChoose: () => Engine.toggleVolume(true)
            },
            'no': {
              text: _('disable audio'),
              nextScene: 'end',
              onChoose: () => Engine.toggleVolume(false)
            }
          }
        }
      }
    });
  }

})();

function inView(dir, elem){

  var scTop = $('#main').offset().top;
  var scBot = scTop + $('#main').height();

  var elTop = elem.offset().top;
  var elBot = elTop + elem.height();

  if( dir == 'up' ){
    // STOP MOVING IF BOTTOM OF ELEMENT IS VISIBLE IN SCREEN
    return ( elBot < scBot );
  } else if( dir == 'down' ){
    return ( elTop > scTop );
  } else {
    return ( ( elBot <= scBot ) && ( elTop >= scTop ) );
  }

}

function setYPosition(elem, y) {
  var elTop = parseInt( elem.css('top'), 10 );
  elem.css('top', `${y}px`);
}


//create jQuery Callbacks() to handle object events
$.Dispatch = function( id ) {
  var callbacks, topic = id && Engine.topics[ id ];
  if ( !topic ) {
    callbacks = jQuery.Callbacks();
    topic = {
      publish: callbacks.fire,
      subscribe: callbacks.add,
      unsubscribe: callbacks.remove
    };
    if ( id ) {
      Engine.topics[ id ] = topic;
    }
  }
  return topic;
};

$(function() {
  Engine.init();
});
````

## `ORIGINAL/script/state_manager.js`

````javascript
/*
 * Module for handling States
 *
 * All states should be get and set through the StateManager ($SM).
 *
 * The manager is intended to handle all needed checks and error catching.
 * This includes creating the parents of layered/deep states so undefined states
 * do not need to be tested for and created beforehand.
 *
 * When a state is changed, an update event is sent out containing the name of the state
 * changed or in the case of multiple changes (.setM, .addM) the parent class changed.
 * Event: type: 'stateUpdate', stateName: <path of state or parent state>
 *
 * Original file created by: Michael Galusha
 */

var StateManager = {

	MAX_STORE: 99999999999999,

	options: {},

	init: function(options) {
		this.options = $.extend(
				this.options,
				options
		);

		//create categories
		var cats = [
			'features',     // big features like buildings, location availability, unlocks, etc
			'stores',       // little stuff, items, weapons, etc
			'character',    // this is for player's character stats such as perks
			'income',
			'timers',
			'game',         // mostly location related: fire temp, workers, population, world map, etc
			'playStats',    // anything play related: play time, loads, etc
			'previous',     // prestige, score, trophies (in future), achievements (again, not yet), etc
			'outfit',      	// used to temporarily store the items to be taken on the path
			'config',
			'wait',			// mysterious wanderers are coming back
			'cooldown'      // residual values for cooldown buttons
		];

		for(var which in cats) {
			if(!$SM.get(cats[which])) $SM.set(cats[which], {});
		}

		//subscribe to stateUpdates
		$.Dispatch('stateUpdate').subscribe($SM.handleStateUpdates);
	},

	//create all parents and then set state
	createState: function(stateName, value) {
		var words = stateName.split(/[.\[\]'"]+/);
		//for some reason there are sometimes empty strings
		for (var j = 0; j < words.length; j++) {
			if (words[j] === '') {
				words.splice(j, 1);
				j--;
			}
		}
		var obj = State;
		var w = null;
		for(var i=0, len=words.length-1;i<len;i++){
			w = words[i];
			if(obj[w] === undefined ) obj[w] = {};
			obj = obj[w];
		}
		obj[words[i]] = value;
		return obj;
	},

	//set single state
	//if noEvent is true, the update event won't trigger, useful for setting multiple states first
	set: function(stateName, value, noEvent) {
		var fullPath = $SM.buildPath(stateName);

		//make sure the value isn't over the engine maximum
		if(typeof value == 'number' && value > $SM.MAX_STORE) value = $SM.MAX_STORE;

		try{
			eval('('+fullPath+') = value');
		} catch (e) {
			//parent doesn't exist, so make parent
			$SM.createState(stateName, value);
		}

		//stores values can not be negative
		if(stateName.indexOf('stores') === 0 && $SM.get(stateName, true) < 0) {
			eval('('+fullPath+') = 0');
			Engine.log('WARNING: state:' + stateName + ' can not be a negative value. Set to 0 instead.');
		}

		if(!noEvent) {
			Engine.saveGame();
			$SM.fireUpdate(stateName);
		}
	},

	//sets a list of states
	setM: function(parentName, list, noEvent) {
		$SM.buildPath(parentName);

		//make sure the state exists to avoid errors,
		if($SM.get(parentName) === undefined) $SM.set(parentName, {}, true);

		for(var k in list){
			$SM.set(parentName+'["'+k+'"]', list[k], true);
		}

		if(!noEvent) {
			Engine.saveGame();
			$SM.fireUpdate(parentName);
		}
	},

	//shortcut for altering number values, return 1 if state wasn't a number
	add: function(stateName, value, noEvent) {
		var err = 0;
		//0 if undefined, null (but not {}) should allow adding to new objects
		//could also add in a true = 1 thing, to have something go from existing (true)
		//to be a count, but that might be unwanted behavior (add with loose eval probably will happen anyways)
		var old = $SM.get(stateName, true);

		//check for NaN (old != old) and non number values
		if(old != old){
			Engine.log('WARNING: '+stateName+' was corrupted (NaN). Resetting to 0.');
			old = 0;
			$SM.set(stateName, old + value, noEvent);
		} else if(typeof old != 'number' || typeof value != 'number'){
			Engine.log('WARNING: Can not do math with state:'+stateName+' or value:'+value+' because at least one is not a number.');
			err = 1;
		} else {
			$SM.set(stateName, old + value, noEvent); //setState handles event and save
		}

		return err;
	},

	//alters multiple number values, return number of fails
	addM: function(parentName, list, noEvent) {
		var err = 0;

		//make sure the parent exists to avoid errors
		if($SM.get(parentName) === undefined) $SM.set(parentName, {}, true);

		for(var k in list){
			if($SM.add(parentName+'["'+k+'"]', list[k], true)) err++;
		}

		if(!noEvent) {
			Engine.saveGame();
			$SM.fireUpdate(parentName);
		}
		return err;
	},

	//return state, undefined or 0
	get: function(stateName, requestZero) {
		var whichState = null;
		var fullPath = $SM.buildPath(stateName);

		//catch errors if parent of state doesn't exist
		try{
			eval('whichState = ('+fullPath+')');
		} catch (e) {
			whichState = undefined;
		}

		//prevents repeated if undefined, null, false or {}, then x = 0 situations
		if((!whichState || whichState == {}) && requestZero) return 0;
		else return whichState;
	},

	//mainly for local copy use, add(M) can fail so we can't shortcut them
	//since set does not fail, we know state exists and can simply return the object
	setget: function(stateName, value, noEvent){
		$SM.set(stateName, value, noEvent);
		return eval('('+$SM.buildPath(stateName)+')');
	},

	remove: function(stateName, noEvent) {
		var whichState = $SM.buildPath(stateName);
		try{
			eval('(delete '+whichState+')');
		} catch (e) {
			//it didn't exist in the first place
			Engine.log('WARNING: Tried to remove non-existant state \''+stateName+'\'.');
		}
		if(!noEvent){
			Engine.saveGame();
			$SM.fireUpdate(stateName);
		}
	},

	removeBranch: function(stateName, noEvent) {
		for(var i in $SM.get(stateName)){
			if(typeof $SM.get(stateName)[i] == 'object'){
				$SM.removeBranch(stateName +'["'+ i +'"]');
			}
		}
		if($.isEmptyObject($SM.get(stateName))){
			$SM.remove(stateName);
		}
		if(!noEvent){
			Engine.saveGame();
			$SM.fireUpdate(stateName);
		}
	},

	//creates full reference from input
	//hopefully this won't ever need to be more complicated
	buildPath: function(input){
		var dot = (input.charAt(0) == '[')? '' : '.'; //if it starts with [foo] no dot to join
		return 'State' + dot + input;
	},

	fireUpdate: function(stateName, save){
		var category = $SM.getCategory(stateName);
		if(stateName === undefined) stateName = category = 'all'; //best if this doesn't happen as it will trigger more stuff
		$.Dispatch('stateUpdate').publish({'category': category, 'stateName':stateName});
		if(save) Engine.saveGame();
	},

	getCategory: function(stateName){
		var firstOB = stateName.indexOf('[');
		var firstDot = stateName.indexOf('.');
		var cutoff = null;
		if(firstOB == -1 || firstDot == -1){
			cutoff = firstOB > firstDot ? firstOB : firstDot;
		} else {
			cutoff = firstOB < firstDot ? firstOB : firstDot;
		}
		if (cutoff == -1){
			return stateName;
		} else {
			return stateName.substr(0,cutoff);
		}
	},

	//Use this function to make old save games compatible with new version
	updateOldState: function(){
		var version = $SM.get('version');
		if(typeof version != 'number') version = 1.0;
		if(version == 1.0) {
			// v1.1 introduced the Lodge, so get rid of lodgeless hunters
			$SM.remove('outside.workers.hunter', true);
			$SM.remove('income.hunter', true);
			Engine.log('upgraded save to v1.1');
			version = 1.1;
		}
		if(version == 1.1) {
			//v1.2 added the Swamp to the map, so add it to already generated maps
			if($SM.get('world')) {
				World.placeLandmark(15, World.RADIUS * 1.5, World.TILE.SWAMP, $SM.get('world.map'));
			}
			Engine.log('upgraded save to v1.2');
			version = 1.2;
		}
		if(version == 1.2) {
			//StateManager added, so move data to new locations
			$SM.remove('room.fire');
			$SM.remove('room.temperature');
			$SM.remove('room.buttons');
			if($SM.get('room')){
				$SM.set('features.location.room', true);
				$SM.set('game.builder.level', $SM.get('room.builder'));
				$SM.remove('room');
			}
			if($SM.get('outside')){
				$SM.set('features.location.outside', true);
				$SM.set('game.population', $SM.get('outside.population'));
				$SM.set('game.buildings', $SM.get('outside.buildings'));
				$SM.set('game.workers', $SM.get('outside.workers'));
				$SM.set('game.outside.seenForest', $SM.get('outside.seenForest'));
				$SM.remove('outside');
			}
			if($SM.get('world')){
				$SM.set('features.location.world', true);
				$SM.set('game.world.map', $SM.get('world.map'));
				$SM.set('game.world.mask', $SM.get('world.mask'));
				$SM.set('starved', $SM.get('character.starved', true));
				$SM.set('dehydrated', $SM.get('character.dehydrated', true));
				$SM.remove('world');
				$SM.remove('starved');
				$SM.remove('dehydrated');
			}
			if($SM.get('ship')){
				$SM.set('features.location.spaceShip', true);
				$SM.set('game.spaceShip.hull', $SM.get('ship.hull', true));
				$SM.set('game.spaceShip.thrusters', $SM.get('ship.thrusters', true));
				$SM.set('game.spaceShip.seenWarning', $SM.get('ship.seenWarning'));
				$SM.set('game.spaceShip.seenShip', $SM.get('ship.seenShip'));
				$SM.remove('ship');
			}
			if($SM.get('punches')){
				$SM.set('character.punches', $SM.get('punches'));
				$SM.remove('punches');
			}
			if($SM.get('perks')){
				$SM.set('character.perks', $SM.get('perks'));
				$SM.remove('perks');
			}
			if($SM.get('thieves')){
				$SM.set('game.thieves', $SM.get('thieves'));
				$SM.remove('thieves');
			}
			if($SM.get('stolen')){
				$SM.set('game.stolen', $SM.get('stolen'));
				$SM.remove('stolen');
			}
			if($SM.get('cityCleared')){
				$SM.set('character.cityCleared', $SM.get('cityCleared'));
				$SM.remove('cityCleared');
			}
			$SM.set('version', 1.3);
		}
	},

	/******************************************************************
	 * Start of specific state functions
	 ******************************************************************/
	//PERKS
	addPerk: function(name) {
		$SM.set('character.perks["'+name+'"]', true);
		Notifications.notify(null, Engine.Perks[name].notify);
	},

	hasPerk: function(name) {
		return $SM.get('character.perks["'+name+'"]');
	},

	//INCOME
	setIncome: function(source, options) {
		var existing = $SM.get('income["'+source+'"]');
		if(typeof existing != 'undefined') {
			options.timeLeft = existing.timeLeft;
		}
		$SM.set('income["'+source+'"]', options);
	},

	getIncome: function(source) {
		var existing = $SM.get('income["'+source+'"]');
		if(typeof existing != 'undefined') {
			return existing;
		}
		return {};
	},

	collectIncome: function() {
		var changed = false;
		if(typeof $SM.get('income') != 'undefined' && Engine.activeModule != Space) {
			for(var source in $SM.get('income')) {
				var income = $SM.get('income["'+source+'"]');
				if(typeof income.timeLeft != 'number')
				{
					income.timeLeft = 0;
				}
				income.timeLeft--;

				if(income.timeLeft <= 0) {
					Engine.log('collection income from ' + source);
					if(source == 'thieves') $SM.addStolen(income.stores);

					var cost = income.stores;
					var ok = true;
					if (source != 'thieves') {
						for (var k in cost) {
							var have = $SM.get('stores["' + k + '"]', true);
							if (have + cost[k] < 0) {
								ok = false;
								break;
							}
						}
					}

					if(ok){
						$SM.addM('stores', income.stores, true);
					}
					changed = true;
					if(typeof income.delay == 'number') {
						income.timeLeft = income.delay;
					}
				}
			}
		}
		if(changed){
			$SM.fireUpdate('income', true);
		}
		Engine._incomeTimeout = Engine.setTimeout($SM.collectIncome, 1000);
	},

	//Thieves
	addStolen: function(stores) {
		for(var k in stores) {
			var old = $SM.get('stores["'+k+'"]', true);
			var short = old + stores[k];
			//if they would steal more than actually owned
			if(short < 0){
				$SM.add('game.stolen["'+k+'"]', (stores[k] * -1) + short);
			} else {
				$SM.add('game.stolen["'+k+'"]', stores[k] * -1);
			}
		}
	},

	startThieves: function() {
		$SM.set('game.thieves', 1);
		$SM.setIncome('thieves', {
			delay: 10,
			stores: {
				'wood': -10,
				'fur': -5,
				'meat': -5
			}
		});
	},

	//Misc
	num: function(name, craftable) {
		switch(craftable.type) {
		case 'good':
		case 'tool':
		case 'weapon':
		case 'upgrade':
		case 'special':
			return $SM.get('stores["'+name+'"]', true);
		case 'building':
			return $SM.get('game.buildings["'+name+'"]', true);
		}
	},

	handleStateUpdates: function(e){

	}
};

//alias
var $SM = StateManager;
````

## `ORIGINAL/script/scoring.js`

````javascript
var Score = {

	name : 'Score',

	options : {},

	init : function(options) {
		this.options = $.extend(this.options, options);
	},

	calculateScore : function() {
		var scoreUnadded = Prestige.getStores(false);
		var fullScore = 0;
		
		var factor = [1, 1.5, 1, 2, 2, 3, 3, 2, 2, 2, 2, 1.5, 1, 
			     1, 10, 30, 50, 100, 150, 150, 3, 3, 5, 4];
		for(var i = 0; i< factor.length; i++){
			fullScore += scoreUnadded[i] * factor[i];
		}
		
		fullScore = fullScore + $SM.get('stores["alien alloy"]', true) * 10;
		fullScore = fullScore + $SM.get('stores["fleet beacon"]', true) * 500;
		fullScore = fullScore + Ship.getMaxHull() * 50;
		return Math.floor(fullScore);
	},

	save: function() {
		$SM.set('playStats.score', Score.calculateScore());
	},

	totalScore : function() {
		return $SM.get('previous.score', true) + Score.calculateScore();
	}
};
````

## `ORIGINAL/script/prestige.js`

````javascript
var Prestige = {
		
	name: 'Prestige',

	options: {},

	init: function(options) {
		this.options = $.extend(this.options, options);
	},
	
	storesMap: [
		{ store: 'wood', type: 'g' },
		{ store: 'fur', type: 'g' },
		{ store: 'meat', type: 'g' },
		{ store: 'iron', type: 'g' },
		{ store: 'coal', type: 'g' },
		{ store: 'sulphur', type: 'g' },
		{ store: 'steel', type: 'g' },
		{ store: 'cured meat', type: 'g' },
		{ store: 'scales', type: 'g' },
		{ store: 'teeth', type: 'g' },
		{ store: 'leather', type: 'g' },
		{ store: 'bait', type: 'g' },
		{ store: 'torch', type: 'g' },
		{ store: 'cloth', type: 'g' },
		{ store: 'bone spear', type: 'w' },
		{ store: 'iron sword', type: 'w' },
		{ store: 'steel sword', type: 'w' },
		{ store: 'bayonet', type: 'w' },
		{ store: 'rifle', type: 'w' },
		{ store: 'laser rifle', type: 'w' },
		{ store: 'bullets', type: 'a' },
		{ store: 'energy cell', type: 'a' },
		{ store: 'grenade', type: 'a' },
		{ store: 'bolas', type: 'a' }
	],
	
	getStores: function(reduce) {
		var stores = [];
		
		for(var i in this.storesMap) {
			var s = this.storesMap[i];
			stores.push(Math.floor($SM.get('stores["' + s.store + '"]', true) / 
					(reduce ? this.randGen(s.type) : 1)));
		}
		
		return stores;
	},
	
	get: function() {
		return {
			stores: $SM.get('previous.stores'),
			score: $SM.get('previous.score')
		};
	},
	
	set: function(prestige) {
		$SM.set('previous.stores', prestige.stores);
		$SM.set('previous.score', prestige.score);
	},
	
	save: function() {
		$SM.set('previous.stores', this.getStores(true));
		$SM.set('previous.score', Score.totalScore());
	},
  
	collectStores : function() {
		var prevStores = $SM.get('previous.stores');
		if(prevStores != null) {
			var toAdd = {};
			for(var i in this.storesMap) {
				var s = this.storesMap[i];
				toAdd[s.store] = prevStores[i];
			}
			$SM.addM('stores', toAdd);
			
			// Loading the stores clears em from the save
			prevStores.length = 0;
		}
	},

	randGen : function(storeType) {
		var amount;
		switch(storeType) {
		case 'g':
			amount = Math.floor(Math.random() * 10);
			break;
		case 'w':
			amount = Math.floor(Math.floor(Math.random() * 10) / 2);
			break;
		case 'a':
			amount = Math.ceil(Math.random() * 10 * Math.ceil(Math.random() * 10));
			break;
		default:
			return 1;
		}
		if (amount !== 0) {
			return amount;
		}
		return 1;
	}

};
````


