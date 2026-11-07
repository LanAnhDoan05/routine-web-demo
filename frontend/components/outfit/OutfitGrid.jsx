import OutfitCard from "./OutfitCard";
import EmptyState from "@/components/common/EmptyState";

export default function OutfitGrid({ outfits, columns = 4 }) {
  if (!outfits || outfits.length === 0) {
    return <EmptyState title="Chưa có outfit nào" description="Hãy quay lại sau nhé." />;
  }

  return (
    <div className="outfit-grid" style={{ "--outfit-cols": columns }}>
      {outfits.map((outfit) => (
        <OutfitCard key={outfit.id} outfit={outfit} />
      ))}
      <style>{`
        .outfit-grid {
          display: grid;
          grid-template-columns: repeat(var(--outfit-cols), 1fr);
          gap: 24px;
        }
        @media (max-width: 1023px) {
          .outfit-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 767px) {
          .outfit-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
        }
      `}</style>
    </div>
  );
}
