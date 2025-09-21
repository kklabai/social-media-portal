import Layout from "@/components/layout/Layout";

export default function ImportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Layout>{children}</Layout>;
}