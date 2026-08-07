import React from "react";

export type PhosphorWeight = "duotone" | "bold" | "fill" | "regular" | "light" | "thin";

interface PhosphorIconProps extends React.SVGProps<SVGSVGElement> {
  name: string;
  weight?: PhosphorWeight;
  className?: string;
  size?: number | string;
  color?: string;
}

export function PhosphorIcon({
  name,
  weight = "duotone",
  className = "",
  size = 20,
  color,
  style,
  ...props
}: PhosphorIconProps) {
  // Normalize icon name (e.g. "car", "file-pdf", "gauge", "sparkle")
  const cleanName = name.toLowerCase().replace(/^(ph-|ph:)/, "").trim();
  const filename = weight === "regular" 
    ? `${cleanName}.svg`
    : `${cleanName}-${weight}.svg`;

  const iconSrc = `/phosphor/${weight}/${filename}`;

  return (
    <img
      src={iconSrc}
      alt={cleanName}
      className={`inline-block shrink-0 select-none object-contain ${className}`}
      style={{
        width: typeof size === "number" ? `${size}px` : size,
        height: typeof size === "number" ? `${size}px` : size,
        ...style
      }}
      onError={(e) => {
        // Fallback to regular or duotone if specific variant is missing
        const target = e.currentTarget;
        if (!target.src.includes("/regular/")) {
          target.src = `/phosphor/regular/${cleanName}.svg`;
        }
      }}
      {...(props as any)}
    />
  );
}

export default PhosphorIcon;
