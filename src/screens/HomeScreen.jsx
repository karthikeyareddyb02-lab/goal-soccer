import { ChoiceGrid } from '../components/ChoiceGrid.jsx';

export function HomeScreen({ onMode }) {
  return (
    <ChoiceGrid
      kicker="Stadium night"
      title="Twelve Yards"
      lede="Penalties or free kicks. One match, or a 16-club tournament with a fresh draw every time."
      choices={[
        {
          id: 'penalties',
          index: '12',
          title: 'Penalties',
          copy: 'From the spot. You strike, then you keep goal.',
          onClick: () => onMode('penalties'),
        },
        {
          id: 'freekicks',
          index: 'FK',
          title: 'Free kicks',
          copy: 'Lift it over the wall. Same shootout, tighter aim.',
          onClick: () => onMode('freekicks'),
        },
      ]}
    />
  );
}
