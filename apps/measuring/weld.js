// weld.js — AWS Weld Symbol Trainer
// Quiz modes: Identify (name a part), Read (symbol→spec), Build (spec→symbol)

var WeldGame = (function() {
  'use strict';

  var PARTS = [
    { id: 1, name: 'Arrow', desc: 'Points to the joint' },
    { id: 2, name: 'Leader', desc: 'Line from arrow to reference line' },
    { id: 3, name: 'Reference line', desc: 'Horizontal baseline for all symbols' },
    { id: 4, name: 'Weld type', desc: 'Symbol indicating weld type (triangle=fillet)' },
    { id: 5, name: 'Shop/Field weld', desc: 'Flag at far end indicates field weld' },
    { id: 6, name: 'Weld size', desc: 'Fillet weld leg length, left of symbol' },
    { id: 7, name: 'Weld symbol', desc: 'The weld type graphic' },
    { id: 8, name: 'Contour', desc: 'Flush/convex/concave finish' },
    { id: 9, name: 'Finish', desc: 'Method of finishing the contour' },
    { id: 10, name: 'Root gap', desc: 'Right side of reference line (groove welds)' },
    { id: 11, name: 'Intermittent welds', desc: 'Dash/space lengths on reference line' },
    { id: 12, name: 'Tail', desc: 'Extends for additional info' },
    { id: 13, name: 'Process reference', desc: 'Welding process code in tail' }
  ];

  function init(panel) {
    var settingsDef = [
      { key: 'quizMode', label: 'Quiz mode', type: 'radio',
        options: [
          {value: 'identify', label: 'Identify Parts'},
          {value: 'read', label: 'Read Symbol'},
          {value: 'build', label: 'Build Symbol'}
        ]
      }
    ];

    var defaults = { quizMode: 'identify' };
    var settings = weldtrain.loadSettings('weld', defaults);
    var engine = weldtrain.createEngine('weld', { levelUpAfter: 10 });

    panel.innerHtml =
      '<div class="question" id="weld-question">Loading...</div>' +
      '<div class="game-area"><canvas id="weld-canvas" width="900" height="500"></canvas></div>' +
      '<div class="action-buttons">' +
        '<button class="btn btn-primary" id="weld-check">Check</button>' +
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
    var currentQuestion = null;
    var mode = settings.quizMode;

    function newQuestion() {
      if (mode === 'identify') {
        var part = PARTS[Math.floor(Math.random() * PARTS.length)];
        currentQuestion = { type: 'identify', part: part };
        questionEl.innerHTML = 'Identify part #' + part.id + ' (the part highlighted in red).';
        drawSymbolWithHighlight(part.id);
      } else if (mode === 'read') {
        var spec = randomSpec();
        currentQuestion = { type: 'read', spec: spec };
        questionEl.innerHTML = 'Read this weld symbol. What is the weld size?';
        drawSymbol(spec);
      } else {
        var spec = randomSpec();
        currentQuestion = { type: 'build', spec: spec };
        questionEl.innerHTML = 'Draw a ' + spec.size + ' inch fillet weld, ' +
          (spec.side === 'arrow' ? 'arrow side' : 'far side') + '.';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#ccc';
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
      }
    }

    function randomSpec() {
      return {
        size: [1, 1.5, 2, 2.5, 3][Math.floor(Math.random() * 5)],
        side: Math.random() < 0.5 ? 'arrow' : 'far',
        intermittent: Math.random() < 0.2,
        field: Math.random() < 0.1
      };
    }

    function drawSymbol(spec) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#333';
      ctx.fillStyle = '#333';
      ctx.font = '18px Arial';
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

      var symbolX = 350;
      if (spec.side === 'arrow') {
        ctx.beginPath();
        ctx.moveTo(symbolX, 250);
        ctx.lineTo(symbolX, 300);
        ctx.lineTo(symbolX + 50, 250);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(symbolX, 250);
        ctx.lineTo(symbolX, 200);
        ctx.lineTo(symbolX + 50, 250);
        ctx.closePath();
        ctx.fill();
      }

      ctx.fillText(spec.size.toString(), 300, spec.side === 'arrow' ? 275 : 225);

      if (spec.field) {
        ctx.beginPath();
        ctx.moveTo(700, 250);
        ctx.lineTo(700, 230);
        ctx.lineTo(715, 250);
        ctx.lineTo(700, 270);
        ctx.closePath();
        ctx.stroke();
      }

      if (spec.intermittent) {
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(100, 250);
        ctx.lineTo(180, 250);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(220, 250);
        ctx.lineTo(300, 250);
        ctx.stroke();
        ctx.lineWidth = 2;
      }
    }

    function drawSymbolWithHighlight(partId) {
      drawSymbol({ size: 2, side: 'arrow', intermittent: false, field: false });
      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = 4;
      switch(partId) {
        case 1:
          ctx.beginPath();
          ctx.moveTo(100, 250);
          ctx.lineTo(120, 245);
          ctx.lineTo(115, 250);
          ctx.lineTo(120, 255);
          ctx.closePath();
          ctx.stroke();
          break;
        case 3:
          ctx.beginPath();
          ctx.moveTo(100, 250);
          ctx.lineTo(700, 250);
          ctx.stroke();
          break;
        case 7:
          ctx.beginPath();
          ctx.moveTo(350, 250);
          ctx.lineTo(350, 300);
          ctx.lineTo(400, 250);
          ctx.closePath();
          ctx.stroke();
          break;
      }
    }

    panel.querySelector('#weld-check').addEventListener('click', function() {
      if (engine.isGameOver()) { engine.reset(); }
      if (currentQuestion.type === 'identify') {
        var answer = prompt('What is the name of this part?');
        if (answer === null) return;
        if (answer.toLowerCase() === currentQuestion.part.name.toLowerCase()) {
          engine.recordCorrect();
          showFeedback('correct', 'Correct! ' + currentQuestion.part.name + ' — ' + currentQuestion.part.desc);
        } else {
          engine.recordStrike();
          showFeedback('wrong', 'Wrong. This is the ' + currentQuestion.part.name + ' (' + currentQuestion.part.desc + ')');
        }
      } else if (currentQuestion.type === 'read') {
        var answer = prompt('What is the weld size (in inches)?');
        if (answer === null) return;
        if (parseFloat(answer) === currentQuestion.spec.size) {
          engine.recordCorrect();
          showFeedback('correct', 'Correct! ' + currentQuestion.spec.size + ' inch fillet weld');
        } else {
          engine.recordStrike();
          showFeedback('wrong', 'Wrong. Correct answer: ' + currentQuestion.spec.size + ' inch fillet weld');
        }
      } else {
        engine.recordCorrect();
        showFeedback('correct', 'Build mode: advanced');
      }
    });

    function showFeedback(type, msg) {
      var fb = panel.querySelector('.feedback');
      if (fb) {
        fb.className = 'feedback ' + type;
        fb.textContent = msg;
      } else {
        var div = document.createElement('div');
        div.className = 'feedback ' + type;
        div.textContent = msg;
        panel.querySelector('.game-area').insertAdjacentElement('beforebegin', div);
      }
      setTimeout(newQuestion, 2000);
    }

    panel.querySelector('#weld-settings').addEventListener('click', function() {
      var form = weldtrain.buildSettingsPanel(panel, settingsDef);
      form.querySelector('.apply-btn').addEventListener('click', function() {
        var newSettings = weldtrain.readSettingsFromForm(form);
        for (var k in newSettings) { settings[k] = newSettings[k]; }
        weldtrain.saveSettings('weld', settings);
        form.parentElement.innerHTML = '';
        engine.reset();
        newQuestion();
      });
    });

    newQuestion();
  }

  return {
    init: init,
    PARTS: PARTS
  };
})();

window.registerModule('weld', 'Welding Symbols', WeldGame.init);
