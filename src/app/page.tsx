import CustomerPanel from "@/components/customer-panel";

export default async function Home(props: { searchParams: Promise<{ table?: string }> }) {
  const searchParams = await props.searchParams;
  return <CustomerPanel initialTable={searchParams?.table} />;
}
