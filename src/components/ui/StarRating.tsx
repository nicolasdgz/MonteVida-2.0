import Image from "next/image";

interface StarRatingProps {
  rating?: number;
  count?: number;
  size?: number;
}

const StarRating = ({ rating = 5, count, size = 14 }: StarRatingProps) => {
  const stars = Math.min(5, Math.max(0, Math.round(rating)));

  return (
    <div className="flex items-center gap-2.5">
      <div className="flex items-center gap-1" aria-label={`${stars} de 5 estrellas`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Image
            key={i}
            src={i < stars ? "/images/icons/icon-star.svg" : "/images/icons/icon-star-gray.svg"}
            alt=""
            width={size}
            height={size}
          />
        ))}
      </div>
      {count !== undefined && (
        <p className="text-custom-sm">({count})</p>
      )}
    </div>
  );
};

export default StarRating;
