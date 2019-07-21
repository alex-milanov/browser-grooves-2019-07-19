'use strict';

// lib
const Rx = require('rx');
const $ = Rx.Observable;

const prettify = require('code-prettify');
const mermaidAPI = require('mermaid');
const {obj} = require('iblokz-data');

mermaidAPI.initialize({
	theme: 'dark',
	themeCSS: '.node rect {fill: #11172c; stroke: #BDD5EA; stroke-width: 2px} .label {color: #BDD5EA; font-size: 16px; font-weight: bold}',
	startOnLoad: false
});

// dom
const {
	h, section, button, span, h1, h2, h3,
	form, fieldset, label, legend, input, select, option,
	ul, li, p, div
} = require('iblokz-snabbdom-helpers');

// components
const code = require('./code');

// util
const arrEq = (arr1, arr2) => JSON.stringify(arr1) === JSON.stringify(arr2);
const arrFlatten = arr => arr.reduce((af, ai) => [].concat(af, ai), []);

const prepAnim = (pos, {index, old, direction, transitioning, anim}) => Object.assign({
	active: (arrEq(index, pos) || (arrEq(old, pos)) && transitioning === true),
	onTop: transitioning === true && arrEq(index, pos)
},
(transitioning === true && !arrEq(index, old) && (arrEq(index, pos) || arrEq(old, pos)))
	? obj.keyValue(anim[direction][arrEq(index, pos) ? 'in' : 'out'], true)
	: {}
);

const mermaid = (el, uid) => div(`.mermaid-${uid}`, {
	props: {
		innerHTML: mermaidAPI.render(`mermaid-${uid}`, el.text)
	}
});

const parseEl = (el, uid) => (el.tag === 'code')
	? el.type === 'mermaid'
		? mermaid(el, uid)
		: code({source: el.text, type: el.type})
	: (el.tag === 'p' || el.tag === 'li')
		? h(el.tag, {props: {innerHTML: el.text}})
		: h(el.tag, el.text || el.children && el.children.map(ch => parseEl(ch, uid)) || '');

const parseSlides = slides => slides.map((col, i) =>
	col.map((slide, k) => parseEl(slide, `${i}-${k}`))
);

module.exports = ({state, actions}) => section('.slides.fadeIn[tabindex="0"]',
	arrFlatten(parseSlides(state.slides).map((col, i) =>
		col.map((slide, k) =>
			section({
				class: prepAnim([i, k], state),
				on: (arrEq(state.index, [i, k]) && state.transitioning)
					? {animationend: () => actions.transitionend()} : {}
			}, [slide])
		))
	));
