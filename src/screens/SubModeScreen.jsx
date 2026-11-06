import { ChoiceGrid } from '../components/ChoiceGrid.jsx';
import { MODE_LABEL } from '../engine.js';

export function SubModeScreen({ mode, onSubMode }) {
  return (
    <ChoiceGrid
      kicker={MODE_LABEL[mode]}
      title="How do you want to play?"
      lede="Both paths use the same shootout. Five kicks each, then sudden death if it is still level."
      choices={[
        {
          id: 'tournament',
          index: '16',
          title: 'Tournament',
          copy: 'Pick your club. The other fifteen enter, and the first-round draw is shuffled every time.',
          onClick: () => onSubMode('tournament'),
        },
        {
          id: 'match',
          index: '1',
          title: 'Match',
          copy: 'Pick your club and one opponent. One shootout, then you are done.',
          onClick: () => onSubMode('match'),
        },
      ]}
    />
  );
}
