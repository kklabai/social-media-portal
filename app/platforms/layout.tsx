import Layout from "@/components/layout/Layout";

export default function PlatformsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Layout>{children}</Layout>;
}