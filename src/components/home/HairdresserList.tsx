import CardHairdresser from "../CardHairdresser";
import { Hairdresser } from "../../types";

interface HairdresserListProps {
  hairdressers: Hairdresser[];
  selectedId?: string;
  onSelect: (hairdresser: Hairdresser) => void;
}

const HairdresserList: React.FC<HairdresserListProps> = ({ hairdressers, selectedId, onSelect }) => {
  if (hairdressers.length === 0) {
    return <div className="text-gray-500">Специалисты пока не добавлены</div>;
  }

  return (
    <div className="grid gap-4">
      {hairdressers.map(h => (
        <button key={h.id} onClick={() => onSelect(h)} className="text-left">
          <CardHairdresser name={h.name} photoUrl={h.photoUrl} isActive={selectedId === h.id} />
        </button>
      ))}
    </div>
  );
};

export default HairdresserList;
