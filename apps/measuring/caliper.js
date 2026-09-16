// caliper.js — Dial Caliper game UI (Type / Find / Trainer modes)

var CaliperGame = (function() {
  'use strict';

  var SCALE = 5; // pixels per 1/1000 inch (or per unit)
  var BEAM_LENGTH = 6000; // 6 inches in 1/1000 units
  var CANVAS_W = 1000;
  var CANVAS_H = 400;

  function init(panel) {
    var settingsDef = [
      { key: 'unit', label: 'Unit', type: 'radio',
        options: [
          {value: 'inch', label: 'Inch'},
          {value: 'cm', label: 'Centimeter'}
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
      },
      { key: 'mode', label: 'Mode', type: 'radio',
        options: [
          {value: 'type', label: 'Type'},
          {value: 'find', label: 'Find'},
          {value: 'trainer', label: 'Trainer'}
        ]
      }
    ];

    var defaults = { unit: 'inch', resolution: '0.001', mode: 'type' };
    var settings = weldtrain.loadSettings('caliper', defaults);
    var engine = weldtrain.createEngine('caliper', { levelUpAfter: 10 });

    panel.innerHTML =
      '<div class="question" id="caliper-question">Loading...</div>' +
      '<div class="caliper-wrap">' +
        '<canvas id="caliper-canvas" width="' + CANVAS_W + '" height="' + CANVAS_H + '"></canvas>' +
      '</div>' +
      '<div class="answer-area">' +
        '<input type="text" id="caliper-answer" placeholder="Your reading" autocomplete="off">' +
      '</div>' +
      '<div class="action-buttons">' +
        '<button class="btn btn-primary" id="caliper-check">Check Answer</button>' +
        '<button class="btn btn-secondary" id="caliper-skip">Skip</button>' +
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
    var answerInput = panel.querySelector('#caliper-answer');
    var answerArea = panel.querySelector('.answer-area');

    var currentTarget = null;
    var currentSettings = null;
    var userTarget = 0;

    function maxTargetInt(s) {
      if (s.unit === 'inch') return s.resolution === '0.001' ? 6000 : 384;
      return s.resolution === '0.01' ? 15000 : 1500;
    }

    function maxDisplayUnits(s) {
      return s.unit === 'inch' ? 6 : 150;
    }

    function getSettings() {
      return { unit: settings.unit, resolution: settings.resolution };
    }

    function newQuestion() {
      currentSettings = getSettings();
      currentTarget = CaliperLogic.generateTarget(currentSettings);
      userTarget = 0;
      answerInput.value = '';

      if (settings.mode === 'type') {
        questionEl.textContent = 'Read the measurement displayed on the caliper.';
        answerArea.style.display = '';
        drawCaliper(currentTarget, currentSettings);
      } else if (settings.mode === 'find') {
        var targetStr = CaliperLogic.formatTarget(currentTarget, currentSettings);
        questionEl.textContent = 'Set the caliper to: ' + targetStr + ' — click the beam, then Check.';
        answerArea.style.display = 'none';
        drawCaliper(userTarget, currentSettings);
      } else {
        var targetStr = CaliperLogic.formatTarget(currentTarget, currentSettings);
        questionEl.textContent = 'Trainer: The target is ' + targetStr + ' — click the beam to practice.';
        answerArea.style.display = 'none';
        drawCaliper(userTarget, currentSettings);
      }
    }

    function drawCaliper(targetInt, s) {
      var maxUnits = maxDisplayUnits(s);
      var canvasMax = CANVAS_W - 100;
      var scale = canvasMax / maxUnits;
      var valueUnits = CaliperLogic.targetToUnits(targetInt, s);
      var jawX = 50 + valueUnits * scale;
      jawX = Math.max(50, Math.min(50 + canvasMax, jawX));

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw beam (upper scale)
      ctx.fillStyle = '#d8d8d8';
      ctx.fillRect(50, 100, CANVAS_W - 100, 60);
      ctx.strokeStyle = '#999';
      ctx.strokeRect(50, 100, CANVAS_W - 100, 60);

      // Beam graduations
      ctx.fillStyle = '#333';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';

      if (s.unit === 'inch') {
        for (var i = 0; i <= 6; i++) {
          var x = 50 + i * scale;
          ctx.beginPath();
          ctx.moveTo(x, 100);
          ctx.lineTo(x, 160);
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 2;
          ctx.stroke();
          if (i > 0 && i <= 6) {
            ctx.fillText(i + '"', x, 175);
          }
        }
        // Half and quarter marks
        for (var i = 0; i < 12; i++) {
          var x = 50 + (i + 0.5) * scale / 2;
          ctx.beginPath();
          ctx.moveTo(x, 130);
          ctx.lineTo(x, 160);
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        for (var i = 0; i < 24; i++) {
          var x = 50 + (i + 0.5) * scale / 4;
          ctx.beginPath();
          ctx.moveTo(x, 145);
          ctx.lineTo(x, 160);
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      } else {
        for (var i = 0; i <= 15; i++) {
          var x = 50 + i * 10 * scale;
          ctx.beginPath();
          ctx.moveTo(x, 100);
          ctx.lineTo(x, 160);
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 2;
          ctx.stroke();
          if (i > 0 && i <= 15) {
            ctx.fillText(i + ' cm', x, 175);
          }
        }
        for (var i = 0; i < 150; i++) {
          var x = 50 + i * scale;
          if (i % 10 !== 0) {
            ctx.beginPath();
            ctx.moveTo(x, 150);
            ctx.lineTo(x, 160);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Fixed jaw at zero + sliding jaw at the measured value
      ctx.fillStyle = '#666';
      ctx.fillRect(46, 90, 8, 80);
      ctx.fillStyle = 'rgba(52, 152, 219, 0.25)';
      if (jawX > 54) ctx.fillRect(54, 100, jawX - 54, 60);
      ctx.fillStyle = '#c00';
      ctx.fillRect(jawX - 3, 90, 6, 80);
      ctx.beginPath();
      ctx.moveTo(jawX, 170);
      ctx.lineTo(jawX - 7, 184);
      ctx.lineTo(jawX + 7, 184);
      ctx.closePath();
      ctx.fill();

      // Draw dial (fixed position, lower scale)
      var dialY = 280;
      var dialX = 200;
      var dialRadius = 90;
      ctx.fillStyle = '#f0f0f0';
      ctx.beginPath();
      ctx.arc(dialX, dialY, dialRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Dial markings (0-100; one revolution per 0.1 in, or per 1 mm in metric)
      var revsPerUnit = s.unit === 'inch' ? 0.1 : 1;
      for (var i = 0; i < 100; i++) {
        var angle = (i / 100) * Math.PI * 2 - Math.PI / 2;
        var markLen = (i % 10 === 0) ? 14 : 7;
        var innerR = dialRadius - 4;
        var outerR = innerR - markLen;
        var x1 = dialX + innerR * Math.cos(angle);
        var y1 = dialY + innerR * Math.sin(angle);
        var x2 = dialX + outerR * Math.cos(angle);
        var y2 = dialY + outerR * Math.sin(angle);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = (i % 10 === 0) ? 2 : 1;
        ctx.stroke();
        if (i % 10 === 0) {
          var labelR = innerR - markLen - 10;
          ctx.fillStyle = '#000';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(i), dialX + labelR * Math.cos(angle),
                       dialY + labelR * Math.sin(angle));
        }
      }
      ctx.textBaseline = 'alphabetic';

      // Needle: fraction of one revolution actually measured
      var revs = valueUnits / revsPerUnit;
      revs = revs - Math.floor(revs);
      var needleAngle = revs * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(dialX - 15 * Math.cos(needleAngle), dialY - 15 * Math.sin(needleAngle));
      ctx.lineTo(dialX + (dialRadius - 10) * Math.cos(needleAngle),
                 dialY + (dialRadius - 10) * Math.sin(needleAngle));
      ctx.strokeStyle = '#c00';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Center dot
      ctx.beginPath();
      ctx.arc(dialX, dialY, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#c00';
      ctx.fill();

      ctx.fillStyle = '#000';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      if (settings.mode !== 'type') {
        ctx.fillText(CaliperLogic.formatTarget(targetInt, s), dialX, dialY + dialRadius + 22);
      }
    }

    function checkAnswer() {
      if (engine.isGameOver()) {
        engine.reset();
        newQuestion();
        return;
      }

      if (settings.mode === 'trainer') {
        var yours = CaliperLogic.formatTarget(userTarget, currentSettings);
        var goal = CaliperLogic.formatTarget(currentTarget, currentSettings);
        showFeedback(userTarget === currentTarget ? 'correct' : 'wrong',
          'Yours: ' + yours + ' — target: ' + goal + ' (practice, no score)');
        return;
      }

      if (settings.mode === 'find') {
        if (userTarget === currentTarget) {
          engine.recordCorrect();
          showFeedback('correct', 'Correct! ' + CaliperLogic.formatTarget(currentTarget, currentSettings));
          setTimer(newQuestion, 1500);
        } else {
          engine.recordStrike();
          var correctStr = CaliperLogic.formatTarget(currentTarget, currentSettings);
          showFeedback('wrong', 'Not quite — yours reads ' +
            CaliperLogic.formatTarget(userTarget, currentSettings) + '. Target: ' + correctStr);
          setTimer(newQuestion, 2500);
        }
        return;
      }

      // Type mode
      var input = answerInput.value.trim();
      if (!input) return;

      if (CaliperLogic.validateAnswer(input, currentTarget, currentSettings)) {
        engine.recordCorrect();
        showFeedback('correct', 'Correct! ' + CaliperLogic.formatTarget(currentTarget, currentSettings));
        setTimer(newQuestion, 1500);
      } else {
        engine.recordStrike();
        var correctStr = CaliperLogic.formatTarget(currentTarget, currentSettings);
        showFeedback('wrong', 'Incorrect. Correct: ' + correctStr);
        setTimer(newQuestion, 2500);
      }
    }

    function showFeedback(type, msg) {
      var existing = panel.querySelector('.feedback');
      if (existing) existing.remove();

      var div = document.createElement('div');
      div.className = 'feedback ' + type;
      div.textContent = msg;
      panel.querySelector('.caliper-wrap').insertAdjacentElement('afterend', div);

      setTimer(function() {
        if (div.parentNode) div.parentNode.removeChild(div);
      }, 2000);
    }

    var setTimer = setTimeout;

    panel.querySelector('#caliper-check').addEventListener('click', checkAnswer);
    answerInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') checkAnswer();
    });

    panel.querySelector('#caliper-skip').addEventListener('click', function() {
      if (engine.isGameOver()) {
        engine.reset();
        newQuestion();
        return;
      }
      engine.recordStrike();
      var correctStr = CaliperLogic.formatTarget(currentTarget, currentSettings);
      showFeedback('wrong', 'Skipped. Correct: ' + correctStr);
      setTimer(newQuestion, 2000);
    });

    panel.querySelector('#caliper-settings').addEventListener('click', function() {
      var form = weldtrain.buildSettingsPanel(panel, settingsDef);
      form.querySelector('.apply-btn').addEventListener('click', function() {
        var newSettings = weldtrain.readSettingsFromForm(form);
        for (var k in newSettings) {
          settings[k] = newSettings[k];
        }
        weldtrain.saveSettings('caliper', settings);
        weldtrain.restorePanel(panel, 'caliper');
      });
    });

    // Canvas interactions for find/trainer modes: click maps to nearest step
    canvas.addEventListener('mousedown', function(e) {
      if (settings.mode !== 'find' && settings.mode !== 'trainer') return;
      var s = getSettings();
      var rect = canvas.getBoundingClientRect();
      var pxPerUnit = rect.width / CANVAS_W;
      var x = (e.clientX - rect.left) / pxPerUnit;
      var relX = Math.max(0, Math.min(CANVAS_W - 100, x - 50));
      var scale = (CANVAS_W - 100) / maxDisplayUnits(s);
      var guess = CaliperLogic.unitsToTarget(relX / scale, s);
      var step = CaliperLogic.stepInTargetUnits(s);
      guess = Math.round(guess / step) * step;
      guess = Math.max(0, Math.min(maxTargetInt(s), guess));
      userTarget = guess;
      drawCaliper(userTarget, s);
    });

    newQuestion();
  }

  return { init: init };
})();

window.registerModule('caliper', 'Dial Caliper', CaliperGame.init);