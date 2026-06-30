import React from "react";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

const Container = ({ children, className = "" }: ContainerProps) => {
  return (
    <div className={`max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0 ${className}`}>
      {children}
    </div>
  );
};

export default Container;
