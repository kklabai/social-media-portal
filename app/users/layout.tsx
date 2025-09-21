import Layout from "@/components/layout/Layout";

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Layout>{children}</Layout>;
}