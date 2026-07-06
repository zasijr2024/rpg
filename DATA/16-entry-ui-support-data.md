# Entry, UI, and Support Data

Entry-point HTML, package metadata, UI helper components, notification/header support, localization bootstrap, and Dropbox integration prompts/logic. These files are included for complete remake context even though most gameplay content lives in other extraction files.

## Source Files

- `ORIGINAL/index.html` (119 lines)
- `ORIGINAL/browserWarning.html` (43 lines)
- `ORIGINAL/mobileWarning.html` (57 lines)
- `ORIGINAL/package.json` (16 lines)
- `ORIGINAL/README.md` (42 lines)
- `ORIGINAL/script/Button.js` (120 lines)
- `ORIGINAL/script/header.js` (34 lines)
- `ORIGINAL/script/notifications.js` (78 lines)
- `ORIGINAL/script/localization.js` (68 lines)
- `ORIGINAL/script/dropbox.js` (312 lines)
- `ORIGINAL/lang/langs.js` (28 lines)

## `ORIGINAL/index.html`

``html
<!DOCTYPE html>
<html itemscope itemtype="https://schema.org/CreativeWork">
<head>
	<meta charset="UTF-8"/>
	<!--  
		A Dark Room (v1.4)
		==================
		
		A minimalist text adventure by Michael Townsend and all his friends.
		Inspired by Candy Box (https://candybox2.github.io/candybox)
		Contribute on GitHub! (https://github.com/doublespeakgames/adarkroom/)
	-->
	<title>A Dark Room</title>
	<meta itemprop="description" name="description" property="og:description" content="A minimalist text adventure">
	<meta itemprop="image" property="og:image" content="img/adr.png" />
	<meta itemprop="name" property="og:title" content="A Dark Room" />
	<link rel="shortcut icon" href="favicon.ico" />
	<link rel="image_src" href="img/adr.png" />
	<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.10.1/jquery.min.js"></script>
	<script>
		if(!window.jQuery) {
			document.write('<script src="lib/jquery.min.js"><\/script>')
		}
	</script>
	<script src="lib/jquery.color-2.1.2.min.js"></script>
	<script src="lib/jquery.event.move.js"></script>
	<script src="lib/jquery.event.swipe.js"></script>
	<script src="lib/base64.js"></script>
	<script src="lib/translate.js"></script>
	
	<script src="lang/langs.js"></script>
	
	<script>
		// try to read "lang" param's from url
		var lang = decodeURIComponent((new RegExp('[?|&]lang=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
		// if no language requested, try to read it from local storage
		if(!lang){
			try {
				lang = localStorage.lang;
			} catch(e) {}
		}
		// if a language different than english requested, load all translations
		if(lang && lang != 'en'){
			document.write('<script src="lang/'+lang+'/strings.js"><\/script>');
			document.write('<link rel="stylesheet" type="text/css" href="lang/'+lang+'/main.css" \/>');
		}
	</script>
	
	<script src="script/Button.js"></script>
	<script src="script/audioLibrary.js"></script>
	<script src="script/audio.js"></script>
	<script src="script/engine.js"></script>
	<script src="script/state_manager.js"></script>
	<script src="script/header.js"></script>
	<script src="script/notifications.js"></script>
	<script src="script/events.js"></script>
	<script src="script/room.js"></script>
	<script src="script/outside.js"></script>
	<script src="script/world.js"></script>
	<script src="script/path.js"></script>
	<script src="script/ship.js"></script>
  <script src="script/space.js"></script>
  <script src="script/fabricator.js"></script>
	<script src="script/prestige.js"></script>
	<script src="script/scoring.js"></script>
	<!-- Event modules -->
	<script src="script/events/global.js"></script>
	<script src="script/events/room.js"></script>
	<script src="script/events/outside.js"></script>
	<script src="script/events/encounters.js"></script>
  <script src="script/events/setpieces.js"></script>
  <script src="script/events/marketing.js"></script>
	<script src="script/events/executioner.js"></script>
	
	<script type='text/javascript'>
		var oldIE = false;
	</script>
	<!--[if lt IE 9]> 
		<script type="text/javascript">oldIE = true;</script> 
	<![endif]-->
	
	<link rel="stylesheet" type="text/css" href="css/main.css" />
	<link rel="stylesheet" type="text/css" href="css/room.css" />
	<link rel="stylesheet" type="text/css" href="css/outside.css" />
	<link rel="stylesheet" type="text/css" href="css/path.css" />
	<link rel="stylesheet" type="text/css" href="css/world.css" />
	<link rel="stylesheet" type="text/css" href="css/ship.css" />
  <link rel="stylesheet" type="text/css" href="css/space.css" />
  <link rel="stylesheet" type="text/css" href="css/fabricator.css" />
	
	<script src="script/localization.js"></script>
	<!-- Google tag (gtag.js) -->
	<script async src="https://www.googletagmanager.com/gtag/js?id=G-606P6J79WH"></script>
	<script>
		window.dataLayer = window.dataLayer || [];
		function gtag(){dataLayer.push(arguments);}
		gtag('js', new Date());

		gtag('config', 'G-606P6J79WH');
	</script>
	
</head>
<body>
	<div id="wrapper">
		<div id="saveNotify"><script>document.write(_("saved."));</script></div>
		<div id="content">
			<div id="outerSlider">
				<div id="main">
					<div id="header"></div>
				</div>
			</div>
		</div>
  </div>
  <a class="logo" href="https://www.doublespeakgames.com" alt="doublespeak games" target="_blank">
    <svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 41.75 32.84375" class="logo-icon">
      <path d="m 18.024533,28.5722 c 2.532365,-2.243 5.064679,-4.4861 7.596993,-6.7292 4.907813,0 9.815625,0 14.723438,0 0,-6.8136 0,-13.6272 0,-20.4408 -12.976656,0 -25.953312,0 -38.9299676,0 0,6.8136 0,13.6272 0,20.4408 3.2917905,0 6.5835811,0 9.8753716,0 -0.643311,2.2431 -1.286622,4.4861 -1.9299604,6.7292 2.5323644,-2.243 5.0646784,-4.4861 7.5969924,-6.7292 0.999066,0 1.998131,0 2.997197,0 -0.643345,2.2431 -1.286691,4.4861 -1.930064,6.7292 z" style="stroke-width:1.0;fill:none;stroke-linejoin:miter;stroke-miterlimit:10;stroke-dasharray:none"></path>
    </svg>
  </a>
</body>
</html>
````

## `ORIGINAL/browserWarning.html`

``html
<!doctype html>
<html>
<head>
	<title>A Dark Room</title>
	<style>
    body {
      background-color: #000000;
      color: #FFFFFF;
    }
    a {
      color: #FFFFFF;
    }
		div {
			width: 960px;
			margin: auto;
			text-align: center;
			margin-top: 20px;
		}
    .browser {
      width:102.4px;
      height:102.4px;
    }
	</style>
</head>
<body>
	<center>
    <img src="img/Logo1.jpg" />
    <div>
      <strong>
      A Dark Room makes use of HTML5 and CSS3, which your current browser does not appear to support.<br/>
      Please <a href="http://browsehappy.com">update your browser</a> for the best experience:<br/>
      </strong>
      <a href='http://www.mozilla.org/en-US/firefox/new/'><img class="browser" src='img/firefox.png' alt='Firefox' title='Firefox' /></a>
      <a href='https://www.google.com/intl/en/chrome/browser/'><img class="browser" src='img/chrome.png' alt='Chrome' title='Chrome' /></a>
      <a href='http://windows.microsoft.com/en-CA/internet-explorer/download-ie'><img class="browser" src='img/ie.png' alt='Internet Explorer' title='Internet Explorer' /></a>
      <a href='http://www.opera.com/computer'><img class="browser" src='img/opera.png' alt='Opera' title='Opera' /></a>
      <a href='http://www.apple.com/safari/'><img class="browser" src='img/safari.png' alt='Safari' title='Safari' /></a>
      <br/><br/>
      Or you can <a href='index.html?ignorebrowser=true'>play anyway</a>, but it probably won't work!
    </div>
  </center>
</body>
</html>
````

## `ORIGINAL/mobileWarning.html`

``html
<!doctype html>
<html>
<head>
    <meta name="viewport" content="initial-scale=1, maximum-scale=1, user-scalable=no">
	<title>A Dark Room</title>
	<style>
    body {
        background-color: #000000;
        color: #FFFFFF;
        line-height: 1.5;
        font-size: 22px;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }
    a {
        color: #FFFFFF;
    }
    p {
        margin: 10px 20px;
        text-align: center;
    }
    .logo {
        width: 100%;
    }
    .store {
        width: 90%;
    }
    .storeLink {
        text-align: center;
    }
    div {
        width: 100%;
        margin: auto;
        text-align: center;
        margin-top: 20px;
    }
	</style>
</head>
<body>
<img class="logo" src="img/Logo1.jpg" />
<p>
    A Dark Room isn't mobile-friendly, and it requires arrow keys.
    <br>
    Sorry about that!
</p>
<p>
  There are native apps, though! Get them now!
</p>
<a class="storeLink" href="https://itunes.apple.com/app/apple-store/id736683061?pt=2073437&ct=mobilesplash&mt=8">
    <img class="store" src="http://i.imgur.com/DMdnDYq.png" alt="App Store">
</a>
<a class="storeLink" href = "https://play.google.com/store/apps/details?id=com.yourcompany.adarkroom&hl=en">
    <img class="store" src="http://i.imgur.com/bLWWj4r.png" alt="Google Play">
</a>

</body>
</html>
````

## `ORIGINAL/package.json`

``javascript
{
  "name": "adarkroom",
  "type": "module",
  "version": "1.0.0",
  "private": true,
  "repository": "git@github.com:doublespeakgames/adarkroom.git",
  "author": "Michael Townsend <michael@doublespeakgames.com>",
  "license": "MPL-2.0",
  "scripts": {
    "start": "node dev-server.js",
    "update_pot": "pybabel extract -F lang/babel.cfg -c \"TRANSLATORS\" script -o lang/adarkroom.pot"
  },
  "dependencies": {
    "express": "^4.17.1"
  }
}
````

## `ORIGINAL/README.md`

``markdown
A Dark Room
===========
> "awake. head throbbing. vision blurry. come light the fire."

a minimalist text adventure game for your browser

[Click to play](http://adarkroom.doublespeakgames.com)

<table>
<tr><th colspan=4>Available Languages</tr>
<tr>
	<td><a href="http://adarkroom.doublespeakgames.com/?lang=zh_cn">Chinese (Simplified)</a></td>
	<td><a href="http://adarkroom.doublespeakgames.com/?lang=zh_tw">Chinese (Traditional)</a></td>
	<td><a href="http://adarkroom.doublespeakgames.com/?lang=en">English</a></td>
	<td><a href="http://adarkroom.doublespeakgames.com/?lang=fr">French</a></td>
</tr><tr>
	<td><a href="http://adarkroom.doublespeakgames.com/?lang=de">German</a></td>
	<td><a href="http://adarkroom.doublespeakgames.com/?lang=el">Greek</a></td>
	<td><a href="http://adarkroom.doublespeakgames.com/?lang=id">Indonesian</a></td>
	<td><a href="http://adarkroom.doublespeakgames.com/?lang=it">Italian</a></td>
</tr><tr>
	<td><a href="http://adarkroom.doublespeakgames.com/?lang=ja">Japanese</a></td>
	<td><a href="http://adarkroom.doublespeakgames.com/?lang=ko">Korean</a></td>
	<td><a href="http://adarkroom.doublespeakgames.com/?lang=nb">Norwegian</a></td>
	<td><a href="http://adarkroom.doublespeakgames.com/?lang=pl">Polish</a></td>
</tr><tr>
	<td><a href="http://adarkroom.doublespeakgames.com/?lang=pt">Portuguese</a></td>
	<td><a href="http://adarkroom.doublespeakgames.com/?lang=pt_br">Portuguese (Brazil)</a></td>
	<td><a href="http://adarkroom.doublespeakgames.com/?lang=ru">Russian</a></td>
	<td><a href="http://adarkroom.doublespeakgames.com/?lang=es">Spanish</a></td>
</tr><tr>
	<td><a href="http://adarkroom.doublespeakgames.com/?lang=sv">Swedish</a></td>
	<td><a href="http://adarkroom.doublespeakgames.com/?lang=th">Thai</a></td>
	<td><a href="http://adarkroom.doublespeakgames.com/?lang=tr">Turkish</a></td>
	<td><a href="http://adarkroom.doublespeakgames.com/?lang=uk">Ukrainian</a></td>
</tr><tr>
	<td><a href="http://adarkroom.doublespeakgames.com/?lang=vi">Vietnamese</a></td>
	<td><a href="http://adarkroom.doublespeakgames.com/?lang=lt_LT">Lithuanian</a></td>
	<td><a href="http://adarkroom.doublespeakgames.com/?lang=gl">Galician</a></td>
</tr>
</table>

or play the latest on [GitHub](http://doublespeakgames.github.io/adarkroom)

<a href="https://itunes.apple.com/us/app/a-dark-room/id736683061"><img src="http://i.imgur.com/DMdnDYq.png" height="50"></a>
<a href="https://play.google.com/store/apps/details?id=com.yourcompany.adarkroom"><img src="http://i.imgur.com/bLWWj4r.png" height="50"></a>
<a href="https://store.steampowered.com/app/2460660/A_Dark_Room/"><img src="https://i.imgur.com/yz6cnU0.png" height="50"></a>
````

## `ORIGINAL/script/Button.js`

``javascript
var Button = {
	Button: function(options) {
		if(typeof options.cooldown == 'number') {
			this.data_cooldown = options.cooldown;
		}
		this.data_remaining = 0;
		if(typeof options.click == 'function') {
			this.data_handler = options.click;
		}

		var el = $('<div>')
			.attr('id', typeof(options.id) != 'undefined' ? options.id : "BTN_" + Engine.getGuid())
			.addClass('button')
			.text(typeof(options.text) != 'undefined' ? options.text : "button")
			.click(function() {
				if(!$(this).hasClass('disabled')) {
					Button.cooldown($(this));
					$(this).data("handler")($(this));
				}
			})
			.data("handler",  typeof options.click == 'function' ? options.click : function() { Engine.log("click"); })
			.data("remaining", 0)
			.data("cooldown", typeof options.cooldown == 'number' ? options.cooldown : 0)
			.data('boosted', options.boosted ?? (() => false));

		el.append($("<div>").addClass('cooldown'));

		// waiting for expiry of residual cooldown detected in state
		Button.cooldown(el, 'state');

		if(options.cost) {
			var ttPos = options.ttPos ? options.ttPos : "bottom right";
			var costTooltip = $('<div>').addClass('tooltip ' + ttPos);
			for(var k in options.cost) {
				$("<div>").addClass('row_key').text(_(k)).appendTo(costTooltip);
				$("<div>").addClass('row_val').text(options.cost[k]).appendTo(costTooltip);
			}
			if(costTooltip.children().length > 0) {
				costTooltip.appendTo(el);
			}
		}

		if(options.width) {
			el.css('width', options.width);
		}

		return el;
	},

	saveCooldown: true,

	setDisabled: function(btn, disabled) {
		if(btn) {
			if(!disabled && !btn.data('onCooldown')) {
				btn.removeClass('disabled');
			} else if(disabled) {
				btn.addClass('disabled');
			}
			btn.data('disabled', disabled);
		}
	},

	isDisabled: function(btn) {
		if(btn) {
			return btn.data('disabled') === true;
		}
		return false;
	},

	cooldown: function(btn, option) {
		var cd = btn.data("cooldown");
		if (btn.data('boosted')()) {
			cd /= 2;
		}
		var id = 'cooldown.'+ btn.attr('id');
		if(cd > 0) {
			if(typeof option == 'number') {
				cd = option;
			}
			// param "start" takes value from cooldown time if not specified
			var start, left;
			switch(option){
				// a switch will allow for several uses of cooldown function
				case 'state':
					if(!$SM.get(id)){
						return;
					}
					start = Math.min($SM.get(id), cd);
					left = (start / cd).toFixed(4);
					break;
				default:
					start = cd;
					left = 1;
			}
			Button.clearCooldown(btn);
			if(Button.saveCooldown){
				$SM.set(id,start);
				// residual value is measured in seconds
				// saves program performance
				btn.data('countdown', Engine.setInterval(function(){
					$SM.set(id, $SM.get(id, true) - 0.5, true);
				},500));
			}
			var time = start;
			if (Engine.options.doubleTime){
				time /= 2;
			}
			$('div.cooldown', btn).width(left * 100 +"%").animate({width: '0%'}, time * 1000, 'linear', function() {
				Button.clearCooldown(btn, true);
			});
			btn.addClass('disabled');
			btn.data('onCooldown', true);
		}
	},

	clearCooldown: function(btn, cooldownEnded) {
		var ended = cooldownEnded || false;
		if(!ended){
			$('div.cooldown', btn).stop(true, true);
		}
		btn.data('onCooldown', false);
		if(btn.data('countdown')){
			window.clearInterval(btn.data('countdown'));
			$SM.remove('cooldown.'+ btn.attr('id'));
			btn.removeData('countdown');
		}
		if(!btn.data('disabled')) {
			btn.removeClass('disabled');
		}
	}
};
````

## `ORIGINAL/script/header.js`

``javascript
/**
 * Module that takes care of header buttons
 */
var Header = {
	
	init: function(options) {
		this.options = $.extend(
			this.options,
			options
		);
	},
	
	options: {}, // Nothing for now
	
	canTravel: function() {
		return $('div#header div.headerButton').length > 1;
	},
	
	addLocation: function(text, id, module, before) {
    const toAdd = $('<div>').attr('id', "location_" + id)
			.addClass('headerButton')
			.text(text).click(function() {
				if(Header.canTravel()) {
					Engine.travelTo(module);
				}
			});
      
    if (before && $(`#location_${before}`).length > 0) {
      return toAdd.insertBefore(`#location_${before}`);
    }
    
    return toAdd.appendTo($('div#header'));
	}
};
````

## `ORIGINAL/script/notifications.js`

``javascript
/**
 * Module that registers the notification box and handles messages
 */
var Notifications = {
	
	init: function(options) {
		this.options = $.extend(
			this.options,
			options
		);
		
		// Create the notifications box
		elem = $('<div>').attr({
			id: 'notifications',
			className: 'notifications'
		});
		// Create the transparency gradient
		$('<div>').attr('id', 'notifyGradient').appendTo(elem);
		
		elem.appendTo('div#wrapper');
	},
	
	options: {}, // Nothing for now
	
	elem: null,
	
	notifyQueue: {},
	
	// Allow notification to the player
	notify: function(module, text, noQueue) {
		if(typeof text == 'undefined') return;
		if(text.slice(-1) != ".") text += ".";
		if(module != null && Engine.activeModule != module) {
			if(!noQueue) {
				if(typeof this.notifyQueue[module] == 'undefined') {
					this.notifyQueue[module] = [];
				}
				this.notifyQueue[module].push(text);
			}
		} else {
			Notifications.printMessage(text);
		}
		Engine.saveGame();
	},
	
	clearHidden: function() {
	
		// To fix some memory usage issues, we clear notifications that have been hidden.
		
		// We use position().top here, because we know that the parent will be the same, so the position will be the same.
		var bottom = $('#notifyGradient').position().top + $('#notifyGradient').outerHeight(true);
		
		$('.notification').each(function() {
		
			if($(this).position().top > bottom){
				$(this).remove();
			}
		
		});
		
	},
	
	printMessage: function(t) {
		var text = $('<div>').addClass('notification').css('opacity', '0').text(t).prependTo('div#notifications');
		text.animate({opacity: 1}, 500, 'linear', function() {
			// Do this every time we add a new message, this way we never have a large backlog to iterate through. Keeps things faster.
			Notifications.clearHidden();
		});
	},
	
	printQueue: function(module) {
		if(typeof this.notifyQueue[module] != 'undefined') {
			while(this.notifyQueue[module].length > 0) {
				Notifications.printMessage(this.notifyQueue[module].shift());
			}
		}
	}
};
````

## `ORIGINAL/script/localization.js`

``javascript
(function(){
	//only used for poedit to find translatable strings
	var keywords = [ 
		_('saved.'),
		_('wood'),
		_('builder'),
		_('teeth'),
		_('meat'),
		_('fur'),
		_('alien alloy'),
		_('bullets'),
		_('charm'),
		_('leather'),
		_('iron'),
		_('steel'),
		_('coal'),
		_('sulphur'),
		_('energy cell'),
		_('torch'),
		_('medicine'),
		_('hunter'),
		_('trapper'),
		_('tanner'),
		_('grenade'),
		_('bolas'),
		_('bayonet'),
		_('charcutier'),
		_('iron miner'),
		_('iron mine'),
		_('coal miner'),
		_('coal mine'),
		_('sulphur miner'),
		_('sulphur mine'),
		_('armourer'),
		_('steelworker'),
		_('bait'),
		_('cured meat'),
		_('scales'),
		_('compass'),
		_('laser rifle'),
		_('gatherer'),
		_('cloth'),
		_('scales'),
		_('cured meat'),
		_('thieves'),
		_('not enough fur'),
		_('not enough wood'),
		_('not enough coal'),
		_('not enough iron'),
		_('not enough steel'),
		_('not enough sulphur'),
		_('baited trap'),
		_('not enough scales'),
		_('not enough cloth'),
		_('not enough teeth'),
		_('not enough leather'),
		_('not enough meat'),
		_('the compass points east'),
		_('the compass points west'),
		_('the compass points north'),
		_('the compass points south'),
		_('the compass points northeast'),
		_('the compass points northwest'),
		_('the compass points southeast'),
		_('the compass points southwest')
	]; 

	keywords = null;
})();
````

## `ORIGINAL/script/dropbox.js`

``javascript
(function (Engine, Events, Dropbox, $) {

  /**
   * Module that enables a save of the gamestate to the dropbox datastore
   * @see https://www.dropbox.com/developers/datastore
   *
   * The dropbox datastore (dbds) connector lets you save your data to your own dropbox datastore
   * without jamming files to it.
   *
   * This connector uses the game engines own base64 encoder.
   */

  'use strict';

  if (!Engine) { return false; }  // Game Engine not available
  if (!Dropbox) { return false; } // Dropbox Connector not available

  var DropboxConnector = {

    options: {
      log: false,
      key: 'q7vyvfsakyfmp3o',
      table: 'adarkroom'
    },

    client: false,
    table: false,
    dropboxAccount: false,
    savegameKey: false,
    savegames: {0: null, 1: null, 2: null, 3: null, 4: null},

    init: function (options) {
      this.options = $.extend(
        this.options,
        options
      );

      this._log = this.options.log;

      this.client = new Dropbox.Client({key: DropboxConnector.options.key});
      this.connectToDropbox(false);

      return this;
    },

    startDropbox: function () {
      if (!DropboxConnector.client || !DropboxConnector.table) {
        DropboxConnector.startDropboxConnectEvent();
      } else {
        DropboxConnector.startDropboxImportEvent();
      }
    },

    /**
     * ******
     * Events
     * ******
     */

    startDropboxConnectEvent: function () {
      Events.startEvent({
        title: _('Dropbox connection'),
        scenes: {
          start: {
            text: [_('connect game to dropbox local storage')],
            buttons: {
              'connect': {
                text: _('connect'),
                nextScene: 'end',
                onChoose: function () {
                  DropboxConnector.connectToDropbox(DropboxConnector.startDropboxImportEvent);
                }
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

    startDropboxImportEvent: function () {
      Events.startEvent({
        title: _('Dropbox Export / Import'),
        scenes: {
          start: {
            text: [_('export or import save data to dropbox datastorage'),
                  _('your are connected to dropbox with account / email ') + DropboxConnector.dropboxAccount],
            buttons: {
              'save': {
                text: _('save'),
                nextScene: {1: 'saveToSlot'}
              },
              'load': {
                text: _('load'),
                nextScene: {1: 'loadFromSlot'},
                onChoose: DropboxConnector.loadGamesFromDropbox
              },
              'signout': {
                text: _('signout'),
                nextScene: 'end',
                onChoose: DropboxConnector.signout
              },
              'cancel': {
                text: _('cancel'),
                nextScene: 'end'
              }
            }
          },
          saveToSlot: {
            text: [_('choose one slot to save to')],
            buttons: (function () {
              var buttons = {};

              $.each(DropboxConnector.savegames, function (n, savegame) {
                buttons['savegame' + n] = {
                  text: _('save to slot') + n + ' ' + (savegame ? DropboxConnector.prepareSaveDate(savegame.get('timestamp')) : 'empty'),
                  nextScene: 'end',
                  onChoose: function () {
                    DropboxConnector.log('Save to slot ' + n + ' initiated');
                    // timeout prevents error due to fade out animation of the previous event
                    Engine.setTimeout(function () {
                      DropboxConnector.log('Save to slot ' + n);
                      DropboxConnector.saveGameToDropbox(n, DropboxConnector.savedtoDropboxEvent);
                    }, 1000);
                  }
                };
              });

              buttons.cancel = {
                text: _('cancel'),
                nextScene: 'end'
              };

              return buttons;
            }())
          },
          loadFromSlot: {
            text: [_('choose one slot to load from')],
            buttons: (function () {
              var buttons = {};

              $.each(DropboxConnector.savegames, function (n, savegame) {
                if (savegame) {
                  buttons['savegame' + n] = {
                    text: _('load from slot') + n + ' ' + DropboxConnector.prepareSaveDate(savegame.get('timestamp')),
                    nextScene: 'end',
                    onChoose: function () {
                      DropboxConnector.log('Load from slot ' + n + ' initiated');
                      // timeout prevents error due to fade out animation of the previous event
                      Engine.setTimeout(function () {
                        DropboxConnector.log('Load from slot ' + n);
                        DropboxConnector.loadGameFromDropbox(n);
                      }, 1000);
                    }
                  };
                }
              });

              buttons.cancel = {
                text: _('cancel'),
                nextScene: 'end'
              };

              return buttons;
            }())
          }
        }
      });
    },

    savedtoDropboxEvent: function (success) {
      Events.startEvent({
        title: _('Dropbox Export / Import'),
        scenes: {
          start: {
            text: success ? [_('successfully saved to dropbox datastorage')] :
                [_('error while saving to dropbox datastorage')],
            buttons: {
              'ok': {
                text: _('ok'),
                nextScene: 'end'
              }
            }
          }
        }
      });
    },

    /**
     * ***************
     * functional code
     * ***************
     */

    /**
     * Initiate dropbox connection
     *
     * @param interactive
     * @param callback
     */
    connectToDropbox: function (interactive, callback) {

      DropboxConnector.log('start dropbox');

      var client = this.client;

      client.authenticate({interactive: interactive}, function (error) {
        if (error) {
          DropboxConnector.log('Dropbox Authentication error: ' + error);
        }
      });

      if (client.isAuthenticated()) {

        var datastoreManager = client.getDatastoreManager();
        datastoreManager.openDefaultDatastore(function (error, datastore) {
          if (error) {
            DropboxConnector.log('Error opening default datastore: ' + error);
          } else {
            DropboxConnector.table = datastore.getTable(DropboxConnector.options.table);
            DropboxConnector.loadGamesFromDropbox();

            DropboxConnector.log(DropboxConnector.client.credentials());

            DropboxConnector.client.getAccountInfo({}, function (error, info) {
              if (!error) {
                DropboxConnector.dropboxAccount = info.email;
              }
            });

            DropboxConnector.log("Got savegames", DropboxConnector.savegames);

            if (typeof callback === "function") {
              callback.call(DropboxConnector.table);
            }
          }
        });
      } else {
        DropboxConnector.log('Not connected to dropbox.');
      }
    },

    /**
     * Requests your savegames fom dbds
     *
     * @returns {*}
     */
    loadGamesFromDropbox: function () {
      var savegames = DropboxConnector.savegames;

      $.each(savegames, function (n) {
        var results = DropboxConnector.table.query({savegameId: DropboxConnector.prepareSavegameID(n)});
        savegames[n] = results[0];
      });

      return savegames;
    },

    /**
     * Imports a gamestate of a given slotnumber to your game
     *
     * @param slotnumber
     */
    loadGameFromDropbox: function (slotnumber) {

      var table = DropboxConnector.table;
      var id = DropboxConnector.prepareSavegameID(slotnumber);
      var results = table.query({savegameId: id});
      var record = results[0];

      if (record && record.get('gameState')) {
        Engine.import64(record.get('gameState'));
      }
    },

    /**
     * Saves a gamestate to a given slot in dbds
     *
     * @param slotnumber
     * @param callback
     */
    saveGameToDropbox: function (slotnumber, callback) {

      var table = DropboxConnector.table;
      var record = null;
      var success = false;
      var id = DropboxConnector.prepareSavegameID(slotnumber);

      var saveGame = {
        gameState: Engine.generateExport64(),
        timestamp: new Date().getTime()
      };

      if (DropboxConnector.savegames[slotnumber]) { // slot aleady used -> overwrite
        record = DropboxConnector.savegames[slotnumber];
        try {
          record.update(saveGame);
          DropboxConnector.log("Updated savegame ", slotnumber);
          success = true;
        } catch (e) {
          success = false;
        }

      } else {
        saveGame.savegameId = id;
        try {
          record = table.insert(saveGame);
          DropboxConnector.log("Inserted savegame ", record.getId());
          success = true;
        } catch (e) {
          success = false;
        }
      }
      if (typeof callback === "function") {
        callback(success);
      }
    },

    /**
     * Terminates the connection to your db account
     */
    signout: function () {
      DropboxConnector.client.signOut({}, function (error) {
        if (error) {
          alert('Error while logout from dropbox');
        } else {
          alert('Successfully signed out.');
          DropboxConnector.client = null;
          DropboxConnector.savegames = null;
          DropboxConnector.dropboxAccount = null;
        }
      });
    },

    /**
     * **************
     * Helper methods
     * **************
     */

    prepareSavegameID: function (slotnumber) {
      return 'adarkroom_savegame_' + slotnumber;
    },

    prepareSaveDate: function (timestamp) {
      var date = new Date(timestamp);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    },

    log: function () {
      if (this._log) {
        console.log(arguments);
      }
    }
  };

  Engine.Dropbox = DropboxConnector;

})(Engine, Events, Dropbox, jQuery);
````

## `ORIGINAL/lang/langs.js`

``javascript
var langs = {
	'cs':'czech',
	'de':'deutsch',
	'el':'ελληνικά',
	'en':'english',
	'eo':'esperanto',
	'es':'español',
	'fr':'français',
	'gl':'galego',
	'id':'bahasa indonesia',
	'it':'italiano',
	'lv':'latviešu valoda',
	'ja':'日本語',
	'ko':'한국어',
	'nb':'norsk',
	'pl':'polski',
	'lt_LT':'lietuvių',
	'pt':'português',
	'pt_br':'português (brasil)',
	'ru':'русский',
	'sv':'svenska',
	'th':'ไทย',
	'tr':'türkçe',
	'uk':'українська',
	'vi':'tiếng việt',
	'zh_cn':'简体中文',
	'zh_tw':'繁體中文'
};
````


