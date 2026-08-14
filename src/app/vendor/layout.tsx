import { VendorShell } from "@/components/layout/VendorShell";

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <VendorShell>{children}</VendorShell>;
}
