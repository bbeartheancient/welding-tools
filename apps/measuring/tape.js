// tape.js — Tape Measure game UI (canvas rendering)

var TapeGame = (function() {
  'use strict';

  function init(panel) {
    var settingsDef = [
      { key: 'questionPrecision', label: 'Question precision', type: 'select',
        options: [
          {value: '1', label: '1 inch'}, {value: '2', label: '1/2 inch'},
          {value: '4', label: '1/4 inch'}, {value: '8', label: '1/8 inch'},
          {value: '16', label: '1/16 inch'}, {value: '32', label: '1/32 inch'},
          {value: '64', label: '1/64 inch'}
        ]
      },
      { key: 'notation', label: 'Answer notation', type: 'radio',
        options: [
          {value: 'fraction', label: 'Fractions'}, {value: 'decimal', label: 'Decimals'}
        ]
      }
    ];

    var defaults = { questionPrecision: '16', notation: 'fraction' };
    var settings = weldtrain.loadSettings('tape', defaults);
    var engine = weldtrain.createEngine('tape', { levelUpAfter: 10 });

    // Build panel layout
    panel.innerHTML =
      '<div class="question" id="tape-question">Loading...</div>' +
      '<div class="game-area"><canvas id="tape-canvas" width="900" height="120"></canvas></div>' +
      '<div class="action-buttons">' +
        '<button class="btn btn-primary" id="tape-check">Check</button>' +
        '<button class="btn btn-warning" id="tape-settings">⚙ Settings</button>' +
      '</div>' +
      '<div class="engine-hud">' +
        '<div class="hud-item"><span class="hud-label">Score</span><span class="hud-value score">0</span></div>' +
        '<div class="hud-item"><span class="hud-label">Level</span><span class="hud-value level">1</span></div>' +
        '<div class="hud-item"><span class="hud-label">Strikes</span><div class="strikes">' +
          '<div class="strike"></div><div class="strike"></div><div class="strike"></div>' +
        '</div></div>' +
        '<div class="game-over">Game Over!</div>' +
      '</div>';

    engine.bindEl(panel.querySelector('.engine-hud'));

    var canvas = panel.querySelector('#tape-canvas');
    var ctx = canvas.getContext('2d');
    var questionEl = panel.querySelector('#tape-question');
    var currentTarget = null;
    var mode = 'type';

    function settingsFromState() {
      return {
        questionPrecision: parseInt(settings.questionPrecision),
        notation: settings.notation,
        fractionStyle: 'reduced',
        length: 12
      };
    }

    function newQuestion() {
      var s = settingsFromState();
      currentTarget = TapeLogic.generateTarget(s);
      questionEl.innerHTML = 'What is this measurement? <span class="value"></span>';
      drawRuler(canvas, currentTarget, s);
      mode = 'type';
    }

    function drawRuler(canvas, targetTicks, s) {
      var precision = s.questionPrecision;
      var length = s.length;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      var ticks = TapeLogic.generateTicks(length, precision);
      var scale = canvas.width / (length * 256);
      ctx.fillStyle = '#fafafa';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#333';
      ctx.fillStyle = '#333';
      ctx.font = '16px Arial';
      ticks.forEach(function(t) {
        var x = t.position * scale;
        if (t.height >= 48) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, t.height);
          ctx.stroke();
          if (t.label) {
            ctx.fillText(t.label, x - 8, t.height + 20);
          }
        } else {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, t.height);
          ctx.stroke();
        }
      });
      if (mode === 'show-answer') {
        var targetX = (targetTicks / precision) * 256 * scale;
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(targetX, 0);
        ctx.lineTo(targetX, 60);
        ctx.stroke();
        ctx.lineWidth = 1;
      }
    }

    panel.querySelector('#tape-check').addEventListener('click', function() {
      if (engine.isGameOver()) { engine.reset(); }
      var s = settingsFromState();
      if (mode === 'type') {
        var answerText = prompt('Enter measurement:');
        if (answerText === null) return;
        var guessedTicks = TapeLogic.parseAnswer(answerText, s);
        if (guessedTicks === currentTarget) {
          engine.recordCorrect();
          panel.querySelector('.game-area').insertAdjacentHTML('beforebegin',
            '<div class="feedback correct">Correct! ' + TapeLogic.formatTarget(currentTarget, s) + '</div>');
          setTimeout(newQuestion, 1500);
        } else {
          engine.recordStrike();
          mode = 'show-answer';
          drawRuler(canvas, currentTarget, s);
          panel.querySelector('.game-area').insertAdjacentHTML('beforebegin',
            '<div class="feedback wrong">Wrong. Correct answer: ' + TapeLogic.formatTarget(currentTarget, s) + '</div>');
        }
      } else {
        newQuestion();
      }
    });

    panel.querySelector('#tape-settings').addEventListener('click', function() {
      var form = weldtrain.buildSettingsPanel(panel, settingsDef);
      form.querySelector('.apply-btn').addEventListener('click', function() {
        var newSettings = weldtrain.readSettingsFromForm(form);
        for (var k in newSettings) { settings[k] = newSettings[k]; }
        weldtrain.saveSettings('tape', settings);
        form.parentElement.innerHTML = '';
        engine.reset();
        newQuestion();
      });
    });

    newQuestion();
  }

  return { init: init };
})();

window.registerModule('tape', 'Tape Measure', TapeGame.init);
