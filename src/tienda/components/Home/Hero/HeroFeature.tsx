import React from "react";
import Image from "next/image";

const featureData = [
  {
    img: "/images/icons/icon-01.svg",
    title: "Envio Gratis",
    description: "En ordenes a partir de 100 soles",
  },

  {
    img: "/images/icons/icon-03.svg",
    title: "Pagos 100% Seguros",
    description: "Tus datos estan protegidos",
  },
  {
    img: "/images/icons/icon-04.svg",
    title: "Soporte Dedicado 24/7",
    description: "Estamos para ayudarte",
  },
];

const HeroFeature = () => {
  return (
    <div className="max-w-[1060px] w-full mx-auto px-4 sm:px-8 xl:px-0">
      <div className="flex flex-wrap items-center gap-5 xl:gap-7.5 mt-10">
        {featureData.map((item, key) => (
          <div className="flex items-center gap-4 bg-surface rounded-2xl px-5 py-4 shadow-neu-sm" key={key}>
            <div className="flex items-center justify-center w-11 h-11 rounded-full shadow-neu-inset flex-shrink-0">
              <Image src={item.img} alt="icons" width={32} height={32} />
            </div>
            <div>
              <h3 className="font-medium text-lg text-dark">{item.title}</h3>
              <p className="text-sm">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeroFeature;
