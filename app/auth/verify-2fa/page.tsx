import { Verify2FAForm } from './Verify2FAForm';

interface Verify2FAPageProps {
  searchParams: { redirect?: string };
}

export default function Verify2FAPage({ searchParams }: Verify2FAPageProps) {
  const redirect = searchParams?.redirect || '/dashboard';

  return <Verify2FAForm redirect={redirect} />;
}














