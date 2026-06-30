import React from "react";

interface BreadcrumbProps {
  title: string;
  pages: string[];
}

const Breadcrumb = ({ title, pages }: BreadcrumbProps) => {
  // Returns null to globally hide the Breadcrumb component across all pages 
  // as per user request to remove "migas de pan".
  return null;
};

export default Breadcrumb;
