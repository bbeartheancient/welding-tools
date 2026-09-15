// caliper.js — Dial Caliper game UI
// Shows a caliper with a rotating dial. User reads the beam + dial.

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
        options: [
          {value: '0.001', label: '0.001 in'},
          {value: '1/64', label: '1/64 in'},
          {value: '1/32', label: '1/32 in'},
          {value: '1/16', label: '1/16 in'},
          {value: '1/8', label: '1/8 in'},
          {value: '0.01', label: '0.01 cm'},
          {value: '0.1', label: '0.1 cm'}
        ]
      }
    ];

    var defaults = { unit: 'inch', resolution: '0.001' };
    var settings = weldtrain.loadSettings('caliper', defaults);
    var engine = weldtrain.createEngine('caliper', { levelUpAfter: 10 });

    panel.innerHTML =
      '<div class="question" id="caliper-question">Loading...</div>' +
      '<div class="caliper-wrap">' +
        '<canvas id="caliper-canvas" width="900" height="300"></canvas>' +
      '</div>' +
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
    var currentSettings = null;

    function settingsFromState() {
      return {
        unit: settings.unit,
        resolution: settings.resolution
      };
    }

    function newQuestion() {
      currentSettings = settingsFromState();
      currentTarget = CaliperLogic.generateTarget(currentSettings);
      questionEl.innerHTML = 'Read the caliper measurement.';
      drawCaliper(currentTarget, currentSettings);
    }

    function drawCaliper(targetValue, s) {
      var isImperial = s.unit === 'inch';
      var beamLength = isImperial ? 6 : 15; // 6 inches or 15 cm max
      var beamScale = 600 / beamLength; // pixels per unit

      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw beam
      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(50, 100, 800, 60);
      ctx.strokeStyle = '#999';
      ctx.lineWidth = 1;
      ctx.strokeRect(50, 100, 800, 60);

      // Draw beam graduations
      ctx.fillStyle = '#333';
      ctx.strokeStyle = '#333';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';

      if (isImperial) {
        // Imperial: draw 0-6 inch marks
        for (var i = 0; i <= beamLength; i++) {
          var x = 50 + i * beamScale;
          ctx.beginPath();
          ctx.moveTo(x, 100);
          ctx.lineTo(x, 160);
          ctx.lineWidth = 2;
          ctx.stroke();
          if (i > 0 && i < beamLength) {
            ctx.fillText(i.toString(), x, 175);
          }
        }

        // Draw 1/2, 1/4, 1/8, 1/16 marks
        var divisions = [2, 4, 8, 16];
        for (var d = 0; d < divisions.length; d++) {
          var div = divisions[d];
          var markHeight = 100 + 60 - (10 + d * 5);
          for (var i = 1; i < beamLength * div; i++) {
            if (i % (div / Math.pow(2, d)) === 0) continue;
            var x = 50 + (i / div) * beamScale;
            ctx.beginPath();
            ctx.moveTo(x, 160);
            ctx.lineTo(x, markHeight);
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      } else {
        // Metric: draw 0-15 cm marks (each cm = 10 mm)
        for (var i = 0; i <= beamLength * 10; i++) {
          var x = 50 + (i / 10) * beamScale;
          if (i % 10 === 0) {
            // cm mark (long)
            ctx.beginPath();
            ctx.moveTo(x, 100);
            ctx.lineTo(x, 160);
            ctx.lineWidth = 2;
            ctx.stroke();
            if (i > 0 && i < beamLength * 10) {
              ctx.fillText((i / 10).toString(), x, 175);
            }
          } else if (i % 5 === 0) {
            // 5mm mark (medium)
            ctx.beginPath();
            ctx.moveTo(x, 160);
            ctx.lineTo(x, 135);
            ctx.lineWidth = 1;
            ctx.stroke();
          } else {
            // 1mm mark (short)
            ctx.beginPath();
            ctx.moveTo(x, 160);
            ctx.lineTo(x, 145);
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Convert target to inches/cm for beam position
      var beamValue = 0;
      var dialValue = 0;
      if (isImperial) {
        if (s.resolution === '0.001') {
          beamValue = targetValue / 1000; // inches
          dialValue = (targetValue % 100) / 100; // 0.00-0.99
        } else {
          // Fractional: target is in 1/64ths
          beamValue = targetValue / 64;
          // For fractional, dial shows 0-63/64
          dialValue = (targetValue % 64) / 64;
        }
      } else {
        if (s.resolution === '0.01') {
          beamValue = targetValue / 100; // cm
          dialValue = (targetValue % 100) / 100;
        } else {
          beamValue = targetValue / 10; // cm
          dialValue = (targetValue % 10) / 10;
        }
      }

      // Draw slider at beam position
      var sliderX = 50 + beamValue * beamScale;
      ctx.fillStyle = '#ccc';
      ctx.fillRect(sliderX - 5, 80, 10, 100);

      // Draw dial on slider
      var dialX = sliderX;
      var dialY = 130;
      var dialRadius = 50;

      // Dial background
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(dialX, dialY, dialRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Dial markings (100 divisions = 0.00-0.99)
      for (var i = 0; i <= 100; i++) {
        var angle = (i / 100) * Math.PI * 2 - Math.PI / 2;
        var markInner = dialRadius - 5;
        var markOuter = dialRadius;
        var mx1 = dialX + markInner * Math.cos(angle);
        var my1 = dialY + markInner * Math.sin(angle);
        var mx2 = dialX + markOuter * Math.cos(angle);
        var my2 = dialY + markOuter * Math.sin(angle);
        ctx.beginPath();
        ctx.moveTo(mx1, my1);
        ctx.lineTo(mx2, my2);
        if (i % 10 === 0) {
          ctx.lineWidth = 2;
        } else {
          ctx.lineWidth = 1;
        }
        ctx.strokeStyle = '#333';
        ctx.stroke();

        // Labels for major divisions
        if (i % 10 === 0 && i < 100) {
          var labelR = dialRadius - 15;
          var lx = dialX + labelR * Math.cos(angle);
          var ly = dialY + labelR * Math.sin(angle);
          ctx.fillStyle = '#333';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(i.toString(), lx, ly);
        }
      }

      // Dial needle
      var dialAngle = dialValue * Math.PI * 2 - Math.PI / 2;
      var needleLen = dialRadius - 10;
      var needleEndX = dialX + needleLen * Math.cos(dialAngle);
      var needleEndY = dialY + needleLen * Math.sin(dialAngle);

      ctx.beginPath();
      ctx.moveTo(dialX, dialY);
      ctx.lineTo(needleEndX, needleEndY);
      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Center dot
      ctx.beginPath();
      ctx.arc(dialX, dialY, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#e74c3c';
      ctx.fill();
    }

    panel.querySelector('#caliper-check').addEventListener('click', function() {
      if (engine.isGameOver()) {
        engine.reset();
      }

      var answerText = prompt('Enter the measurement:');
      if (answerText === null) return;

      var guessed = CaliperLogic.parseAnswer(answerText, currentSettings);
      if (guessed === currentTarget) {
        engine.recordCorrect();
        showFeedback('correct', 'Correct! ' + CaliperLogic.formatTarget(currentTarget, currentSettings));
        setTimeout(newQuestion, 1500);
      } else {
        engine.recordStrike();
        showFeedback('wrong', 'Wrong. Correct: ' + CaliperLogic.formatTarget(currentTarget, currentSettings));
        setTimeout(newQuestion, 2500);
      }
    });

    panel.querySelector('#caliper-settings').addEventListener('click', function() {
      var form = weldtrain.buildSettingsPanel(panel, settingsDef);
      form.querySelector('.apply-btn').addEventListener('click', function() {
        var newSettings = weldtrain.readSettingsFromForm(form);
        for (var k in newSettings) {
          settings[k] = newSettings[k];
        }
        weldtrain.saveSettings('caliper', settings);
        form.parentElement.innerHTML = '';
        engine.reset();
        newQuestion();
      });
    });

    function showFeedback(type, msg) {
      var existing = panel.querySelector('.feedback');
      if (existing) existing.remove();

      var div = document.createElement('div');
      div.className = 'feedback ' + type;
      div.textContent = msg;
      panel.querySelector('.caliper-wrap').insertAdjacentElement('afterend', div);
    }

    newQuestion();
  }

  return { init: init };
})();

window.registerModule('caliper', 'Dial Caliper', CaliperGame.init);