# Audio Data

Generated from the original game source. Callback functions and formulas are preserved because they carry gameplay data such as costs, rewards, unlock conditions, and side effects.

## Scope

Audio library constants and audio engine behavior. The asset inventory file lists the actual files on disk.

## Source Files

- `ORIGINAL/script/audioLibrary.js` (91 lines)
- `ORIGINAL/script/audio.js` (268 lines)

## `ORIGINAL/script/audioLibrary.js`

````javascript
/**
 * Module that defines all audio files
 */
var AudioLibrary = {
    MUSIC_DUSTY_PATH: 'audio/dusty-path.flac',
    MUSIC_SILENT_FOREST: 'audio/silent-forest.flac',
    MUSIC_LONELY_HUT: 'audio/lonely-hut.flac',
    MUSIC_TINY_VILLAGE: 'audio/tiny-village.flac',
    MUSIC_MODEST_VILLAGE: 'audio/modest-village.flac',
    MUSIC_LARGE_VILLAGE: 'audio/large-village.flac',
    MUSIC_RAUCOUS_VILLAGE: 'audio/raucous-village.flac',
    MUSIC_FIRE_DEAD: 'audio/fire-dead.flac',
    MUSIC_FIRE_SMOLDERING: 'audio/fire-smoldering.flac',
    MUSIC_FIRE_FLICKERING: 'audio/fire-flickering.flac',
    MUSIC_FIRE_BURNING: 'audio/fire-burning.flac',
    MUSIC_FIRE_ROARING: 'audio/fire-roaring.flac',
    MUSIC_WORLD: 'audio/world.flac',
    MUSIC_SPACE: 'audio/space.flac',
    MUSIC_ENDING: 'audio/ending.flac',
    MUSIC_SHIP: 'audio/ship.flac',
    EVENT_NOMAD: 'audio/event-nomad.flac',
    EVENT_NOISES_OUTSIDE: 'audio/event-noises-outside.flac',
    EVENT_NOISES_INSIDE: 'audio/event-noises-inside.flac',
    EVENT_BEGGAR: 'audio/event-beggar.flac',
    EVENT_SHADY_BUILDER: 'audio/event-shady-builder.flac',
    EVENT_MYSTERIOUS_WANDERER: 'audio/event-mysterious-wanderer.flac',
    EVENT_SCOUT: 'audio/event-scout.flac',
    EVENT_WANDERING_MASTER: 'audio/event-wandering-master.flac',
    EVENT_SICK_MAN: 'audio/event-sick-man.flac',
    EVENT_RUINED_TRAP: 'audio/event-ruined-trap.flac',
    EVENT_HUT_FIRE: 'audio/event-hut-fire.flac',
    EVENT_SICKNESS: 'audio/event-sickness.flac',
    EVENT_PLAGUE: 'audio/event-plague.flac',
    EVENT_BEAST_ATTACK: 'audio/event-beast-attack.flac',
    EVENT_SOLDIER_ATTACK: 'audio/event-soldier-attack.flac',
    EVENT_THIEF: 'audio/event-thief.flac',
    LANDMARK_FRIENDLY_OUTPOST: 'audio/landmark-friendly-outpost.flac',
    LANDMARK_SWAMP: 'audio/landmark-swamp.flac',
    LANDMARK_CAVE: 'audio/landmark-cave.flac',
    LANDMARK_TOWN: 'audio/landmark-town.flac',
    LANDMARK_CITY: 'audio/landmark-city.flac',
    LANDMARK_HOUSE: 'audio/landmark-house.flac',
    LANDMARK_BATTLEFIELD: 'audio/landmark-battlefield.flac',
    LANDMARK_BOREHOLE: 'audio/landmark-borehole.flac',
    LANDMARK_CRASHED_SHIP: 'audio/landmark-crashed-ship.flac',
    LANDMARK_SULPHUR_MINE: 'audio/landmark-sulphurmine.flac',
    LANDMARK_COAL_MINE: 'audio/landmark-coalmine.flac',
    LANDMARK_IRON_MINE: 'audio/landmark-ironmine.flac',
    LANDMARK_DESTROYED_VILLAGE: 'audio/landmark-destroyed-village.flac',
    ENCOUNTER_TIER_1: 'audio/encounter-tier-1.flac',
    ENCOUNTER_TIER_2: 'audio/encounter-tier-2.flac',
    ENCOUNTER_TIER_3: 'audio/encounter-tier-3.flac',
    LIGHT_FIRE: 'audio/light-fire.flac',
    STOKE_FIRE: 'audio/stoke-fire.flac',
    BUILD: 'audio/build.flac',
    CRAFT: 'audio/craft.flac',
    BUY: 'audio/buy.flac',
    GATHER_WOOD: 'audio/gather-wood.flac',
    CHECK_TRAPS: 'audio/check-traps.flac',
    EMBARK: 'audio/embark.flac',
    FOOTSTEPS_1: 'audio/footsteps-1.flac',
    FOOTSTEPS_2: 'audio/footsteps-2.flac',
    FOOTSTEPS_3: 'audio/footsteps-3.flac',
    FOOTSTEPS_4: 'audio/footsteps-4.flac',
    FOOTSTEPS_5: 'audio/footsteps-5.flac',
    FOOTSTEPS_6: 'audio/footsteps-6.flac',
    EAT_MEAT: 'audio/eat-meat.flac',
    USE_MEDS: 'audio/use-meds.flac',
    WEAPON_UNARMED_1: 'audio/weapon-unarmed-1.flac',
    WEAPON_UNARMED_2: 'audio/weapon-unarmed-2.flac',
    WEAPON_UNARMED_3: 'audio/weapon-unarmed-3.flac',
    WEAPON_MELEE_1: 'audio/weapon-melee-1.flac',
    WEAPON_MELEE_2: 'audio/weapon-melee-2.flac',
    WEAPON_MELEE_3: 'audio/weapon-melee-3.flac',
    WEAPON_RANGED_1: 'audio/weapon-ranged-1.flac',
    WEAPON_RANGED_2: 'audio/weapon-ranged-2.flac',
    WEAPON_RANGED_3: 'audio/weapon-ranged-3.flac',
    DEATH: 'audio/death.flac',
    REINFORCE_HULL: 'audio/reinforce-hull.flac',
    UPGRADE_ENGINE: 'audio/upgrade-engine.flac',
    LIFT_OFF: 'audio/lift-off.flac',
    ASTEROID_HIT_1: 'audio/asteroid-hit-1.flac',
    ASTEROID_HIT_2: 'audio/asteroid-hit-2.flac',
    ASTEROID_HIT_3: 'audio/asteroid-hit-3.flac',
    ASTEROID_HIT_4: 'audio/asteroid-hit-4.flac',
    ASTEROID_HIT_5: 'audio/asteroid-hit-5.flac',
    ASTEROID_HIT_6: 'audio/asteroid-hit-6.flac',
    ASTEROID_HIT_7: 'audio/asteroid-hit-7.flac',
    ASTEROID_HIT_8: 'audio/asteroid-hit-8.flac',
    CRASH: 'audio/crash.flac',
};
````

