'use strict';

const {obj} = require('iblokz-data');
const request = require('superagent');
const marked = require('marked');

// initial
const initial = {
	slidesMap: ['', '', '', ['', '', '', '', '', ''], ['', ''], ''],
	slides: [],
	index: [0, 0],
	old: [0, 0],
	transitioning: false,
	direction: false,
	controls: {
		on: false,
		tab: 'anim'
	},
	anim: {
		top: {
			in: 'scaleUp',
			out: 'scaleDown'
		},
		left: {
			in: 'scaleUp',
			out: 'scaleDown'
		},
		bottom: {
			in: 'scaleUp',
			out: 'scaleDown'
		},
		right: {
			in: 'scaleUp',
			out: 'scaleDown'
		}
	}
};

const directionMap = {
	top: ({index, slides}) => (slides[index[0]] instanceof Array && index[1] > 0)
		? [index[0], index[1] - 1] : index,
	left: ({index, slides}) => (index[0] > 0)
		? [index[0] - 1, 0] : index,
	bottom: ({index, slides}) => (slides[index[0]] instanceof Array && (index[1] < slides[index[0]].length - 1))
		? [index[0], index[1] + 1] : index,
	right: ({index, slides}) => (index[0] < slides.length - 1)
		? [index[0] + 1, 0] : index
};

// actions
const move = direction => state => Object.assign({}, state, {
	index: directionMap[direction](state),
	old: state.index,
	transitioning: true,
	direction
});

const toggleControls = () => state => obj.patch(state, 'controls', {on: !state.controls.on});
/*
const next = () => state => Object.assign({}, state, {
	index: (state.index < state.slidesCount - 1) ? state.index + 1 : state.index,
	old: state.index,
	transitioning: true
});
const prev = () => state => Object.assign({}, state, {
	index: (state.index > 0) ? state.index - 1 : state.index,
	old: state.index,
	transitioning: true
});
*/
const transitionend = () => state => Object.assign({}, state, {transitioning: false, directon: false});
const changeAnim = (direction, inOut, animClass) => state => obj.patch(state, ['anim', direction, inOut], animClass);
const setTab = tab => state => obj.patch(state, 'controls', {tab});

const parseSlides = list => list.reduce((slides, el, i) => {
	switch (el.type) {
		case 'heading':
			if (el.depth <= 2) {
				slides.push([{
					tag: 'span',
					children: [{tag: `h${el.depth}`, text: el.text}]
				}]);
			} else {
				slides[slides.length - 1].push({
					tag: 'span',
					children: [{tag: `h${el.depth}`, text: el.text}]
				});
			}
			break;
		case 'list_start':
			slides[slides.length - 1][slides[slides.length - 1].length - 1].children.push({
				tag: el.ordered ? 'ol' : 'ul',
				children: []
			});
			break;
		case 'text':
			if (list[i - 1].type === 'list_item_start') {
				slides[slides.length - 1][slides[slides.length - 1].length - 1].children[
					slides[slides.length - 1][slides[slides.length - 1].length - 1].children.length - 1
				].children.push({
					tag: 'li',
					text: el.text
				});
			} else {
				slides[slides.length - 1][slides[slides.length - 1].length - 1].children.push({
					tag: 'p',
					text: el.text
				});
			}
			break;
		case 'paragraph':
			slides[slides.length - 1][slides[slides.length - 1].length - 1].children.push({
				tag: 'p',
				text: el.text
			});
			break;
		case 'code':
			console.log(el);
			slides[slides.length - 1][slides[slides.length - 1].length - 1].children.push({
				tag: 'code',
				text: el.text.replace(/[ ]{4}/ig, '\t'),
				type: el.lang || 'js'
			});
			break;
		default:
			break;
	}
	return slides;
}, []);

const loadSlides = () => request.get('assets/md/slides.md')
	.then(req => marked.lexer(req.text, marked.defaults))
	.then(slides => (console.log({slides}), slides))
	.then(slides => slides.map(el =>
		(el.type === 'paragraph' || el.type === 'text')
			? obj.patch(el, 'text', marked.inlineLexer(el.text, slides.links)) : el)
	)
	.then(slides => (console.log({slides}), slides))
	.then(raw => parseSlides(raw))
	.then(slides => state => Object.assign({}, state, {slides}));

module.exports = {
	initial,
	loadSlides,
	toggleControls,
	move,
	transitionend,
	changeAnim,
	setTab
};
