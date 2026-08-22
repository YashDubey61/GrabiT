import Image from "next/image";
import Link from "next/link";

// Real pixel dimensions of public/grabit-logo-full.png — passing these
// (rather than arbitrary values) lets next/image compute the correct
// intrinsic aspect ratio, so a CSS height + `w-auto` never distorts it.
const LOGO_WIDTH = 1976;
const LOGO_HEIGHT = 796;

/**
 * The single GrabIt brand mark — full logo (symbol + wordmark +
 * tagline) as one transparent-background image asset. Every surface
 * that shows GrabIt branding should render this component instead of
 * a separate icon + "GrabIt" text pair, so a future logo change only
 * touches this one file.
 */
export function GrabItLogo({
  href,
  heightClassName = "h-10",
  priority = false,
  className,
}: {
  /** Wrap the logo in a Link when it should be clickable (e.g. "go home"). */
  href?: string;
  /** Tailwind height utility controlling the rendered size — width follows automatically via the real aspect ratio. */
  heightClassName?: string;
  priority?: boolean;
  className?: string;
}) {
  const img = (
    <Image
      src="/grabit-logo-full.png"
      alt="GrabIt — When Hunger Hits, GrabIt."
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      priority={priority}
      className={`w-auto object-contain ${heightClassName} ${className ?? ""}`}
    />
  );

  if (href) {
    return (
      <Link href={href} className="flex shrink-0 items-center transition-transform active:scale-95">
        {img}
      </Link>
    );
  }

  return img;
}
