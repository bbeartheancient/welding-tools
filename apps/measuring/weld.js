// weld.js — AWS Weld Symbol Trainer (Identify/Read/Build modes)

var WeldGame = (function() {
  'use strict';

  var PARTS = [
    { id: 1, name: 'Arrow', desc: 'Points to the joint' },
    { id: 2, name: 'Leader', desc: 'Line from arrow to reference line' },
    { id: 3, name: 'Reference line', desc: 'Horizontal baseline for all symbols' },
    { id: 4, name: 'Weld type', desc: 'Symbol indicating weld type (e.g. triangle=fillet)' },
    { id: 5, name: 'Shop/Field weld', desc: 'Flag at the arrow/reference-line junction indicates field weld' },
    { id: 6, name: 'Weld size', desc: 'Fillet weld leg length, left of symbol' },
    { id: 7, name: 'Weld symbol', desc: 'The weld type graphic' },
    { id: 8, name: 'Contour', desc: 'Flush/convex/concave finish' },
    { id: 9, name: 'Finish', desc: 'Method of finishing the contour' },
    { id: 10, name: 'Root gap', desc: 'Right side of reference line (groove welds)' },
    { id: 11, name: 'Intermittent welds', desc: 'Dash/space lengths on reference line' },
    { id: 12, name: 'Tail', desc: 'Extends for additional info' },
    { id: 13, name: 'Process reference', desc: 'Welding process code in tail' }
  ];

  var WELD_TYPES = [
    { id: 'fillet', name: 'Fillet', symbol: 'triangle' },
    { id: 'groove', name: 'V-groove', symbol: 'vee' },
    { id: 'plug', name: 'Plug', symbol: 'rectangle' },
    { id: 'slot', name: 'Slot', symbol: 'rectangle' },
    { id: 'seam', name: 'Resistance seam', symbol: 'circle-with-parallel-lines' }
  ];

  var CANVAS_W = 900;
  var CANVAS_H = 500;

  function init(panel) {
    var settingsDef = [
      { key: 'quizMode', label: 'Quiz mode', type: 'radio',
        options: [
          {value: 'identify', label: 'Identify Parts'},
          {value: 'read', label: 'Read Symbol'},
          {value: 'build', label: 'Build Symbol'}
        ]
      },
      { key: 'weldType', label: 'Weld types', type: 'select',
        options: [
          {value: 'all', label: 'All types'},
          {value: 'fillet', label: 'Fillet only'},
          {value: 'groove', label: 'Groove only'}
        ]
      }
    ];

    var defaults = { quizMode: 'identify', weldType: 'all' };
    var settings = weldtrain.loadSettings('weld', defaults);
    var engine = weldtrain.createEngine('weld', { levelUpAfter: 10 });

    panel.innerHTML =
      '<div class="question" id="weld-question">Loading...</div>' +
      '<div class="game-area"><canvas id="weld-canvas" width="' + CANVAS_W + '" height="' + CANVAS_H + '"></canvas></div>' +
      '<div class="answer-area">' +
        '<input type="text" id="weld-answer" placeholder="Your answer" autocomplete="off">' +
      '</div>' +
      '<div class="action-buttons">' +
        '<button class="btn btn-primary" id="weld-check">Check Answer</button>' +
        '<button class="btn btn-secondary" id="weld-skip">Skip</button>' +
        '<button class="btn btn-warning" id="weld-settings">⚙ Settings</button>' +
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

    var canvas = panel.querySelector('#weld-canvas');
    var ctx = canvas.getContext('2d');
    var questionEl = panel.querySelector('#weld-question');
    var answerInput = panel.querySelector('#weld-answer');
    var currentQuestion = null;

    function randomSpec() {
      var weldType = null;
      if (settings.weldType === 'all') {
        weldType = WELD_TYPES[Math.floor(Math.random() * WELD_TYPES.length)];
      } else {
        weldType = WELD_TYPES.find(function(t) { return t.id === settings.weldType; });
      }

      var sizes = [1, 1.5, 2, 2.5, 3, 3.5, 4];
      var size = sizes[Math.floor(Math.random() * sizes.length)];
      var side = Math.random() < 0.5 ? 'arrow' : 'far';
      return {
        weldType: weldType,
        size: size,
        side: side,
        intermittent: Math.random() < 0.15,
        field: Math.random() < 0.08,
        tail: Math.random() < 0.1,
        processCode: '111'
      };
    }

    function drawSymbol(spec, highlightPart) {
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = '#333';
      ctx.font = '16px Arial';
      ctx.lineWidth = 2;

      var refY = 250;
      var arrowX = 100;
      var symbolX = 380;
      var flagX = arrowX;
      var tailX = 750;

      // Reference line (part 3)
      if (highlightPart === 3) {
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 4;
      } else {
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
      }
      ctx.beginPath();
      ctx.moveTo(arrowX, refY);
      ctx.lineTo(tailX, refY);
      ctx.stroke();

      // Leader line (part 2)
      if (highlightPart === 2) {
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 4;
      } else {
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
      }
      ctx.beginPath();
      ctx.moveTo(arrowX, refY);
      ctx.lineTo(arrowX + 40, refY + 30);
      ctx.stroke();

      // Arrow head (part 1)
      if (highlightPart === 1) {
        ctx.fillStyle = '#e74c3c';
      } else {
        ctx.fillStyle = '#333';
      }
      ctx.beginPath();
      ctx.moveTo(arrowX + 40, refY + 30);
      ctx.lineTo(arrowX + 30, refY + 25);
      ctx.lineTo(arrowX + 30, refY + 35);
      ctx.closePath();
      ctx.fill();

      // Weld symbol (part 7) and weld type (part 4)
      var symbolColor = (highlightPart === 7 || highlightPart === 4) ? '#e74c3c' : '#333';
      ctx.fillStyle = symbolColor;
      ctx.strokeStyle = symbolColor;

      ctx.lineWidth = (highlightPart === 7 || highlightPart === 4) ? 4 : 2;
      var sides = spec.side === 'both' ? [1, -1] : [spec.side === 'arrow' ? 1 : -1];
      sides.forEach(function(side) {
        var y = refY + side * 30;
        ctx.beginPath();
        if (spec.weldType.id === 'fillet') {
          ctx.moveTo(symbolX, refY);
          ctx.lineTo(symbolX, y);
          ctx.lineTo(symbolX + 30, refY);
          ctx.closePath();
        } else if (spec.weldType.id === 'groove') {
          ctx.moveTo(symbolX, y);
          ctx.lineTo(symbolX + 15, refY);
          ctx.lineTo(symbolX + 30, y);
        } else if (spec.weldType.id === 'plug' || spec.weldType.id === 'slot') {
          ctx.rect(symbolX, refY, 40, side * 22);
        } else if (spec.weldType.id === 'seam') {
          ctx.arc(symbolX + 15, refY, 18, 0, Math.PI * 2);
          ctx.moveTo(symbolX - 12, refY - 7);
          ctx.lineTo(symbolX + 42, refY - 7);
          ctx.moveTo(symbolX - 12, refY + 7);
          ctx.lineTo(symbolX + 42, refY + 7);
        }
        ctx.stroke();
      });

      // Weld size (part 6) - left of symbol
      if (highlightPart === 6) {
        ctx.fillStyle = '#e74c3c';
      } else {
        ctx.fillStyle = '#333';
      }
      ctx.fillText(String(spec.size), symbolX - 60, spec.side === 'arrow' ? refY + 35 : refY - 20);

      // Field weld flag (part 5)
      if (spec.field) {
        if (highlightPart === 5) {
          ctx.strokeStyle = '#e74c3c';
          ctx.lineWidth = 4;
        } else {
          ctx.strokeStyle = '#333';
          ctx.lineWidth = 2;
        }
        ctx.beginPath();
        ctx.moveTo(flagX, refY);
        ctx.lineTo(flagX, refY - 55);
        ctx.lineTo(flagX + 30, refY - 45);
        ctx.lineTo(flagX, refY - 35);
        ctx.stroke();
      }

      if (spec.intermittent) {
        ctx.fillStyle = highlightPart === 11 ? '#e74c3c' : '#333';
        ctx.fillText('2-5', symbolX + 65, spec.side === 'arrow' ? refY + 35 : refY - 20);
      }

      // Tail (part 12)
      if (spec.tail) {
        if (highlightPart === 12) {
          ctx.strokeStyle = '#e74c3c';
        } else {
          ctx.strokeStyle = '#333';
        }
        ctx.lineWidth = highlightPart === 12 ? 4 : 2;
        ctx.beginPath();
        ctx.moveTo(tailX + 40, refY - 25);
        ctx.lineTo(tailX, refY);
        ctx.lineTo(tailX + 40, refY + 25);
        ctx.stroke();

        // Process reference (part 13)
        if (highlightPart === 13) {
          ctx.fillStyle = '#e74c3c';
        } else {
          ctx.fillStyle = '#333';
        }
        ctx.font = '14px Arial';
        ctx.fillText(spec.processCode, tailX + 45, refY + 5);
      }
    }

    function newQuestion() {
      answerInput.value = '';
      var mode = settings.quizMode;

      if (mode === 'identify') {
        var pool = PARTS.filter(function(p) {
          return [1, 2, 3, 4, 5, 6, 7, 11, 12, 13].indexOf(p.id) !== -1;
        });
        var part = pool[Math.floor(Math.random() * pool.length)];
        var spec = randomSpec();
        if (part.id === 5) spec.field = true;
        if (part.id === 11) spec.intermittent = true;
        if (part.id === 12 || part.id === 13) spec.tail = true;
        currentQuestion = { type: 'identify', part: part, spec: spec };
        questionEl.textContent = 'Identify part #' + part.id + ' (highlighted in red).';
        drawSymbol(spec, part.id);
        answerInput.placeholder = 'Part name';
      } else if (mode === 'read') {
        var spec = randomSpec();
        currentQuestion = { type: 'read', spec: spec };
        questionEl.textContent = 'Read this weld symbol. What is the weld size?';
        drawSymbol(spec);
        answerInput.placeholder = 'Size (e.g. 2 or 2 fillet)"';
      } else {
        var spec = randomSpec();
        currentQuestion = { type: 'build', spec: spec };
        questionEl.textContent = 'Build: ' + spec.size + '" ' + spec.weldType.name.toLowerCase() + ' weld, ' +
          (spec.side === 'arrow' ? 'arrow side' : 'far side') +
          (spec.intermittent ? ', intermittent' : '') +
          (spec.field ? ', field weld' : '');
        // Draw blank canvas with just reference line for student to draw on
        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(100, 250);
        ctx.lineTo(700, 250);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(100, 250);
        ctx.lineTo(120, 245);
        ctx.lineTo(115, 250);
        ctx.lineTo(120, 255);
        ctx.closePath();
        ctx.fill();
        answerInput.placeholder = 'Draw on canvas, then enter size';
      }
    }

    function checkAnswer() {
      if (engine.isGameOver()) {
        engine.reset();
        newQuestion();
        return;
      }

      var input = answerInput.value.trim();
      if (!input) return;

      if (currentQuestion.type === 'identify') {
        var partName = input.toLowerCase();
        var correctName = currentQuestion.part.name.toLowerCase();
        if (partName === correctName || partName.includes(correctName) || correctName.includes(partName)) {
          engine.recordCorrect();
          showFeedback('correct', 'Correct! This is the ' + currentQuestion.part.name + '. ' + currentQuestion.part.desc);
        } else {
          engine.recordStrike();
          showFeedback('wrong', 'Incorrect. This is the ' + currentQuestion.part.name + ', not "' + input + '".');
        }
      } else if (currentQuestion.type === 'read') {
        var expected = currentQuestion.spec.size;
        var expectedStr = expected.toString();
        if (input.trim() === expectedStr) {
          engine.recordCorrect();
          showFeedback('correct', 'Correct! ' + expected + " inch " + currentQuestion.spec.weldType.name.toLowerCase() + ' weld.');
        } else {
          engine.recordStrike();
          showFeedback('wrong', 'Incorrect. The weld size is ' + expected + " inches, not " + input + ".");
        }
      } else {
        // Build mode - just show the completed symbol as feedback
        var spec = currentQuestion.spec;
        showFeedback('correct', 'Here is the completed symbol for: ' + spec.size + '" ' + spec.weldType.name.toLowerCase() + ' weld, ' +
          (spec.side === 'arrow' ? 'arrow side' : 'far side'));
        drawSymbol(spec);
        engine.recordCorrect();
      }

      setTimeout(newQuestion, 2500);
    }

    function showFeedback(type, msg) {
      var existing = panel.querySelector('.feedback');
      if (existing) existing.remove();

      var div = document.createElement('div');
      div.className = 'feedback ' + type;
      div.textContent = msg;
      panel.querySelector('.game-area').insertAdjacentElement('beforebegin', div);

      setTimeout(function() {
        if (div.parentNode) div.parentNode.removeChild(div);
      }, 2500);
    }

    panel.querySelector('#weld-check').addEventListener('click', checkAnswer);
    answerInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') checkAnswer();
    });

    panel.querySelector('#weld-skip').addEventListener('click', function() {
      if (engine.isGameOver()) {
        engine.reset();
        newQuestion();
        return;
      }
      engine.recordStrike();
      var msg = '';
      if (currentQuestion.type === 'identify') {
        msg = 'Skipped. This is the ' + currentQuestion.part.name + '. ' + currentQuestion.part.desc;
      } else if (currentQuestion.type === 'read') {
        msg = 'Skipped. The size is ' + currentQuestion.spec.size + " inches.";
      } else {
        var spec = currentQuestion.spec;
        msg = 'Skipped. This would be a ' + spec.size + '" ' + spec.weldType.name.toLowerCase() + 's ' + spec.size + '" weld on the ' + spec.side + ' side.';
      }
      showFeedback('wrong', msg);
      setTimeout(newQuestion, 2500);
    });

    panel.querySelector('#weld-settings').addEventListener('click', function() {
      var form = weldtrain.buildSettingsPanel(panel, settingsDef);
      form.querySelector('.apply-btn').addEventListener('click', function() {
        var newSettings = weldtrain.readSettingsFromForm(form);
        for (var k in newSettings) {
          settings[k] = newSettings[k];
        }
        weldtrain.saveSettings('weld', settings);
        weldtrain.restorePanel(panel, 'weld');
      });
    });

    newQuestion();
  }

  return { init: init, PARTS: PARTS };
})();

window.registerModule('weld', 'Welding Symbols', WeldGame.init);