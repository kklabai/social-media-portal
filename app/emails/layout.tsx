import Layout from "@/components/layout/Layout";

export default function EmailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Layout>{children}</Layout>;
}