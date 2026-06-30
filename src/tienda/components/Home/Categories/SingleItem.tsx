import { Category } from "@/tienda/types/category";
import React from "react";
import Image from "next/image";
import Link from "next/link";

const SingleItem = ({ item }: { item: Category }) => {
  return (
    <Link href="/tienda" className="group flex flex-col items-start">
      <div className="max-w-[130px] w-full bg-surface h-32.5 rounded-full flex items-center justify-center mb-4 shadow-neu-sm hover:shadow-neu-inset transition-shadow duration-300">
        {item.img && (
          <Image src={item.img} alt="Category" width={82} height={62} />
        )}
      </div>

      <div className="flex justify-start">
        <h3 className="inline-block font-medium text-left text-dark transition-colors duration-300 group-hover:text-primary">
          {item.title}
        </h3>
      </div>
    </Link>
  );
};

export default SingleItem;