## `ORIGINAL/script/audio.js`

````javascript
/**
 * Module that takes care of audio playback
 */
var AudioEngine = {
    FADE_TIME: 1,
    AUDIO_BUFFER_CACHE: {},
    _audioContext: null,
    _master: null,
    _currentBackgroundMusic: null,
    _currentEventAudio: null,
    _currentSoundEffectAudio: null,
    _initialized: false,
    init: function () {
        AudioEngine._initAudioContext();
        // AudioEngine._preloadAudio(); // removed to save bandwidth
        AudioEngine._initialized = true;
    },
    _preloadAudio: function () {
        // start loading music and events early
        // ** could be used later if we specify a better set of
        // audio files to preload -- i.e. we probably don't need to load
        // the later villages or events audio, and esp. not the ending
        for (var key in AudioLibrary) {
            if (
            key.toString().indexOf('MUSIC_') > -1 ||
            key.toString().indexOf('EVENT_') > -1) {
                AudioEngine.loadAudioFile(AudioLibrary[key]);
            }
        }
    },
    _initAudioContext: function () {
        AudioEngine._audioContext = new (window.AudioContext || window.webkitAudioContext);
        AudioEngine._createMasterChannel();
    },
    _createMasterChannel: function () {
        // create master
        AudioEngine._master = AudioEngine._audioContext.createGain();
        AudioEngine._master.gain.setValueAtTime(1.0, AudioEngine._audioContext.currentTime);
        AudioEngine._master.connect(AudioEngine._audioContext.destination);
    },
    _getMissingAudioBuffer: function () {
        // plays beeping sound to indicate missing audio
        var buffer = AudioEngine._audioContext.createBuffer(
            1,
            AudioEngine._audioContext.sampleRate,
            AudioEngine._audioContext.sampleRate
        );
        // Fill the buffer
        var bufferData = buffer.getChannelData(0);
        for (var i = 0; i < buffer.length / 2; i++) {
            bufferData[i] = Math.sin(i * 0.05) / 4; // max .25 gain value
        }
        return buffer;
    },
    _playSound: function (buffer) {
        if (AudioEngine._currentSoundEffectAudio &&
            AudioEngine._currentSoundEffectAudio.source.buffer == buffer) {
            return;
        }

        var source = AudioEngine._audioContext.createBufferSource();
        source.buffer = buffer;
        source.onended = function(event) {
            // dereference current sound effect when finished
            if (AudioEngine._currentSoundEffectAudio &&
                AudioEngine._currentSoundEffectAudio.source.buffer == buffer) {
                AudioEngine._currentSoundEffectAudio = null;
            }
        };

        source.connect(AudioEngine._master);
        source.start();

        AudioEngine._currentSoundEffectAudio = {
            source: source
        };
    },
    _playBackgroundMusic: function (buffer) {
        var source = AudioEngine._audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        var envelope = AudioEngine._audioContext.createGain();
        envelope.gain.setValueAtTime(0.0, AudioEngine._audioContext.currentTime);
        
        var fadeTime = AudioEngine._audioContext.currentTime + AudioEngine.FADE_TIME;

        // fade out current background music
        if (AudioEngine._currentBackgroundMusic && 
            AudioEngine._currentBackgroundMusic.source &&
            AudioEngine._currentBackgroundMusic.source.playbackState !== 0) {
            var currentBackgroundGainValue = AudioEngine._currentBackgroundMusic.envelope.gain.value;
            AudioEngine._currentBackgroundMusic.envelope.gain.cancelScheduledValues(AudioEngine._audioContext.currentTime);
            AudioEngine._currentBackgroundMusic.envelope.gain.setValueAtTime(currentBackgroundGainValue, AudioEngine._audioContext.currentTime);
            AudioEngine._currentBackgroundMusic.envelope.gain.linearRampToValueAtTime(0.0, fadeTime);
            AudioEngine._currentBackgroundMusic.source.stop(fadeTime + 0.3); // make sure fade has completed
        }

        // fade in new backgorund music
        source.connect(envelope);
        envelope.connect(AudioEngine._master);
        source.start();
        envelope.gain.linearRampToValueAtTime(1.0, fadeTime);

        // update current background music
        AudioEngine._currentBackgroundMusic = {
            source: source,
            envelope: envelope
        };
    },
    _playEventMusic: function (buffer) {
        var source = AudioEngine._audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        var envelope = AudioEngine._audioContext.createGain();
        envelope.gain.setValueAtTime(0.0, AudioEngine._audioContext.currentTime);

        var fadeTime = AudioEngine._audioContext.currentTime + AudioEngine.FADE_TIME * 2;

        // turn down current background music
        if (AudioEngine._currentBackgroundMusic != null) {
            var currentBackgroundGainValue = AudioEngine._currentBackgroundMusic.envelope.gain.value;
            AudioEngine._currentBackgroundMusic.envelope.gain.cancelScheduledValues(AudioEngine._audioContext.currentTime);
            AudioEngine._currentBackgroundMusic.envelope.gain.setValueAtTime(currentBackgroundGainValue, AudioEngine._audioContext.currentTime);
            AudioEngine._currentBackgroundMusic.envelope.gain.linearRampToValueAtTime(0.2, fadeTime);
        }

        // fade in event music
        source.connect(envelope);
        envelope.connect(AudioEngine._master);
        source.start();
        envelope.gain.linearRampToValueAtTime(1.0, fadeTime);

        // update reference
        AudioEngine._currentEventAudio = {
            source: source,
            envelope: envelope
        };
    },
    _stopEventMusic: function () {
        var fadeTime = AudioEngine._audioContext.currentTime + AudioEngine.FADE_TIME * 2;

        // fade out event music and stop
        if (AudioEngine._currentEventAudio && 
            AudioEngine._currentEventAudio.source && 
            AudioEngine._currentEventAudio.source.buffer) {
            var currentEventGainValue = AudioEngine._currentEventAudio.envelope.gain.value;
            AudioEngine._currentEventAudio.envelope.gain.cancelScheduledValues(AudioEngine._audioContext.currentTime);
            AudioEngine._currentEventAudio.envelope.gain.setValueAtTime(currentEventGainValue, AudioEngine._audioContext.currentTime);
            AudioEngine._currentEventAudio.envelope.gain.linearRampToValueAtTime(0.0, fadeTime);
            AudioEngine._currentEventAudio.source.stop(fadeTime + 1); // make sure fade has completed
            AudioEngine._currentEventAudio = null;
        }

        // turn up background music
        if (AudioEngine._currentBackgroundMusic) {
          var currentBackgroundGainValue = AudioEngine._currentBackgroundMusic.envelope.gain.value;
          AudioEngine._currentBackgroundMusic.envelope.gain.cancelScheduledValues(AudioEngine._audioContext.currentTime);
          AudioEngine._currentBackgroundMusic.envelope.gain.setValueAtTime(currentBackgroundGainValue, AudioEngine._audioContext.currentTime);
          AudioEngine._currentBackgroundMusic.envelope.gain.linearRampToValueAtTime(1.0, fadeTime);
        }
    },
    isAudioContextRunning: function () {
        return AudioEngine._audioContext.state !== 'suspended';
    },
    tryResumingAudioContext: function() {
        if (AudioEngine._audioContext.state === 'suspended') {
            AudioEngine._audioContext.resume();
        }
    },
    playBackgroundMusic: function (src) {
        if (!AudioEngine._initialized) {
          return;
        }
        AudioEngine.loadAudioFile(src)
            .then(function (buffer) {
                AudioEngine._playBackgroundMusic(buffer);
            });
    },
    playEventMusic: function (src) {
        if (!AudioEngine._initialized) {
          return;
        }
        AudioEngine.loadAudioFile(src)
            .then(function (buffer) {
                AudioEngine._playEventMusic(buffer);
            });
    },
    stopEventMusic: function () {
        if (!AudioEngine._initialized) {
          return;
        }
        AudioEngine._stopEventMusic();
    },
    playSound: function (src) {
        if (!AudioEngine._initialized) {
          return;
        }
        AudioEngine.loadAudioFile(src)
            .then(function (buffer) {
                AudioEngine._playSound(buffer);
            });
    },
    loadAudioFile: function (src) {
        if (src.indexOf('http') === -1) {
            var path = window.location.protocol + '//' + window.location.hostname + (window.location.port ?(':' + window.location.port) : '') + window.location.pathname;
            if(path.endsWith('index.html')){
                path = path.slice(0, - 10); 
            }
            src = path + src;
        }
        if (AudioEngine.AUDIO_BUFFER_CACHE[src]) {
            return new Promise(function (resolve, reject) {
                resolve(AudioEngine.AUDIO_BUFFER_CACHE[src]);
            });
        } else {
            var request = new Request(src);
            return fetch(request).then(function (response) {
                return response.arrayBuffer();
            }).then(function (buffer) {
                if (buffer.byteLength === 0) {
                    console.error('cannot load audio from ' + src);
                    return AudioEngine._getMissingAudioBuffer();
                }

                var decodeAudioDataPromise = AudioEngine._audioContext.decodeAudioData(buffer, function (decodedData) {
                    AudioEngine.AUDIO_BUFFER_CACHE[src] = decodedData;
                    return AudioEngine.AUDIO_BUFFER_CACHE[src];
                });

                // Safari WebAudio does not return a promise based API for
                // decodeAudioData, so we need to fake it if we want to play
                // audio immediately on first fetch
                if (decodeAudioDataPromise) {
                    return decodeAudioDataPromise;
                } else {
                    return new Promise(function (resolve, reject) {
                        var fakePromiseId = setInterval(function() {
                            if (AudioEngine.AUDIO_BUFFER_CACHE[src]) {
                                resolve(AudioEngine.AUDIO_BUFFER_CACHE[src]);
                                clearInterval(fakePromiseId);
                            }
                        }, 20);
                    });
                }
            });
        }
    },
    setBackgroundMusicVolume: function (volume, s) {
        if (AudioEngine._master == null) return;  // master may not be ready yet
        if (volume === undefined) {
            volume = 1.0;
        }
        if (s === undefined) {
            s = 1.0;
        }

        // cancel any current schedules and then ramp
        var currentBackgroundGainValue = AudioEngine._currentBackgroundMusic.envelope.gain.value;
        AudioEngine._currentBackgroundMusic.envelope.gain.cancelScheduledValues(AudioEngine._audioContext.currentTime);
        AudioEngine._currentBackgroundMusic.envelope.gain.setValueAtTime(currentBackgroundGainValue, AudioEngine._audioContext.currentTime);
        AudioEngine._currentBackgroundMusic.envelope.gain.linearRampToValueAtTime(
            volume,
            AudioEngine._audioContext.currentTime + s
        );
    },
    setMasterVolume: function (volume, s) {
        if (AudioEngine._master == null) return;  // master may not be ready yet
        if (volume === undefined) {
            volume = 1.0;
        }
        if (s === undefined) {
            s = 1.0;
        }

        // cancel any current schedules and then ramp
        var currentGainValue = AudioEngine._master.gain.value;
        AudioEngine._master.gain.cancelScheduledValues(AudioEngine._audioContext.currentTime);
        AudioEngine._master.gain.setValueAtTime(currentGainValue, AudioEngine._audioContext.currentTime);
        AudioEngine._master.gain.linearRampToValueAtTime(
            volume,
            AudioEngine._audioContext.currentTime + s
        );
    }
};
````


