import { useBrand } from '../../context/BrandContext';

export default function BrandLogo({ size = 'md' }) {
  const { brand } = useBrand();
  const text = { sm: 'text-lg', md: 'text-xl', lg: 'text-2xl' }[size];
  const img = { sm: 'h-7', md: 'h-8', lg: 'h-10' }[size];

  if (brand?.logoUrl) {
    return <img src={brand.logoUrl} alt={brand.name} className={`${img} w-auto object-contain`} />;
  }
  return <span className={`font-heading font-bold text-accent ${text}`}>{brand?.name || 'EstateCore'}</span>;
}
