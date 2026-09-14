// caliper.js — Dial Caliper game UI

var CaliperGame = (function() {
  'use strict';

  function init(panel) {
    var settingsDef = [
      { key: 'unit', label: 'Unit', type: 'radio',
        options: [
          {value: 'inch', label: 'Inch'}, {value: 'cm', label: 'Centimeter'}
        ]
      },
      { key: 'resolution', label: 'Resolution', type: 'select',
        options: [{value: '0.001', label: '0.001"'}, {value: '1/8', label: '1/8'},
          {value: '1/16', label: '1/16'}, {value: '1/32', label: '1/32'},
          {value: '1/64', label: '1/64'}, {value: '0.1', label: '0.1mm'},
          {value: '0.01', label: '0.01mm'}
        ]
      }
    ];

    var defaults = { unit: 'inch', resolution: '0.001' };
    var settings = weldtrain.loadSettings('caliper', defaults);
    var engine = weldtrain.createEngine('caliper', { levelUpAfter: 5 });

    panel.innerHTML =
      '<div class="question" id="caliper-question">Loading...</div>' +
      '<div class="game-area"><canvas id="caliper-canvas" width="900" height="400"></canvas></div>' +
      '<div class="action-buttons">' +
        '<button class="btn btn-primary" id="caliper-check">Check</button>' +
        '<button class="btn btn-warning" id="caliper-settings">⚙ Settings</button>' +
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

    var canvas = panel.querySelector('#caliper-canvas');
    var ctx = canvas.getContext('2d');
    var questionEl = panel.querySelector('#caliper-question');
    var currentTarget = null;
    var mode = 'type';

    function newQuestion() {
      currentTarget = CaliperLogic.generateTarget(settings);
      questionEl.innerHTML = 'What is this measurement? <span class="value"></span>';
      drawCaliper(canvas, currentTarget);
      mode = 'type';
    }

    function drawCaliper(canvas, target) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fafafa';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#333';
      ctx.fillStyle = '#333';

      // Simplified beam representation
      var beamY = 100;
      ctx.beginPath();
      ctx.moveTo(50, beamY);
      ctx.lineTo(canvas.width - 50, beamY);
      ctx.stroke();

      // Simplified: just show beam length for target
      var scale = (canvas.width - 100) / 64;
      ctx.fillStyle = '#3498db';
      ctx.fillRect(50, beamY - 20, target * scale, 20);

      if (mode === 'show-answer') {
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(50 + target * scale, beamY - 30);
        ctx.lineTo(50 + target * scale, beamY + 30);
        ctx.stroke();
        ctx.lineWidth = 1;
      }
    }

    panel.querySelector('#caliper-check').addEventListener('click', function() {
      if (engine.isGameOver()) { engine.reset(); }
      if (mode === 'type') {
        var answerText = prompt('Enter measurement:');
        if (answerText === null) return;
        var guessed = CaliperLogic.parseAnswer(answerText, settings);
        if (guessed === currentTarget) {
          engine.recordCorrect();
          panel.querySelector('.game-area').insertAdjacentHTML('beforebegin',
            '<div class="feedback correct">Correct! ' + CaliperLogic.formatTarget(currentTarget, settings) + '</div>');
          setTimeout(newQuestion, 1500);
        } else {
          engine.recordStrike();
          mode = 'show-answer';
          drawCaliper(canvas, currentTarget);
          panel.querySelector('.game-area').insertAdjacentHTML('beforebegin',
            '<div class="feedback wrong">Wrong. Correct: ' + CaliperLogic.formatTarget(currentTarget, settings) + '</div>');
        }
      } else {
        newQuestion();
      }
    });

    panel.querySelector('#caliper-settings').addEventListener('click', function() {
      var form = weldtrain.buildSettingsPanel(panel, settingsDef);
      form.querySelector('.apply-btn').addEventListener('click', function() {
        var newSettings = weldtrain.readSettingsFromForm(form);
        for (var k in newSettings) { settings[k] = newSettings[k]; }
        weldtrain.saveSettings('caliper', settings);
        form.parentElement.innerHTML = '';
        engine.reset();
        newQuestion();
      });
    });

    newQuestion();
  }

  return { init: init };
})();

window.registerModule('caliper', 'Dial Caliper', CaliperGame.init);
