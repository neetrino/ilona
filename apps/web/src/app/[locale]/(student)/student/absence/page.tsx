import { redirect } from 'next/navigation';

interface RedirectPageProps {
  params: Promise<{ locale: string }>;
}

export default async function StudentAbsenceLegacyRedirect({
  params,
}: RedirectPageProps) {
  const { locale } = await params;
  redirect(`/${locale}/student/attendance`);
}
