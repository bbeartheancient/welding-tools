// caliper-logic.js — Dial Caliper game logic (pure, no DOM)
// Inch resolutions: 0.001, 1/8, 1/16, 1/32, 1/64
// Metric resolutions: 0.1mm, 0.01mm

var CaliperLogic = (function() {
  'use strict';

  function gcd(a, b) {
    while (b > 0) { var t = b; b = a % b; a = t; }
    return a;
  }

  function generateTarget(settings) {
    var unit = settings.unit || 'inch';
    var resolution = settings.resolution || '0.001';
    if (unit === 'inch') {
      if (resolution === '1/64') return Math.floor(Math.random() * 128) + 1;
      if (resolution === '1/32') return (Math.floor(Math.random() * 64) + 1) * 2;
      if (resolution === '1/16') return (Math.floor(Math.random() * 32) + 1) * 4;
      if (resolution === '1/8') return (Math.floor(Math.random() * 16) + 1) * 8;
      return Math.floor(Math.random() * 1000) + 1;
    }
    if (resolution === '0.01') return Math.floor(Math.random() * 1000) + 1;
    return (Math.floor(Math.random() * 100) + 1) * 10;
  }

  function formatTarget(target, settings) {
    var unit = settings.unit || 'inch';
    var resolution = settings.resolution || '0.001';
    if (unit === 'inch') {
      if (resolution === '0.001') return (target / 1000).toFixed(3) + ' in';
      var whole = Math.floor(target / 64);
      var frac = target - whole * 64;
      if (frac === 0) return whole + ' in';
      var g = gcd(frac, 64);
      var num = frac / g;
      var den = 64 / g;
      if (den === 1) return (whole + num) + ' in';
      return whole > 0 ? whole + ' ' + num + '/' + den + ' in' : num + '/' + den + ' in';
    }
    if (resolution === '0.01') return (target / 100).toFixed(2) + ' mm';
    return (target / 10).toFixed(1) + ' mm';
  }

  function parseAnswer(text, settings) {
    text = text.trim();
    var unit = settings.unit || 'inch';
    var resolution = settings.resolution || '0.001';
    if (unit === 'inch') {
      if (resolution === '0.001') {
        var val = parseFloat(text.replace(/\s*in$/, ''));
        if (isNaN(val)) return null;
        return Math.round(val * 1000);
      }
      var m = text.match(/^(\d+)?\s*([\d]+)\s*\/\s*([\d]+)?/);
      if (m) {
        var whole = m[1] ? parseInt(m[1]) : 0;
        var num = parseInt(m[2]);
        var den = m[3] ? parseInt(m[3]) : 64;
        return whole * 64 + Math.round(num * 64 / den);
      }
      return null;
    }
    var met = parseFloat(text.replace(/\s*mm$/, ''));
    if (isNaN(met)) return null;
    if (resolution === '0.01') return Math.round(met * 100);
    return Math.round(met * 10);
  }

  return {
    generateTarget: generateTarget,
    formatTarget: formatTarget,
    parseAnswer: parseAnswer
  };
})();
