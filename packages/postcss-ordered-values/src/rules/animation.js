import { unit } from 'postcss-value-parser';
import { getArguments } from 'cssnano-utils';
import addSpace from '../lib/addSpace';
import getValue from '../lib/getValue';

// animation: [ none | <keyframes-name> ] || <time> || <single-timing-function> || <time> || <single-animation-iteration-count> || <single-animation-direction> || <single-animation-fill-mode> || <single-animation-play-state>
const functions = new Set(['steps', 'cubic-bezier', 'frames']);
const keywords = new Set([
  'ease',
  'ease-in',
  'ease-in-out',
  'ease-out',
  'linear',
  'step-end',
  'step-start',
]);

const directions = new Set([
  'normal',
  'reverse',
  'alternate',
  'alternate-reverse',
]);
const fillModes = new Set(['none', 'forwards', 'backwards', 'both']);
const playStates = new Set(['running', 'paused']);
const timeUnits = new Set(['ms', 's']);

const isTimingFunction = (value, type) => {
  return (type === 'function' && functions.has(value)) || keywords.has(value);
};

const isDirection = (value) => {
  return directions.has(value);
};

const isFillMode = (value) => {
  return fillModes.has(value);
};

const isPlayState = (value) => {
  return playStates.has(value);
};

const isTime = (value) => {
  const quantity = unit(value);

  return quantity && timeUnits.has(quantity.unit);
};

const isIterationCount = (value) => {
  const quantity = unit(value);

  return value === 'infinite' || (quantity && !quantity.unit);
};

export default function normalizeAnimation(parsed) {
  const args = getArguments(parsed);

  const values = args.reduce((list, arg) => {
    const state = {
      name: [],
      duration: [],
      timingFunction: [],
      delay: [],
      iterationCount: [],
      direction: [],
      fillMode: [],
      playState: [],
    };
    const stateConditions = [
      { property: 'duration', delegate: isTime },
      { property: 'timingFunction', delegate: isTimingFunction },
      { property: 'delay', delegate: isTime },
      { property: 'iterationCount', delegate: isIterationCount },
      { property: 'direction', delegate: isDirection },
      { property: 'fillMode', delegate: isFillMode },
      { property: 'playState', delegate: isPlayState },
    ];

    arg.forEach((node) => {
      let { type, value } = node;

      if (type === 'space') {
        return;
      }

      value = value.toLowerCase();

      const hasMatch = stateConditions.some(({ property, delegate }) => {
        if (delegate(value, type) && !state[property].length) {
          state[property] = [node, addSpace()];
          return true;
        }
      });

      if (!hasMatch) {
        state.name = [...state.name, node, addSpace()];
      }
    });
    return [
      ...list,
      [
        ...state.name,
        ...state.duration,
        ...state.timingFunction,
        ...state.delay,
        ...state.iterationCount,
        ...state.direction,
        ...state.fillMode,
        ...state.playState,
      ],
    ];
  }, []);

  return getValue(values);
}
