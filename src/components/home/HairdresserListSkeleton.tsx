const HairdresserListSkeleton: React.FC = () => {
  return (
    <div className="grid gap-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-200" />
          <div className="flex-1 flex flex-col gap-3">
            <div className="h-4 bg-slate-200 rounded w-2/3" />
            <div className="h-3 bg-slate-100 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default HairdresserListSkeleton;
